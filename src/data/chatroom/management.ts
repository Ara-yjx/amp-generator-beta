import { apiPostAt } from '../backend';
import { CHATROOM_MANAGEMENT_API_BASE } from './config';

export function unwrapChatroomPayload<T>(payload: unknown): T {
  if (!payload || typeof payload !== 'object') return payload as T;

  const maybeData = (payload as { data?: unknown }).data;
  if (!maybeData || typeof maybeData !== 'object' || Array.isArray(maybeData)) {
    return payload as T;
  }

  if ('chatrooms' in maybeData) return (maybeData as { chatrooms: T }).chatrooms;
  if ('chatroom' in maybeData) return (maybeData as { chatroom: T }).chatroom;
  return maybeData as T;
}

export async function chatroomApiPost<T>(path: string, data: unknown = {}): Promise<T> {
  const response = await apiPostAt<unknown>(CHATROOM_MANAGEMENT_API_BASE, path, data, true);
  return unwrapChatroomPayload<T>(response);
}
