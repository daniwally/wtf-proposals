"use client";

import { useState, useEffect, useCallback } from "react";
import type { Project } from "@/types/project";
import ProjectCard from "./ProjectCard";
import ImportModal from "./ImportModal";

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [showImport, setShowImport] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadProjects = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/projects");
    const data = await res.json();
    setProjects(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const activeCount = projects.filter((p) => p.status === "active").length;

  return (
    <div className="min-h-screen bg-background bg-cover bg-center bg-fixed bg-no-repeat" style={{ backgroundImage: "url('/assets/bg_1.png')" }}>
      {/* Header */}
      <header className="border-b border-white/10">
        <div className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src="/assets/logo-wtf.png" alt="WTF Agency" className="h-12" />
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">Proposals</h1>
              <p className="text-white/60 text-sm mt-1">
                {projects.length} proyectos &middot; {activeCount} activos
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/generator/"
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2.5 border border-accent text-accent hover:bg-accent hover:text-white rounded-lg font-medium transition-colors"
            >
              Budget Generator
            </a>
            <button
              onClick={() => setShowImport(true)}
              className="px-5 py-2.5 bg-accent hover:bg-accent-hover text-white rounded-lg font-medium transition-colors"
            >
              + Importar Proyecto
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {loading ? (
          <div className="text-center py-20 text-white/60">Cargando...</div>
        ) : projects.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-white/60 text-lg mb-4">
              No hay proyectos todavía
            </p>
            <button
              onClick={() => setShowImport(true)}
              className="px-5 py-2.5 bg-accent hover:bg-accent-hover text-white rounded-lg font-medium transition-colors"
            >
              + Importar tu primer proyecto
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onUpdate={loadProjects}
              />
            ))}
          </div>
        )}
      </main>

      <ImportModal
        open={showImport}
        onClose={() => setShowImport(false)}
        onImported={loadProjects}
      />
    </div>
  );
}
