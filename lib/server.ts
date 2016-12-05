import { Client, Message } from 'discord.js';
import * as Path from 'path';

import { Observable } from 'rxjs/Observable';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observer } from 'rxjs/Observer';
import 'rxjs/add/observable/empty';
import 'rxjs/add/observable/forkJoin';

import * as Datastore from 'nedb';
import * as minimist from 'minimist';

import { SlaveBotConfig } from './config';
import { fromDiscordEvent } from './utils/discord-event';
import { SlaveBotPlugin } from './plugin';

export interface PluginConfiguration {
  server: SlaveBotServer;
  bot: Client;
  db: Datastore;
  options?: any;
  state: any;
}

export interface PluginSummary {
  name: string;
  version: string;
  description?: string;
  usage?: string;
}

const PLUGIN_DIR: string = '../plugins';

class PluginContainer {

  private configuration: PluginConfiguration;

  private handlers: { [name: string]: any } = {};

  constructor (
    private server: SlaveBotServer,
    private bot: Client,
    public plugin: SlaveBotPlugin,
    private db: Datastore,
    private options: any = {}
  ) {
    this.configuration = { server, bot, db, options, state: {} };
  }

  register (): Promise<any> {

    if (this.plugin.register) {
      return this.plugin.register(this.configuration).then(() => this._listenEvents());
    }
    else {
      return Promise.resolve().then(() => this._listenEvents());
    }
  }

  private _listenEvents () {
    const { events } = this.plugin;

    if (!events) {
      return;
    }

    for (let event in events) {

      const handler = (...args: any[]) => {
        events[event](this.configuration, ...args);
      };

      this.bot.on(event, handler);
      this.handlers[event] = handler;
    }
  }

  destroy (): void {

    for (let handler in this.handlers) {
      this.bot.removeListener(handler, this.handlers[handler]);
    }

    if (this.plugin.destroy) {
      this.plugin.destroy(this.configuration);
    }
  }
}

export class SlaveBotServer {

  private _ready: BehaviorSubject<boolean> = new BehaviorSubject(false);
  public ready: Observable<any> = this._ready.asObservable();
  private bot: Client;
  private plugins: { [name: string]: PluginContainer } = {};
  private _methods: { [name: string]: Function } = {};

  private started: boolean = false;
  private registrations: Promise<any>;

  private slaveJson: string;
  private config: SlaveBotConfig;

  public setup (slaveJson: string) {

    this.slaveJson = slaveJson;

    try {
      this.config = require(this.slaveJson);
    }
    catch (ignored) {
      throw new Error('Could not find slave.json configuration file at: ' + slaveJson);
    }

    this.bot = new Client();
    this._setup();
  }

  public reboot () {

    return this.quit().then(() => {
      
      this.config = require(this.slaveJson);
      this.bot = new Client();
      this._setup();
      return this.start();
    })
    .then(() => {
      return new Promise((resolve, reject) => {
        this.bot.once('ready', () => {
          resolve();
        });
      });
    });
  }


  isElevated (message: Message): boolean {

    const { roles } = message.guild;
    const name = this.config.adminRole || 'Slave Master';
    const role = roles.find('name', name);
    const member = message.member;

    return (role && member) ? member.roles.exists('name', role.name) : false;
  }

  method (name: string, ...args: any[]): any {

    if (!this.methods[name]) {
      throw Error(`SlaveBotServer#method: no method called ${name}`);
    }

    const method = this.methods[name];

    return method.apply(this, args);
  }

  methods (name: string, fn: Function) {
    if (typeof fn === 'function') {
      this.methods[name] = fn;
    }
  }

  /**
   * Parse arguments with minimist
   * @param args the arguments
   */
  parseArgs (args: any[]) {

    return minimist(args);
  }

 
  pluginInfo (pluginName: string): PluginSummary {
    
    const container = this.plugins[pluginName];
    if (!container) {
      return null;
    }

    const { name, version, description, usage } = container.plugin;
    return {
      name, version, description, usage
    };
  }

  pluginList (): PluginSummary[] {

    return Object.keys(this.plugins).map((key: string) => {
      const { name, version, description, usage } = this.plugins[key].plugin;
      return { 
        name, version, description, usage
      };
    });
  }

  private _setup () {

    fromDiscordEvent(this.bot, 'ready').subscribe(() => {
      if (this.config.initialPlayingGame) {
        this.bot.user.setGame(this.config.initialPlayingGame);
      }

      if (this.config.botUsername) {
        this.bot.user.setUsername(this.config.botUsername);
      }

      this._ready.next(true);
    });

    const plugins = this.config.plugins || [];

    plugins.forEach(
      (config: any) => {
        if (!config.name) {
          throw new Error(`Missing plugin name: ${JSON.stringify(config)}`);
        }

        const local = typeof config.path === 'undefined';
        const path = local ? Path.posix.join(PLUGIN_DIR, config.name) : config.path;

        const { plugin } = require(path);
        this.plugins[plugin.name] = new PluginContainer(
          this, 
          this.bot, 
          plugin, 
          new Datastore(`./databases/${plugin.name}.db`),
          config.options || null
        );
      }
    );

    const promises = Object.keys(this.plugins).map((key: string) => {
      return this.plugins[key].register();
    });

    this.registrations = Promise.all(promises);
  }

  public start (): Promise<any> {

    if (this.started) {
      return;
    }

    this.started = true;

    return this.registrations
      .then(() => this.bot.login(this.config.botToken, null))
      .then(() => this.bot.user.setStatus('online'));
  }

  public quit (): Promise<any> {

    if (this.started) {

      return this.bot.user.setStatus('invisible').then(() => {
        for (let plugin in this.plugins) {
          if (this.plugins[plugin].destroy) {
            this.plugins[plugin].destroy();
          }
        }

        return this.bot.destroy().then(() => this.started = false);
      });
    }

    return Promise.resolve();
  }
}