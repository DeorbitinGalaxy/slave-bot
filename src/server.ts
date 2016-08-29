import { SlaveBotConfig } from './config';
import { Client } from 'discord.js';
import { fromDiscordEvent } from './utils/discord-event';
import { SlaveBotPlugin } from './plugins/plugin';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/empty';
import { Observer } from 'rxjs/Observer';
import * as Datastore from 'nedb';
import { Message } from 'discord.js';


export interface PluginConfiguration {
  server: SlaveBotServer;
  bot: Client;
  db: Datastore;
  options?: any;
}

export class SlaveBotServer {

  private _ready: BehaviorSubject<boolean> = new BehaviorSubject(false);
  public ready: Observable<any> = this._ready.asObservable();
  private bot: Client;
  private plugins: { [name: string]: SlaveBotPlugin } = {};
  private options: { [name: string]: any } = {};
  private _methods: { [name: string]: Function } = {};


  private started: boolean = false;
  private registrations: Observable<any>;

  constructor (private config: SlaveBotConfig) {

    this.bot = new Client();
    this._setup();
  }


  isElevated (message: Message): boolean {

    const server = message.server;
    const roles = server.roles;
    const name = this.config.adminRole || 'Slave Master';
    const role = roles.get('name', name);

    return role ? message.author.hasRole(role) : false;
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

    return require('minimist')(args);
  }

  /**
   * Unload a plugin at runtime.
   */
  unloadPlugin (message: Message, name: string): void {

    if (this.plugins[name] && this.isElevated(message)) {
      this.plugins[name].destroy();
    }
  }

  loadPlugin (message: Message, name: string, options: any = null): Observable<any> {

    if (this.plugins[name] && this.isElevated(message)) {
      if (options === null) {
        options = this.options[name];
      }

      return this.register(name, options);
    }

    return Observable.throw({ code: 404, message: 'Plugin not found' });
  }

  private register (name: string, options: any = null): Observable<any> {

    return this.plugins[name].register({
      server: this,
      options: options,
      bot: this.bot,
      db: new Datastore(`./databases/${name}.db`)
    });
  }

  pluginList () {

    return Object.keys(this.plugins).map((key: string) => {
      const plugin = this.plugins[key];
      return { name: plugin.name, version: plugin.version, description: plugin.description };
    });
  }

  private _setup () {

    fromDiscordEvent(this.bot, 'ready').subscribe(() => {
      if (this.config.initialPlayingGame) {
        this.bot.setPlayingGame(this.config.initialPlayingGame);
      }

      if (this.config.botUsername) {
        this.bot.setUsername(this.config.botUsername);
      }

      this._ready.next(true);
    });

    const plugins = this.config.plugins || [];

    plugins.forEach(
      (pluginConfig: any) => {
        if (!pluginConfig.name) {
          throw new Error(`Missing plugin name: ${JSON.stringify(pluginConfig)}`);
        }

        const local = typeof pluginConfig.path === 'undefined';
        const path = local ? `./plugins/${pluginConfig.name}` : pluginConfig.path;

        const { plugin } = require(path);
        this.plugins[plugin.name] = plugin;

        this.options[plugin.name] = pluginConfig.options || null;
      }
    )


    const observables = Object.keys(this.plugins).map((key: string) => {
      return this.register(key, this.options[key]);
    });

    this.registrations = Observable.forkJoin(
      observables
    );

  }

  public start (): void {

    if (this.started) {
      return;
    }

    this.started = true;

    this.registrations.subscribe(
      () => {},
      (err) => { throw err },
      () => {
        this.bot.loginWithToken(this.config.botToken, null, null, (err) => {
          if (err) {
            throw err;
          }
        });
      }
    );
  }
}