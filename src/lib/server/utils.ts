/**
 * Escapes a string to be used as a shell argument.
 * This is a simple implementation that wraps the string in single quotes
 * and escapes any existing single quotes.
 * @param {string} arg The string to escape.
 * @returns {string} The escaped string.
 */
export function shellescape(arg: string): string {
  if (/[^A-Za-z0-9_\/:=-]/.test(arg)) {
    return `'${arg.replace(/'/g, "'\\''")}'`;
  }
  return arg;
}
