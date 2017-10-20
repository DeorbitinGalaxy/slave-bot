import { resolve, join } from 'path';
import * as minimist from 'minimist';

import { SlaveBotConfig } from './config';
import { SlaveBotServer } from './server';

const args: any = minimist(process.argv.slice(2));

let slaveJson = join(process.cwd(), 'slave.json');

if (args.config && typeof args.config === 'string') {
  slaveJson = resolve(args.config);
} 

const server = new SlaveBotServer();

server.setup(slaveJson).then(() => {
    server.start();
});

server.ready.subscribe((ready) => {
  if (ready) {
    console.log('Slave Bot started...');
  }
});

