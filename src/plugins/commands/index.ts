import { Client, Message } from 'discord.js';
import { SlaveBotPlugin } from '../plugin';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/bindCallback';
import { Subscription } from 'rxjs/Subscription';
import * as Datastore from 'nedb';

import { fromDiscordEvent } from '../../utils/discord-event';
import { split, getDoubleQuotedText } from '../../utils/message-utils';
import * as Md from '../../utils/markdown';

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

  db.remove({ _id: command }, (err, num) => {
    if (err || num === 0) {
      return bot.reply(message, `Command ${Md.bold('/' + command)} does not exist`);
    }

    return bot.reply(message, `Command ${Md.bold('/' + command)} removed`);
  });
}

function executeCommand (bot: Client, db: Datastore, message: Message) {

  const parts: string[] = split(message);

  const command: string = parts[0];

  db.findOne({ _id: command.slice(1, command.length) }, (err, doc: any) => {
    if (!err && doc) {
      bot.sendMessage(message.channel, doc.content);
    }
  })
}

function commandList (bot: Client, db: Datastore, message: Message) {

  const list: Array<any> = db.getAllData();

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
}

let subscription: Subscription;

export const name: string = 'commands';
export const version: string = '1.0.0';
export const plugin: SlaveBotPlugin = {

  register (bot: Client, db: Datastore): Observable<any> {


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
          if (parts[0].startsWith('/')) {
            executeCommand(bot, db, message);
          }
      }
    });

    return Observable.create((observer) => {
      db.loadDatabase((() => observer.complete()));
    });
  },

  destroy (): void {
    subscription.unsubscribe();
  }
}
