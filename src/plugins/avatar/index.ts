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
  name: 'avatar',
  version: '1.0.0',
  description: 'Change the bot avatar. The update is seen on all the servers the bot is connected to',
  usage: '/slaveavatar {game}',
  register (plugin: PluginConfiguration) {
    
    subscription = fromDiscordEvent(plugin.bot, 'message').subscribe((message: Message) => {

      if (!plugin.server.isElevated(message)) {
        return;
      }

      const parts: string[] = split(message);
      if (parts[0] === '/slaveavatar') {

        if (!parts[1]) {
          return message.reply('Missing url');
        }

        return plugin.bot.user.setAvatar(parts[1] || null);
      }
    });

    return Observable.empty();
  },
  destroy () {
    subscription.unsubscribe();
  }
}
