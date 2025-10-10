// Zero-dep, conservative "good enough" stripper for chat UIs.
export function stripMarkdown(md: string): string {
  if (!md) return "";

  let s = md;

  // Code blocks & inline code → keep text, drop backticks
  s = s.replace(/```[\s\S]*?```/g, m => m.replace(/```/g, ""));
  s = s.replace(/`([^`]+)`/g, "$1");

  // Images ![alt](url) → alt (url)  OR just alt
  s = s.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, "$1 ($2)");

  // Links [text](url) → text (url)
  s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1 ($2)");

  // Bold/italic/strikethrough
  s = s.replace(/(\*\*|__)(.*?)\1/g, "$2");
  s = s.replace(/(\*|_)(.*?)\1/g, "$2");
  s = s.replace(/~~(.*?)~~/g, "$1");

  // Headings, blockquotes, list bullets → remove marker only
  s = s.replace(/^\s{0,3}(#{1,6})\s+/gm, "");
  s = s.replace(/^\s{0,3}>\s?/gm, "");
  s = s.replace(/^\s{0,3}([-*+])\s+/gm, "");
  s = s.replace(/^\s{0,3}\d+\.\s+/gm, "");

  // Horizontal rules
  s = s.replace(/^\s{0,3}([-*_]\s?){3,}$/gm, "");

  // Collapse excess whitespace but keep paragraphs
  s = s.replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();

  return s;
}
