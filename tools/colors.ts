const ANSI_RESET = '\x1b[0m';
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const BLUE = '\x1b[34m';

const BOLD = '\x1b[1m';
const BRIGHT_CYAN = '\x1b[96m';
const BG_GRAY = '\x1b[100m';

function ansiTag(...codes: string[]) {
  return (strings: TemplateStringsArray, ...values: unknown[]): string => {
    const text = strings.reduce((result, part, index) => {
      const value = index < values.length ? String(values[index]) : '';
      return `${result}${part}${value}`;
    }, '');

    return `${codes.join('')}${text}${ANSI_RESET}`;
  };
}

export const ansi = {
  error: ansiTag(RED),
  success: ansiTag(GREEN),
  path: ansiTag(BLUE),
  reminder: ansiTag(BG_GRAY, BRIGHT_CYAN, BOLD),
};
