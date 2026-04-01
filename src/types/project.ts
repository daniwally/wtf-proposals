export interface Project {
  id: string;
  name: string;
  description: string;
  subdomain: string;
  repoUrl: string;
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
}
