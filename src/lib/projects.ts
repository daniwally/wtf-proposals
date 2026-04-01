import type { Project } from "@/types/project";

const REPO = "daniwally/wtf-proposals";
const FILE_PATH = "src/data/projects.json";

function getToken() {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error("GITHUB_TOKEN not configured");
  return token;
}

async function getFileFromGitHub(): Promise<{ content: Project[]; sha: string }> {
  const res = await fetch(
    `https://api.github.com/repos/${REPO}/contents/${FILE_PATH}`,
    {
      headers: {
        Authorization: `Bearer ${getToken()}`,
        Accept: "application/vnd.github.v3+json",
      },
      cache: "no-store",
    }
  );

  if (!res.ok) {
    if (res.status === 404) return { content: [], sha: "" };
    throw new Error(`GitHub API error: ${res.status}`);
  }

  const data = await res.json();
  const decoded = Buffer.from(data.content, "base64").toString("utf-8");
  return { content: JSON.parse(decoded), sha: data.sha };
}

async function saveFileToGitHub(projects: Project[], sha: string, message: string) {
  const encoded = Buffer.from(JSON.stringify(projects, null, 2)).toString("base64");
  const res = await fetch(
    `https://api.github.com/repos/${REPO}/contents/${FILE_PATH}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${getToken()}`,
        Accept: "application/vnd.github.v3+json",
      },
      body: JSON.stringify({
        message,
        content: encoded,
        sha,
      }),
    }
  );

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Failed to save: ${error}`);
  }
}

export async function getProjects(): Promise<Project[]> {
  const { content } = await getFileFromGitHub();
  return content;
}

export async function addProject(
  project: Omit<Project, "id" | "createdAt" | "updatedAt">
): Promise<Project> {
  const { content: projects, sha } = await getFileFromGitHub();
  const newProject: Project = {
    ...project,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  projects.push(newProject);
  await saveFileToGitHub(projects, sha, `Add project: ${newProject.name}`);
  return newProject;
}

export async function updateProject(
  id: string,
  updates: Partial<Pick<Project, "name" | "subdomain" | "status">>
): Promise<Project | null> {
  const { content: projects, sha } = await getFileFromGitHub();
  const index = projects.findIndex((p) => p.id === id);
  if (index === -1) return null;
  projects[index] = {
    ...projects[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  await saveFileToGitHub(projects, sha, `Update project: ${projects[index].name}`);
  return projects[index];
}

export async function deleteProject(id: string): Promise<boolean> {
  const { content: projects, sha } = await getFileFromGitHub();
  const project = projects.find((p) => p.id === id);
  if (!project) return false;
  const filtered = projects.filter((p) => p.id !== id);
  await saveFileToGitHub(filtered, sha, `Delete project: ${project.name}`);
  return true;
}
