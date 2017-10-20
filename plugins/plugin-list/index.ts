import { Message } from 'discord.js';
import { SlaveBotPlugin, SlaveBotEvents, PluginConfiguration, PluginSummary, split, Md, fromDiscordEvent} from '../../lib';

export default class ListPlugin implements SlaveBotPlugin {
  name = 'plugin-list';

  version = require('../../../package.json').version;

  description = 'Display the plugin list';

  usage = '/pluginlist';

  events = new ListPluginEvents();
}

class ListPluginEvents implements SlaveBotEvents {
  message (plugin: PluginConfiguration, message: Message) {
  
    const parts: string[] = split(message);
    if (parts[0] !== '/pluginlist') {
      return;
    }
  
    const list = plugin.server.pluginList();
    let reply = Md.line('Plugins registered:');
  
    list.forEach((plugin: PluginSummary) => {
      const { usage, description } = plugin;
      reply = Md.build(
        reply,
        Md.line(Md.bold(plugin.name) + ' - ' + Md.italic('v', plugin.version)),
        Md.line(description ? description : 'No description available'),
        Md.line(Md.bold('Usage: ', usage ? usage : 'No usage available')),
        Md.line()
      );
    });
  
    return message.reply(reply);
  }
}