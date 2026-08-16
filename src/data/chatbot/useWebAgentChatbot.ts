import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  createWelcomeThread,
  loadChatState,
  loadUiState,
  persistChatState,
  persistUiState,
} from './chatbotStorage';
import {
  buildAttachmentSummary,
  buildMockReply,
  clampConversationPaneWidth,
  clampDrawerWidth,
  delay,
  getAssistantVariantInfo,
  getDisplayMessages,
  getThreadUserId,
  getTypingDelay,
  isDefaultThreadTitle,
  isMobileViewport,
  normalizeUserId,
} from './chatbotUtils';
import { DEFAULT_THREAD_TITLE, MAX_PENDING_IMAGES } from './constants';
import {
  addFilesToPendingImages,
  cloneUpload,
  revokeUploadPreview,
  toStoredAttachment,
} from './imageUpload';
import { requestAssistant } from './requestAssistant';
import type {
  ChatMessage,
  ChatState,
  ChatThread,
  PendingUpload,
  StatusMode,
  UiState,
} from './types';

/**
 * Options for configuring the WebAgentChatbot hook.
 */
export type UseWebAgentChatbotOptions = {
  /**
   * User identifier of the currently authenticated user (e.g. username or numeric ID).
   * Used to scope sessionStorage and attribute messages in AgentCore runtime.
   */
  currentUserId?: string;
};

/**
 * Return type and API surface provided by the `useWebAgentChatbot` hook.
 */
export type UseWebAgentChatbotReturn = {
  /** Root chat data state containing threads, active thread ID, and user ID */
  chatState: ChatState;
  /** React state dispatcher for chatState */
  setChatState: React.Dispatch<React.SetStateAction<ChatState>>;
  /** UI layout and visibility state (drawer open, collapsed, dimensions) */
  uiState: UiState;
  /** React state dispatcher for uiState */
  setUiState: React.Dispatch<React.SetStateAction<UiState>>;
  /** Currently active conversation thread */
  activeThread: ChatThread | null;
  /** Filtered list of messages for the active thread including variant choices */
  displayMessages: ChatMessage[];
  /** Assistant operational status (idle, online, busy, error) and display label */
  status: { mode: StatusMode; text: string };
  /** Text prompt currently entered in the input textarea */
  prompt: string;
  /** React state dispatcher for prompt input text */
  setPrompt: React.Dispatch<React.SetStateAction<string>>;
  /** Array of pending image uploads attached to the next message */
  pendingImages: PendingUpload[];
  /** Whether the mobile conversations sidebar is visible */
  mobileThreadsOpen: boolean;
  /** React state dispatcher for mobile conversations sidebar visibility */
  setMobileThreadsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  /** Whether an AI generation or streaming process is currently in progress */
  isBusy: boolean;
  /** Ref attached to the scrollable messages container for auto-scrolling */
  messageScrollRef: React.RefObject<HTMLDivElement>;
  /** Ref attached to the prompt input textarea */
  promptRef: React.RefObject<HTMLTextAreaElement>;
  /** Ref attached to the root chatbot DOM container */
  rootRef: React.RefObject<HTMLDivElement>;
  /** Opens the chatbot sliding drawer */
  openDrawer: () => void;
  /** Closes the chatbot sliding drawer */
  closeDrawer: () => void;
  /** Creates a new conversation thread and sets it as active */
  createThread: (title?: string) => void;
  /** Selects a conversation thread by its ID */
  selectThread: (threadId: string) => void;
  /** Deletes a conversation thread and cleans up preview memory */
  deleteThread: (threadId: string) => void;
  /** Prompts the user to rename a conversation thread */
  renameThread: (threadId: string) => void;
  /** Sends a prompt (or currently typed input) with attached images to the assistant */
  sendMessage: (overridePrompt?: string) => Promise<void>;
  /** Cancels the active generation in progress */
  stopGeneration: () => void;
  /** Re-sends the last user prompt to generate an alternate answer variant */
  regenerateLastAnswer: () => Promise<void>;
  /** Switches between alternate assistant answer variants for a given user message */
  switchAssistantVariant: (userId: string, delta: number) => void;
  /** Validates and adds file uploads to the pending images list */
  handleAddFiles: (files: File[]) => Promise<void>;
  /** Removes an image from the pending uploads list */
  removePendingImage: (uploadId: string) => void;
  /** Clears all pending images and optionally revokes preview object URLs */
  clearPendingImages: (options?: { revoke?: boolean }) => void;
  /** Retrieves the object URL preview for an attachment */
  getPreviewUrl: (messageId: string, attachmentId: string) => string | undefined;
  /** Retrieves variant count and index information for an assistant response */
  getAssistantVariantInfo: (
    thread: ChatThread,
    message: ChatMessage,
  ) => { userId: string; index: number; total: number } | null;
  /** Clamps drawer width within bounds */
  clampDrawerWidth: (width: number) => number;
  /** Clamps conversation sidebar width within bounds */
  clampConversationPaneWidth: (width: number) => number;
};

function ensureInitialState(state: ChatState, fallbackUserId?: string): ChatState {
  const effectiveUserId = fallbackUserId || state.userId;
  if (state.threads.length === 0) {
    const thread = createWelcomeThread(effectiveUserId);
    return {
      ...state,
      userId: effectiveUserId,
      threads: [thread],
      activeThreadId: thread.id,
    };
  }

  if (!state.activeThreadId || !state.threads.some((t) => t.id === state.activeThreadId)) {
    return { ...state, userId: effectiveUserId, activeThreadId: state.threads[0].id };
  }

  return { ...state, userId: effectiveUserId };
}

function updateThread(
  state: ChatState,
  threadId: string,
  updater: (thread: ChatThread) => ChatThread,
): ChatState {
  return {
    ...state,
    threads: state.threads.map((thread) =>
      thread.id === threadId ? updater({ ...thread, messages: [...thread.messages] }) : thread,
    ),
  };
}

function updateMessage(
  state: ChatState,
  threadId: string,
  msgId: string,
  patch: Partial<ChatMessage>,
): ChatState {
  return updateThread(state, threadId, (thread) => ({
    ...thread,
    updatedAt: Date.now(),
    messages: thread.messages.map((msg) => (msg.id === msgId ? { ...msg, ...patch } : msg)),
  }));
}

/**
 * Custom React hook encapsulating state, AWS Bedrock AgentCore invocation,
 * message streaming, layout persistence, and UI events for the Stimulize WebAgent chatbot.
 *
 * @param options - Optional configuration including authenticated `currentUserId`
 * @returns Object providing reactive state and action handlers for the chatbot UI
 */
export function useWebAgentChatbot(options: UseWebAgentChatbotOptions = {}): UseWebAgentChatbotReturn {
  const { currentUserId } = options;

  const [chatState, setChatState] = useState<ChatState>(() =>
    ensureInitialState(loadChatState(currentUserId), currentUserId),
  );
  const [uiState, setUiState] = useState<UiState>(() => loadUiState());
  const [status, setStatus] = useState<{ mode: StatusMode; text: string }>({
    mode: 'idle',
    text: 'Idle',
  });
  const [prompt, setPrompt] = useState('');
  const [pendingImages, setPendingImages] = useState<PendingUpload[]>([]);
  const [mobileThreadsOpen, setMobileThreadsOpen] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const inflightRef = useRef<{ controller: AbortController; threadId: string; msgId: string } | null>(null);
  const messageScrollRef = useRef<HTMLDivElement>(null);
  const promptRef = useRef<HTMLTextAreaElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const messageImageStoreRef = useRef<Map<string, PendingUpload[]>>(new Map());

  // Reload chat state when currentUserId changes
  useEffect(() => {
    if (currentUserId && currentUserId !== chatState.userId) {
      setChatState(ensureInitialState(loadChatState(currentUserId), currentUserId));
    }
  }, [currentUserId, chatState.userId]);

  const activeThread = useMemo(
    () => chatState.threads.find((t) => t.id === chatState.activeThreadId) || null,
    [chatState.activeThreadId, chatState.threads],
  );

  const displayMessages = useMemo(
    () => getDisplayMessages(activeThread),
    [activeThread],
  );

  useEffect(() => {
    persistChatState(chatState, currentUserId);
  }, [chatState, currentUserId]);

  useEffect(() => {
    persistUiState(uiState);
  }, [uiState]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) {
      return;
    }
    root.style.setProperty('--drawer-width', `${uiState.panelWidth}px`);
    root.style.setProperty('--conversation-width', `${uiState.conversationPaneWidth}px`);
  }, [uiState.panelWidth, uiState.conversationPaneWidth]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || !uiState.drawerOpen) {
        return;
      }
      setUiState((prev) => ({ ...prev, drawerOpen: false }));
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [uiState.drawerOpen]);

  useEffect(() => {
    const scrollEl = messageScrollRef.current;
    if (!scrollEl) {
      return;
    }
    scrollEl.scrollTop = scrollEl.scrollHeight;
  }, [displayMessages, activeThread?.id]);

  const setStatusState = useCallback((mode: StatusMode, text: string) => {
    setStatus({ mode, text });
  }, []);

  const openDrawer = useCallback(() => {
    setUiState((prev) => ({ ...prev, drawerOpen: true }));
    if (isMobileViewport()) {
      setMobileThreadsOpen(false);
    }
  }, []);

  const closeDrawer = useCallback(() => {
    setUiState((prev) => ({ ...prev, drawerOpen: false }));
    setMobileThreadsOpen(false);
  }, []);

  const createThread = useCallback((title = DEFAULT_THREAD_TITLE) => {
    const userId = currentUserId || chatState.userId;
    const thread = createWelcomeThread(userId, title);
    setChatState((prev) => ({
      ...prev,
      threads: [thread, ...prev.threads],
      activeThreadId: thread.id,
    }));
    setMobileThreadsOpen(false);
  }, [chatState.userId, currentUserId]);

  const selectThread = useCallback((threadId: string) => {
    setChatState((prev) => ({ ...prev, activeThreadId: threadId }));
    setMobileThreadsOpen(false);
  }, []);

  const deleteThread = useCallback((threadId: string) => {
    const target = chatState.threads.find((t) => t.id === threadId);
    if (!target) {
      return;
    }
    if (!window.confirm(`Delete conversation "${target.title || DEFAULT_THREAD_TITLE}"?`)) {
      return;
    }

    if (inflightRef.current?.threadId === threadId) {
      inflightRef.current.controller.abort();
    }

    for (const message of target.messages) {
      const uploads = messageImageStoreRef.current.get(message.id);
      uploads?.forEach((item) => revokeUploadPreview(item));
      messageImageStoreRef.current.delete(message.id);
    }

    setChatState((prev) => {
      const index = prev.threads.findIndex((t) => t.id === threadId);
      const nextThreads = prev.threads.filter((t) => t.id !== threadId);
      if (nextThreads.length === 0) {
        const thread = createWelcomeThread(currentUserId || prev.userId);
        return { ...prev, threads: [thread], activeThreadId: thread.id };
      }

      let nextActiveId = prev.activeThreadId;
      if (prev.activeThreadId === threadId) {
        const next = nextThreads[index] || nextThreads[index - 1] || nextThreads[0];
        nextActiveId = next.id;
      }
      return { ...prev, threads: nextThreads, activeThreadId: nextActiveId };
    });
  }, [chatState.threads, currentUserId]);

  const renameThread = useCallback((threadId: string) => {
    const thread = chatState.threads.find((t) => t.id === threadId);
    if (!thread) {
      return;
    }
    const currentTitle = (thread.title || DEFAULT_THREAD_TITLE).trim();
    const input = window.prompt('Rename conversation', currentTitle);
    if (input == null) {
      return;
    }
    const nextTitle = input.trim().replace(/\s+/g, ' ').slice(0, 80);
    if (!nextTitle) {
      return;
    }
    setChatState((prev) =>
      updateThread(prev, threadId, (t) => ({ ...t, title: nextTitle, updatedAt: Date.now() })),
    );
  }, [chatState.threads]);

  const clearPendingImages = useCallback((options: { revoke?: boolean } = {}) => {
    if (options.revoke !== false) {
      pendingImages.forEach((item) => revokeUploadPreview(item));
    }
    setPendingImages([]);
  }, [pendingImages]);

  const askAssistant = useCallback(
    async (promptText: string, replyToUserId: string, attachments: PendingUpload[]) => {
      const threadId = chatState.activeThreadId;
      const thread = chatState.threads.find((t) => t.id === threadId);
      if (!thread) {
        return;
      }

      const msgId = `msg-${Date.now()}-assistant`;
      const controller = new AbortController();
      inflightRef.current = { controller, threadId, msgId };
      setIsBusy(true);

      setChatState((prev) => {
        const next = updateThread(prev, threadId, (t) => ({
          ...t,
          updatedAt: Date.now(),
          variantSelections: replyToUserId
            ? { ...t.variantSelections, [replyToUserId]: msgId }
            : t.variantSelections,
          messages: [
            ...t.messages,
            {
              id: msgId,
              role: 'assistant',
              content: 'Thinking.',
              createdAt: Date.now(),
              state: 'thinking',
              replyToUserId,
            },
          ],
        }));
        return next;
      });

      setStatusState('busy', 'Thinking');

      let thinkingTick = 0;
      const thinkingTimer = window.setInterval(() => {
        if (!inflightRef.current || inflightRef.current.msgId !== msgId) {
          return;
        }
        thinkingTick = (thinkingTick + 1) % 3;
        setChatState((prev) =>
          updateMessage(prev, threadId, msgId, {
            content: `Thinking${'.'.repeat(thinkingTick + 1)}`,
            state: 'thinking',
          }),
        );
      }, 360);

      let finalText = '';
      let usedMock = false;
      const effectiveUser = currentUserId || chatState.userId;
      const threadUserId = getThreadUserId(thread, effectiveUser);

      try {
        finalText = await requestAssistant(
          promptText,
          threadId,
          threadUserId,
          controller.signal,
          attachments,
          chatState.endpoint,
        );
        setStatusState('online', 'Connected');
      } catch (error) {
        window.clearInterval(thinkingTimer);
        if (error instanceof DOMException && error.name === 'AbortError') {
          setChatState((prev) =>
            updateMessage(prev, threadId, msgId, {
              content: 'Generation stopped.',
              state: 'stopped',
            }),
          );
          setStatusState('idle', 'Stopped');
          inflightRef.current = null;
          setIsBusy(false);
          return;
        }

        usedMock = true;
        finalText = buildMockReply(promptText, thread, attachments, threadUserId);
        setStatusState('error', 'Mock fallback');
      }

      window.clearInterval(thinkingTimer);
      setChatState((prev) =>
        updateMessage(prev, threadId, msgId, { content: '', state: 'streaming' }),
      );

      try {
        let cursor = 0;
        while (cursor < finalText.length) {
          if (controller.signal.aborted) {
            throw new DOMException('Aborted', 'AbortError');
          }
          const nextChar = finalText[cursor];
          cursor += 1;
          setChatState((prev) =>
            updateMessage(prev, threadId, msgId, {
              content: finalText.slice(0, cursor),
              state: 'streaming',
            }),
          );
          await delay(getTypingDelay(nextChar));
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          setChatState((prev) =>
            updateMessage(prev, threadId, msgId, {
              content: 'Generation stopped.',
              state: 'stopped',
            }),
          );
          setStatusState('idle', 'Stopped');
          inflightRef.current = null;
          setIsBusy(false);
          return;
        }
        throw error;
      }

      setChatState((prev) =>
        updateMessage(prev, threadId, msgId, {
          state: 'done',
          content: finalText,
          usedMock,
        }),
      );
      inflightRef.current = null;
      setIsBusy(false);
      setStatusState(usedMock ? 'error' : 'idle', usedMock ? 'Mock response' : 'Ready');
    },
    [chatState.activeThreadId, chatState.endpoint, chatState.threads, chatState.userId, currentUserId, setStatusState],
  );

  const sendMessage = useCallback(async (overridePrompt?: string) => {
    if (inflightRef.current) {
      return;
    }

    const raw = (overridePrompt ?? prompt).trim();
    const queuedImages = pendingImages.map((item) => cloneUpload(item));
    if (!raw && queuedImages.length === 0) {
      return;
    }

    const thread = chatState.threads.find((t) => t.id === chatState.activeThreadId);
    if (!thread) {
      return;
    }

    if (raw === '/clear' && queuedImages.length === 0) {
      for (const message of thread.messages) {
        const uploads = messageImageStoreRef.current.get(message.id);
        uploads?.forEach((item) => revokeUploadPreview(item));
        messageImageStoreRef.current.delete(message.id);
      }
      setChatState((prev) =>
        updateThread(prev, thread.id, (t) => ({
          ...t,
          messages: [],
          variantSelections: {},
          updatedAt: Date.now(),
        })),
      );
      setPrompt('');
      clearPendingImages();
      return;
    }

    const now = Date.now();
    const userMsgId = `msg-${now}-user`;
    const visibleContent = raw || buildAttachmentSummary(queuedImages);

    messageImageStoreRef.current.set(userMsgId, queuedImages);

    setChatState((prev) =>
      updateThread(prev, thread.id, (t) => ({
        ...t,
        title: isDefaultThreadTitle(t.title)
          ? (raw || buildAttachmentSummary(queuedImages)).slice(0, 40)
          : t.title,
        updatedAt: now,
        messages: [
          ...t.messages,
          {
            id: userMsgId,
            role: 'user',
            content: visibleContent,
            inputText: raw,
            attachments: queuedImages.map((item) => toStoredAttachment(item)),
            createdAt: now,
            state: 'done',
          },
        ],
      })),
    );

    setPrompt('');
    setPendingImages([]);

    await askAssistant(raw, userMsgId, queuedImages);
  }, [askAssistant, chatState.activeThreadId, chatState.threads, clearPendingImages, pendingImages, prompt]);

  const stopGeneration = useCallback(() => {
    inflightRef.current?.controller.abort();
  }, []);

  const regenerateLastAnswer = useCallback(async () => {
    if (inflightRef.current) {
      return;
    }
    const thread = chatState.threads.find((t) => t.id === chatState.activeThreadId);
    if (!thread) {
      return;
    }
    const lastUser = [...thread.messages].reverse().find((item) => item.role === 'user');
    if (!lastUser) {
      return;
    }
    const attachments = messageImageStoreRef.current.get(lastUser.id) || [];
    await askAssistant(lastUser.inputText || lastUser.content, lastUser.id, attachments);
  }, [askAssistant, chatState.activeThreadId, chatState.threads]);

  const switchAssistantVariant = useCallback(
    (userId: string, delta: number) => {
      const thread = chatState.threads.find((t) => t.id === chatState.activeThreadId);
      if (!thread) {
        return;
      }
      const variants = thread.messages.filter(
        (item) => item.role === 'assistant' && item.replyToUserId === userId,
      );
      if (variants.length <= 1) {
        return;
      }
      const currentId = thread.variantSelections[userId] || '';
      let index = variants.findIndex((item) => item.id === currentId);
      if (index < 0) {
        index = variants.length - 1;
      }
      index = (index + delta + variants.length) % variants.length;
      setChatState((prev) =>
        updateThread(prev, thread.id, (t) => ({
          ...t,
          variantSelections: { ...t.variantSelections, [userId]: variants[index].id },
        })),
      );
    },
    [chatState.activeThreadId, chatState.threads],
  );

  const handleAddFiles = useCallback(async (files: File[]) => {
    try {
      const result = await addFilesToPendingImages(files, pendingImages);
      setPendingImages(result.uploads);
      if (result.truncated) {
        window.alert(`Only the first ${MAX_PENDING_IMAGES - pendingImages.length} image(s) were added.`);
      }
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Failed to read the selected image.');
    }
  }, [pendingImages]);

  const removePendingImage = useCallback((uploadId: string) => {
    setPendingImages((prev) => {
      const target = prev.find((item) => item.id === uploadId);
      revokeUploadPreview(target);
      return prev.filter((item) => item.id !== uploadId);
    });
  }, []);

  const getPreviewUrl = useCallback((messageId: string, attachmentId: string) => {
    const pending = pendingImages.find((item) => item.id === attachmentId);
    if (pending?.previewUrl) {
      return pending.previewUrl;
    }
    const storedList = messageImageStoreRef.current.get(messageId) || [];
    const found = storedList.find((item) => item.id === attachmentId);
    return found?.previewUrl;
  }, [pendingImages]);

  return {
    chatState,
    setChatState,
    uiState,
    setUiState,
    activeThread,
    displayMessages,
    status,
    prompt,
    setPrompt,
    pendingImages,
    mobileThreadsOpen,
    setMobileThreadsOpen,
    isBusy,
    messageScrollRef,
    promptRef,
    rootRef,
    openDrawer,
    closeDrawer,
    createThread,
    selectThread,
    deleteThread,
    renameThread,
    sendMessage,
    stopGeneration,
    regenerateLastAnswer,
    switchAssistantVariant,
    handleAddFiles,
    removePendingImage,
    clearPendingImages,
    getPreviewUrl,
    getAssistantVariantInfo,
    clampDrawerWidth,
    clampConversationPaneWidth,
  };
}
