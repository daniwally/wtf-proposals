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

async function createPlaceholderPage(subdomain: string) {
  const placeholderPath = `public/projects/${subdomain}/index.html`;
  // Read the 404.html template
  const templateRes = await fetch(
    `https://api.github.com/repos/${REPO}/contents/public/projects/404.html`,
    {
      headers: {
        Authorization: `Bearer ${getToken()}`,
        Accept: "application/vnd.github.v3+json",
      },
    }
  );
  let content: string;
  if (templateRes.ok) {
    const data = await templateRes.json();
    content = data.content; // already base64
  } else {
    content = Buffer.from("<html><body>Preparando proyecto...</body></html>").toString("base64");
  }

  await fetch(
    `https://api.github.com/repos/${REPO}/contents/${placeholderPath}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${getToken()}`,
        Accept: "application/vnd.github.v3+json",
      },
      body: JSON.stringify({
        message: `Placeholder for ${subdomain}`,
        content,
      }),
    }
  );
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
  await createPlaceholderPage(newProject.subdomain);
  return newProject;
}

export async function updateProject(
  id: string,
  updates: Partial<Pick<Project, "name" | "subdomain" | "status" | "description">>
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

async function deleteProjectFiles(subdomain: string) {
  const dirPath = `public/projects/${subdomain}`;
  try {
    // List all files in the project directory
    const res = await fetch(
      `https://api.github.com/repos/${REPO}/contents/${dirPath}`,
      {
        headers: {
          Authorization: `Bearer ${getToken()}`,
          Accept: "application/vnd.github.v3+json",
        },
      }
    );
    if (!res.ok) return;
    const files = await res.json();
    if (!Array.isArray(files)) return;

    // Delete each file
    for (const file of files) {
      await fetch(
        `https://api.github.com/repos/${REPO}/contents/${file.path}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${getToken()}`,
            Accept: "application/vnd.github.v3+json",
          },
          body: JSON.stringify({
            message: `Delete ${file.path}`,
            sha: file.sha,
          }),
        }
      );
    }
  } catch (e) {
    console.error("Error deleting project files:", e);
  }
}

export async function deleteProject(id: string): Promise<boolean> {
  const { content: projects, sha } = await getFileFromGitHub();
  const project = projects.find((p) => p.id === id);
  if (!project) return false;
  const filtered = projects.filter((p) => p.id !== id);
  await saveFileToGitHub(filtered, sha, `Delete project: ${project.name}`);
  await deleteProjectFiles(project.subdomain);
  return true;
}
