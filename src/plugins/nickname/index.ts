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
  name: 'nickname',
  version: '1.0.0',
  description: 'Change the bot nickname on the current server',
  register (plugin: PluginConfiguration) {

    subscription = fromDiscordEvent(plugin.bot, 'message').subscribe((message: Message) => {

      const parts: string[] = split(message);

      if (parts[0] === '/slavenick' && plugin.server.isElevated(message)) {

        if (!parts[1]) {
          return plugin.bot.reply(message, 'Missing nickname');
        }

        return plugin.bot.setNickname(message.server, parts[1]);
      }
    });

    return Observable.empty();
  },
  destroy () {
    subscription.unsubscribe();
  }
}
