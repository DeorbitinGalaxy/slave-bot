import 'rxjs/add/observable/forkJoin';

import { SlaveBotConfig } from './config';
import { SlaveBotServer } from './server';

let config: SlaveBotConfig;

try {
  config = require('../slave.json');
}
catch (ignored) {
  throw 'Could not find slave.json configuration file';
}

const server = new SlaveBotServer(config);

server.ready.subscribe((ready) => {
  if (ready) {
    console.log('Slave bot started');
  }
})

server.start();

