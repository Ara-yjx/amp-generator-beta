export type ProjectEntity = {
  id: number;
  name: string;
  description: string;
  creator_id: number;
  has_access: boolean;
  is_owner: boolean;
  created_at: string;
  last_updated_at: string;
};

export type Project = {
  id: number;
  name: string;
  description: string;
  creatorId: number;
  isOwner: boolean;
  hasAccess: boolean;
  createdAt: string;
  lastUpdatedAt: string;
};

export function projectFromEntity(p: ProjectEntity): Project {
  return {
    id: p.id,
    name: p.name,
    description: p.description,
    creatorId: p.creator_id,
    isOwner: p.is_owner,
    hasAccess: p.has_access,
    createdAt: p.created_at,
    lastUpdatedAt: p.last_updated_at,
  };
}

export type ExperimentEntity = {
  id: number;
  project_id: number;
  name?: string;
  description: string;
  created_at: string;
  last_updated_at: string;
  experiment_data: object;
};

export type Experiment = {
  id: number;
  projectId: number;
  name?: string;
  description: string;
  experimentData: object;
  createdAt: string;
  lastUpdatedAt: string;
};

export function experimentFromEntity(e: ExperimentEntity): Experiment {
  return {
    id: e.id,
    projectId: e.project_id,
    name: e.name,
    description: e.description,
    createdAt: e.created_at,
    lastUpdatedAt: e.last_updated_at,
    experimentData: e.experiment_data,
  };
}
