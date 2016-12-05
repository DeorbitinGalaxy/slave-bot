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
}

export interface PluginSummary {
  name: string;
  version: string;
  description?: string;
  usage?: string;
}

const PLUGIN_DIR: string = '../plugins';

export class PluginContainer {

  public isRegistered: boolean = false;

  private subscriptions: any[] = [];

  constructor (
    private bot: Client,
    private plugin: SlaveBotPlugin,
    public options: any = {}
  ) {}

  subscribe (event: string, handler: Function) {

    this.subscriptions.push(
      fromDiscordEvent(this.bot, event).subscribe((...args: any[]) => {
        handler(...args);
      })
    );
  }

  register (): Observable<any> {

    if (this.isRegistered) {
      return;
    }

    if (!this.plugin.register) {
      throw new Error('SlaveBotPlugin needs a register method');
    }
  }

  destroy (): void {

    if (this.plugin.destroy) {
      this.plugin.destroy();
    }

    this.subscriptions.forEach((subscription: any) => subscription.unsubscribe());
    this.isRegistered = false;
  }
}

export class SlaveBotServer {

  private _ready: BehaviorSubject<boolean> = new BehaviorSubject(false);
  public ready: Observable<any> = this._ready.asObservable();
  private bot: Client;
  private plugins: { [name: string]: SlaveBotPlugin } = {};
  private options: { [name: string]: any } = {};
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

  /**
   * Unload a plugin at runtime.
   */
  unloadPlugin (message: Message, name: string): void {

    if (this.plugins[name] && this.isElevated(message)) {
      this.plugins[name].destroy();
    }
  }

  loadPlugin (message: Message, name: string, options: any = null): Promise<any> {

    if (this.plugins[name] && this.isElevated(message)) {
      if (options === null) {
        options = this.options[name];
      }

      return this.register(name, options);
    }

    return Promise.reject({ code: 404, message: 'Plugin not found' });
  }

  private register (name: string, options: any = null): Promise<any> {

    return this.plugins[name].register({
      server: this,
      options: options,
      bot: this.bot,
      db: new Datastore(`./databases/${name}.db`)
    });
  }

  pluginInfo (pluginName: string): PluginSummary {
    
    const plugin = this.plugins[pluginName];
    if (!plugin) {
      return null;
    }

    const { name, version, description, usage } = this.plugins[pluginName];
    return {
      name, version, description, usage
    };
  }

  pluginList (): PluginSummary[] {

    return Object.keys(this.plugins).map((key: string) => {
      const { name, version, description, usage } = this.plugins[key];
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
        this.plugins[plugin.name] = plugin;
        this.options[plugin.name] = config.options || null;
      }
    );

    const promises = Object.keys(this.plugins).map((key: string) => {
      return this.register(key, this.options[key]);
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
          this.plugins[plugin].destroy();
        }

        return this.bot.destroy().then(() => this.started = false);
      });
    }

    return Promise.resolve();
  }
}