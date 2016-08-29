import 'rxjs/add/observable/forkJoin';

import { SlaveBotConfig } from './config';
import { SlaveBotServer } from './server';

const config: SlaveBotConfig = require('../slave.json');

const server = new SlaveBotServer(config);

server.start().subscribe(() => {
  console.log('Slave bot started');
});



