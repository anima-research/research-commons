import { Router, Request, Response } from 'express';
import { AppContext } from '../index.js';
import type { Message } from '../types/submission.js';

// User agents for social media crawlers
const CRAWLER_USER_AGENTS = [
  'facebookexternalhit',
  'Facebot',
  'Twitterbot',
  'LinkedInBot',
  'Slackbot',
  'TelegramBot',
  'WhatsApp',
  'Discordbot',
  'Googlebot',
  'bingbot',
  'Applebot',
  'ia_archiver'
];

function isCrawler(userAgent: string | undefined): boolean {
  if (!userAgent) return false;
  return CRAWLER_USER_AGENTS.some(crawler => 
    userAgent.toLowerCase().includes(crawler.toLowerCase())
  );
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

function extractTextFromBlocks(contentBlocks: any[]): string {
  return contentBlocks
    .filter(block => block.type === 'text')
    .map(block => block.text || '')
    .join('\n');
}

export function createOgMetaRoutes(context: AppContext): Router {
  const router = Router();

  // Generate OG preview image for a submission
  router.get('/og-image/:submissionId', async (req: Request, res: Response) => {
    try {
      const { submissionId } = req.params;
      const submission = await context.submissionStore.getSubmission(submissionId);
      
      if (!submission) {
        res.status(404).send('Not found');
        return;
      }

      // Check visibility - only public/unlisted get previews
      if (submission.visibility === 'private') {
        res.status(403).send('Private');
        return;
      }

      const messages = await context.submissionStore.getMessages(submissionId);
      
      // Find pinned message or use first message
      const pinnedMessageId = submission.metadata?.pinned_message_id;
      let previewMessage = pinnedMessageId 
        ? messages.find((m: Message) => m.id === pinnedMessageId)
        : messages[0];
      
      if (!previewMessage) {
        previewMessage = messages[0];
      }

      const previewText = previewMessage 
        ? extractTextFromBlocks(previewMessage.content_blocks)
        : 'No content';

      const title = submission.title || 'Untitled Conversation';
      const participant = previewMessage?.participant_name || 'Unknown';
      const submissionType = submission.submission_type || 'conversation';
      const typeLabel = submissionType === 'document' ? 'Document' : 'Conversation';

      // Split on actual line breaks, skip leading empty lines, preserve internal empty lines
      const allLines = previewText.split(/\r?\n/);
      // Find first non-empty line
      const firstContentIdx = allLines.findIndex(line => line.trim().length > 0);
      const lines = allLines
        .slice(firstContentIdx >= 0 ? firstContentIdx : 0)
        .slice(0, 22) // More lines with tighter spacing
        .map(line => truncate(line, 110)); // Wider truncation for smaller font

      // Generate SVG with tighter layout
      const svg = `
        <svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:#0f172a;stop-opacity:1" />
              <stop offset="100%" style="stop-color:#1e1b4b;stop-opacity:1" />
            </linearGradient>
          </defs>
          <rect width="1200" height="630" fill="url(#bg)"/>
          
          <!-- Left accent -->
          <rect x="0" y="0" width="6" height="630" fill="#6366f1"/>
          
          <!-- Header row -->
          <text x="40" y="45" font-family="Arial, Helvetica, sans-serif" font-size="18" fill="#6366f1" font-weight="bold">Research Commons</text>
          <text x="230" y="45" font-family="Arial, Helvetica, sans-serif" font-size="16" fill="#64748b">· ${escapeHtml(typeLabel)}</text>
          
          <!-- Title -->
          <text x="40" y="100" font-family="Arial, Helvetica, sans-serif" font-size="42" fill="#ffffff" font-weight="bold">${escapeHtml(truncate(title, 45))}</text>
          
          <!-- Author -->
          <text x="40" y="140" font-family="Arial, Helvetica, sans-serif" font-size="20" fill="#a5b4fc">${escapeHtml(participant)}</text>
          
          <!-- Content box -->
          <rect x="40" y="160" width="1120" height="420" rx="8" fill="#1e293b"/>
          
          <!-- Content text (monospace, no wrap, tight line spacing for ASCII art) -->
          <text font-family="'Courier New', Courier, monospace" font-size="16" fill="#94a3b8" xml:space="preserve">
            ${lines.map((line, i) => `<tspan x="60" y="${195 + i * 18}">${escapeHtml(line || ' ')}</tspan>`).join('\n            ')}
          </text>
          
          <!-- Footer -->
          <rect x="1020" y="590" width="140" height="30" rx="15" fill="#6366f1"/>
          <text x="1090" y="611" font-family="Arial, Helvetica, sans-serif" font-size="14" fill="#ffffff" text-anchor="middle">${messages.length} message${messages.length !== 1 ? 's' : ''}</text>
        </svg>
      `;

      res.setHeader('Content-Type', 'image/svg+xml');
      res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
      res.send(svg);
    } catch (error) {
      console.error('OG image generation error:', error);
      res.status(500).send('Error');
    }
  });

  return router;
}

// Middleware to intercept crawler requests and serve OG meta tags
export function createOgMiddleware(context: AppContext) {
  return async (req: Request, res: Response, next: () => void) => {
    // Only intercept conversation pages for crawlers
    const match = req.path.match(/^\/c\/([a-f0-9-]{36})$/i);
    if (!match || !isCrawler(req.headers['user-agent'])) {
      return next();
    }

    const submissionId = match[1];
    
    try {
      const submission = await context.submissionStore.getSubmission(submissionId);
      
      if (!submission) {
        return next(); // Let normal 404 handling take over
      }

      // Check visibility
      if (submission.visibility === 'private') {
        return next();
      }

      const messages = await context.submissionStore.getMessages(submissionId);
      
      // Find pinned message or use first message
      const pinnedMessageId = submission.metadata?.pinned_message_id;
      let previewMessage = pinnedMessageId 
        ? messages.find((m: Message) => m.id === pinnedMessageId)
        : messages[0];
      
      if (!previewMessage) {
        previewMessage = messages[0];
      }

      const title = escapeHtml(submission.title || 'Untitled Conversation');
      const description = previewMessage 
        ? escapeHtml(truncate(extractTextFromBlocks(previewMessage.content_blocks), 200))
        : 'A conversation on Research Commons';
      
      const baseUrl = process.env.BASE_URL || `https://${req.headers.host}`;
      const url = `${baseUrl}/c/${submissionId}`;
      const imageUrl = `${baseUrl}/api/og-image/${submissionId}`;

      const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${title} - Research Commons</title>
  
  <!-- Open Graph -->
  <meta property="og:type" content="article">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:url" content="${url}">
  <meta property="og:image" content="${imageUrl}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:site_name" content="Research Commons">
  
  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${description}">
  <meta name="twitter:image" content="${imageUrl}">
  
  <!-- Canonical -->
  <link rel="canonical" href="${url}">
</head>
<body>
  <h1>${title}</h1>
  <p>${description}</p>
  <p><a href="${url}">View on Research Commons</a></p>
</body>
</html>`;

      res.setHeader('Content-Type', 'text/html');
      res.send(html);
    } catch (error) {
      console.error('OG middleware error:', error);
      next();
    }
  };
}

