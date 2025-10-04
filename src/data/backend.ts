// Backend API client for Stimulize-backend

import { Message } from "@arco-design/web-react";
import { requireLogin } from "../component/login";

const API_BASE = 'https://q15bwdgudf.execute-api.us-east-2.amazonaws.com/live';
// const API_BASE = 'http://localhost:3000/live';
const AUTH_TOKEN_KEY = 'stimulize_access_token';

// typing of all request
interface Response<T> {
  data: T;
  meta: {
    code: number;
    message: string;
  };
}

function getAuthToken() {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

function setAuthToken(token: string) {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
}

function clearAuthToken() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
}

async function apiPost<T>(path: string, data: any = {}, useAuth: boolean = false): Promise<Response<T>> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (useAuth) {
    const token = getAuthToken();
    if (token) {
      headers['Authorization'] = `${token}`;
    } else {
      try {
        await requireLogin();
      } catch (err) {
        Message.error('Login is required to use this feature');
      }
    }
  }
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw json;
  return json;
}

// Auth APIs
export async function login({ email, username, password }: { email: string, username: string, password: string }) {
  const result = await apiPost<{ access_token: string, user: { email: string, id: number, username: string } }>(
    '/api/login',
    { email, username, password }
  );
  if (result?.data?.access_token) setAuthToken(result.data.access_token);
  return result;
}

export async function logout() {
  clearAuthToken();
  const result = await apiPost('/api/logout', {}, true);
  return result;
}

// Registration API
export async function register({ email, username, password }: { email: string, username: string, password: string }) {
  return apiPost('/api/register', { email, username, password });
}



// Project APIs
export async function createProject({ name, description }: { name?: string, description?: string }) {
  return apiPost('/api/createProject', { name, description }, true);
}

export async function getProjects() {
  return apiPost('/api/getProjects', {}, true);
}

export async function getProject(projectId: number) {
  return apiPost(`/api/getProject/${projectId}`, {}, true);
}

export async function updateProject(projectId: number, { name, description }: { name: string, description?: string }) {
  return apiPost(`/api/updateProject/${projectId}`, { name, description }, true);
}

export async function deleteProject(projectId: number) {
  return apiPost(`/api/deleteProject/${projectId}`, {}, true);
}