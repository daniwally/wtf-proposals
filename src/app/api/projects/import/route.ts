export async function POST(request: Request) {
  const body = await request.json();
  const { repoFullName, subdomain } = body;

  if (!repoFullName || !subdomain) {
    return Response.json(
      { error: "repoFullName and subdomain are required" },
      { status: 400 }
    );
  }

  const githubToken = process.env.GITHUB_TOKEN;
  if (!githubToken) {
    return Response.json(
      { error: "GITHUB_TOKEN not configured" },
      { status: 500 }
    );
  }

  // Trigger GitHub Actions workflow
  const [owner] = repoFullName.split("/");
  const response = await fetch(
    `https://api.github.com/repos/${owner}/wtf-proposals/actions/workflows/import-project.yml/dispatches`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${githubToken}`,
        Accept: "application/vnd.github.v3+json",
      },
      body: JSON.stringify({
        ref: "main",
        inputs: {
          source_repo: repoFullName,
          subdomain: subdomain,
          project_name: subdomain,
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    return Response.json(
      { error: `Failed to trigger import: ${error}` },
      { status: 500 }
    );
  }

  return Response.json({
    success: true,
    message: `Import started for ${repoFullName} → ${subdomain}.wtf-agency.works`,
  });
}
