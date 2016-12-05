import { resolve, join } from 'path';
import { SlaveBotConfig } from './config';
import { SlaveBotServer } from './server';


let config;

// TODO slave.json path
try {
  config = require(resolve(join(process.cwd(), 'slave.json')));
}
catch (ignored) {
  throw 'Could not find slave.json configuration file';
}

const server = new SlaveBotServer(config);

server.ready.subscribe((ready) => {
  if (ready) {
    console.log('Slave bot started');
  }
});


server.start();



