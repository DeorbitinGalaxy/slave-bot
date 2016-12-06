import { Message } from 'discord.js';

import { SlaveBotPlugin, PluginConfiguration, split, getDoubleQuotedText, Md, fromDiscordEvent } from '../../lib';

export const plugin: SlaveBotPlugin = {
  name: 'avatar',
  version: require('../../../package.json').version,
  description: 'Change the bot avatar. The update is seen on all the servers the bot is connected to',
  usage: '/slaveavatar {game}',
  events: {
    message (plugin: PluginConfiguration, message: Message) {
      
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
    }
  }
}
