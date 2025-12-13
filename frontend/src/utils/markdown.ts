import { marked } from 'marked'

// Configure marked for safe rendering
marked.setOptions({
  breaks: true, // Convert \n to <br>
  gfm: true     // GitHub Flavored Markdown
})

/**
 * Escape HTML-like patterns that aren't valid HTML tags
 * This prevents things like <reply:@user> or <end of turn> from being parsed as HTML
 */
function escapeNonHtmlTags(text: string): string {
  // Match < followed by anything that's NOT a valid HTML tag start
  // Valid HTML tags start with a letter or / (for closing tags)
  // We want to escape things like <reply:, <end of, etc.
  return text.replace(/<(?![a-zA-Z\/!])/g, '&lt;')
    // Also escape patterns like <word followed by : or space (not valid HTML)
    .replace(/<([a-zA-Z]+)(?=[:@\s][^>]*>)/g, '&lt;$1')
    // Escape any remaining unclosed angle brackets that look like chat artifacts
    .replace(/<(reply|end|start|user|assistant|system|thinking|context|message)[^>]*>/gi, (match) => {
      return match.replace(/</g, '&lt;').replace(/>/g, '&gt;')
    })
}

/**
 * Convert Discord-style mentions to styled badges
 * Handles: <@username>, <@user name>, @username
 * Note: reply:@username patterns are now handled in Message.vue header, not here
 */
function styleMentions(html: string): string {
  // Handle <@username> or <@user name> patterns (use a placeholder to avoid double-matching)
  html = html.replace(/&lt;@([^&]+)&gt;/g, '%%MENTION%%$1%%ENDMENTION%%')
  
  // Handle standalone @mentions (but not in code blocks, emails, or already-processed mentions)
  // Only match @word patterns not preceded by letters/numbers (to avoid emails)
  html = html.replace(/(?<![a-zA-Z0-9%])@([a-zA-Z][a-zA-Z0-9_]{1,30})(?![a-zA-Z0-9@%])/g, '%%MENTION%%$1%%ENDMENTION%%')
  
  // Now convert placeholders to actual spans
  html = html.replace(/%%MENTION%%([^%]+)%%ENDMENTION%%/g, '<span class="mention">@$1</span>')
  
  return html
}

/**
 * Render markdown to HTML
 */
export function renderMarkdown(text: string): string {
  if (!text) return ''
  // First escape non-HTML tags to prevent them from being parsed as HTML
  const escaped = escapeNonHtmlTags(text)
  const html = marked.parse(escaped) as string
  // Then style mentions
  return styleMentions(html)
}

/**
 * For plain text that should preserve newlines but isn't markdown
 */
export function preserveNewlines(text: string): string {
  if (!text) return ''
  return text.replace(/\n/g, '<br>')
}

