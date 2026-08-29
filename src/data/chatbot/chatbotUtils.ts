import {
  DEFAULT_THREAD_TITLE,
  WELCOME_MESSAGE,
} from './constants';
import type { ChatMessage, ChatThread } from './types';

/**
 * Builds a unique identifier with a given prefix.
 * @param prefix - Prefix string (e.g., 'user', 'session', 'msg')
 */
export function buildGeneratedId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Normalizes a user identifier, falling back to a default value if empty.
 * @param rawValue - Candidate user ID value
 * @param fallback - Fallback string if rawValue is invalid
 */
export function normalizeUserId(rawValue: unknown, fallback = ''): string {
  if (typeof rawValue === 'string') {
    const normalized = rawValue.trim();
    if (normalized) {
      return normalized;
    }
  }
  return fallback;
}

/**
 * Checks whether a thread title is a default title.
 * @param title - Candidate thread title
 */
export function isDefaultThreadTitle(title: string): boolean {
  return title === DEFAULT_THREAD_TITLE || title === 'New chat' || title === 'Welcome';
}

/**
 * Normalizes legacy message contents to ensure consistent greeting presentation.
 * @param id - Message ID
 * @param role - Message role
 * @param content - Message content
 */
export function normalizeLegacyMessageContent(id: string, role: string, content: unknown): string {
  if (typeof content !== 'string') {
    return '';
  }

  const trimmed = content.trim();
  if (role === 'assistant' && /-welcome$/.test(id) && (!trimmed || trimmed === 'Hello!')) {
    return WELCOME_MESSAGE;
  }

  return content;
}

/**
 * Sanitizes variant selections map to ensure only valid string mappings are stored.
 * @param input - Raw variant selection object
 */
export function sanitizeVariantSelections(input: unknown): Record<string, string> {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return {};
  }

  const out: Record<string, string> = {};
  for (const [userId, messageId] of Object.entries(input)) {
    if (typeof userId === 'string' && typeof messageId === 'string') {
      out[userId] = messageId;
    }
  }
  return out;
}

/**
 * Formats byte counts into human-readable strings (B, KB, MB).
 * @param bytes - Size in bytes
 */
export function formatBytes(bytes: number): string {
  const value = Number(bytes) || 0;
  if (value < 1024) {
    return `${value} B`;
  }
  if (value < 1024 * 1024) {
    return `${(value / 1024).toFixed(1)} KB`;
  }
  return `${(value / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Formats a timestamp into a localized short time string.
 * @param timestamp - Milliseconds since epoch
 */
export function formatTime(timestamp: number): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(timestamp));
}

/**
 * Builds a brief summary string describing uploaded image count.
 * @param attachments - Array of attachments
 */
export function buildAttachmentSummary(attachments: { length: number }): string {
  if (!attachments || attachments.length === 0) {
    return '';
  }
  const label = attachments.length === 1 ? 'image' : 'images';
  return `[Uploaded ${attachments.length} ${label}]`;
}

/**
 * Retrieves the effective user ID for a thread.
 * @param thread - ChatThread object or null
 * @param defaultUserId - Fallback user ID
 */
export function getThreadUserId(thread: ChatThread | null, defaultUserId: string): string {
  if (!thread) {
    return defaultUserId;
  }
  return normalizeUserId(thread.userId, defaultUserId);
}

/**
 * Returns all assistant responses answering a specific user prompt.
 * @param thread - Conversation thread
 * @param replyToUserId - Target user message ID
 */
export function getAssistantVariants(thread: ChatThread, replyToUserId: string): ChatMessage[] {
  return thread.messages.filter(
    (item) => item.role === 'assistant' && item.replyToUserId === replyToUserId,
  );
}

/**
 * Filters thread messages for active display based on variant selections.
 * @param thread - Active conversation thread
 */
export function getDisplayMessages(thread: ChatThread | null): ChatMessage[] {
  if (!thread) {
    return [];
  }

  const selectionMap = thread.variantSelections || {};
  const displayed: ChatMessage[] = [];

  for (const message of thread.messages) {
    if (message.role !== 'assistant' || !message.replyToUserId) {
      displayed.push(message);
      continue;
    }

    const userId = message.replyToUserId;
    const chosenId = selectionMap[userId];
    const variants = getAssistantVariants(thread, userId);

    if (chosenId) {
      if (message.id === chosenId) {
        displayed.push(message);
      }
      continue;
    }

    if (variants.length > 0 && variants[variants.length - 1].id === message.id) {
      displayed.push(message);
    }
  }

  return displayed;
}

/**
 * Returns variant navigation metadata for an assistant message.
 * @param thread - Active conversation thread
 * @param message - Target assistant message
 */
export function getAssistantVariantInfo(
  thread: ChatThread,
  message: ChatMessage,
): { userId: string; index: number; total: number } | null {
  if (message.role !== 'assistant' || !message.replyToUserId) {
    return null;
  }

  const variants = getAssistantVariants(thread, message.replyToUserId);
  if (variants.length <= 1) {
    return null;
  }

  const index = variants.findIndex((item) => item.id === message.id);
  if (index < 0) {
    return null;
  }

  return {
    userId: message.replyToUserId,
    index,
    total: variants.length,
  };
}

/**
 * Generates an offline fallback response when backend services are unavailable.
 * @param prompt - The user prompt
 * @param thread - The current chat thread
 * @param attachments - Image attachments list
 * @param threadUserId - User ID
 */
export function buildMockReply(
  prompt: string,
  thread: ChatThread,
  attachments: unknown[],
  threadUserId: string,
): string {
  const lastUserCount = thread.messages.filter((msg) => msg.role === 'user').length;
  const imageCount = Array.isArray(attachments) ? attachments.length : 0;

  return [
    '[Offline reply] Backend AgentCore service is currently unreachable.',
    '',
    `Your prompt: **${prompt || '(image-only request)'}**`,
    `Attached images: ${imageCount}`,
    '',
    'Please check your AWS credentials or network connection, then try again.',
    `- User ID: ${threadUserId}`,
    `- Message count in session: ${lastUserCount}`,
  ].join('\n');
}

/**
 * Extracts raw assistant text from various AgentCore response payload structures.
 * @param payload - Response payload object or string
 */
export function extractAssistantText(payload: unknown): string {
  if (payload == null) {
    return '';
  }

  if (typeof payload === 'string') {
    return payload.trim();
  }

  if (typeof payload === 'object') {
    const record = payload as Record<string, unknown>;

    if (typeof record.result === 'string') {
      return record.result;
    }

    if (record.result && typeof record.result === 'object') {
      const nestedResult = extractAssistantText(record.result);
      if (nestedResult) {
        return nestedResult;
      }
    }

    if (typeof record.text === 'string') {
      return record.text;
    }

    if (typeof record.content === 'string') {
      return record.content;
    }

    if (typeof record.message === 'string') {
      return record.message;
    }

    if (record.message) {
      const messageText = extractTextNode(record.message);
      if (messageText) {
        return messageText;
      }
    }

    if (Array.isArray(record.messages)) {
      const parts = record.messages.map((item) => extractAssistantText(item)).filter(Boolean);
      if (parts.length > 0) {
        return parts.join('\n\n');
      }
    }

    if (Array.isArray(record.content)) {
      const parts = record.content.map((item) => extractAssistantText(item)).filter(Boolean);
      if (parts.length > 0) {
        return parts.join('\n\n');
      }
    }

    if (typeof record.output === 'string') {
      return record.output;
    }

    if (record.output && typeof record.output === 'object') {
      const outputText = extractAssistantText(record.output);
      if (outputText) {
        return outputText;
      }
    }

    if (typeof record.response === 'string') {
      return record.response;
    }

    if (record.response && typeof record.response === 'object') {
      const responseText = extractAssistantText(record.response);
      if (responseText) {
        return responseText;
      }
    }

    try {
      return JSON.stringify(record, null, 2);
    } catch {
      return String(payload);
    }
  }

  return String(payload);
}

function extractTextNode(input: unknown): string {
  if (!input) {
    return '';
  }
  if (typeof input === 'string') {
    return input;
  }
  if (typeof input === 'object') {
    const record = input as Record<string, unknown>;
    if (typeof record.text === 'string') {
      return record.text;
    }
    if (typeof record.content === 'string') {
      return record.content;
    }
    if (Array.isArray(record.content)) {
      return record.content.map((item) => extractTextNode(item)).filter(Boolean).join('\n');
    }
  }
  return '';
}

/**
 * Escapes HTML characters for safe rendering.
 * @param text - Raw input string
 */
export function escapeHtml(text: string): string {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Renders simple markdown into sanitised HTML.
 * @param markdown - Markdown formatted string
 */
export function renderMarkdown(markdown: string): string {
  const codeBlocks: string[] = [];
  let text = String(markdown || '').replace(/\r\n/g, '\n');

  // Extract triple-backtick code blocks
  text = text.replace(/```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g, (_, lang, code) => {
    const safeLang = escapeHtml(lang || 'text');
    const safeCode = escapeHtml(code);
    const encoded = encodeURIComponent(code);
    const index = codeBlocks.length;
    codeBlocks.push(
      `<div class="code-block"><div class="code-header"><span class="code-lang">${safeLang}</span><button class="copy-code-btn" type="button" data-copy-enc="${encoded}">Copy</button></div><pre><code class="language-${safeLang}">${safeCode}</code></pre></div>`,
    );
    return `@@CODE_BLOCK_${index}@@`;
  });

  // Extract inline code
  text = text.replace(/`([^`\n]+)`/g, (_, inline) => `<code>${escapeHtml(inline)}</code>`);

  // Basic markdown formatting
  text = escapeHtml(text);
  text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  text = text.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  text = text.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

  // Paragraphs & lines
  const paragraphs = text
    .split(/\n{2,}/)
    .map((block) => `<p>${block.replace(/\n/g, '<br />')}</p>`);

  let html = paragraphs.join('');

  // Re-insert code blocks
  html = html.replace(/@@CODE_BLOCK_(\d+)@@/g, (_, idx) => codeBlocks[Number(idx)] || '');

  return html;
}

/**
 * Delays execution by specified milliseconds.
 * @param ms - Milliseconds to sleep
 */
export async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Computes simulated typing delay based on chunk length.
 * @param text - Text chunk length
 */
export function getTypingDelay(text: string): number {
  const len = text.length;
  if (len < 5) return 20;
  if (len < 20) return 40;
  return 60;
}

/**
 * Clamps drawer width between min and max constraints.
 * @param width - Raw width
 */
export function clampDrawerWidth(width: number): number {
  return Math.max(420, Math.min(920, width));
}

/**
 * Clamps conversation sidebar width between min and max constraints.
 * @param width - Raw width
 */
export function clampConversationPaneWidth(width: number): number {
  return Math.max(220, Math.min(460, width));
}

/**
 * Detects whether current viewport is a mobile screen width.
 */
export function isMobileViewport(): boolean {
  return typeof window !== 'undefined' && window.innerWidth <= 880;
}
