import { Client } from 'discord.js';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/forkJoin';

import * as Datastore from 'nedb';

import { fromDiscordEvent } from './utils/discord-event';
import { SlaveBotConfig } from './config';
import { SlaveBotPlugin } from './plugins/plugin';

const slaveBotConfig: SlaveBotConfig = require('../slave.json');

const plugins: { [name: string]: SlaveBotPlugin } = {};
const databases: { [name: string]: Datastore } = {};

const slavePluginsPaths: string[] = [
  'commands'
];

const configPluginPaths: string[] = slaveBotConfig.plugins || [];

slavePluginsPaths.forEach(
  (path: string) => {
    const { name, plugin } = require(`./plugins/${path}`);
    plugins[name] = plugin;
  }
);

configPluginPaths.forEach(
  (path: string) => {
    const { name, plugin } = require(path);
    plugins[name] = plugin;
  }
);

const bot: Client = new Client();

fromDiscordEvent(bot, 'ready').subscribe(() => {
  if (slaveBotConfig.initialPlayingGame) {
    bot.setPlayingGame(slaveBotConfig.initialPlayingGame);
  }

  if (slaveBotConfig.botUsername) {
    bot.setUsername(slaveBotConfig.botUsername);
  }
});

const observables = Object.keys(plugins).map((key: string) => {
  const plugin: SlaveBotPlugin = plugins[key];
  return plugin.register(bot, new Datastore(`./databases/${key}.db`));
});

const registrations: Observable<any> = Observable.forkJoin(
  observables
);

registrations.subscribe(
  () => {},
  (err) => {
    throw err;
  },
  () => {
    bot.loginWithToken(slaveBotConfig.botToken, null, null, () => {
      console.log('Slave Bot is running...')
    });
  }
);





