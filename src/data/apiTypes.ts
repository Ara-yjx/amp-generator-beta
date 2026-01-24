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
  experiment_data: { 
    settings?: string; // JSON string of {value: ...} . Is undefined for new experiment
  };
  has_access?: boolean;
  is_owner?: boolean;
};

export type Experiment = {
  id: number;
  projectId: number;
  name?: string;
  description: string;
  experimentData: { 
    settings?: string; // JSON string of {value: ...} . Is undefined for new experiment
  };
  createdAt: string;
  lastUpdatedAt: string;
  hasAccess?: boolean;
  isOwner?: boolean;
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
    hasAccess: e.has_access,
    isOwner: e.is_owner,
  };
}

export type ExperimentFileEntity = {
  file_id: string;
  filename: string;
  s3_arn: string;
  s3_key: string;
  content_type: string;
  uploaded_at: string;
};

export type ExperimentFile = {
  fileId: string;
  filename: string;
  s3Arn: string;
  s3Key: string;
  contentType: string;
  uploadedAt: string;
};

export function experimentFileFromEntity(ef: ExperimentFileEntity): ExperimentFile {
  return {
    fileId: ef.file_id,
    filename: ef.filename,
    s3Arn: ef.s3_arn,
    s3Key: ef.s3_key,
    contentType: ef.content_type,
    uploadedAt: ef.uploaded_at,
  };
}

// Team types
export type TeamEntity = {
  id: number;
  name: string;
  description?: string;
  owner_id: number;
  created_at: string;
  is_owner?: boolean;
  has_access?: boolean;
};

export type Team = {
  id: number;
  name: string;
  description?: string;
  ownerId: number;
  createdAt: string;
  isOwner?: boolean;
  hasAccess?: boolean;
};

export function teamFromEntity(t: TeamEntity): Team {
  return {
    id: t.id,
    name: t.name,
    description: t.description,
    ownerId: t.owner_id,
    createdAt: t.created_at,
    isOwner: t.is_owner,
    hasAccess: t.has_access,
  };
}

export type TeamMemberEntity = {
  id: number;
  username: string;
  email: string;
  role: string;
  joined_at: string;
};

export type TeamMember = {
  id: number;
  username: string;
  email: string;
  role: string;
  joinedAt: string;
};

export function teamMemberFromEntity(tm: TeamMemberEntity): TeamMember {
  return {
    id: tm.id,
    username: tm.username,
    email: tm.email,
    role: tm.role,
    joinedAt: tm.joined_at,
  };
} 

/** The experiment_data */
export type ExperimentData = {
  settings: string; // JSON string
  lastUpdatedBy?: number; // user id
}

