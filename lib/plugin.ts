import { PluginConfiguration } from './server';
import { Message } from 'discord.js';



export interface SlaveBotEvents {
  message?: (plugin: PluginConfiguration, message: Message) => void;
}

export interface SlaveBotPlugin {
  name: string;
  version: string;
  register: (plugin: PluginConfiguration) => Promise<any>;
  destroy: () => void;
  description?: string;
  usage?: string;
  events?: SlaveBotEvents;
}
