import { Client } from 'discord.js';
import { Observable } from 'rxjs/Observable';
import * as Datastore from 'nedb';

export interface SlaveBotPlugin {
  register: (bot: Client, db?: Datastore) => Observable<any>;
  destroy: () => void;
}