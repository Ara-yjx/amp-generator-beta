import { useCallback } from 'react';
import { formatBytes, formatTime, renderMarkdown } from '../../data/chatbot/chatbotUtils';
import type { ChatMessage, ChatThread, StoredAttachment } from '../../data/chatbot/types';

type ChatMessageItemProps = {
  thread: ChatThread;
  message: ChatMessage;
  getPreviewUrl: (messageId: string, attachmentId: string) => string | undefined;
  onSwitchVariant: (userId: string, delta: number) => void;
  variantInfo: { userId: string; index: number; total: number } | null;
};

/**
 * Individual chat message renderer supporting markdown formatting,
 * image thumbnails, code copying, and variant toggling.
 */
export default function ChatMessageItem({
  message,
  getPreviewUrl,
  onSwitchVariant,
  variantInfo,
}: ChatMessageItemProps) {
  const handleCopyCode = useCallback(async (encoded: string, button: HTMLButtonElement) => {
    let text = '';
    try {
      text = decodeURIComponent(encoded);
    } catch {
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      button.textContent = 'Copied';
      window.setTimeout(() => {
        button.textContent = 'Copy';
      }, 800);
    } catch {
      button.textContent = 'Copy failed';
      window.setTimeout(() => {
        button.textContent = 'Copy';
      }, 900);
    }
  }, []);

  const tags = [formatTime(message.createdAt)];
  if (message.state === 'thinking') tags.push('thinking');
  if (message.state === 'streaming') tags.push('streaming');
  if (message.state === 'stopped') tags.push('stopped');
  if (message.usedMock) tags.push('mock');

  return (
    <article className={`msg-item ${message.role}`} data-msg-id={message.id}>
      <div className="msg-role">{message.role === 'user' ? 'You' : 'Agent'}</div>
      <div className="msg-bubble">
        <div
          className="msg-content"
          onClick={(event) => {
            const copyBtn = (event.target as HTMLElement).closest('button.copy-code-btn');
            if (copyBtn instanceof HTMLButtonElement && copyBtn.dataset.copyEnc) {
              handleCopyCode(copyBtn.dataset.copyEnc, copyBtn);
            }
          }}
        >
          {message.attachments && message.attachments.length > 0 && (
            <div className="msg-attachments msg-content-block">
              {message.attachments.map((attachment: StoredAttachment) => {
                const previewUrl = getPreviewUrl(message.id, attachment.id);
                return (
                  <div key={attachment.id} className="msg-attachment">
                    <div className="msg-attachment-thumb">
                      {previewUrl && (
                        <img src={previewUrl} alt={attachment.name || 'Uploaded image'} />
                      )}
                    </div>
                    <div className="msg-attachment-meta">
                      <div className="msg-attachment-name">{attachment.name || 'image'}</div>
                      <div className="msg-attachment-detail">
                        {String(attachment.format || 'image').toUpperCase()} ·{' '}
                        {attachment.size ? formatBytes(attachment.size) : 'Stored metadata only'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {message.content && (
            <div
              className="msg-content-block"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(message.content) }}
            />
          )}
        </div>
        <div className="msg-meta">
          <span className="msg-meta-text">{tags.join(' · ')}</span>
          {variantInfo && variantInfo.total > 1 && (
            <span className="variant-switch">
              <button
                type="button"
                className="variant-btn"
                aria-label="Previous answer variant"
                onClick={() => onSwitchVariant(variantInfo.userId, -1)}
              >
                ←
              </button>
              <span className="variant-label">
                {variantInfo.index + 1}/{variantInfo.total}
              </span>
              <button
                type="button"
                className="variant-btn"
                aria-label="Next answer variant"
                onClick={() => onSwitchVariant(variantInfo.userId, 1)}
              >
                →
              </button>
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
