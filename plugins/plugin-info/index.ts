import { Message } from 'discord.js';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/empty';

import { SlaveBotPlugin, PluginConfiguration, PluginSummary, split, Md, fromDiscordEvent } from '../../lib';

let subscription: any;

export const plugin: SlaveBotPlugin = {
  name: 'plugin-info',
  version: '1.0.0',
  description: 'Display plugin information',
  usage: '/plugininfo {name}',
  register (plugin: PluginConfiguration) {

    subscription = fromDiscordEvent(plugin.bot, 'message').subscribe((message: Message) => {

      const parts: string[] = split(message);

      if (parts[0] === '/plugininfo') {

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
    });

    return Observable.empty();
  },
  destroy () {
    subscription.unsubscribe();
  }
}

