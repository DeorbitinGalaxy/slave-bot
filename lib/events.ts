import { 
  Message, 
  Guild,
  GuildMember,
  ClientUser, 
  User,
  Channel,
  Emoji,
  Collection,
  Role
} from 'discord.js';

import { PluginConfiguration } from './server';

export interface SlaveBotEvents {
  // Channels
  channelCreate?: (plugin: PluginConfiguration, channel: Channel) => void;
  channelDelete?: (plugin: PluginConfiguration, channel: Channel) => void;
  channelPinsUpdate?: (plugin: PluginConfiguration, channel: Channel) => void;

  // Guilds
  guildBanAdd?: (plugin: PluginConfiguration, guild: Guild, user: User) => void;
  guildBanRemove?: (plugin: PluginConfiguration, guild: Guild, user: User) => void;
  guildCreate?: (plugin: PluginConfiguration, guild: Guild) => void;
  guildDelete?: (plugin: PluginConfiguration, guild: Guild) => void;

  guildEmojiCreate?: (plugin: PluginConfiguration, emoji: Emoji) => void;
  guildEmojiDelete?: (plugin: PluginConfiguration, emoji: Emoji) => void;
  guildEmojiUpdate?: (plugin: PluginConfiguration, oldemoji: Emoji, newemoji: Emoji) => void;

  guildMemberAdd?: (plugin: PluginConfiguration, member: GuildMember) => void;
  guildMemberAvailable?: (plugin: PluginConfiguration, member: GuildMember) => void;
  guildMemberRemove?: (plugin: PluginConfiguration, member: GuildMember) => void;
  guildMembersChunk?: (plugin: PluginConfiguration, members: Array<GuildMember>) => void;
  guildMemberSpeaking?: (plugin: PluginConfiguration, member: GuildMember, speaking: boolean) => void;
  guildMemberUpdate?: (plugin: PluginConfiguration, oldMember: GuildMember, newMember: GuildMember) => void;
  guildUnavailable?: (plugin: PluginConfiguration, guild: Guild) => void;
  guildUpdate?: (plugin: PluginConfiguration, oldGuild: Guild, newGuild: Guild) => void;

  // Messages
  message?: (plugin: PluginConfiguration, message: Message) => void;
  messageDelete?: (plugin: PluginConfiguration, message: Message) => void;
  messageDeleteBulk?: (plugin: PluginConfiguration, messages: Collection<string, Message>) => void;
  messageUpdate?: (plugin: PluginConfiguration, oldMessage: Message, newMessage: Message) => void;

  // Presense
  presenceUpdate?: (plugin: PluginConfiguration, oldMember: GuildMember, newMember: GuildMember) => void;

  // Roles
  roleCreate?: (plugin: PluginConfiguration, role: Role) => void;
  roleDelete?: (plugin: PluginConfiguration, oldRole: Role, newRole: Role) => void;

  // Typings
  typingStart?: (plugin: PluginConfiguration, channel: Channel, user: User) => void;
  typingStop?: (plugin: PluginConfiguration, channel: Channel, user: User) => void;

  // Users
  userUpdate?: (plugin: PluginConfiguration, oldUser: User, newUser: User) => void;

  // Voice
  voiceStateUpdate?: (plugin: PluginConfiguration, oldMember: GuildMember, newMember: GuildMember) => void;
}

