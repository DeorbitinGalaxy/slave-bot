import { SlaveBotConfig } from './config';
import { Client } from 'discord.js';
import { fromDiscordEvent } from './utils/discord-event';
import { SlaveBotPlugin } from './plugins/plugin';
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

  private bot: Client;
  private plugins: { [name: string]: SlaveBotPlugin } = {};
  private _methods: { [name: string]: Function } = {};


  private started: boolean = false;
  private registrations: Observable<any>;

  constructor (private config: SlaveBotConfig) {

    this.bot = new Client();
    this._setup();
  }


  isElevated (message: Message): boolean {

    return message.author.hasRole(this.config.adminRole || 'Slave Master');
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
   * Unload a plugin at runtime.
   */
  unloadPlugin (message: Message, name: string) {

    if (this.plugins[name] && this.isElevated(message)) {
      this.plugins[name].destroy();
    }
  }

  loadPlugin (message: Message, name: string) {

  }


  private _setup () {

    fromDiscordEvent(this.bot, 'ready').subscribe(() => {
      if (this.config.initialPlayingGame) {
        this.bot.setPlayingGame(this.config.initialPlayingGame);
      }

      if (this.config.botUsername) {
        this.bot.setUsername(this.config.botUsername);
      }
    });

    const slavePluginsPaths: string[] = [
      'commands'
    ];

    const configPluginPaths = this.config.plugins || [];


    slavePluginsPaths.forEach(
      (path: string) => {
        const { plugin } = require(`./plugins/${path}`);
        this.plugins[plugin.name] = plugin;
      }
    );

    configPluginPaths.forEach(
      (path: string) => {
        const { plugin } = require(path);
        this.plugins[plugin.name] = plugin;
      }
    );

    const observables = Object.keys(this.plugins).map((key: string) => {
      const plugin: SlaveBotPlugin = this.plugins[key];
      return plugin.register({
        server: this,
        options: null,
        bot: this.bot,
        db: new Datastore(`./databases/${key}.db`)
      });
    });

    this.registrations = Observable.forkJoin(
      observables
    );

  }

  public start (): Observable<any> {

    if (this.started) {
      return Observable.empty();
    }

    this.started = true;

    return Observable.create((observer: Observer<any>) => {
      this.registrations.subscribe(
        (value) => observer.next(value),
        (err) => observer.error(err),
        () => {
          this.bot.loginWithToken(this.config.botToken, null, null, (err) => {
            if (err) {
              observer.error(err);
            }
            else {
              observer.complete();
            }
          });
        }
      );
    });
  }
}