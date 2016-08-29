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
  name: 'code',
  version: '1.0.0',
  description: 'Paste code using Markdown',
  register (plugin: PluginConfiguration) {

    subscription = fromDiscordEvent(plugin.bot, 'message').subscribe((message: Message) => {

      const parts: string[] = split(message);

      if (parts[0] === '/code' && plugin.server.isElevated(message)) {

        if (!parts[1]) {
          return plugin.bot.reply(message, 'Missing code');
        }

        const code = parts.slice(1, parts.length);
        const args: any = plugin.server.parseArgs(code);

        return plugin.bot.deleteMessage(message, { wait: 0 }, (err) => {
          return plugin.bot.sendMessage(message, Md.build(
            Md.line(`From ${message.author.mention()}`),
            Md.line(),
            Md.multilineCode(args._.join(' '), args.l)
          ));
        });
      }
    });

    return Observable.empty();
  },
  destroy () {
    subscription.unsubscribe();
  }
}
