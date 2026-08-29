/** Session storage key prefix for chatbot thread state */
export const CHATBOT_STORAGE_KEY_PREFIX = 'stimulize_agent_chat_';

/** Session storage key for UI layout preferences */
export const UI_STORAGE_KEY = 'stimulize_agent_ui_v1';

/** Default prefix for auto-generated user identifiers if not logged in */
export const DEFAULT_USER_ID_PREFIX = 'user';

/** Default title assigned to newly created conversation threads */
export const DEFAULT_THREAD_TITLE = 'New chat';

/** Minimum drawer width in pixels */
export const DRAWER_MIN_WIDTH = 420;

/** Maximum drawer width in pixels */
export const DRAWER_MAX_WIDTH = 920;

/** Minimum conversation sidebar width in pixels */
export const CONVERSATION_MIN_WIDTH = 220;

/** Maximum conversation sidebar width in pixels */
export const CONVERSATION_MAX_WIDTH = 460;

/** Minimum chat workspace width in pixels */
export const CHAT_MIN_WIDTH = 320;

/** Initial greeting message rendered for newly opened threads */
export const WELCOME_MESSAGE = 'Hello! How can I assist you with Stimulize today?';

/** Maximum number of image attachments allowed per message */
export const MAX_PENDING_IMAGES = 5;

/** Maximum file size per uploaded image (3.75 MB) */
export const MAX_IMAGE_BYTES = Math.floor(3.75 * 1024 * 1024);

/** Allowed MIME types for image attachments */
export const ACCEPTED_IMAGE_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
]);
