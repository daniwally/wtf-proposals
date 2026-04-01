import { NextRequest, NextResponse } from "next/server";

const REPO = "daniwally/wtf-proposals";
const FILE_PATH = "src/data/projects.json";

async function getProjectStatus(subdomain: string): Promise<"active" | "inactive" | "not_found"> {
  try {
    const token = process.env.GITHUB_TOKEN;
    if (!token) return "active"; // fallback: serve content
    const res = await fetch(
      `https://api.github.com/repos/${REPO}/contents/${FILE_PATH}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github.v3+json",
        },
        next: { revalidate: 30 },
      }
    );
    if (!res.ok) return "active";
    const data = await res.json();
    const decoded = Buffer.from(data.content, "base64").toString("utf-8");
    const projects = JSON.parse(decoded);
    const project = projects.find((p: { subdomain: string }) => p.subdomain === subdomain);
    if (!project) return "not_found";
    return project.status;
  } catch {
    return "active"; // fallback: serve content on error
  }
}

export async function middleware(request: NextRequest) {
  const host = request.headers.get("host") || "";
  const url = request.nextUrl.clone();

  // Allow admin subdomain and vercel.app domain to access the panel
  if (
    host.startsWith("admin.") ||
    host.endsWith(".vercel.app") ||
    host === "localhost:3000"
  ) {
    return NextResponse.next();
  }

  // Allow API routes from any host
  if (url.pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // For any other subdomain, rewrite to static project files
  const subdomainMatch = host.match(/^([^.]+)\.wtf-agency\.works$/);
  if (subdomainMatch) {
    const subdomain = subdomainMatch[1];

    // Only check status for main page requests
    if (url.pathname === "/" || url.pathname === "/index.html") {
      const status = await getProjectStatus(subdomain);
      if (status === "inactive") {
        url.pathname = "/projects/disabled.html";
        return NextResponse.rewrite(url);
      }
    }

    const path = url.pathname === "/" ? "/index.html" : url.pathname;
    url.pathname = `/projects/${subdomain}${path}`;
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
