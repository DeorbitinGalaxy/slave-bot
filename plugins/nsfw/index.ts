import { Message, Emoji } from 'discord.js';

import { SlaveBotPlugin, PluginConfiguration, split, Md, fromDiscordEvent } from '../../lib';

export const plugin: SlaveBotPlugin = {
  name: 'nsfw',
  version: require('../../../package.json').version,
  description: 'Add NSFW tag to message',
  usage: '!nsfw {url}',
  events: {
    message (plugin: PluginConfiguration, message: Message) {

      const parts: string[] = split(message);

      if (parts[0] === '!nsfw') {

        if (!parts[1]) {
          return 
        }

        const url = parts.slice(1, parts.length);

        return message.delete().then(() => {
          return message.channel.sendMessage(`[NSFW] From ${message.author.toString()} : <${url}>`)
        })
        .catch(() => {
          return message.channel.sendMessage(`But Master ${message.author.toString()}, I can't delete messages :persevere:`);
        });
      }
    }
  }
}

