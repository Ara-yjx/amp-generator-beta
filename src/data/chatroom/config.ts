function normalizeUrl(value: string | undefined, fallback: string): string {
  return (value || fallback).replace(/\/+$/, '');
}

export const CHATROOM_MANAGEMENT_API_BASE = normalizeUrl(
  process.env.REACT_APP_CHATROOM_MANAGEMENT_API_BASE,
  'https://9wr63is7x6.execute-api.us-east-2.amazonaws.com/live',
);

export const CHATROOM_RUNTIME_API_BASE = normalizeUrl(
  process.env.REACT_APP_CHATROOM_RUNTIME_API_BASE,
  'https://pmvb4orly5.execute-api.us-east-2.amazonaws.com/prod',
);

export const CHATROOM_WIDGET_URL = process.env.REACT_APP_CHATROOM_WIDGET_URL
  || 'https://ara-yjx.github.io/stimulize-chatroom-proto-resume/chatroom.min.js';

export const IS_LOCAL_DEVELOPMENT = process.env.NODE_ENV === 'development';
