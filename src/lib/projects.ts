import { promises as fs } from "fs";
import path from "path";
import type { Project } from "@/types/project";

const DATA_PATH = path.join(process.cwd(), "src/data/projects.json");

export async function getProjects(): Promise<Project[]> {
  const data = await fs.readFile(DATA_PATH, "utf-8");
  return JSON.parse(data);
}

export async function saveProjects(projects: Project[]): Promise<void> {
  await fs.writeFile(DATA_PATH, JSON.stringify(projects, null, 2));
}

export async function addProject(
  project: Omit<Project, "id" | "createdAt" | "updatedAt">
): Promise<Project> {
  const projects = await getProjects();
  const newProject: Project = {
    ...project,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  projects.push(newProject);
  await saveProjects(projects);
  return newProject;
}

export async function updateProject(
  id: string,
  updates: Partial<Pick<Project, "name" | "subdomain" | "status">>
): Promise<Project | null> {
  const projects = await getProjects();
  const index = projects.findIndex((p) => p.id === id);
  if (index === -1) return null;
  projects[index] = {
    ...projects[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  await saveProjects(projects);
  return projects[index];
}

export async function deleteProject(id: string): Promise<boolean> {
  const projects = await getProjects();
  const filtered = projects.filter((p) => p.id !== id);
  if (filtered.length === projects.length) return false;
  await saveProjects(filtered);
  return true;
}
