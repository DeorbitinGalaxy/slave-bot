import { resolve, join } from 'path';
import * as minimist from 'minimist';

import { SlaveBotConfig } from './config';
import { SlaveBotServer } from './server';

const args: any = minimist(process.argv.slice(2));

let slaveJson = join(process.cwd(), 'slave.json');

if (args.config && typeof args.config === 'string') {
  slaveJson = resolve(args.config);
} 

let config;

// TODO slave.json path
try {
  config = require(slaveJson);
}
catch (ignored) {
  throw new Error('Could not find slave.json configuration file at: ' + slaveJson);
}

const server = new SlaveBotServer(config);

server.ready.subscribe((ready) => {
  if (ready) {
    console.log('Slave bot started');
  }
});


server.start();



