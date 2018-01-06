import { Client, Message } from 'discord.js';
import * as Datastore from 'nedb';

import { 
  SlaveBotPlugin, 
  SlaveBotEvents,
  fromDiscordEvent, 
  split, 
  getDoubleQuotedText, 
  Md, 
  PluginConfiguration,
  escape
} from '../../lib';


export default class CommandsPlugin implements SlaveBotPlugin {
  name = 'commands';

  version = require('../../../package.json').version;

  description = 'Manage custom commands';

  usage = `
    /addcmd {command} {message} [start|match|startonly]
    Matching strategies: 
      start: Match command at the start of the message (followed by a message or not)
      match: Match command in the all message
      startonly: Match command at the start of the message without a following message
    /delcmd {command}
    /cmdlist
  `;


  events = new CommandsPluginEvents()

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

class CommandsPluginEvents implements SlaveBotEvents {

  private guilds = {}

  async message (plugin: PluginConfiguration, message: Message) {
  
    const parts: string[] = split(message);
  
    const { bot, db } = plugin;
    
    switch (parts[0]) {
      case '/addcmd':
        this.registerCommand(plugin, bot, db, message, parts);
        break;
      case '/delcmd':
        this.deleteCommand(plugin, bot, db, message);
        break;
      case '/cmdlist':
        this.commandList(bot, db, message);
        break;
      case '/cmdbackup':
        this.sendBackup(bot, db, message);
        break;
      default:
        if (this.guilds[message.guild.id]) {
          this.handlePossibleCommand(this.guilds[message.guild.id], message);
        }
        else {
          const list: any[] = await this.loadCommands(db, message.guild.id);
          this.handlePossibleCommand(list, message);
        }
    }
  }

  private registerCommand (plugin: PluginConfiguration, bot: Client, db: Datastore, message: Message, parts: string[]) {

    if (!plugin.server.isElevated(message)) {
      return;
    }

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
    }, async (err: any) => {
  
      if (err && err.errorType === 'uniqueViolated') {
        return message.reply(`Command ${Md.bold(command)} already exist.`);
      }

      await this.loadCommands(db, message.guild.id)
      return message.reply(Md.build(
        Md.line(),
        Md.line('Registered command: ', Md.bold(command)),
        Md.line('Usage: ', Md.bold(command)),
        Md.line('Matching strategy: ', Md.bold(matching)),
        Md.line('Command content: ', Md.bold(text))
      ));
    });
  
  }
  
  private deleteCommand (plugin: PluginConfiguration, bot: Client, db: Datastore, message: Message) {
  
    if (!plugin.server.isElevated(message)) {
      return;
    }

    const parts: string[] = split(message);
    const command = parts[1];
  
    if (!command) {
      return message.reply('Missing command name');
    }
  
    db.remove({ _id: `${message.guild.id}-${command}` }, async (err, num) => {
  
      if (err || num === 0) {
        return message.reply(`Command ${Md.bold(command)} does not exist`);
      }
      
      await this.loadCommands(db, message.guild.id)
      return message.reply(`Command ${Md.bold(command)} removed`);
    });
  }
  
  
  private handleCommand (command: any, message: Message) {
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
      message.channel.send(command.content);
    }
  
    return match;
  }
  
  private handlePossibleCommand (list: any[], message: Message) {
    const content = message.content;
  
    for (let i = 0; i < list.length; ++i) {
      if (this.handleCommand(list[i], message)) {
        break;
      }
    }
  }
  
  private async commandList (bot: Client, db: Datastore, message: Message) {
  
    function display (list: any[]) {
      let reply: string;
      if (list.length === 0) {
        reply = `No command registered. Register your first command by using ${Md.bold('/addcmd')}`;
      }
      else {
        reply = Md.line(list.length.toString(), (list.length > 1) ? ' commands are available:' : ' command is available:');
        list.forEach((command) => {
          reply += Md.line(Md.bold(command.name));
        });
      }
  
      return message.reply(reply);
    }
  
    if (this.guilds[message.guild.id]) {
      display(this.guilds[message.guild.id]);
    }
    else {
      const list = await this.loadCommands(db, message.guild.id);
      display(list);
    }
  }
  
  private async sendBackup (bot: Client, db: Datastore, message: Message) {
    const list = await this.loadCommands(db, message.guild.id);
    const buffer = new Buffer(JSON.stringify(list, null, 4), 'utf-8');
    return message.channel.sendFile(buffer, `cmd-backup-${message.guild.name}-${new Date()}.json`);
  }
  
  private loadCommands (db: Datastore, guild: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
      db.find({ guild }, (err, list) => {
        if (err) {
          reject(err);
        }
        else {
          this.guilds[guild] = list;
          resolve(list);
        }
      });
    })
  }
}

