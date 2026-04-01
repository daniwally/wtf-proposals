import { getProjects, addProject, updateProject, deleteProject } from "@/lib/projects";

export async function GET() {
  const projects = await getProjects();
  return Response.json(projects);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { name, subdomain, repoUrl, description } = body;

  if (!name || !subdomain || !repoUrl) {
    return Response.json(
      { error: "name, subdomain, and repoUrl are required" },
      { status: 400 }
    );
  }

  const project = await addProject({
    name,
    description: description || "",
    subdomain: subdomain.toLowerCase().replace(/[^a-z0-9-]/g, ""),
    repoUrl,
    status: "active",
  });

  return Response.json(project, { status: 201 });
}

export async function PUT(request: Request) {
  const body = await request.json();
  const { id, ...updates } = body;

  if (!id) {
    return Response.json({ error: "id is required" }, { status: 400 });
  }

  const project = await updateProject(id, updates);
  if (!project) {
    return Response.json({ error: "Project not found" }, { status: 404 });
  }

  return Response.json(project);
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return Response.json({ error: "id is required" }, { status: 400 });
  }

  const deleted = await deleteProject(id);
  if (!deleted) {
    return Response.json({ error: "Project not found" }, { status: 404 });
  }

  return Response.json({ success: true });
}
