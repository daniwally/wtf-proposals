"use client";

import { useState } from "react";
import type { Project } from "@/types/project";

interface ProjectCardProps {
  project: Project;
  onUpdate: () => void;
}

export default function ProjectCard({ project, onUpdate }: ProjectCardProps) {
  const [editing, setEditing] = useState(false);
  const [subdomain, setSubdomain] = useState(project.subdomain);
  const [editingDesc, setEditingDesc] = useState(false);
  const [description, setDescription] = useState(project.description || "");
  const [loading, setLoading] = useState(false);

  const handleToggleStatus = async () => {
    setLoading(true);
    await fetch("/api/projects", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: project.id,
        status: project.status === "active" ? "inactive" : "active",
      }),
    });
    setLoading(false);
    onUpdate();
  };

  const handleUpdateSubdomain = async () => {
    setLoading(true);
    await fetch("/api/projects", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: project.id,
        subdomain: subdomain.toLowerCase().replace(/[^a-z0-9-]/g, ""),
      }),
    });
    setLoading(false);
    setEditing(false);
    onUpdate();
  };

  const handleUpdateDescription = async () => {
    setLoading(true);
    await fetch("/api/projects", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: project.id,
        description,
      }),
    });
    setLoading(false);
    setEditingDesc(false);
    onUpdate();
  };

  const handleReimport = async () => {
    setLoading(true);
    await fetch("/api/projects/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        repoFullName: project.repoUrl,
        subdomain: project.subdomain,
      }),
    });
    setLoading(false);
    alert(`Re-importando ${project.name}. En unos minutos se actualiza.`);
  };

  const handleDelete = async () => {
    if (!confirm(`Eliminar "${project.name}"?`)) return;
    setLoading(true);
    await fetch(`/api/projects?id=${project.id}`, { method: "DELETE" });
    setLoading(false);
    onUpdate();
  };

  const projectUrl = `https://${project.subdomain}.wtf-agency.works`;

  return (
    <div className="w-[30%] bg-black/70 backdrop-blur-md border border-white/10 rounded-xl p-5 hover:border-white/20 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-lg font-semibold text-white">{project.name}</h3>
          <p className="text-sm text-white/50 font-mono mt-1">{project.repoUrl}</p>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
            project.status === "active"
              ? "bg-success/10 text-success"
              : "bg-white/10 text-white/50"
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              project.status === "active" ? "bg-success" : "bg-white/50"
            }`}
          />
          {project.status === "active" ? "Activo" : "Inactivo"}
        </span>
      </div>

      {/* Description */}
      <div className="mb-3">
        {editingDesc ? (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descripción del proyecto..."
              className="flex-1 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-accent"
            />
            <button
              onClick={handleUpdateDescription}
              disabled={loading}
              className="px-3 py-2 bg-accent text-white rounded-lg text-sm hover:bg-accent-hover transition-colors"
            >
              OK
            </button>
            <button
              onClick={() => {
                setEditingDesc(false);
                setDescription(project.description || "");
              }}
              className="px-3 py-2 text-white/50 hover:text-white text-sm"
            >
              X
            </button>
          </div>
        ) : (
          <p
            className="text-sm text-white/60 cursor-pointer hover:text-white/80 transition-colors"
            onClick={() => setEditingDesc(true)}
          >
            {project.description || "Click para agregar descripción..."}
          </p>
        )}
      </div>

      <div className="mb-4">
        {editing ? (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={subdomain}
              onChange={(e) =>
                setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))
              }
              className="flex-1 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent"
            />
            <span className="text-white/50 text-sm">.wtf-agency.works</span>
            <button
              onClick={handleUpdateSubdomain}
              disabled={loading}
              className="px-3 py-2 bg-accent text-white rounded-lg text-sm hover:bg-accent-hover transition-colors"
            >
              OK
            </button>
            <button
              onClick={() => {
                setEditing(false);
                setSubdomain(project.subdomain);
              }}
              className="px-3 py-2 text-white/50 hover:text-white text-sm"
            >
              X
            </button>
          </div>
        ) : (
          <a
            href={projectUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-white hover:underline text-sm font-mono"
          >
            {projectUrl}
          </a>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-1.5 text-xs">
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="px-2 py-1 border border-white/20 rounded-lg text-white/60 hover:bg-white hover:text-black transition-colors cursor-pointer"
          >
            Editar
          </button>
        )}
        <a
          href={projectUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="px-2 py-1 border border-white/20 rounded-lg text-white/60 hover:bg-white hover:text-black transition-colors cursor-pointer"
        >
          Ver
        </a>
        <button
          onClick={handleToggleStatus}
          disabled={loading}
          className="px-2 py-1 border border-white/20 rounded-lg text-white/60 hover:bg-white hover:text-black transition-colors cursor-pointer"
        >
          {project.status === "active" ? "Desactivar" : "Activar"}
        </button>
        <button
          onClick={handleReimport}
          disabled={loading}
          className="px-2 py-1 border border-accent/50 rounded-lg text-accent hover:bg-accent hover:text-white transition-colors cursor-pointer"
        >
          Actualizar
        </button>
        <button
          onClick={handleDelete}
          disabled={loading}
          className="px-2 py-1 border border-danger rounded-lg text-danger hover:bg-danger hover:text-white transition-colors cursor-pointer"
        >
          Eliminar
        </button>
      </div>
    </div>
  );
}
