let openDrawerHandler: (() => void) | null = null;

/**
 * Registers the callback handler for opening the chatbot drawer.
 * @param handler - Callback function invoked when opening the drawer
 */
export function registerChatbotOpen(handler: (() => void) | null): void {
  openDrawerHandler = handler;
}

/**
 * Triggers opening of the chatbot sliding drawer from any component.
 */
export function openChatbotDrawer(): void {
  openDrawerHandler?.();
}
