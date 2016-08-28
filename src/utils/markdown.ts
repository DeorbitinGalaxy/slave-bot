export function line (text: string = '') {

  return `${text}\n`;
}

export function bold (text: string) {

  return `**${text}**`;
}

export function italic (text: string) {

  return `*${text}*`;
}

export function code (text: string) {

  return '`' + text + '`';
}

export function build (...args: string[]) {

  return args.join('');
}

export function multilineCode (text: string) {

  return build(
    line('```'),
    text,
    line('```')
  );
}

