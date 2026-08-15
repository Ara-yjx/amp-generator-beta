import { ChatroomSetting } from './chatroomSetting';
import { chatroomApiPost } from './management';

export interface ChatroomSummary {
  id: string;
  name: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Chatroom extends ChatroomSummary {
  setting: Partial<ChatroomSetting>;
}

export function listChatrooms(): Promise<ChatroomSummary[]> {
  return chatroomApiPost('/api/getChatrooms');
}

export function createChatroom(name: string, setting: ChatroomSetting): Promise<Chatroom> {
  return chatroomApiPost('/api/createChatroom', { name, setting });
}

export function getChatroom(id: string): Promise<Chatroom> {
  return chatroomApiPost(`/api/getChatroom/${id}`);
}

export function updateChatroom(
  id: string,
  payload: { name: string; status: string; setting: ChatroomSetting },
): Promise<Chatroom> {
  return chatroomApiPost(`/api/updateChatroom/${id}`, payload);
}

export function deleteChatroom(id: string): Promise<Chatroom> {
  return chatroomApiPost(`/api/deleteChatroom/${id}`);
}

export function getChatroomUsage<T>(id: string, period: 'day' | 'week' | 'month'): Promise<T> {
  return chatroomApiPost(`/api/getChatroomUsage/${id}`, { period });
}
