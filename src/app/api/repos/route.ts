export async function GET() {
  const githubToken = process.env.GITHUB_TOKEN;
  if (!githubToken) {
    return Response.json({ error: "GITHUB_TOKEN not configured" }, { status: 500 });
  }

  const res = await fetch(
    "https://api.github.com/user/repos?per_page=100&sort=updated&type=owner",
    {
      headers: {
        Authorization: `Bearer ${githubToken}`,
        Accept: "application/vnd.github.v3+json",
      },
      cache: "no-store",
    }
  );

  if (!res.ok) {
    return Response.json({ error: "Failed to fetch repos" }, { status: 500 });
  }

  const repos = await res.json();
  const list = repos.map((r: { full_name: string; name: string; updated_at: string }) => ({
    fullName: r.full_name,
    name: r.name,
    updatedAt: r.updated_at,
  }));

  return Response.json(list);
}
