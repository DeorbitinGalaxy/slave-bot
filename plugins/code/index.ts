import { Message, Emoji } from 'discord.js';

import { SlaveBotPlugin, PluginConfiguration, split, Md, fromDiscordEvent, SlaveBotEvents } from '../../lib';


export default class CodePlugin implements SlaveBotPlugin {
  name = 'code'

  version = require('../../../package.json').version

  description = 'Paste code using Markdown'

  usage = '/code {snippet}'

  events = new CodePluginEvents()
}

class CodePluginEvents implements SlaveBotEvents {
  async message (plugin: PluginConfiguration, message: Message) {

    const parts: string[] = split(message);

    if (parts[0] === '/code') {

      if (!parts[1]) {
        return message.reply('Missing code');
      }

      const code = parts.slice(1, parts.length);
      const args: any = plugin.server.parseArgs(code);
      
      try {
        await message.delete();
        return message.channel.sendCode(args.l, args._.join(' '));
      }
      catch {
        return message.channel.send(`But Master ${message.author.toString()}, I can't delete messages :persevere:`);
      }
    }
  }
}
