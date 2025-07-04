export function escapeMarkdownV2(text: string): string {
  if (!text) return '';
  return text
    .replace(/([_*\[\]()~`>#+\-=|{}.!\\])/g, '\\$1')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
