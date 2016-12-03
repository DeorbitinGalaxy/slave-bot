import { Message } from 'discord.js';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/empty';

import { SlaveBotPlugin } from '../plugin';
import { PluginConfiguration } from '../../server';
import { split, getDoubleQuotedText } from '../../utils/message-utils';
import * as Md from '../../utils/markdown';
import { fromDiscordEvent } from '../../utils/discord-event';

let subscription: any;

export const plugin: SlaveBotPlugin = {
  name: 'nickname',
  version: '1.0.0',
  description: 'Change the bot username (only twice per hour)',
  usage: '/slavenick {nickname}',
  register (plugin: PluginConfiguration) {

    subscription = fromDiscordEvent(plugin.bot, 'message').subscribe((message: Message) => {

      const parts: string[] = split(message);

      if (parts[0] === '/slavenick' && plugin.server.isElevated(message)) {

        const nick = getDoubleQuotedText(parts, 1);
        if (nick.error) {
          return message.reply('Missing nickname or syntax error');
        }
        
        return plugin.bot.user.setUsername(nick.text);
      }
    });

    return Observable.empty();
  },
  destroy () {
    subscription.unsubscribe();
  }
}
