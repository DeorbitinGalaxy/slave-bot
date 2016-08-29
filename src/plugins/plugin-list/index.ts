import { Message } from 'discord.js';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/empty';

import { SlaveBotPlugin } from '../plugin';
import { PluginConfiguration } from '../../server';
import { split } from '../../utils/message-utils';
import * as Md from '../../utils/markdown';
import { fromDiscordEvent } from '../../utils/discord-event';


let subscription: any;

export const plugin: SlaveBotPlugin = {
  name: 'plugin-list',
  version: '1.0.0',
  register (plugin: PluginConfiguration) {

    subscription = fromDiscordEvent(plugin.bot, 'message').subscribe((message: Message) => {

      const parts: string[] = split(message);


      if (parts[0] === '/pluginlist' && plugin.server.isElevated(message)) {

        const list = plugin.server.pluginList();
        let reply = 'Plugins registered:';

        list.forEach((plugin: any) => {
          reply = `${reply}\n${Md.bold(plugin.name)} - ${Md.italic('v' + plugin.version)}`;
        });

        return plugin.bot.reply(message, reply);
      }

    });

    return Observable.empty();
  },
  destroy () {
    subscription.unsubscribe();
  }
}

