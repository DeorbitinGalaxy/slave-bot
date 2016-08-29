import { Client } from 'discord.js';
import { Observable } from 'rxjs/Observable';
import * as Datastore from 'nedb';

import { PluginConfiguration } from '../server';

export interface SlaveBotPlugin {
  name: string;
  version: string;
  register: (plugin: PluginConfiguration) => Observable<any>;
  destroy: () => void;
}