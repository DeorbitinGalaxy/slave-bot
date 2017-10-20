import { Message } from 'discord.js';

import { SlaveBotPlugin, SlaveBotEvents, PluginConfiguration, PluginSummary, split, Md, fromDiscordEvent } from '../../lib';

export default class InfoPlugin implements SlaveBotPlugin {
  name = 'plugin-info';

  version = require('../../../package.json').version;

  description = 'Display plugin information';

  usage = '/plugininfo {name}';

  events = new InfoPluginEvents()
}

class InfoPluginEvents implements SlaveBotEvents {
  message (plugin: PluginConfiguration, message: Message) {
    const parts: string[] = split(message);
  
    if (parts[0] !== '/plugininfo') {
      return;
    }
  
    const name = parts[1];
    if (!name) {
      return message.reply('Missing plugin name');
    }
  
    const info: PluginSummary = plugin.server.pluginInfo(name);
  
    if (!info) {
      return message.reply(`Plugin ${name} does not exists`);
    }
  
    const { usage, description } = info;
    const reply = Md.build(
      Md.line(),
      Md.line(Md.bold(info.name) + ' - ' + Md.italic('v', info.version)),
      Md.line(description ? description : 'No description available'),
      Md.line(Md.bold('Usage: ', usage ? usage : 'No usage available')),
    );
  
    return message.reply(reply);
  }
}

