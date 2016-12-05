import { Message } from 'discord.js';

import { SlaveBotPlugin, PluginConfiguration, split, Md, fromDiscordEvent } from '../../lib';

export const plugin: SlaveBotPlugin = {
  name: 'code',
  version: '1.0.0',
  description: 'Paste code using Markdown',
  usage: '/code {snippet}',
  events: {
    message (plugin: PluginConfiguration, message: Message) {

      const parts: string[] = split(message);

      if (parts[0] === '/code' && plugin.server.isElevated(message)) {

        if (!parts[1]) {
          return message.reply('Missing code');
        }

        const code = parts.slice(1, parts.length);
        const args: any = plugin.server.parseArgs(code);

        return message.delete().then(() => {
          return message.channel.sendCode(args.l, args._.join(' '));
        });
      }
    }
  }
}

