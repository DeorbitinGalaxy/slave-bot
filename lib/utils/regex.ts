const specialCharacters: any = {
  '\\': '\\\\',
  '^': '\\^',
  '$': '\\$',
  '{': '\\{',
  '}': '\\}',
  '[': '\\[',
  ']': '\\]',
  '(': '\\(',
  ')': '\\)',
  '.': '\\.',
  '*': '\\*',
  '+': '\\+',
  '?': '\\?',
  '|': '\\|',
  '<': '\\<',
  '>': '\\>',
  '-': '\\-',
  '&': '\\&',
};

export function escape (text: string) {
  let value: string = '';
  for (let i = 0; i < text.length; ++i) {
    if (specialCharacters[text[i]]) {
      value += specialCharacters[text[i]];
    }
    else {
      value += text[i];
    }
  }

  return value;
}