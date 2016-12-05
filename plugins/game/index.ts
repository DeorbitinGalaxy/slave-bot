import { Message } from 'discord.js';

import { 
  SlaveBotPlugin, 
  PluginConfiguration,
  split,
  getDoubleQuotedText,
  Md,
  fromDiscordEvent
} from '../../lib';


export const plugin: SlaveBotPlugin = {
  name: 'game',
  version: '1.0.0',
  description: 'Change the bot playing game. The update is seen on all the servers the bot is connected to',
  usage: '/slavegame {game}',
  events: {
    message (plugin: PluginConfiguration, message: Message) {
      if (!plugin.server.isElevated(message)) {
        return;
      }

      const parts: string[] = split(message);
      if (parts[0] === '/slavegame') {
        const game = getDoubleQuotedText(parts, 1);
        return plugin.bot.user.setGame(game.text || null);
      }
    }
  }
}
