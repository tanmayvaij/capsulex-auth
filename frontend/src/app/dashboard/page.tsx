"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Copy, CheckCircle2, Trash2, Users, LayoutDashboard, ChevronRight, BarChart3, Fingerprint } from "lucide-react";
import Link from "next/link";

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
      const token = localStorage.getItem("developer_token");
      if (!token) return;

      try {
        const projectsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/developer/projects`, {
          headers: { Authorization: `Bearer ${token}` },
        });

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

    const token = localStorage.getItem("developer_token");
    setCreatingProject(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/developer/projects`, {
        method: "POST",
        headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
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
    const token = localStorage.getItem("developer_token");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/developer/projects/${projectToDelete.id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <div key={project.id} className="bg-card border border-border rounded-[1.5rem] relative overflow-hidden hover:shadow-lg transition-all group flex flex-col p-6">
                  <div className="absolute top-4 right-4 flex gap-2 z-10">
                    <button
                      onClick={() => handleDeleteProject(project)}
                      className="w-8 h-8 rounded-full bg-muted/50 text-muted-foreground hover:text-destructive hover:bg-destructive/10 flex items-center justify-center transition-all"
                      title="Delete Project"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  
                  <div className="flex-1 flex flex-col pt-1">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="px-2 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider">
                        Active
                      </span>
                      <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
                        {new Date(project.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <h3 className="font-bold text-xl text-foreground mb-2 line-clamp-1 group-hover:text-primary transition-colors pr-10">
                      {project.name}
                    </h3>
                    
                    <div className="flex items-center gap-1.5 text-muted-foreground mb-6">
                      <Users className="h-4 w-4" />
                      <span className="text-sm font-medium">{project.user_count || 0} Users</span>
                    </div>
                    
                    <div className="mt-auto pt-4 border-t border-border/50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-muted-foreground">API Key</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 text-xs font-mono bg-background px-3 py-2 rounded-lg text-muted-foreground border border-border/50 truncate">
                          {project.api_key}
                        </code>
                        <button
                          onClick={() => copyToClipboard(project.api_key)}
                          className="shrink-0 p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
                          title="Copy API Key"
                        >
                          {copiedKey === project.api_key ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    
                    <Link
                      href={`/dashboard/projects/${project.id}`}
                      className="mt-4 w-full py-2.5 rounded-xl bg-background border border-border text-center text-sm font-semibold text-foreground hover:bg-primary/5 hover:border-primary/30 transition-all"
                    >
                      Manage Users
                    </Link>
                  </div>
                </div>
              ))}
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
