import { Message, Client } from 'discord.js';
import * as Datastore from 'nedb';
import { SlaveBotEvents } from './events';
import { SlaveBotServer } from './server';
import { mkdir } from './utils/fs';
import { APP_DATA_DIR, DATABASES_DIR } from './config';


export interface SlaveBotPlugin {
  name: string;
  version: string;
  register?: (plugin?: PluginConfiguration) => Promise<any>;
  destroy?: (plugin?: PluginConfiguration) => void;
  description?: string;
  usage?: string;
  events?: SlaveBotEvents;
}


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



/**
 * A wrapper around a plugin.
 * Handles registration of the plugin
 * Handles listening to events and unsubscribing on destroy.
 */
export class PluginContainer {
  
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