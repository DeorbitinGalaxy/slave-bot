import { Observable } from 'rxjs/Observable';
import { PluginConfiguration } from '../server';

export interface SlaveBotPlugin {
  name: string;
  version: string;
  register: (plugin: PluginConfiguration) => Observable<any>;
  destroy: () => void;
  dependencies?: string[];
  description?: string;
  usage?: string;
}

export { PluginConfiguration, SlaveBotServer } from '../server';