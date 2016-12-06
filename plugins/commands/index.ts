import { Client, Message } from 'discord.js';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/bindCallback';
import { Subscription } from 'rxjs/Subscription';
import * as Datastore from 'nedb';

import { 
  SlaveBotPlugin, 
  fromDiscordEvent, 
  split, 
  getDoubleQuotedText, 
  Md, 
  PluginConfiguration,
  escape
} from '../../lib';

const internals: any = {
  guilds: {},
  // http://www.fon.hum.uva.nl/praat/manual/Regular_expressions_1__Special_characters.html
};

function loadCommands (db: Datastore, guild: string) {
  return new Promise((resolve, reject) => {
    db.find({ guild }, (err, list) => {
      if (err) {
        reject(err);
      }
      else {
        internals.guilds[guild] = list;
        resolve(list);
      }
    });
  })
}

function registerCommand (bot: Client, db: Datastore, message: Message, parts: string[]) {

  const command: string = parts[1];

  if (!command) {
    return message.reply(Md.build(
      `Missing command name. Usage: /addcmd ${Md.bold('commandname')} "Display something".,
      'The double quotes are optional if the content is only one word short.`
    ));
  }

  const { error, text, index }: any = getDoubleQuotedText(parts, 2);

  if (error) {
    if (error === 404) {
      return message.reply('Missing command content');
    }
    else if (error === 400) {
      return message.reply('Missing double quote');
    }
  }

  let matching: string = 'start';

  if (index < parts.length) {
    if (['start', 'match', 'startonly'].includes(parts[index])) {
      matching = parts[index];
    }
    else {
      return message.reply('Wrong matching strategy: must be start, startonly or match')
    }
  }

  db.insert({
    _id: `${message.guild.id}-${command}`,
    name: command,
    guild: message.guild.id,
    content: text,
    matching: matching
  }, (err: any) => {

    if (err && err.errorType === 'uniqueViolated') {
      return message.reply(`Command ${Md.bold(command)} already exist.`);
    }

    return loadCommands(db, message.guild.id).then(() => {
      return message.reply(Md.build(
        Md.line(),
        Md.line('Registered command: ', Md.bold(command)),
        Md.line('Usage: ', Md.bold(command)),
        Md.line('Matching strategy: ', Md.bold(matching)),
        Md.line('Command content: ', Md.bold(text))
      ));
    });

  });

}

function deleteCommand (bot: Client, db: Datastore, message: Message) {

  const parts: string[] = split(message);
  const command = parts[1];

  if (!command) {
    return message.reply('Missing command name');
  }

  db.remove({ _id: `${message.guild.id}-${command}` }, (err, num) => {

    if (err || num === 0) {
      return message.reply(`Command ${Md.bold(command)} does not exist`);
    }

    return loadCommands(db, message.guild.id).then(() => {
      return message.reply(`Command ${Md.bold(command)} removed`);
    });
  });
}


function handleCommand (command: any, message: Message) {
  let regex: RegExp;

  switch (command.matching) {
    case 'start': 
      regex = new RegExp(`^${escape(command.name)}(\\s|$)`);
      break;
    case 'startonly': 
      regex = new RegExp(`^${escape(command.name)}$`);
      break;
    case 'match':
      regex = new RegExp(`(^|\\s)${escape(command.name)}(\\s|$)`);
      break;
  }
  
  const match = regex.test(message.content);
  if (match) {
    message.channel.sendMessage(command.content);
  }

  return match;
}

function handlePossibleCommand (list: any[], message: Message) {

  const content = message.content;

  for (let i = 0; i < list.length; ++i) {
    if (handleCommand(list[i], message)) {
      break;
    }
  }
}

function commandList (bot: Client, db: Datastore, message: Message) {

  function display (list: any) {
    let reply: string;
    if (list.length === 0) {
      reply = `No command registered. Register your first command by using ${Md.bold('/addcmd')}`;
    }
    else {
      reply = Md.line(list.length, (list.length > 1) ? ' commands are available:' : ' command is available:');
      list.forEach((command) => {
        reply += Md.line(Md.bold(command.name));
      });
    }

    return message.reply(reply);
  }

  if (internals.guilds[message.guild.id]) {
    display(internals.guilds[message.guild.id]);
  }
  else {
    loadCommands(db, message.guild.id).then((list) => display(list));
  }
}

let subscription: Subscription;

function assignDefaultsOptions (options: any) {
  options = options || {};
  return options
}

export const plugin: SlaveBotPlugin = {
  name: 'commands',
  version: require('../../../package.json').version,
  description: 'Manage custom commands',
  usage: `
    /addcmd {command} {message} [start|match|startonly]
    Matching strategies: 
      start: Match command at the start of the message (followed by a message or not)
      match: Match command in the all message
      startonly: Match command at the start of the message without a following message
    /delcmd {command}
    /cmdlist
  `,
  events: {
    message (plugin: PluginConfiguration, message: Message) {

      const parts: string[] = split(message);

      const { bot, db } = plugin;
      internals.options = assignDefaultsOptions(plugin.options);

      switch (parts[0]) {
        case '/addcmd':
          registerCommand(bot, db, message, parts);
          break;
        case '/delcmd':
          deleteCommand(bot, db, message);
          break;
        case '/cmdlist':
          commandList(bot, db, message);
          break;
        default:
          if (internals.guilds[message.guild.id]) {
            handlePossibleCommand(internals.guilds[message.guild.id], message);
          }
          else {
            loadCommands(db, message.guild.id).then((list: any[]) => handlePossibleCommand(list, message));
          }
      }
    }
  },
  register (plugin: PluginConfiguration) {

    return new Promise((resolve, reject) => {
      plugin.db.ensureIndex({ fieldName: 'guild' }, (err) => {
        if (err) {
          reject(err);
        }
        else {
          plugin.db.loadDatabase(() => resolve());
        }
      });
    });
  }
}
