"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Copy, CheckCircle2, Trash2, Users, LayoutDashboard, ChevronRight, BarChart3, Fingerprint } from "lucide-react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";

export default function DeveloperDashboardPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [newProjectName, setNewProjectName] = useState("");
  const [loading, setLoading] = useState(true);
  const [creatingProject, setCreatingProject] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const projectsRes = await apiFetch("/api/developer/projects");

        if (!projectsRes.ok) return;
        
        const projectsData = await projectsRes.json();
        setProjects(projectsData);
      } catch (error: any) {
        console.error("Failed to fetch projects data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    setCreatingProject(true);
    try {
      const res = await apiFetch("/api/developer/projects", {
        method: "POST",
        headers: { 
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: newProjectName }),
      });
      
      if (res.ok) {
        const newProject = await res.json();
        setProjects([...projects, newProject]);
        setNewProjectName("");
      }
    } catch (error) {
      console.error("Failed to create project", error);
    } finally {
      setCreatingProject(false);
    }
  };

  const handleDeleteProject = (project: any) => {
    setProjectToDelete(project);
  };

  const confirmDeleteProject = async () => {
    if (!projectToDelete) return;
    
    setIsDeleting(true);
    try {
      const res = await apiFetch(`/api/developer/projects/${projectToDelete.id}`, {
        method: "DELETE",
      });
      
      if (res.ok) {
        setProjects(projects.filter(p => p.id !== projectToDelete.id));
        setProjectToDelete(null);
      }
    } catch (error) {
      console.error("Failed to delete project", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(text);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Calculate some dummy stats based on projects for the right panel
  const totalUsers = projects.reduce((acc, p) => acc + (p.user_count || 0), 0);

  return (
    <div className="w-full flex flex-col xl:flex-row gap-6 p-4 sm:p-6 lg:p-8">
      
      {/* Main Content Area */}
      <div className="flex-1 space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 bg-card border border-border/60 rounded-2xl p-6 shadow-sm">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
              Developer Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">Manage your authentication projects and users.</p>
          </div>
          
          <form onSubmit={handleCreateProject} className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            <input
              type="text"
              placeholder="New Project Name"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              className="flex-1 lg:w-64 h-10 rounded-lg border border-border/50 bg-muted/20 px-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 transition-all"
            />
            <button
              type="submit"
              disabled={creatingProject || !newProjectName.trim()}
              className="inline-flex items-center justify-center rounded-lg text-sm font-semibold transition-all disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-6 shrink-0 shadow-sm"
            >
              {creatingProject ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Create <ChevronRight className="ml-1 h-4 w-4" /></>}
            </button>
          </form>
        </div>

        {/* Quick Stats Pills */}
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-3 bg-card border border-border/60 px-6 py-4 rounded-2xl shadow-sm flex-1 min-w-[200px]">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <LayoutDashboard className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-semibold uppercase">Total Projects</p>
              <p className="text-lg font-bold text-foreground">{projects.length}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-card border border-border/60 px-6 py-4 rounded-2xl shadow-sm flex-1 min-w-[200px]">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-semibold uppercase">Total Users</p>
              <p className="text-lg font-bold text-foreground">{totalUsers}</p>
            </div>
          </div>
        </div>

        {/* Projects Grid (Continue Watching style) */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-foreground">Your Projects</h2>
          </div>
          
          {projects.length === 0 ? (
            <div className="text-center p-12 border-2 border-dashed border-border rounded-3xl text-muted-foreground flex flex-col items-center">
              <LayoutDashboard className="h-10 w-10 text-muted-foreground/50 mb-4" />
              <p className="font-semibold text-foreground text-lg">No projects found</p>
              <p className="text-sm mt-1">Create a project using the banner above.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-md border border-border bg-background/30">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
                  <tr>
                    <th className="px-6 py-5 font-semibold">Project Name</th>
                    <th className="px-6 py-5 font-semibold">API Key</th>
                    <th className="px-6 py-5 font-semibold">Users</th>
                    <th className="px-6 py-5 font-semibold">Created</th>
                    <th className="px-6 py-5 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {projects.map((project) => (
                    <tr key={project.id} className="hover:bg-muted/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground text-base">{project.name}</span>
                          <span className="text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary px-2 py-0.5 rounded-full">Active</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <code className="text-xs font-mono bg-black/40 border border-white/5 px-2 py-1 rounded-lg text-muted-foreground max-w-[200px] truncate">
                            {project.api_key}
                          </code>
                          <button
                            onClick={() => copyToClipboard(project.api_key)}
                            className="text-muted-foreground hover:text-primary transition-colors p-1.5 rounded-md hover:bg-primary/10"
                            title="Copy API Key"
                          >
                            {copiedKey === project.api_key ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Users className="h-4 w-4" />
                          <span className="font-medium">{project.user_count || 0}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground font-medium text-xs">
                        {new Date(project.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Link
                            href={`/dashboard/projects/${project.id}`}
                            className="inline-flex items-center justify-center text-xs font-semibold px-3 py-1.5 rounded-md border border-border bg-background/50 hover:bg-muted/50 text-foreground transition-colors"
                          >
                            Manage
                          </Link>
                          <button
                            onClick={() => handleDeleteProject(project)}
                            className="inline-flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 p-1.5 rounded-md transition-colors cursor-pointer"
                            title="Delete Project"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Project Delete Modal */}
      {projectToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="bg-card border border-border shadow-lg rounded-2xl p-6 w-full max-w-md animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-bold text-foreground mb-2">Delete Project</h3>
            <p className="text-muted-foreground text-sm mb-6">
              Are you sure you want to delete <span className="font-semibold text-foreground">{projectToDelete.name}</span>? All associated users will also be deleted. This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setProjectToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-medium rounded-lg text-muted-foreground hover:bg-muted/50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteProject}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-medium rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors flex items-center gap-2"
              >
                {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
