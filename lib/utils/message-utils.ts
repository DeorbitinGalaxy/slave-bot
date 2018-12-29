import { Message } from 'discord.js';

export function split (message: Message, separator: string = ' '): string[] {
  return message.content.trim().split(separator);
}

export function parseIntArg(parts: string[], index: number, defaultValue: number) {
  if (index >= parts.length) {
    return defaultValue;
  }

  const parsed = parseInt(parts[index]);
  if (isNaN(parsed)) {
    return defaultValue;
  }

  return parsed;
}


export interface DoubleQuotedText {
  text?: string;
  index?: number;
  error?: number;
}

export function getDoubleQuotedText (parts: string[], startIndex: number): DoubleQuotedText {

  let content = parts[startIndex];

  if (!content) {
    return { error: 404 };
  }

  let index = startIndex;
  // extract the double quoted string
  if (content.startsWith('"')) {
    while (!content.endsWith('"') && ++index < parts.length) {
      content = `${content} ${parts[index]}`;
    }

    if (!content.endsWith('"')) {
      return { error: 400 };
    }

    // Remove the double quotes
    content = content.slice(1, content.length - 1);
  }

  return { text: content, index: index + 1 };
}