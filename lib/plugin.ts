import { PluginConfiguration } from './server';
import { Message } from 'discord.js';
import { SlaveBotEvents } from './events';


export interface SlaveBotPlugin {
  name: string;
  version: string;
  register?: (plugin?: PluginConfiguration) => Promise<any>;
  destroy?: (plugin?: PluginConfiguration) => void;
  description?: string;
  usage?: string;
  events?: SlaveBotEvents;
}
