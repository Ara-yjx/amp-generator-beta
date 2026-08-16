import {
  CHATBOT_STORAGE_KEY_PREFIX,
  DEFAULT_THREAD_TITLE,
  DEFAULT_USER_ID_PREFIX,
  UI_STORAGE_KEY,
  WELCOME_MESSAGE,
} from './constants';
import {
  buildGeneratedId,
  isDefaultThreadTitle,
  normalizeLegacyMessageContent,
  normalizeUserId,
  sanitizeVariantSelections,
} from './chatbotUtils';
import type { ChatState, ChatThread, MessageState, UiState } from './types';

/**
 * Returns the session storage key scoped to a specific user.
 * @param userId - User ID or username
 */
export function getChatStorageKey(userId?: string): string {
  const normalized = normalizeUserId(userId, 'guest');
  return `${CHATBOT_STORAGE_KEY_PREFIX}${normalized}`;
}

/**
 * Clears stored chatbot conversation data from sessionStorage.
 * If userId is provided, clears that user's chat data; otherwise clears all chatbot keys.
 * @param userId - Optional specific user ID to clear
 */
export function clearChatbotStorage(userId?: string): void {
  try {
    if (userId) {
      sessionStorage.removeItem(getChatStorageKey(userId));
    } else {
      const keysToRemove: string[] = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && key.startsWith(CHATBOT_STORAGE_KEY_PREFIX)) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((key) => sessionStorage.removeItem(key));
    }
  } catch {
    /* ignore sessionStorage access errors */
  }
}

/**
 * Creates an initial conversation thread containing a welcome greeting.
 * @param userId - ID of the user creating the thread
 * @param title - Display title for the thread
 */
export function createWelcomeThread(userId: string, title = DEFAULT_THREAD_TITLE): ChatThread {
  const now = Date.now();
  return {
    id: `session-${now}-${Math.random().toString(36).slice(2, 8)}`,
    userId,
    title,
    createdAt: now,
    updatedAt: now,
    variantSelections: {},
    messages: [
      {
        id: `msg-${now}-welcome`,
        role: 'assistant',
        content: WELCOME_MESSAGE,
        createdAt: now,
        state: 'done',
      },
    ],
  };
}

/**
 * Loads conversation state from sessionStorage scoped to the current user.
 * @param currentUserId - Optional user ID of the logged-in user
 */
export function loadChatState(currentUserId?: string): ChatState {
  const defaultUserId = normalizeUserId(currentUserId, buildGeneratedId(DEFAULT_USER_ID_PREFIX));
  const empty: ChatState = {
    endpoint: '',
    userId: defaultUserId,
    threads: [],
    activeThreadId: '',
  };

  try {
    const storageKey = getChatStorageKey(defaultUserId);
    const raw = sessionStorage.getItem(storageKey);
    if (!raw) {
      return empty;
    }

    const parsed = JSON.parse(raw) as Partial<ChatState>;
    if (!parsed || typeof parsed !== 'object') {
      return empty;
    }

    const userId = normalizeUserId(parsed.userId, defaultUserId);
    const threads = Array.isArray(parsed.threads)
      ? parsed.threads
          .filter((item): item is ChatThread => Boolean(item && typeof item.id === 'string'))
          .map((item) => ({
            id: item.id,
            userId: normalizeUserId(item.userId, userId),
            title:
              typeof item.title === 'string'
                ? isDefaultThreadTitle(item.title)
                  ? DEFAULT_THREAD_TITLE
                  : item.title
                : DEFAULT_THREAD_TITLE,
            createdAt: Number(item.createdAt) || Date.now(),
            updatedAt: Number(item.updatedAt) || Date.now(),
            variantSelections: sanitizeVariantSelections(item.variantSelections),
            messages: Array.isArray(item.messages)
              ? item.messages
                  .filter((msg) => msg && typeof msg.role === 'string')
                  .map((msg) => ({
                    id: typeof msg.id === 'string' ? msg.id : `msg-${Date.now()}`,
                    role: msg.role as 'user' | 'assistant',
                    content: normalizeLegacyMessageContent(msg.id, msg.role, msg.content),
                    inputText: typeof msg.inputText === 'string' ? msg.inputText : '',
                    attachments: Array.isArray(msg.attachments)
                      ? msg.attachments
                          .filter((attachment) => attachment && typeof attachment === 'object')
                          .map((attachment) => ({
                            id:
                              typeof attachment.id === 'string'
                                ? attachment.id
                                : `attachment-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                            name: typeof attachment.name === 'string' ? attachment.name : 'image',
                            format: typeof attachment.format === 'string' ? attachment.format : 'png',
                            mediaType:
                              typeof attachment.mediaType === 'string' ? attachment.mediaType : '',
                            size: Number(attachment.size) || 0,
                          }))
                      : [],
                    createdAt: Number(msg.createdAt) || Date.now(),
                    state: (msg.state === 'thinking' ||
                      msg.state === 'streaming' ||
                      msg.state === 'stopped'
                        ? msg.state
                        : 'done') as MessageState,
                    usedMock: Boolean(msg.usedMock),
                    replyToUserId:
                      typeof msg.replyToUserId === 'string' ? msg.replyToUserId : '',
                  }))
              : [],
          }))
      : [];

    return {
      endpoint: typeof parsed.endpoint === 'string' ? parsed.endpoint : '',
      userId,
      threads,
      activeThreadId: typeof parsed.activeThreadId === 'string' ? parsed.activeThreadId : '',
    };
  } catch {
    return empty;
  }
}

/**
 * Persists chat state to sessionStorage scoped to the user ID.
 * @param state - The chat state to store
 * @param currentUserId - Optional user ID to scope storage
 */
export function persistChatState(state: ChatState, currentUserId?: string): void {
  try {
    const userId = currentUserId || state.userId;
    const storageKey = getChatStorageKey(userId);
    sessionStorage.setItem(storageKey, JSON.stringify(state));
  } catch {
    /* ignore storage quota or private window errors */
  }
}

/**
 * Loads UI layout preferences from sessionStorage.
 */
export function loadUiState(): UiState {
  const fallback: UiState = {
    drawerOpen: false,
    conversationsCollapsed: false,
    panelWidth: 560,
    conversationPaneWidth: 280,
  };

  try {
    const raw = sessionStorage.getItem(UI_STORAGE_KEY);
    if (!raw) {
      return fallback;
    }
    const parsed = JSON.parse(raw) as Partial<UiState>;
    if (!parsed || typeof parsed !== 'object') {
      return fallback;
    }
    return {
      drawerOpen: Boolean(parsed.drawerOpen),
      conversationsCollapsed: Boolean(parsed.conversationsCollapsed),
      panelWidth: typeof parsed.panelWidth === 'number' ? parsed.panelWidth : fallback.panelWidth,
      conversationPaneWidth:
        typeof parsed.conversationPaneWidth === 'number'
          ? parsed.conversationPaneWidth
          : fallback.conversationPaneWidth,
    };
  } catch {
    return fallback;
  }
}

/**
 * Persists UI layout preferences to sessionStorage.
 * @param state - The UI state to store
 */
export function persistUiState(state: UiState): void {
  try {
    sessionStorage.setItem(UI_STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore storage quota errors */
  }
}
