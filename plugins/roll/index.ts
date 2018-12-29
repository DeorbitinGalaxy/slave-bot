import { Message } from 'discord.js';
import { SlaveBotPlugin, SlaveBotEvents, PluginConfiguration, split, parseIntArg } from '../../lib';

export default class RollPlugin implements SlaveBotPlugin {
  name = 'plugin-list';

  version = require('../../../package.json').version;

  description = 'Roll random number (0 to 100 by default)';

  usage = '/roll [max]';

  events = new RollPluginEvents();
}

class RollPluginEvents implements SlaveBotEvents {
  async message (plugin: PluginConfiguration, message: Message) {
  
    const parts: string[] = split(message);
    if (parts[0] !== '/roll') {
      return;
    }

    const max = parseIntArg(parts, 1, 100)
    const roll = Math.floor(Math.random() * (max + 1));
    return message.reply(roll);
  }
}