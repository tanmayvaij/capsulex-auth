"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Users, FolderOpen, ShieldCheck, Settings, LogOut, User, ArrowRight } from "lucide-react";
import { useAppTitle } from "@/hooks/useAppTitle";
import Link from "next/link";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({ developers: 0, projects: 0, users: 0 });
  const [developers, setDevelopers] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { title } = useAppTitle();
  const router = useRouter();

  useEffect(() => {
    const fetchAdminData = async () => {
      const token = localStorage.getItem("admin_token");
      if (!token) {
        router.push("/login");
        return;
      }

      try {
        const [statsRes, devsRes, projsRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/admin/auth/stats`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/admin/auth/developers`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/admin/auth/projects`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        if (statsRes.ok && devsRes.ok && projsRes.ok) {
          setStats(await statsRes.json());
          setDevelopers(await devsRes.json());
          setProjects(await projsRes.json());
        }
      } catch (error) {
        console.error("Failed to fetch admin data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, [router]);

  const handleToggleDevStatus = async (devId: number, currentStatus: boolean) => {
    const token = localStorage.getItem("admin_token");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/admin/auth/developers/${devId}/status`, {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ is_active: !currentStatus })
      });
      
      if (res.ok) {
        setDevelopers(developers.map(d => 
          d.id === devId ? { ...d, is_active: !currentStatus } : d
        ));
      }
    } catch (error) {
      console.error("Failed to update status", error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
              <h1 className="text-xl font-bold tracking-tight">{title} <span className="text-sm font-normal text-muted-foreground ml-2">Admin</span></h1>
            </div>
          </div>
          <div className="flex items-center gap-2">

            <Link
              href="/admin/settings"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2"
            >
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Link>
            <button
              onClick={handleLogout}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2 text-destructive hover:text-destructive"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      <main className="flex-1 p-8 w-full max-w-7xl mx-auto space-y-8">
        
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500/10 rounded-lg">
                <Users className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Developers</p>
                <h3 className="text-2xl font-bold">{stats.developers}</h3>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-500/10 rounded-lg">
                <FolderOpen className="h-6 w-6 text-emerald-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Projects</p>
                <h3 className="text-2xl font-bold">{stats.projects}</h3>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-500/10 rounded-lg">
                <Users className="h-6 w-6 text-purple-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">End Users</p>
                <h3 className="text-2xl font-bold">{stats.users}</h3>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="p-6 border-b border-border">
            <h3 className="text-lg font-semibold">Registered Developers</h3>
            <p className="text-sm text-muted-foreground">Manage developers on your platform.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border/50">
                <tr>
                  <th className="px-6 py-4 font-medium">Developer ID</th>
                  <th className="px-6 py-4 font-medium">Email</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Joined</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {developers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground italic bg-background/30">
                      No developers found.
                    </td>
                  </tr>
                ) : (
                  developers.map(dev => (
                    <tr key={dev.id} className="bg-background border-b border-border/30 hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4">
                        <code className="text-xs bg-muted border border-border/50 px-2 py-1 rounded text-muted-foreground">
                          {dev.id}
                        </code>
                      </td>
                      <td className="px-6 py-4 font-medium text-foreground">
                        {dev.email}
                      </td>
                      <td className="px-6 py-4">
                        <button 
                          onClick={() => handleToggleDevStatus(dev.id, dev.is_active)}
                          className={`inline-flex items-center text-xs px-2.5 py-1 rounded-full border cursor-pointer hover:opacity-80 transition-opacity ${dev.is_active ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-destructive/10 text-destructive border-destructive/20'}`}
                        >
                          {dev.is_active ? 'Active' : 'Suspended'}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {new Date(dev.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {/* More actions could go here */}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>


        {/* Global Projects Table */}
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden mt-8">
          <div className="p-6 border-b border-border">
            <h3 className="text-lg font-semibold">Global Projects</h3>
            <p className="text-sm text-muted-foreground">View all projects and their creators across the platform.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border/50">
                <tr>
                  <th scope="col" className="px-6 py-4 font-medium">Project Name</th>
                  <th scope="col" className="px-6 py-4 font-medium">Creator (Developer)</th>
                  <th scope="col" className="px-6 py-4 font-medium text-center">End Users</th>
                  <th scope="col" className="px-6 py-4 font-medium">Created At</th>
                  <th scope="col" className="px-6 py-4 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {projects.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground italic bg-background/30">
                      No projects have been created yet.
                    </td>
                  </tr>
                ) : (
                  projects.map((project) => (
                    <tr key={project.id} className="bg-background border-b border-border/30 hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4 font-medium text-foreground">
                        {project.name}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">{project.developer?.email || "Unknown"}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center justify-center bg-primary/10 text-primary font-semibold text-xs px-2.5 py-0.5 rounded-full">
                          {project.users_count || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {new Date(project.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link 
                          href={`/admin/projects/${project.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-primary bg-primary/10 hover:bg-primary/20 rounded-md transition-colors"
                        >
                          View End Users
                          <ArrowRight className="h-3 w-3" />
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>
  );
}
