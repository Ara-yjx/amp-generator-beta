// Backend API client for Stimulize-backend

import { Message } from '@arco-design/web-react';
import { requireLogin } from '../component/loginModal';
import { ProjectEntity } from './apiTypes';

const API_BASE = 'https://q15bwdgudf.execute-api.us-east-2.amazonaws.com/live';
const LS_AUTH_KEY = 'stimulize_auth';

// typing of all request
interface Response<T> {
  data: T;
  meta: {
    code: number;
    message: string;
  };
}

export type AuthState = {
  token: string;
  username: string;
}


/**
 * getAuth/setAuth is data level and is managed by the backend operations, whereas AuthContext is UI level and is managed by the components
 */
export function getAuth(): AuthState | null {
  try {
    const auth = localStorage.getItem(LS_AUTH_KEY);
    return auth ? JSON.parse(auth) : null;
  } catch {
    return null;
  }
}

export function setAuth(auth: AuthState) {
  try {
    localStorage.setItem(LS_AUTH_KEY, JSON.stringify(auth));
  } catch { }
}

export function clearAuth() {
  try {
    localStorage.removeItem(LS_AUTH_KEY);
  } catch { }
}

async function apiPost<T>(path: string, data: any = {}, requireAuth: boolean = false): Promise<Response<T>> {
  console.log('apiPost', path, data, requireAuth);
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (requireAuth) {
    const token = getAuth()?.token;
    if (token) {
      headers['Authorization'] = `${token}`;
    } else {
      try {
        console.log('requireLogin', requireLogin)
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
  // 400 means auth expired. Request login and retry
  if (res.status === 400) {
    Message.info('Your login session has expired. Please login again.');
    clearAuth();
    await requireLogin();
    return apiPost<T>(path, data, requireAuth);
  } else {
    const json = await res.json() as Response<T>;
    if (!res.ok) throw json;
    return json;
  }
}

// Multipart/form-data POST helper (for file uploads)
async function apiPostForm<T>(path: string, form: FormData, useAuth: boolean = false): Promise<Response<T>> {
  const headers: Record<string, string> = {};
  if (useAuth) {
    const token = getAuth()?.token;
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
    headers, // do NOT set Content-Type; browser will set boundary
    body: form,
  });
  if (res.status === 400) {
    Message.info('Your login session has expired. Please login again.');
    clearAuth();
    await requireLogin();
    return apiPostForm<T>(path, form, useAuth);
  } else {
    const json = await res.json() as Response<T>;
    if (!res.ok) throw json;
    return json;
  }
}

// Auth APIs
export async function login({ email, username, password }: { email: string, username: string, password: string }): Promise<Response<any> & { auth: AuthState }> {
  const result = await apiPost<{ access_token: string, user: { email: string, id: number, username: string } }>(
    '/api/login',
    { email, username, password }
  );
  if (result?.data?.access_token) {
    setAuth({ token: result.data.access_token, username: result.data.user.username });
    return { ...result, auth: { token: result.data.access_token, username: result.data.user.username } };
  } else {
    throw new Error('API Backend error: No access token received. Please try again.');
  }
}

export async function logout() {
  clearAuth();
  return await apiPost('/api/logout', {}, true);
}

// Registration API
export async function register({ email, username, password }: { email: string, username: string, password: string }) {
  return apiPost('/api/register', { email, username, password });
}



// Project APIs
export async function createProject({ name, description }: { name?: string, description?: string }): Promise<ProjectEntity> {
  return (await apiPost<{ project: ProjectEntity }>('/api/createProject', { name, description }, true)).data.project;
}

export async function getProjects(): Promise<{ projects: ProjectEntity[] }> {
  return (await apiPost<{ projects: ProjectEntity[] }>('/api/getProjects', {}, true)).data;
}

export async function getProject(projectId: number): Promise<ProjectEntity> {
  return (await apiPost<{ project: ProjectEntity }>(`/api/getProject/${projectId}`, {}, true)).data.project;
}

export async function updateProject(projectId: number, { name, description }: { name: string, description?: string }): Promise<ProjectEntity> {
  return (await apiPost<{ project: ProjectEntity }>(`/api/updateProject/${projectId}`, { name, description }, true)).data.project;
}

export async function deleteProject(projectId: number) {
  return await apiPost(`/api/deleteProject/${projectId}`, {}, true);
}

// =============================
// Experiment APIs
// =============================

// Types for experiments and files (minimal based on API docs)
export type ExperimentEntity = {
  id: number;
  name?: string;
  description?: string;
  metadata?: any;
  created_at?: string;
  creator_id?: number;
  project_id?: number;
  has_access?: boolean;
  is_owner?: boolean;
};

export type ExperimentFileInfo = {
  file_id: string;
  filename: string;
  s3_arn: string;
  s3_key: string;
  content_type: string;
  uploaded_at: string;
};

export async function createExperiment(projectId: number, payload?: { name?: string; description?: string }): Promise<ExperimentEntity> {
  return (await apiPost<{ experiment: ExperimentEntity }>(`/api/createExperiment`, { project_id: projectId, ...(payload || {}) }, true)).data.experiment;
}

export async function getExperimentsByProjectId(projectId: number): Promise<{ experiments: ExperimentEntity[] }> {
  return (await apiPost<{ experiments: ExperimentEntity[] }>(`/api/getExperimentsByProjectId`, { project_id: projectId }, true)).data;
}

export async function getExperiment(experimentId: number): Promise<ExperimentEntity> {
  return (await apiPost<{ experiment: ExperimentEntity }>(`/api/getExperiment/${experimentId}`, {}, true)).data.experiment;
}

export async function updateExperiment(experimentId: number, payload: { description?: string; metadata?: any }): Promise<ExperimentEntity> {
  return (await apiPost<{ experiment: ExperimentEntity }>(`/api/updateExperiment/${experimentId}`, payload, true)).data.experiment;
}

export async function deleteExperiment(experimentId: number) {
  return await apiPost(`/api/deleteExperiment/${experimentId}`, {}, true);
}

// File operations for experiments
export async function uploadExperimentFile(experimentId: number, file: File) {
  const form = new FormData();
  form.append('files', file);
  return (await apiPostForm<{ file: ExperimentFileInfo }>(`/api/uploadFIle/${experimentId}`, form, true)).data.file;
}

export async function getExperimentFiles(experimentId: number) {
  return (await apiPost<{ experiment_id: number; files: ExperimentFileInfo[]; count: number }>(`/api/getFIles/${experimentId}`, {}, true)).data;
}

export async function shareExperimentFile(experimentId: number, fileId: string) {
  return (await apiPost<{ shared_url: string; expires_at: string; file_info: ExperimentFileInfo }>(`/api/experiment/${experimentId}/shareFile/${fileId}`, {}, true)).data;
}

export async function deleteExperimentFile(experimentId: number, fileId: string) {
  // API docs label looks duplicated; using deleteFile endpoint name here.
  return await apiPost(`/api/experiment/${experimentId}/deleteFile/${fileId}`, {}, true);
}

