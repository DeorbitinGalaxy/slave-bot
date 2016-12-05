import { Message } from 'discord.js';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/empty';
import { SlaveBotPlugin, PluginConfiguration, PluginSummary, split, Md, fromDiscordEvent} from '../../lib';

let subscription: any;

export const plugin: SlaveBotPlugin = {
  name: 'plugin-list',
  version: '1.0.0',
  description: 'Display the plugin list',
  usage: '/pluginlist',
  register (plugin: PluginConfiguration) {

    subscription = fromDiscordEvent(plugin.bot, 'message').subscribe((message: Message) => {

      const parts: string[] = split(message);


      if (parts[0] === '/pluginlist') {

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

    });

    return Promise.resolve();
  },
  destroy () {
    subscription.unsubscribe();
  }
}

