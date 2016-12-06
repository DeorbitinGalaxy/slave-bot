import { Message, ClientUser } from 'discord.js';

import { 
  SlaveBotPlugin, 
  PluginConfiguration,
  split,
  getDoubleQuotedText,
  Md,
  fromDiscordEvent
} from '../../lib';


export const plugin: SlaveBotPlugin = {
  name: 'game',
  version: '1.0.0',
  description: 'Change the bot playing game. The update is seen on all the servers the bot is connected to',
  usage: '/slavegame {game}',
  register (plugin: PluginConfiguration) {
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
  },
  events: {
    message (plugin: PluginConfiguration, message: Message) {

      if (!plugin.server.isElevated(message)) {
        return;
      }
      const parts: string[] = split(message);
      if (parts[0] === '/slavegame') {
        const game = getDoubleQuotedText(parts, 1);

        if (!game.text) {
          return;
        }

        return plugin.bot.user.setGame(game.text).then((user: ClientUser) => {
          plugin.db.update({
            _id: 'current_game'
          },{
            game: game.text
          }, {
            upsert: true
          });
        });
      }
    }
  }
}
