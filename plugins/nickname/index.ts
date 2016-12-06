import { Message, GuildMember } from 'discord.js';

import { 
  SlaveBotPlugin, 
  PluginSummary, 
  PluginConfiguration, 
  split, 
  getDoubleQuotedText, 
  fromDiscordEvent,
  Md 
} from '../../lib';

export const plugin: SlaveBotPlugin = {
  name: 'nickname',
  version: require('../../../package.json').version,
  description: 'Change the bot username (only twice per hour)',
  usage: '/slavenick {nickname}',
  events: {
    message (plugin: PluginConfiguration, message: Message) {
      const parts: string[] = split(message);

      if (parts[0] === '/slavenick' && plugin.server.isElevated(message)) {

        const nick = getDoubleQuotedText(parts, 1);
        if (nick.error) {
          return message.reply('Missing nickname or syntax error');
        }

        return message.guild.fetchMember(plugin.bot.user).then((member: GuildMember) => {
          return member.setNickname(nick.text);
        });
      }
    }
  }
}
