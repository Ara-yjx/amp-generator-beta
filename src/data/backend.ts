// Backend API client for Stimulize-backend

import { Message } from '@arco-design/web-react';
import { requireLogin } from './loginCoordinator';
import { Experiment, experimentFromEntity, Project, ProjectEntity, projectFromEntity, ExperimentFileEntity, ExperimentFile, experimentFileFromEntity, ExperimentData, Team, TeamEntity, teamFromEntity, TeamMember, TeamMemberEntity, teamMemberFromEntity } from './apiTypes';

export const API_BASE = (
  process.env.REACT_APP_API_BASE
  || 'https://q15bwdgudf.execute-api.us-east-2.amazonaws.com/live'
).replace(/\/+$/, '');
const LS_AUTH_KEY = 'stimulize_auth';

// typing of all request
export interface ApiResponse<T> {
  data: T;
  meta?: {
    code?: number;
    message?: string;
  };
  error?: string;
}

export type AuthState = {
  token: string;
  username: string;
  id: number;
};

const authListeners = new Set<(auth: AuthState | null) => void>();

/** internal type in localStorage */
type AuthStateInternal = AuthState & {
  tokenCreatedAt: number;
  tokenExpiresAt: number;
};

const TOKEN_TTL = 12 * 60 * 60 * 1000; // 12 hours in ms

/**
 * getAuth/setAuth is data level and is managed by the backend operations, whereas AuthContext is UI level and is managed by the components
 * @returns Returns null if no auth or auth has expired
 */
export function getAuth(): AuthState | null {
  try {
    return parseStoredAuth(localStorage.getItem(LS_AUTH_KEY));
  } catch {}
  return null;
}

export function setAuth(auth: AuthState) {
  try {
    const now = Date.now();
    const authInternal: AuthStateInternal = { 
      ...auth, 
      tokenCreatedAt: now, 
      tokenExpiresAt: now + TOKEN_TTL 
    };
    localStorage.setItem(LS_AUTH_KEY, JSON.stringify(authInternal));
    notifyAuthListeners(authInternal);
  } catch { }
}

export function clearAuth() {
  try {
    localStorage.removeItem(LS_AUTH_KEY);
  } catch { }
  notifyAuthListeners(null);
}

export function addAuthListener(callback: (auth: AuthState | null) => void) {
  authListeners.add(callback);
  const listener = (event: StorageEvent) => {
    if (event.key === LS_AUTH_KEY) {
      callback(parseStoredAuth(event.newValue));
    }
  };
  window.addEventListener('storage', listener);
  return () => {
    authListeners.delete(callback);
    window.removeEventListener('storage', listener);
  };
}

function parseStoredAuth(value: string | null): AuthState | null {
  try {
    const auth = value ? JSON.parse(value) as AuthStateInternal : null;
    if (
      auth
      && typeof auth.token === 'string'
      && typeof auth.username === 'string'
      && typeof auth.id === 'number'
      && typeof auth.tokenExpiresAt === 'number'
      && Date.now() < auth.tokenExpiresAt
    ) {
      return auth;
    }
  } catch { }
  return null;
}

function notifyAuthListeners(auth: AuthState | null) {
  authListeners.forEach(listener => listener(auth));
}

/**
 * @param useJsonContentType should set to false for Multipart/form-data (file upload)
 * @returns 
 */
async function apiPost<T>(path: string, data: any = {}, requireAuth: string | boolean = false, useJsonContentType: boolean = true, isFirstTry: boolean = true, apiBase: string = API_BASE): Promise<ApiResponse<T>> {
  const headers: Record<string, string> = useJsonContentType ? { 'Content-Type': 'application/json' } : {};
  if (requireAuth) {
    if (!getAuth()?.token) {
      try {
        await requireLogin();
      } catch (err) {
        console.warn('apiPost requireLogin failure', err);
        Message.error('Please login (or re-login) to continue.');
        throw err;
      }
    }
    const token = getAuth()?.token;
    if (!token) {
      throw new Error('Auth token not found after login');
    }
    headers['Authorization'] = token;
  }
  const res = await fetch(`${apiBase}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  });


  let resJson: ApiResponse<T> | null = null;
  try {
    resJson = await res.json() as ApiResponse<T>;
  } catch { }

  // Prev: 400 means auth expired. Now: meta.code 401 means auth expired. Request login and retry
  // Now now: 200 & {error: "Invalid, expired, or missing authentication token."} <- should let backend fix this
  if (res.status === 401 || resJson?.meta?.code === 401 || resJson?.error === 'Invalid, expired, or missing authentication token.') {
    if (requireAuth) {
      if (isFirstTry) {
        Message.info(`${typeof requireAuth === 'string' ? requireAuth : ''}${getAuth() ? 'Your login session has expired. Please login again.' : 'Please login (or re-login) to continue.'}`);
        clearAuth();
        await requireLogin();
        return apiPost<T>(path, data, requireAuth, useJsonContentType, false, apiBase);
      }
      clearAuth();
      throw new Error('Authentication failed after re-login.');
    }
  }

  if (!res.ok || resJson === null || resJson.error) {
    throw new Error(resJson?.error ?? 'Unexpected server error. Please try again later.');
  }

  return resJson;
}

export function apiPostAt<T>(apiBase: string, path: string, data: unknown = {}, requireAuth: string | boolean = true): Promise<ApiResponse<T>> {
  return apiPost<T>(path, data, requireAuth, true, true, apiBase.replace(/\/+$/, ''));
}


// Auth APIs
export async function login({ email, username, password }: { email: string, username: string, password: string }): Promise<{ response: ApiResponse<any>, auth: AuthState }> {
  const response = await apiPost<{ access_token: string, user: { email: string, id: number, username: string } }>(
    '/api/login',
    { email, username, password }
  );
  if (response?.data?.access_token) {
    setAuth({ token: response.data.access_token, id: response.data.user.id, username: response.data.user.username });
    return { response, auth: { token: response.data.access_token, id: response.data.user.id, username: response.data.user.username } };
  } else {
    throw new Error('API Backend error: No access token received. Please try again.');
  }
}

export async function logout() {
  clearAuth();
  return await apiPost('/api/logout', {});
}

// Registration API
export async function register({ email, username, password }: { email: string, username: string, password: string }) {
  return apiPost('/api/register', { email, username, password });
}



// Project APIs
export async function createProject({ name, description }: { name?: string, description?: string }): Promise<Project> {
  const response = await apiPost<{ project: Pick<ProjectEntity, 'id' | 'name' | 'description' | 'created_at' | 'creator_id'> }>('/api/createProject', { name, description }, true);
  return {
    id: response.data.project.id,
    name: response.data.project.name,
    description: response.data.project.description,
    createdAt: response.data.project.created_at,
    creatorId: getAuth()?.id ?? 0,
    lastUpdatedAt: response.data.project.created_at,
    isOwner: true,
    hasAccess: true,
  }
}

export async function getProjects(): Promise<{ response: ApiResponse<{ projects: ProjectEntity[] }>, projects: Project[] }> {
  const response = await apiPost<{ projects: ProjectEntity[] }>('/api/getProjects', {}, true);
  return { response, projects: response.data.projects.map(projectFromEntity) };
}

export async function getProject(projectId: number): Promise<{ response: ApiResponse<{ project: ProjectEntity }>, project: Project }> {
  const response = await apiPost<{ project: ProjectEntity }>(`/api/getProject/${projectId}`, {}, true);
  return { response, project: projectFromEntity(response.data.project) };
}

export async function updateProject(projectId: number, { name, description }: { name: string, description?: string }): Promise<{ response: ApiResponse<{ project: ProjectEntity }>, project: Project }> {
  const response = await apiPost<{ project: ProjectEntity }>(`/api/updateProject/${projectId}`, { name, description }, true);
  return { response, project: projectFromEntity(response.data.project) };
}

export async function deleteProject(projectId: number) {
  return await apiPost(`/api/deleteProject/${projectId}`, {}, true);
}

export async function createExperiment(projectId: number, payload?: { name?: string; description?: string }): Promise<{ response: ApiResponse<{ experiment: any }>, experiment: Experiment }> {
  const response = await apiPost<{ experiment: any }>(`/api/createExperiment`, { project_id: projectId, ...(payload || {}) }, true);
  return { response, experiment: experimentFromEntity(response.data.experiment) };
}

export async function getExperimentsByProjectId(projectId: number): Promise<{ response: ApiResponse<{ experiments: any[] }>, experiments: Experiment[] }> {
  const response = await apiPost<{ experiments: any[] }>(`/api/getExperimentsByProjectId`, { project_id: projectId }, true);
  return { response, experiments: (response.data.experiments || []).map(experimentFromEntity) };
}

export async function getExperiment(experimentId: number): Promise<{ response: ApiResponse<{ experiment: any }>, experiment: Experiment }> {
  const response = await apiPost<{ experiment: any }>(`/api/getExperiment/${experimentId}`, {}, true);
  return { response, experiment: experimentFromEntity(response.data.experiment) };
}

export async function updateExperimentDescription(
  experimentId: number, { description }: { description?: string }
): Promise<{
  response: ApiResponse<{ experiment: any }>, experiment: Experiment
}> {
  const response = await apiPost<{ experiment: any }>(
    `/api/updateExperiment/${experimentId}`,
    { description },
    'Login is required to update experiment. '
  );
  return { response, experiment: experimentFromEntity(response.data.experiment) };
}

export async function updateExperimentData(
  experimentId: number, { experimentData }: { experimentData?: ExperimentData }
): Promise<{
  response: ApiResponse<{ experiment: any }>, experiment: Experiment
}> {
  const response = await apiPost<{ experiment: any }>(
    `/api/updateExperiment/${experimentId}`,
    { metadata: experimentData },
    'Login is required to save experiment settings to cloud. '
  );
  return { response, experiment: experimentFromEntity(response.data.experiment) };
}

export async function deleteExperiment(experimentId: number) {
  return await apiPost(`/api/deleteExperiment/${experimentId}`, {}, true);
}

// File operations for experiments
export async function uploadExperimentFile(experimentId: number, file: File): Promise<{ response: ApiResponse<{ file: ExperimentFileEntity }>, file: ExperimentFile }> {
  const form = new FormData();
  form.append('files', file);
  const response = await apiPost<{ file: ExperimentFileEntity }>(`/api/uploadFile/${experimentId}`, form as any, true, false);
  return { response, file: experimentFileFromEntity(response.data.file) };
}

export async function getExperimentFiles(experimentId: number): Promise<{ response: ApiResponse<{ experiment_id: number; files: ExperimentFileEntity[]; count: number }>, experimentId: number, files: ExperimentFile[], count: number }> {
  const response = await apiPost<{ experiment_id: number; files: ExperimentFileEntity[]; count: number }>(`/api/getFiles/${experimentId}`, {}, true);
  return {
    response,
    experimentId: response.data.experiment_id,
    files: (response.data.files || []).map(experimentFileFromEntity),
    count: response.data.count,
  };
}

export async function shareExperimentFile(experimentId: number, fileId: string): Promise<{ response: ApiResponse<{ shared_url: string; expires_at: string; file_info: ExperimentFileEntity }>, sharedUrl: string, expiresAt: string, fileInfo: ExperimentFile }> {
  const response = await apiPost<{ shared_url: string; expires_at: string; file_info: ExperimentFileEntity }>(`/api/experiment/${experimentId}/shareFile/${fileId}`, {}, true);
  return {
    response,
    sharedUrl: response.data.shared_url,
    expiresAt: response.data.expires_at,
    fileInfo: experimentFileFromEntity(response.data.file_info),
  };
}

export async function deleteExperimentFile(experimentId: number, fileId: string) {
  // API docs label looks duplicated; using deleteFile endpoint name here.
  return await apiPost(`/api/experiment/${experimentId}/deleteFile/${fileId}`, {}, true);
}

// =============================
// Team APIs
// =============================

export async function createTeam({ name, description }: { name: string; description?: string }): Promise<{ response: ApiResponse<{ team: TeamEntity }>, team: Team }> {
  const response = await apiPost<{ team: TeamEntity }>('/api/teams/create', { name, description }, true);
  return { response, team: teamFromEntity(response.data.team) };
}

export async function getTeams(): Promise<{ response: ApiResponse<{ teams: TeamEntity[] }>, teams: Team[] }> {
  const response = await apiPost<{ teams: TeamEntity[] }>('/api/teams/getTeams', {}, true);
  return { response, teams: (response.data.teams || []).map(teamFromEntity) };
}

export async function getTeam(teamId: number): Promise<{ response: ApiResponse<{ team: TeamEntity }>, team: Team }> {
  const response = await apiPost<{ team: TeamEntity }>(`/api/teams/getTeam/${teamId}`, {}, true);
  return { response, team: teamFromEntity(response.data.team) };
}

export async function updateTeam(teamId: number, { name, description }: { name: string; description?: string }): Promise<{ response: ApiResponse<{ team: TeamEntity }>, team: Team }> {
  const response = await apiPost<{ team: TeamEntity }>(`/api/teams/updateTeam/${teamId}`, { name, description }, true);
  return { response, team: teamFromEntity(response.data.team) };
}

export async function addTeamMember(teamId: number, userId: number): Promise<{ response: ApiResponse<{ team: TeamEntity }>, team: Team }> {
  const response = await apiPost<{ team: TeamEntity }>(`/api/teams/addMember/${teamId}`, { user_id: userId }, true);
  return { response, team: teamFromEntity(response.data.team) };
}

export async function removeTeamMember(teamId: number, userId: number): Promise<{ response: ApiResponse<{ team: TeamEntity }>, team: Team }> {
  const response = await apiPost<{ team: TeamEntity }>(`/api/teams/removeMember/${teamId}`, { user_id: userId }, true);
  return { response, team: teamFromEntity(response.data.team) };
}

export async function getTeamMembers(teamId: number): Promise<{ response: ApiResponse<{ members: TeamMemberEntity[] }>, members: TeamMember[] }> {
  const response = await apiPost<{ members: TeamMemberEntity[] }>(`/api/teams/getTeamMembers/${teamId}`, {}, true);
  return { response, members: (response.data.members || []).map(teamMemberFromEntity) };
}

export async function checkTeamAccess(teamId: number): Promise<{ response: ApiResponse<{ team_id: number; has_access: boolean; is_owner: boolean; user_role: string }>, teamId: number, hasAccess: boolean, isOwner: boolean, userRole: string }> {
  const response = await apiPost<{ team_id: number; has_access: boolean; is_owner: boolean; user_role: string }>(`/api/teams/checkTeamAccess/${teamId}`, {}, true);
  return {
    response,
    teamId: response.data.team_id,
    hasAccess: response.data.has_access,
    isOwner: response.data.is_owner,
    userRole: response.data.user_role,
  };
}
