import { Client, Message } from 'discord.js';
import { SlaveBotPlugin } from '../plugin';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/bindCallback';
import { Subscription } from 'rxjs/Subscription';
import * as Datastore from 'nedb';

import { fromDiscordEvent } from '../../utils/discord-event';
import { split, getDoubleQuotedText } from '../../utils/message-utils';
import * as Md from '../../utils/markdown';
import { PluginConfiguration } from '../../server';

function registerCommand (bot: Client, db: Datastore, message: Message, parts: string[]) {
  const command: string = parts[1];

  if (!command) {
    return bot.reply(message, Md.build(
      `Missing command name. Usage: /addcommand ${Md.bold('commandname')} "Display something".,
      'The double quotes are optional if the content is only one word short.`
    ));
  }

  const content: any = getDoubleQuotedText(parts,  2);

  if (content.error) {
    if (content.error === 404) {
      return bot.reply(message, 'Missing command content');
    }
    else if (content.error === 400) {
      return bot.reply(message, 'Missing double quote');
    }
  }

  db.insert({
    _id: command,
    server: message.server.id,
    content: content.text
  }, (err: any) => {
    if (err && err.errorType === 'uniqueViolated') {
      return bot.reply(message, `Command ${Md.bold(command)} already exist.`);
    }

    return bot.reply(message, Md.build(
      Md.line(),
      Md.line(`Registered command: ${Md.bold(command)}`),
      Md.line(`Usage: ${Md.bold('/' + command)}`),
      Md.line(`Command content: ${Md.bold(content.text)}`)
    ));
  });

}

function deleteCommand (bot: Client, db: Datastore, message: Message) {

  const parts: string[] = split(message);
  const command = parts[1];

  if (!command) {
    return bot.reply(message, 'Missing command name');
  }

  db.remove({ _id: command, server: message.server.id }, (err, num) => {
    if (err || num === 0) {
      return bot.reply(message, `Command ${Md.bold('/' + command)} does not exist`);
    }

    return bot.reply(message, `Command ${Md.bold('/' + command)} removed`);
  });
}

function executeCommand (bot: Client, db: Datastore, message: Message) {

  const parts: string[] = split(message);

  const command: string = parts[0];

  db.findOne({ _id: command.slice(1, command.length), server: message.server.id }, (err, doc: any) => {
    if (!err && doc) {
      bot.sendMessage(message.channel, doc.content);
    }
  })
}

function commandList (bot: Client, db: Datastore, message: Message) {

  db.find({ server: message.server.id }, (err, list) => {
    let reply: string;
    if (list.length === 0) {
      reply = `No command registered. Register your first command by using ${Md.bold('/addcommand')}`;
    }
    else {
     reply = '' + list.length + ' commands are available:';
     list.forEach((command) => {
       reply += `\n/${Md.bold(command._id)}`;
     });
    }
    return bot.reply(message, reply);
  });
}

let subscription: Subscription;

function assignDefaultsOptions (options: any) {
  options = options || {};
  options.commandCharacter = options.commandCharacter || '/';
  return options
}

export const plugin: SlaveBotPlugin = {

  name: 'commands',
  version: '1.0.0',
  description: 'Manage custom commands',
  register (plugin: PluginConfiguration): Observable<any> {

    const { bot, db } = plugin;

    const options = assignDefaultsOptions(plugin.options);

    subscription = fromDiscordEvent(bot, 'message').subscribe((message: Message) => {

      const parts: string[] = split(message);

      switch (parts[0]) {
        case '/addcommand':
          registerCommand(bot, db, message, parts);
          break;
        case '/deletecommand':
          deleteCommand(bot, db, message);
          break;
        case '/commandlist':
          commandList(bot, db, message);
          break;
        default:
          if (parts[0].startsWith(options.commandCharacter)) {
            executeCommand(bot, db, message);
          }
      }
    });

    return Observable.create((observer) => {
      db.ensureIndex({ fieldName: 'server' }, (err) => {
        if (err) {
          observer.error(err);
        }
        else {
          db.loadDatabase((() => observer.complete()));
        }
      });
    });
  },

  destroy (): void {
    subscription.unsubscribe();
  }
}
