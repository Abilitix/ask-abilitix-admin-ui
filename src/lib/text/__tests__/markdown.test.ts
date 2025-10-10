import { stripMarkdown } from '../markdown';

describe('stripMarkdown', () => {
  it('should strip bold formatting', () => {
    expect(stripMarkdown('**bold text**')).toBe('bold text');
    expect(stripMarkdown('__bold text__')).toBe('bold text');
  });

  it('should strip italic formatting', () => {
    expect(stripMarkdown('*italic text*')).toBe('italic text');
    expect(stripMarkdown('_italic text_')).toBe('italic text');
  });

  it('should strip links but preserve text and URL', () => {
    expect(stripMarkdown('[Link text](https://example.com)')).toBe('Link text (https://example.com)');
  });

  it('should strip code blocks and inline code', () => {
    expect(stripMarkdown('`inline code`')).toBe('inline code');
    expect(stripMarkdown('```\ncode block\n```')).toBe('code block');
  });

  it('should strip list markers', () => {
    expect(stripMarkdown('- List item')).toBe('List item');
    expect(stripMarkdown('* List item')).toBe('List item');
    expect(stripMarkdown('1. Numbered item')).toBe('Numbered item');
  });

  it('should strip headings', () => {
    expect(stripMarkdown('# Heading 1')).toBe('Heading 1');
    expect(stripMarkdown('## Heading 2')).toBe('Heading 2');
  });

  it('should handle empty or null input', () => {
    expect(stripMarkdown('')).toBe('');
    expect(stripMarkdown(null as any)).toBe('');
    expect(stripMarkdown(undefined as any)).toBe('');
  });

  it('should preserve normal text', () => {
    expect(stripMarkdown('Normal text with no formatting')).toBe('Normal text with no formatting');
  });

  it('should handle mixed content', () => {
    const input = '**Bold** and *italic* text with [link](url) and `code`.';
    const expected = 'Bold and italic text with link (url) and code.';
    expect(stripMarkdown(input)).toBe(expected);
  });
});
