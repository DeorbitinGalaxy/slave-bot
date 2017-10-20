import { Message, GuildMember } from 'discord.js';

import { 
  SlaveBotPlugin, 
  PluginSummary, 
  PluginConfiguration, 
  split, 
  getDoubleQuotedText, 
  fromDiscordEvent,
  Md, 
  SlaveBotEvents
} from '../../lib';

export default class NicknamePlugin implements SlaveBotPlugin {
  
  name = 'nickname';

  version = require('../../../package.json').version;

  description = 'Change the bot username (only twice per hour)';

  usage = '/slavenick {nickname}';

  events = new NicknamePluginEvents()
}

class NicknamePluginEvents implements SlaveBotEvents {
  async message (plugin: PluginConfiguration, message: Message) {
    const parts: string[] = split(message);

    if (parts[0] === '/slavenick' && plugin.server.isElevated(message)) {

      const nick = getDoubleQuotedText(parts, 1);
      if (nick.error) {
        return message.reply('Missing nickname or syntax error');
      }

      const member = await message.guild.fetchMember(plugin.bot.user);
      return member.setNickname(nick.text);
    }
  }
}

