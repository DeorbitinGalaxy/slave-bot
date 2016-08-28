import { Message } from 'discord.js';

export function split (message: Message, separator: string = ' '): string[] {
  return message.content.trim().split(separator);
}

export function getDoubleQuotedText (parts: string[], startIndex: number): any {

  let content = parts[startIndex];

  if (!content) {
    return { error: 404 };
  }

  // extract the double quoted string
  if (content.startsWith('"')) {
    let index = startIndex;
    while (!content.endsWith('"') && ++index < parts.length) {
      content = `${content} ${parts[index]}`;
    }

    if (!content.endsWith('"')) {
      return { error: 400 };
    }

    // Remove the double quotes
    content = content.slice(1, content.length - 1);
  }

  return { text: content };
}