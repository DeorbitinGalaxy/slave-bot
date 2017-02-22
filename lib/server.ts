import { Client, Message } from 'discord.js';
import { homedir } from 'os';
import { join, posix } from 'path';
import { existsSync, statSync, mkdirSync, unlinkSync } from 'fs';


import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

import * as Datastore from 'nedb';
import * as minimist from 'minimist';

import { SlaveBotConfig } from './config';
import { fromDiscordEvent } from './utils/discord-event';
import { SlaveBotPlugin } from './plugin';

/**
 * A plugin configuration passed to methods in a plugin.
 */
export interface PluginConfiguration {
  server: SlaveBotServer;
  bot: Client;
  db: Datastore;
  options?: any;
  state: any;
}

/**
 * A plugin summary used in SlaveBotServer#pluginInfo and SlaveBotServer#pluginList
 */
export interface PluginSummary {
  name: string;
  version: string;
  description?: string;
  usage?: string;
}

const PLUGIN_DIR: string = '../plugins';
const APP_DATA_DIR: string = join(homedir(), '.slavebot');
const DATABASES_DIR: string = join(APP_DATA_DIR, 'databases');

function mkdir (path: string) {

  try {
    const stat = statSync(path);
    if (stat && !stat.isDirectory) {
      unlinkSync(path);
    }
  }
  catch (ignored) {
    mkdirSync(path);
  }
}

/**
 * A wrapper around a plugin.
 * Handles registration of the plugin
 * Handles listening to events and unsubscribing on destroy.
 */
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
    mkdir(APP_DATA_DIR);
    mkdir(DATABASES_DIR);
  }

  // Initialize plugin, listen to events
  register (): Promise<any> {

    if (this.plugin.register) {
      return this.plugin.register(this.configuration).then(() => this._listenEvents());
    }
    else {
      return Promise.resolve().then(() => this._listenEvents());
    }
  }

  // Remove all handlers, call SlaveBotPlugin#destroy
  destroy (): void {

    for (let handler in this.handlers) {
      this.bot.removeListener(handler, this.handlers[handler]);
    }

    if (this.plugin.destroy) {
      this.plugin.destroy(this.configuration);
    }
  }

  // Listen to events declared in SlaveBotPlugin#events
  private _listenEvents () {

    const { events } = this.plugin;

    // No events are declared
    if (!events) {
      return;
    }

    for (let event in events) {

      // Declare a handler that can be referenced later
      const handler = (...args: any[]) => {
        events[event](this.configuration, ...args);
      };

      this.bot.on(event, handler);
      this.handlers[event] = handler;
    }
  }
}


// The SlaveBotServer handles registrations/unregistrations of plugins 
export class SlaveBotServer {

  private _ready: BehaviorSubject<boolean> = new BehaviorSubject(false);
  public ready: Observable<any> = this._ready.asObservable();
  private bot: Client;
  private plugins: { [name: string]: PluginContainer } = {};
  private _methods: { [name: string]: Function } = {};

  private started: boolean = false;
  private registrations: Promise<any>;
  private subscriptions: Subscription[] = [];

  private slaveJson: string;
  private config: SlaveBotConfig;

  /**
   * Initialize a SlaveBotServer
   * @param slaveJson the configuration file path.
   */
  setup (slaveJson: string) {

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

  /**
   * Reboot the server:
   * - The client quits
   * - All event listeners are destroyed 
   * - The client joins 
   * - All event listeners are created
   * - Start the client
   */
  reboot () {

    return this.quit().then(() => {
      
      delete require.cache[require.resolve(this.slaveJson)];
      this.config = require(this.slaveJson);
      this.bot = new Client();
      this._setup();
      return this.start();
    });
  }

  /**
   * Returns true if the message is coming from an elevated role.
   * An elevated role is by default "Slave Master" but can be changed via the configuration file via 
   * the "adminRole" property.
   * @param message the message to check.
   */
  isElevated (message: Message): boolean {

    const { roles } = message.guild;
    const name = this.config.adminRole || 'Slave Master';
    const role = roles.find('name', name);
    const member = message.member;

    return (role && member) ? member.roles.exists('name', role.name) : false;
  }

  /**
   * Call a method declared by SlaveBotServer#methods
   * @param name the method name 
   * @param args the arguments to pass to the method
   */
  method (name: string, ...args: any[]): any {

    if (!this.methods[name]) {
      throw new Error(`SlaveBotServer#method: no method called ${name}`);
    }

    const method = this.methods[name];

    return method.apply(this, args);
  }

  /**
   * Creates a method.
   * @param name the method name
   * @param fn the method
   */
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
   * Returns a plugin summary of the pluginName 
   * @param pluginName the plugin name
   */
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

  /**
   * Returns a list of plugin summaries that are registered.
   * @returns PluginSummary[]
   */
  pluginList (): PluginSummary[] {

    return Object.keys(this.plugins).map((key: string) => {
      const { name, version, description, usage } = this.plugins[key].plugin;
      return { 
        name, version, description, usage
      };
    });
  }

  /**
   * Starts the server 
   * @return a promise that resolves when the server has started.
   */
  start (): Promise<any> {

    if (this.started) {
      return;
    }

    this.started = true;

    

    return this.registrations
      .then(() => this.bot.login(this.config.botToken, null))
      .then(() => this.bot.user.setStatus('online'));
  }

  /**
   * Quit Discord.
   * The client quit discord and destroys all event listeners.
   */
  quit (): Promise<any> {

    if (this.started) {

      this.subscriptions.forEach((s) => {
        s.unsubscribe();
      });

      this.subscriptions = [];

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

  private _setup () {

    this.subscriptions.push(
      fromDiscordEvent(this.bot, 'ready').subscribe(() => {
        if (this.config.initialPlayingGame) {
          this.bot.user.setGame(this.config.initialPlayingGame);
        }

        if (this.config.botUsername) {
          this.bot.user.setUsername(this.config.botUsername);
        }

        this._ready.next(true);
      }),

      fromDiscordEvent(this.bot, 'disconnect').subscribe(() => {
        this.start();
      })
    );

    const plugins = this.config.plugins || [];

    for (const config of plugins) {
      if (!config.name) {
        throw new Error(`Missing plugin name: ${JSON.stringify(config)}`);
      }

      const local = typeof config.path === 'undefined';
      const path = local ? posix.join(PLUGIN_DIR, config.name) : config.path;

      const { plugin } = require(path);
      this.plugins[plugin.name] = new PluginContainer(
        this, 
        this.bot, 
        plugin, 
        new Datastore(join(DATABASES_DIR, `${plugin.name}.db`)),
        config.options || null
      );
    }

    const promises = Object.keys(this.plugins)
        .map((key: string) => this.plugins[key].register());

    this.registrations = Promise.all(promises);
  }
}