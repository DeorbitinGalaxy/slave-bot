import { Client, Message } from 'discord.js';
import { homedir } from 'os';
import { join, posix } from 'path';

import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

import * as Datastore from 'nedb';
import * as minimist from 'minimist';

import { SlaveBotConfig, PLUGIN_DIR, DATABASES_DIR } from './config';
import { fromDiscordEvent } from './utils/discord-event';
import { SlaveBotPlugin, PluginContainer, PluginSummary } from './plugin';




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

  private json: string;
  private config: SlaveBotConfig;

  /**
   * Initialize a SlaveBotServer
   * @param slaveJson the configuration file path.
   */
  async setup (json: string) {

    this.json = json;

    try {
      this.config = require(this.json)
    }
    catch (ignored) {
      throw new Error('Could not find slave.json configuration file at: ' + json);
    }

    this.bot = new Client();
    return this._setup();
  }

  /**
   * Reboot the server:
   * - The client quits
   * - All event listeners are destroyed 
   * - The client joins 
   * - All event listeners are created
   * - Start the client
   */
  async reboot () {

    await this.quit();
    this.bot = new Client();
    await this._setup();
    await this.start();
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
  async start (): Promise<any> {

    if (this.started) {
      return;
    }

    this.started = true;

    await this.registrations
    await this.bot.login(this.config.botToken)
    await this.bot.user.setStatus('online');
  }

  /**
   * Quit Discord.
   * The client quit discord and destroys all event listeners.
   */
  async quit () {

    if (this.started) {

      this.subscriptions.forEach(s => s.unsubscribe());
      this.subscriptions = [];

      await this.bot.user.setStatus('invisible');
      for (let plugin in this.plugins) {
        if (this.plugins[plugin].destroy) {
          this.plugins[plugin].destroy();
        }
      }

      await this.bot.destroy();
      this.started = false;
    }
  }

  private async _setup () {

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

      fromDiscordEvent(this.bot, 'error').subscribe((error) => {
        console.error(error)
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
      const moduleKey = config.className ? config.className : 'default';

      try {
        const module = await import(path);
        const plugin = new module[moduleKey];
        this.plugins[plugin.name] = new PluginContainer(
          this, 
          this.bot, 
          plugin, 
          new Datastore(join(DATABASES_DIR, `${plugin.name}.db`)),
          config.options || null
        );
      }
      catch (e) {
        console.error(`Couldn't load plugin: ${path}`);
      }
    }

    const promises = Object.keys(this.plugins)
        .map((key: string) => this.plugins[key].register());

    this.registrations = Promise.all(promises);
  }
}