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

export function multilineCode (text: string, language: string = '') {

  return build(
    line('```' + language),
    text,
    line('```')
  );
}

export function strike (text: string) {

  return '<s>' + text + '</s>';
}

export function quote (text: string) {

  return '> ' + text;
}

export function video (url: string) {

  return '[[embed url=' + url + ']]';
}