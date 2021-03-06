import { Message, ClientUser } from 'discord.js';

import { 
  SlaveBotPlugin, 
  PluginConfiguration,
  split,
  getDoubleQuotedText,
  Md,
  fromDiscordEvent,
  SlaveBotEvents
} from '../../lib';

export default class GamePlugin implements SlaveBotPlugin {
  name = 'game';

  version = require('../../../package.json').version;

  description = 'Change the bot playing game. The update is seen on all the servers the bot is connected to';

  usage: '/slavegame {game}'

  events = new GamePluginEvents()

  async register (plugin: PluginConfiguration) {
    return new Promise((resolve, reject) => {
      plugin.db.loadDatabase(() => {
        plugin.db.findOne({ _id: 'current_game' }, (err, doc: any) => {

          if (err) {
            reject(err);
          }

          if (doc) {
            plugin.bot.user.setGame(doc.game).then(() => resolve());
          }
          else {
            resolve();
          }
        });
      });
    });
  }
}

class GamePluginEvents implements SlaveBotEvents {
  async message (plugin: PluginConfiguration, message: Message) {
    
    if (!plugin.server.isElevated(message)) {
      return;
    }
    const parts: string[] = split(message);
    if (parts[0] === '/slavegame') {
      const game = getDoubleQuotedText(parts, 1);

      if (!game.text) {
        return;
      }

      const user = await plugin.bot.user.setGame(game.text)
      plugin.db.update({
        _id: 'current_game'
      },{
        game: game.text
      }, {
        upsert: true
      });
    }
  }
}

