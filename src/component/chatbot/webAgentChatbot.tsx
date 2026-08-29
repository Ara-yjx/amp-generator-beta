import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AuthContext } from '../../context/AuthContext';
import { formatBytes, formatTime, isMobileViewport } from '../../data/chatbot/chatbotUtils';
import { DEFAULT_THREAD_TITLE } from '../../data/chatbot/constants';
import { useWebAgentChatbot } from '../../data/chatbot/useWebAgentChatbot';
import { registerChatbotOpen } from './chatbotControl';
import ChatMessageItem from './ChatMessageItem';
import './chatbot.css';

function autoResizeTextarea(textarea: HTMLTextAreaElement | null) {
  if (!textarea) {
    return;
  }
  textarea.style.height = 'auto';
  textarea.style.height = `${Math.min(textarea.scrollHeight, 190)}px`;
}

/**
 * Stimulize WebAgent Chatbot Drawer component.
 * Renders the floating launcher button and the sliding right-hand assistant drawer via React Portal.
 */
export default function WebAgentChatbot() {
  const { authState } = useContext(AuthContext);
  const currentUserId = authState?.username || (authState?.id ? `user-${authState.id}` : undefined);
  const bot = useWebAgentChatbot({ currentUserId });

  const imageInputRef = useRef<HTMLInputElement>(null);
  const drawerResizeRef = useRef<{ startX: number; startWidth: number } | null>(null);
  const conversationResizeRef = useRef<{ startX: number; startWidth: number } | null>(null);
  const [isResizingDrawer, setIsResizingDrawer] = useState(false);
  const [isResizingConversations, setIsResizingConversations] = useState(false);

  const rootClassName = [
    'web-agent-chatbot',
    bot.uiState.drawerOpen ? 'is-drawer-open' : '',
    isResizingDrawer ? 'is-resizing-drawer' : '',
    isResizingConversations ? 'is-resizing-conversations' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const shellClassName = [
    'shell',
    bot.uiState.drawerOpen ? 'open' : '',
    bot.uiState.conversationsCollapsed && !isMobileViewport() ? 'conversations-collapsed' : '',
    bot.mobileThreadsOpen ? 'mobile-threads-open' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const startDrawerResize = useCallback(
    (event: React.PointerEvent) => {
      if (isMobileViewport()) {
        return;
      }
      event.preventDefault();
      drawerResizeRef.current = {
        startX: event.clientX,
        startWidth: bot.uiState.panelWidth,
      };
      setIsResizingDrawer(true);

      const onMove = (moveEvent: PointerEvent) => {
        if (!drawerResizeRef.current) {
          return;
        }
        const delta = drawerResizeRef.current.startX - moveEvent.clientX;
        const nextWidth = Math.max(420, Math.min(920, drawerResizeRef.current.startWidth + delta));
        bot.setUiState((prev) => ({ ...prev, panelWidth: nextWidth }));
      };

      const onUp = () => {
        drawerResizeRef.current = null;
        setIsResizingDrawer(false);
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
      };

      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
    },
    [bot],
  );

  const startConversationResize = useCallback(
    (event: React.PointerEvent) => {
      if (isMobileViewport()) {
        return;
      }
      event.preventDefault();
      if (bot.uiState.conversationsCollapsed) {
        bot.setUiState((prev) => ({ ...prev, conversationsCollapsed: false }));
      }
      conversationResizeRef.current = {
        startX: event.clientX,
        startWidth: bot.uiState.conversationPaneWidth,
      };
      setIsResizingConversations(true);

      const onMove = (moveEvent: PointerEvent) => {
        if (!conversationResizeRef.current) {
          return;
        }
        const delta = moveEvent.clientX - conversationResizeRef.current.startX;
        bot.setUiState((prev) => ({
          ...prev,
          conversationPaneWidth: Math.max(180, conversationResizeRef.current!.startWidth + delta),
        }));
      };

      const onUp = () => {
        conversationResizeRef.current = null;
        setIsResizingConversations(false);
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
      };

      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
    },
    [bot],
  );

  const onQuickAction = (promptText: string) => {
    void bot.sendMessage(promptText);
  };

  useEffect(() => {
    registerChatbotOpen(bot.openDrawer);
    return () => registerChatbotOpen(null);
  }, [bot.openDrawer]);

  useEffect(() => {
    autoResizeTextarea(bot.promptRef.current);
  }, [bot.prompt]);

  const chatbotUi = (
    <div ref={bot.rootRef} className={rootClassName}>
      {!bot.uiState.drawerOpen && (
        <button className="agent-launcher" type="button" aria-label="Open assistant" onClick={bot.openDrawer}>
          <span className="launcher-ping" aria-hidden="true" />
          <span className="launcher-icon" aria-hidden="true">AI</span>
          <span className="launcher-text">Agent</span>
        </button>
      )}

      {bot.uiState.drawerOpen && (
        <div
          className="drawer-backdrop"
          aria-hidden="true"
          onClick={bot.closeDrawer}
        />
      )}

      <aside className={shellClassName} aria-label="Stimulize Agent Drawer">
        <div
          className="drawer-resizer"
          role="separator"
          aria-label="Resize drawer width"
          onPointerDown={startDrawerResize}
        />

        <header className="drawer-header">
          <div className="brand">
            <span className="brand-dot" aria-hidden="true" />
            <div>
              <h2 className="brand-title">Stimulize AI Agent</h2>
              <p className="brand-sub">Bedrock AgentCore Runtime</p>
            </div>
          </div>
          <div className="drawer-header-actions">
            <button
              className="ghost-btn"
              type="button"
              onClick={() => {
                if (isMobileViewport()) {
                  bot.setMobileThreadsOpen((prev) => !prev);
                  return;
                }
                bot.setUiState((prev) => ({
                  ...prev,
                  conversationsCollapsed: !prev.conversationsCollapsed,
                }));
              }}
            >
              {bot.uiState.conversationsCollapsed ? 'Show History' : 'Hide History'}
            </button>
            <button
              className="icon-btn"
              type="button"
              aria-label="Close assistant"
              onClick={bot.closeDrawer}
            >
              ✕
            </button>
          </div>
        </header>

        <div className="drawer-content">
          <nav className="sidebar" aria-label="Conversations sidebar">
            <div className="sidebar-head">
              <button
                className="primary-btn site-ghost"
                type="button"
                onClick={() => bot.createThread()}
              >
                + New Chat
              </button>
            </div>
            <div className="sidebar-group">
              <p className="group-label">Conversations</p>
              <div className="thread-list">
                {bot.chatState.threads.map((thread) => {
                  const isActive = thread.id === bot.chatState.activeThreadId;
                  return (
                    <div
                      key={thread.id}
                      className={`thread-item ${isActive ? 'active' : ''}`}
                    >
                      <button
                        className="thread-open"
                        type="button"
                        onClick={() => bot.selectThread(thread.id)}
                      >
                        <div className="thread-title">{thread.title || DEFAULT_THREAD_TITLE}</div>
                        <div className="thread-time">{formatTime(thread.updatedAt || thread.createdAt)}</div>
                      </button>
                      <button
                        className="thread-rename"
                        type="button"
                        title="Rename conversation"
                        aria-label="Rename conversation"
                        onClick={(event) => {
                          event.stopPropagation();
                          bot.renameThread(thread.id);
                        }}
                      >
                        ✎
                      </button>
                      <button
                        className="thread-delete"
                        type="button"
                        title="Delete conversation"
                        aria-label="Delete conversation"
                        onClick={(event) => {
                          event.stopPropagation();
                          bot.deleteThread(thread.id);
                        }}
                      >
                        ×
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </nav>

          <div
            className="conversation-resizer"
            role="separator"
            aria-label="Resize conversation history sidebar width"
            onPointerDown={startConversationResize}
          />

          <main className="chat-main">
            <header className="chat-topbar">
              <div>
                <h3 className="top-title">
                  {bot.activeThread?.title || DEFAULT_THREAD_TITLE}
                </h3>
                <p className="top-sub">
                  Session: {bot.activeThread?.id.slice(0, 18) || 'none'}...
                </p>
              </div>
              <div className="status-wrap" aria-live="polite">
                <span className={`status-dot ${bot.status.mode}`} aria-hidden="true" />
                <span className="status-text">{bot.status.text}</span>
              </div>
            </header>

            <section className="quick-actions" aria-label="Suggested questions">
              <button
                className="quick-chip"
                type="button"
                onClick={() => onQuickAction('How do I create a new experiment stimulus in Stimulize?')}
              >
                Create experiment
              </button>
              <button
                className="quick-chip"
                type="button"
                onClick={() => onQuickAction('What parameter types are supported in the experiment builder?')}
              >
                Supported parameters
              </button>
              <button
                className="quick-chip"
                type="button"
                onClick={() => onQuickAction('How do I export and sync experiment data with cloud?')}
              >
                Export data
              </button>
            </section>

            <div
              ref={bot.messageScrollRef}
              className="message-scroll"
              aria-label="Conversation messages"
            >
              <div className="message-list">
                {bot.displayMessages.map((msg) => {
                  const variantInfo = bot.activeThread
                    ? bot.getAssistantVariantInfo(bot.activeThread, msg)
                    : null;
                  return (
                    <ChatMessageItem
                      key={msg.id}
                      thread={bot.activeThread!}
                      message={msg}
                      getPreviewUrl={bot.getPreviewUrl}
                      onSwitchVariant={bot.switchAssistantVariant}
                      variantInfo={variantInfo}
                    />
                  );
                })}
              </div>
            </div>

            <footer className="composer-wrap">
              <div className="composer-tools">
                <button
                  className="ghost-btn"
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  disabled={bot.isBusy}
                >
                  Attach Images
                </button>
                <button
                  className="ghost-btn"
                  type="button"
                  onClick={() => void bot.regenerateLastAnswer()}
                  disabled={bot.isBusy || !bot.activeThread?.messages.some((m) => m.role === 'user')}
                >
                  Regenerate
                </button>
                {bot.isBusy && (
                  <button
                    className="ghost-btn"
                    type="button"
                    onClick={bot.stopGeneration}
                  >
                    Stop
                  </button>
                )}
                <input
                  ref={imageInputRef}
                  className="hidden"
                  type="file"
                  accept="image/png,image/jpeg,image/gif,image/webp"
                  multiple
                  onChange={(event) => {
                    const files = Array.from(event.target.files || []);
                    void bot.handleAddFiles(files);
                    event.target.value = '';
                  }}
                />
              </div>

              {bot.pendingImages.length > 0 && (
                <div className="composer-uploads" aria-label="Attached images pending upload">
                  {bot.pendingImages.map((upload) => (
                    <div key={upload.id} className="composer-upload">
                      <div className="composer-upload-thumb">
                        <img src={upload.previewUrl} alt={upload.name || 'Preview upload'} />
                      </div>
                      <div className="composer-upload-meta">
                        <div className="composer-upload-name">{upload.name || 'image'}</div>
                        <div className="composer-upload-detail">
                          {String(upload.format || 'image').toUpperCase()} · {formatBytes(upload.size)}
                        </div>
                      </div>
                      <button
                        className="composer-upload-remove"
                        type="button"
                        title="Remove image"
                        aria-label="Remove image"
                        onClick={() => bot.removePendingImage(upload.id)}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="composer-box">
                <textarea
                  ref={bot.promptRef}
                  rows={1}
                  placeholder="Ask Stimulize Agent a question..."
                  value={bot.prompt}
                  onChange={(event) => bot.setPrompt(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && !event.shiftKey) {
                      event.preventDefault();
                      void bot.sendMessage();
                    }
                  }}
                />
                <button
                  className="send-btn"
                  type="button"
                  disabled={bot.isBusy || (!bot.prompt.trim() && bot.pendingImages.length === 0)}
                  onClick={() => void bot.sendMessage()}
                >
                  {bot.isBusy ? '...' : 'Send'}
                </button>
              </div>
            </footer>
          </main>
        </div>
      </aside>
    </div>
  );

  return createPortal(chatbotUi, document.body);
}
