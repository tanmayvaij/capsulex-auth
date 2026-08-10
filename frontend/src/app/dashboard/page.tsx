"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, LogOut, ShieldCheck, Plus, Copy, CheckCircle2, Trash2, Users, Settings, User, Book } from "lucide-react";
import Link from "next/link";
import { useAppTitle } from "@/hooks/useAppTitle";

export default function AdminDashboardPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [developer, setDeveloper] = useState<any>(null);
  const [newProjectName, setNewProjectName] = useState("");
  const [loading, setLoading] = useState(true);
  const [creatingProject, setCreatingProject] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const { title } = useAppTitle();
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("developer_token");
      if (!token) {
        router.push("/login");
        return;
      }

      try {
        const [projectsRes, devRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/developer/projects`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/developer/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
          })
        ]);

        if (!projectsRes.ok || !devRes.ok) {
           if (projectsRes.status === 401 || projectsRes.status === 403 || devRes.status === 401 || devRes.status === 403) {
             throw new Error("Unauthorized");
           }
           return;
        }
        
        const projectsData = await projectsRes.json();
        const devData = await devRes.json();
        setProjects(projectsData);
        setDeveloper(devData);
      } catch (error: any) {
        console.error("Failed to fetch dashboard data:", error);
        if (error.message === "Unauthorized") {
          localStorage.removeItem("developer_token");
          router.push("/login");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("developer_token");
    router.push("/login");
  };

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

  const handleDeleteProject = async (projectId: number) => {
    if (!confirm("Are you sure you want to delete this project? All associated users will also be deleted. This action cannot be undone.")) return;
    
    const token = localStorage.getItem("developer_token");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/developer/projects/${projectId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      
      if (res.ok) {
        setProjects(projects.filter(p => p.id !== projectId));
      }
    } catch (error) {
      console.error("Failed to delete project", error);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(text);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-red-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-background flex flex-col">
      <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center px-8 justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-primary bg-primary/10">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">{title}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {developer && (
              <span className="text-sm text-muted-foreground mr-4 hidden md:inline-block">
                {developer.email}
              </span>
            )}
            <Link
              href="/dashboard/docs"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2 text-muted-foreground hover:text-foreground"
            >
              <Book className="mr-2 h-4 w-4" />
              Docs
            </Link>
            <Link
              href="/dashboard/profile"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2 text-muted-foreground hover:text-foreground"
            >
              <User className="mr-2 h-4 w-4" />
              Profile
            </Link>
            <button
              onClick={handleLogout}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-destructive/10 hover:text-destructive h-9 px-4 py-2 text-muted-foreground"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      <main className="flex-1 p-8 w-full">
        <div className="bg-card/50 backdrop-blur-xl border border-border rounded-xl p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h2 className="text-xl font-semibold mb-2">Manage Projects</h2>
            <p className="text-sm text-muted-foreground">Create new tenant projects and generate API keys for integration.</p>
          </div>
          
          <form onSubmit={handleCreateProject} className="flex gap-2 w-full sm:w-auto max-w-md shrink-0">
            <input
              type="text"
              placeholder="New Project Name"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              className="flex h-10 w-full sm:w-64 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
            />
            <button
              type="submit"
              disabled={creatingProject || !newProjectName.trim()}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 shrink-0"
            >
              {creatingProject ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Plus className="mr-2 h-4 w-4" /> Create Project</>}
            </button>
          </form>
        </div>

        <div className="space-y-4">
          {projects.length === 0 ? (
            <div className="text-center p-8 border-2 border-dashed border-border rounded-lg text-muted-foreground text-sm">
              No projects created yet.
            </div>
          ) : (
            projects.map((project) => (
              <div key={project.id} className="p-4 border border-border rounded-lg bg-background/50 flex flex-col gap-4 hover:border-primary/50 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-medium text-foreground">{project.name}</h3>
                    <p className="text-xs text-muted-foreground">Created: {new Date(project.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-2 bg-muted/50 p-2 rounded-md border border-border/50 max-w-full overflow-hidden">
                    <code className="text-xs text-muted-foreground truncate w-48 sm:w-64">{project.api_key}</code>
                    <div className="flex items-center gap-1 border-l border-border/50 pl-2 ml-1">
                      <button 
                        onClick={() => copyToClipboard(project.api_key)}
                        className="shrink-0 text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-md hover:bg-muted"
                        title="Copy API Key"
                      >
                        {copiedKey === project.api_key ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={() => router.push(`/dashboard/projects/${project.id}`)}
                        className="shrink-0 text-muted-foreground hover:text-primary hover:bg-primary/10 p-1.5 rounded-md transition-colors cursor-pointer"
                        title="View Users"
                      >
                        <Users className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteProject(project.id)}
                        className="shrink-0 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 p-1.5 rounded-md transition-colors cursor-pointer"
                        title="Delete Project"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      </main>
    </div>
  );
}
