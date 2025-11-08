import { marked } from 'marked'

// Configure marked for safe rendering
marked.setOptions({
  breaks: true, // Convert \n to <br>
  gfm: true     // GitHub Flavored Markdown
})

/**
 * Render markdown to HTML
 */
export function renderMarkdown(text: string): string {
  if (!text) return ''
  return marked.parse(text) as string
}

/**
 * For plain text that should preserve newlines but isn't markdown
 */
export function preserveNewlines(text: string): string {
  if (!text) return ''
  return text.replace(/\n/g, '<br>')
}

