// Backend API client for Stimulize-backend

import { Message } from '@arco-design/web-react';
import { requireLogin } from '../component/loginModal';
import { Experiment, experimentFromEntity, Project, ProjectEntity, projectFromEntity, ExperimentFileEntity, ExperimentFile, experimentFileFromEntity, ExperimentData, Team, TeamEntity, teamFromEntity, TeamMember, TeamMemberEntity, teamMemberFromEntity } from './apiTypes';

const API_BASE = 'https://q15bwdgudf.execute-api.us-east-2.amazonaws.com/live';
const LS_AUTH_KEY = 'stimulize_auth';

// typing of all request
interface Response<T> {
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

export function addAuthListener(callback: (auth: AuthState | null) => void) {
  const listener = (event: StorageEvent) => {
    if (event.key === LS_AUTH_KEY) {
      const auth = event.newValue ? JSON.parse(event.newValue) : null;
      callback(auth);
    }
  };
  window.addEventListener('storage', listener);
  return () => window.removeEventListener('storage', listener);
}

/**
 * @param useJsonContentType should set to false for Multipart/form-data (file upload)
 * @returns 
 */
async function apiPost<T>(path: string, data: any = {}, requireAuth: string | boolean = false, useJsonContentType: boolean = true, isFirstTry: boolean = true): Promise<Response<T>> {
  console.debug('apiPost', path, data, requireAuth);
  const headers: Record<string, string> = useJsonContentType ? { 'Content-Type': 'application/json' } : {};
  if (requireAuth) {
    if (!getAuth()?.token) {
      try {
        await requireLogin();
      } catch (err) {
        console.warn('apiPost requireLogin failure', err);
        Message.error('Login is required to use this feature');
        throw err;
      }
    }
    const token = getAuth()?.token;
    if (!token) {
      throw new Error('Auth token not found after login');
    }
    headers['Authorization'] = token;
  }
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  });
  // Prev: 400 means auth expired. Now: meta.code 401 means auth expired. Request login and retry
  if (res.status === 400) {
    if (requireAuth) {
      return await loginAndRetry();
    }
  } else {
    const json = await res.json() as Response<T>;
    if (res.ok) {
      if (json.meta?.code === 401) {
        if (requireAuth) {
          return await loginAndRetry();
        } else {
          Message.error('Unexpected error when calling server. Please try again later.');
          throw new Error('Unexpected error in apiPost');
        }
      }
      if (json.error) {
        Message.error(`Error: ${json.error}`);
      }
      return json;
    }
    Message.error(`Error when calling server: ${json.meta?.message ?? json.error ?? ''}. Please try again later.`);
  }
  throw new Error('Unexpected error in apiPost');
  
  async function loginAndRetry() {
    if (isFirstTry) {
      Message.info(`${typeof requireAuth === 'string' ? requireAuth : ''}${getAuth() ? 'Your login session has expired. Please login again.' : ''}`);  
    }
    clearAuth();
    await requireLogin();
    return apiPost<T>(path, data, requireAuth, useJsonContentType, false);
  }
}


// Auth APIs
export async function login({ email, username, password }: { email: string, username: string, password: string }): Promise<{ response: Response<any>, auth: AuthState }> {
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

export async function getProjects(): Promise<{ response: Response<{ projects: ProjectEntity[] }>, projects: Project[] }> {
  const response = await apiPost<{ projects: ProjectEntity[] }>('/api/getProjects', {}, true);
  return { response, projects: response.data.projects.map(projectFromEntity) };
}

export async function getProject(projectId: number): Promise<{ response: Response<{ project: ProjectEntity }>, project: Project }> {
  const response = await apiPost<{ project: ProjectEntity }>(`/api/getProject/${projectId}`, {}, true);
  return { response, project: projectFromEntity(response.data.project) };
}

export async function updateProject(projectId: number, { name, description }: { name: string, description?: string }): Promise<{ response: Response<{ project: ProjectEntity }>, project: Project }> {
  const response = await apiPost<{ project: ProjectEntity }>(`/api/updateProject/${projectId}`, { name, description }, true);
  return { response, project: projectFromEntity(response.data.project) };
}

export async function deleteProject(projectId: number) {
  return await apiPost(`/api/deleteProject/${projectId}`, {}, true);
}

export async function createExperiment(projectId: number, payload?: { name?: string; description?: string }): Promise<{ response: Response<{ experiment: any }>, experiment: Experiment }> {
  const response = await apiPost<{ experiment: any }>(`/api/createExperiment`, { project_id: projectId, ...(payload || {}) }, true);
  return { response, experiment: experimentFromEntity(response.data.experiment) };
}

export async function getExperimentsByProjectId(projectId: number): Promise<{ response: Response<{ experiments: any[] }>, experiments: Experiment[] }> {
  const response = await apiPost<{ experiments: any[] }>(`/api/getExperimentsByProjectId`, { project_id: projectId }, true);
  return { response, experiments: (response.data.experiments || []).map(experimentFromEntity) };
}

export async function getExperiment(experimentId: number): Promise<{ response: Response<{ experiment: any }>, experiment: Experiment }> {
  const response = await apiPost<{ experiment: any }>(`/api/getExperiment/${experimentId}`, {}, true);
  return { response, experiment: experimentFromEntity(response.data.experiment) };
}

export async function updateExperimentDescription(
  experimentId: number, { description }: { description?: string }
): Promise<{
  response: Response<{ experiment: any }>, experiment: Experiment
}> {
  const response = await apiPost<{ experiment: any }>(
    `/api/updateExperiment/${experimentId}`, 
    { description},
    'Login is required to update experiment. '
  );
  return { response, experiment: experimentFromEntity(response.data.experiment) };
}

export async function updateExperimentData(
  experimentId: number, { experimentData }: { experimentData?: ExperimentData }
): Promise<{
  response: Response<{ experiment: any }>, experiment: Experiment
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
export async function uploadExperimentFile(experimentId: number, file: File): Promise<{ response: Response<{ file: ExperimentFileEntity }>, file: ExperimentFile }> {
  const form = new FormData();
  form.append('files', file);
  const response = await apiPost<{ file: ExperimentFileEntity }>(`/api/uploadFile/${experimentId}`, form as any, true, false);
  return { response, file: experimentFileFromEntity(response.data.file) };
}

export async function getExperimentFiles(experimentId: number): Promise<{ response: Response<{ experiment_id: number; files: ExperimentFileEntity[]; count: number }>, experimentId: number, files: ExperimentFile[], count: number }> {
  const response = await apiPost<{ experiment_id: number; files: ExperimentFileEntity[]; count: number }>(`/api/getFiles/${experimentId}`, {}, true);
  return {
    response,
    experimentId: response.data.experiment_id,
    files: (response.data.files || []).map(experimentFileFromEntity),
    count: response.data.count,
  };
}

export async function shareExperimentFile(experimentId: number, fileId: string): Promise<{ response: Response<{ shared_url: string; expires_at: string; file_info: ExperimentFileEntity }>, sharedUrl: string, expiresAt: string, fileInfo: ExperimentFile }> {
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

export async function createTeam({ name, description }: { name: string; description?: string }): Promise<{ response: Response<{ team: TeamEntity }>, team: Team }> {
  const response = await apiPost<{ team: TeamEntity }>('/api/teams/create', { name, description }, true);
  return { response, team: teamFromEntity(response.data.team) };
}

export async function getTeams(): Promise<{ response: Response<{ teams: TeamEntity[] }>, teams: Team[] }> {
  const response = await apiPost<{ teams: TeamEntity[] }>('/api/teams/getTeams', {}, true);
  return { response, teams: (response.data.teams || []).map(teamFromEntity) };
}

export async function getTeam(teamId: number): Promise<{ response: Response<{ team: TeamEntity }>, team: Team }> {
  const response = await apiPost<{ team: TeamEntity }>(`/api/teams/getTeam/${teamId}`, {}, true);
  return { response, team: teamFromEntity(response.data.team) };
}

export async function updateTeam(teamId: number, { name, description }: { name: string; description?: string }): Promise<{ response: Response<{ team: TeamEntity }>, team: Team }> {
  const response = await apiPost<{ team: TeamEntity }>(`/api/teams/updateTeam/${teamId}`, { name, description }, true);
  return { response, team: teamFromEntity(response.data.team) };
}

export async function addTeamMember(teamId: number, userId: number): Promise<{ response: Response<{ team: TeamEntity }>, team: Team }> {
  const response = await apiPost<{ team: TeamEntity }>(`/api/teams/addMember/${teamId}`, { user_id: userId }, true);
  return { response, team: teamFromEntity(response.data.team) };
}

export async function removeTeamMember(teamId: number, userId: number): Promise<{ response: Response<{ team: TeamEntity }>, team: Team }> {
  const response = await apiPost<{ team: TeamEntity }>(`/api/teams/removeMember/${teamId}`, { user_id: userId }, true);
  return { response, team: teamFromEntity(response.data.team) };
}

export async function getTeamMembers(teamId: number): Promise<{ response: Response<{ members: TeamMemberEntity[] }>, members: TeamMember[] }> {
  const response = await apiPost<{ members: TeamMemberEntity[] }>(`/api/teams/getTeamMembers/${teamId}`, {}, true);
  return { response, members: (response.data.members || []).map(teamMemberFromEntity) };
}

export async function checkTeamAccess(teamId: number): Promise<{ response: Response<{ team_id: number; has_access: boolean; is_owner: boolean; user_role: string }>, teamId: number, hasAccess: boolean, isOwner: boolean, userRole: string }> {
  const response = await apiPost<{ team_id: number; has_access: boolean; is_owner: boolean; user_role: string }>(`/api/teams/checkTeamAccess/${teamId}`, {}, true);
  return {
    response,
    teamId: response.data.team_id,
    hasAccess: response.data.has_access,
    isOwner: response.data.is_owner,
    userRole: response.data.user_role,
  };
}

