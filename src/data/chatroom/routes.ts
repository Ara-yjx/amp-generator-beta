export const CHATROOM_LIST_ROUTE = '/chatroom'

export function aiConversationBatchRoute(chatroomId: string, batchId: string): string {
  return `${CHATROOM_LIST_ROUTE}/${chatroomId}/ai-batches/${batchId}`
}

export function chatroomDetailRoute(id: string): string {
  return `${CHATROOM_LIST_ROUTE}/${id}`
}

export function chatroomUsageRoute(id: string): string {
  return `${CHATROOM_LIST_ROUTE}/${id}/usage`
}
