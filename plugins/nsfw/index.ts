import { Message, Emoji, RichEmbed, BufferResolvable } from 'discord.js';
import { parse as parseUrl } from 'url';
import { SlaveBotPlugin, PluginConfiguration, split, Md, fromDiscordEvent, SlaveBotEvents } from '../../lib';


export default class NsfwPlugin implements SlaveBotPlugin {
  name = 'nsfw';

  version = require('../../../package.json').version;

  description = 'Add NSFW tag to message';

  usage = '!nsfw {url}';

  events = new NsfwPluginEvents()
}

class NsfwPluginEvents implements SlaveBotEvents {
  async message (plugin: PluginConfiguration, message: Message) {
  
    const parts: string[] = split(message);
    if (parts[0] === '!nsfw') {
  
      if (!parts[1]) {
        return 
      }
  
      try {
        if (parseUrl(parts[1]).hostname !== null) {
          await message.delete();
          await message.channel.send({ 
            embed: {
              author: { name: message.author.username, icon_url: message.author.avatarURL }, 
              title: 'NSFW Content',
              thumbnail: { url: 'https://i.imgur.com/QVWrtIr.jpg' },
              url: parts[1],
              description: parts[1]
            } 
          })
        }

      }
      catch(e) {
        const error: string = e.message;
        if (e.name === 'DiscordAPIError') {
          if (/permissions/gi.test(error)) {
            return message.channel.send(`Sorry, I could not fulfill your request. I may not be able to delete messages :persevere:.`);
          }
          
          if (/url/gi.test(error)) {
            return message.channel.send(`Sorry, I could not fulfill your request. It looks like your URL is invalid :persevere:.`)
          }
        }
      }
    }
  }
}
