export type Project = {
  id: number;
  name: string;
  description?: string;
  createdAt?: string;
};

export function projectFromEntity(e: ProjectEntity): Project {
  return {
    id: e.id,
    name: e.name,
    description: e.description,
    createdAt: e.created_at,
  };
}

export type ProjectEntity = {
  id: number;
  name: string;
  description: string;
  creator_id: number;
  created_at: string;
};

// More info when we call getProjects API
export type ListProjectEntity = ProjectEntity & {
  has_access: boolean;
  is_owner: boolean;
  last_updated_at: string;
};
