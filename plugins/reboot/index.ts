import { Message } from 'discord.js';
import { Observable } from 'rxjs/Observable';

import { SlaveBotPlugin, PluginConfiguration, split, getDoubleQuotedText, Md, fromDiscordEvent } from '../../lib';

let subscription: any;

export const plugin: SlaveBotPlugin = {
  name: 'reboot',
  version: '1.0.0',
  description: 'Reboot the Slave Bot, eleveted permissions required.',
  usage: '/slavereboot',
  register (plugin: PluginConfiguration) {
    
    subscription = fromDiscordEvent(plugin.bot, 'message').subscribe((message: Message) => {

      if (!plugin.server.isElevated(message)) {
        return;
      }

      const parts: string[] = split(message);
      if (parts[0] === '/slavereboot') {

        message.channel.sendMessage('Rebooting...').then(() => {
          return plugin.server.reboot();
        });
      }
    });

    return Promise.resolve();
  },
  destroy () {
    subscription.unsubscribe();
  }
}
