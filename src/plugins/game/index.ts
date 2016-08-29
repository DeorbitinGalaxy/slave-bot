import { Message } from 'discord.js';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/empty';

import { SlaveBotPlugin } from '../plugin';
import { PluginConfiguration } from '../../server';
import { split } from '../../utils/message-utils';
import * as Md from '../../utils/markdown';
import { fromDiscordEvent } from '../../utils/discord-event';

let subscription: any;

export const plugin: SlaveBotPlugin = {
  name: 'game',
  version: '1.0.0',
  description: 'Change the bot playing game. The update is seen on all the servers the bot is connected to',
  register (plugin: PluginConfiguration) {

    subscription = fromDiscordEvent(plugin.bot, 'message').subscribe((message: Message) => {

      const parts: string[] = split(message);

      if (parts[0] === '/slavegame' && plugin.server.isElevated(message)) {

        return plugin.bot.setPlayingGame(parts[1] || null);
      }
    });

    return Observable.empty();
  },
  destroy () {
    subscription.unsubscribe();
  }
}
