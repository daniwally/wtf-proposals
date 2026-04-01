"use client";

import { useState } from "react";

interface ImportModalProps {
  open: boolean;
  onClose: () => void;
  onImported: () => void;
}

export default function ImportModal({ open, onClose, onImported }: ImportModalProps) {
  const [repoUrl, setRepoUrl] = useState("");
  const [subdomain, setSubdomain] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    // Extract owner/repo from URL or use directly
    let repoFullName = repoUrl;
    const githubMatch = repoUrl.match(/github\.com\/([^/]+\/[^/]+)/);
    if (githubMatch) {
      repoFullName = githubMatch[1].replace(/\.git$/, "");
    }

    // First, create the project record
    const createRes = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        subdomain: subdomain.toLowerCase(),
        repoUrl: repoFullName,
      }),
    });

    if (!createRes.ok) {
      const data = await createRes.json();
      setError(data.error || "Error creating project");
      setLoading(false);
      return;
    }

    // Then trigger the import
    const importRes = await fetch("/api/projects/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        repoFullName,
        subdomain: subdomain.toLowerCase(),
      }),
    });

    if (!importRes.ok) {
      const data = await importRes.json();
      setError(data.error || "Error triggering import");
      setLoading(false);
      return;
    }

    setSuccess(`Importando ${name} → ${subdomain}.wtf-agency.works`);
    setLoading(false);
    setTimeout(() => {
      onImported();
      onClose();
      setRepoUrl("");
      setSubdomain("");
      setName("");
      setSuccess("");
    }, 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-surface border border-border rounded-xl w-full max-w-lg p-8">
        <h2 className="text-xl font-semibold mb-6">Importar Proyecto</h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm text-muted mb-2">Nombre del proyecto</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Telit Pitch Deck"
              className="w-full bg-background border border-border rounded-lg px-4 py-3 text-foreground placeholder:text-muted/50 focus:outline-none focus:border-accent"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-muted mb-2">Repo de GitHub</label>
            <input
              type="text"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              placeholder="daniwally/telit o URL completa"
              className="w-full bg-background border border-border rounded-lg px-4 py-3 text-foreground placeholder:text-muted/50 focus:outline-none focus:border-accent"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-muted mb-2">Subdominio</label>
            <div className="flex items-center gap-0">
              <input
                type="text"
                value={subdomain}
                onChange={(e) =>
                  setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))
                }
                placeholder="telit"
                className="flex-1 bg-background border border-border rounded-l-lg px-4 py-3 text-foreground placeholder:text-muted/50 focus:outline-none focus:border-accent"
                required
              />
              <span className="bg-border px-4 py-3 rounded-r-lg text-muted text-sm border border-border border-l-0">
                .wtf-agency.works
              </span>
            </div>
          </div>

          {error && (
            <p className="text-danger text-sm">{error}</p>
          )}
          {success && (
            <p className="text-success text-sm">{success}</p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-border rounded-lg text-muted hover:text-foreground transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-accent hover:bg-accent-hover text-white rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {loading ? "Importando..." : "Importar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
