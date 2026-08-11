"use client";

import { useEffect, useState } from "react";
import { Loader2, Users, FolderOpen, User, Trash2, ArrowUpRight, ArrowDownRight, ShieldCheck, Eye, X, ArrowRight } from "lucide-react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({ developers: 0, projects: 0, users: 0 });
  const [developers, setDevelopers] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [devToDelete, setDevToDelete] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedProjectForUsers, setSelectedProjectForUsers] = useState<any | null>(null);
  const [projectUsers, setProjectUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const [statsRes, devsRes, projsRes] = await Promise.all([
          apiFetch("/api/admin/auth/stats", { role: "admin" }),
          apiFetch("/api/admin/auth/developers", { role: "admin" }),
          apiFetch("/api/admin/auth/projects", { role: "admin" })
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
  }, []);

  const handleToggleDevStatus = async (devId: number, currentStatus: boolean) => {
    try {
      const res = await apiFetch(`/api/admin/auth/developers/${devId}/status`, {
        method: "PATCH",
        role: "admin",
        headers: {
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

  const handleDeleteDeveloper = async (devId: number) => {
    setIsDeleting(true);
    try {
      const res = await apiFetch(`/api/admin/auth/developers/${devId}`, {
        method: "DELETE",
        role: "admin"
      });
      
      if (res.ok) {
        setDevelopers(developers.filter(d => d.id !== devId));
        setProjects(projects.filter(p => p.developer_id !== devId));
        setStats(prev => ({
          ...prev,
          developers: Math.max(0, prev.developers - 1)
        }));
      } else {
        const errorData = await res.json();
        alert(`Failed to delete developer: ${errorData.detail}`);
      }
    } catch (error) {
      console.error("Failed to delete developer", error);
      alert("Failed to delete developer.");
    } finally {
      setIsDeleting(false);
      setDevToDelete(null);
    }
  };

  const handleViewUsers = async (project: any) => {
    setSelectedProjectForUsers(project);
    setLoadingUsers(true);
    try {
      const res = await apiFetch(`/api/admin/auth/projects/${project.id}/users`, { role: "admin" });
      if (res.ok) {
        setProjectUsers(await res.json());
      }
    } catch (error) {
      console.error("Failed to fetch project users", error);
    } finally {
      setLoadingUsers(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="w-full p-6 lg:p-8 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Overview</h1>
          <p className="text-muted-foreground mt-1">Track and manage your platform's core metrics and users.</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1 */}
        <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-sm flex flex-col">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-primary/10 rounded-xl">
              <Users className="w-5 h-5 text-primary" />
            </div>
          </div>
          <h3 className="text-3xl font-bold text-foreground">{stats.developers}</h3>
          <p className="text-sm font-medium text-muted-foreground mt-1">Total Developers</p>
        </div>

        {/* Card 2 */}
        <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-sm flex flex-col">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-primary/10 rounded-xl">
              <FolderOpen className="w-5 h-5 text-primary" />
            </div>
          </div>
          <h3 className="text-3xl font-bold text-foreground">{stats.projects}</h3>
          <p className="text-sm font-medium text-muted-foreground mt-1">Active Projects</p>
        </div>

        {/* Card 3 */}
        <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-sm flex flex-col">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-primary/10 rounded-xl">
              <User className="w-5 h-5 text-primary" />
            </div>
          </div>
          <h3 className="text-3xl font-bold text-foreground">{stats.users}</h3>
          <p className="text-sm font-medium text-muted-foreground mt-1">Total End Users</p>
        </div>
      </div>

      {/* Tables Section */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        
        {/* Developers Table */}
        <div className="bg-card border border-border/60 rounded-2xl overflow-hidden shadow-sm flex flex-col">
          <div className="px-6 py-5 border-b border-border/50 flex justify-between items-center bg-muted/10">
            <div>
              <h3 className="font-semibold text-foreground">Registered Developers</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Manage developer accounts</p>
            </div>
          </div>
          <div className="overflow-auto flex-1 max-h-[600px]">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/20">
                <tr>
                  <th className="px-6 py-4 font-medium">Developer</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Created At</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {developers.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-muted-foreground">
                      No developers found.
                    </td>
                  </tr>
                ) : (
                  developers.slice(0, 5).map(dev => (
                    <tr key={dev.id} className="hover:bg-muted/10 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                            {dev.email.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-foreground text-sm truncate max-w-[150px] sm:max-w-[200px]">{dev.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button 
                          onClick={() => handleToggleDevStatus(dev.id, dev.is_active)}
                          className={`inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md transition-opacity hover:opacity-80 ${
                            dev.is_active ? 'bg-emerald-500/10 text-emerald-500' : 'bg-destructive/10 text-destructive'
                          }`}
                        >
                          {dev.is_active ? 'Active' : 'Suspended'}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-xs text-muted-foreground">
                        {new Date(dev.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => setDevToDelete(dev.id)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                          title="Delete Developer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="p-4 border-t border-border/50 bg-muted/5 flex justify-center">
            <Link href="/admin/developers" className="text-sm font-semibold text-primary hover:text-primary/80 flex items-center gap-1 transition-colors">
              View All Developers <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Global Projects Table */}
        <div className="bg-card border border-border/60 rounded-2xl overflow-hidden shadow-sm flex flex-col">
          <div className="px-6 py-5 border-b border-border/50 flex justify-between items-center bg-muted/10">
            <div>
              <h3 className="font-semibold text-foreground">Global Projects</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Overview of platform applications</p>
            </div>
          </div>
          <div className="overflow-auto flex-1 max-h-[600px]">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/20">
                <tr>
                  <th scope="col" className="px-6 py-2.5 font-medium">Project</th>
                  <th scope="col" className="px-6 py-2.5 font-medium">Developer</th>
                  <th scope="col" className="px-6 py-4 font-medium">End Users</th>
                  <th scope="col" className="px-6 py-4 font-medium">Created</th>
                  <th scope="col" className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {projects.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">
                      No projects have been created yet.
                    </td>
                  </tr>
                ) : (
                  projects.slice(0, 5).map((project) => (
                    <tr key={project.id} className="hover:bg-muted/10 transition-colors">
                      <td className="px-6 py-2.5">
                        <p className="font-semibold text-foreground">{project.name}</p>
                      </td>
                      <td className="px-6 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-[10px] shrink-0">
                            {(project.developer?.email || "U").charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-foreground text-xs truncate max-w-[120px]">{project.developer?.email || "Unknown"}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Users className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="font-medium text-foreground">{project.user_count || 0}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs text-muted-foreground">
                        {new Date(project.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleViewUsers(project)}
                          className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full transition-all bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground"
                          title="View End Users"
                        >
                          <Eye className="h-3 w-3 mr-1.5" /> Users
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="p-4 border-t border-border/50 bg-muted/5 flex justify-center">
            <Link href="/admin/projects" className="text-sm font-semibold text-primary hover:text-primary/80 flex items-center gap-1 transition-colors">
              View All Projects <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

      </div>

      {/* Delete Developer Modal */}
      {devToDelete !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border/50 rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mb-4 mx-auto">
              <Trash2 className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold text-foreground text-center mb-2">Delete Developer?</h3>
            <p className="text-sm text-muted-foreground text-center mb-6">
              This will permanently delete this developer account and all associated projects. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDevToDelete(null)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-border hover:bg-muted/50 transition-colors"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteDeveloper(devToDelete)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors flex items-center justify-center gap-2"
                disabled={isDeleting}
              >
                {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Project Users Modal */}
      {selectedProjectForUsers !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border/50 rounded-2xl max-w-2xl w-full shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[80vh]">
            <div className="flex items-center justify-between p-6 border-b border-border/50 bg-muted/10">
              <div>
                <h3 className="text-xl font-bold text-foreground">Users: {selectedProjectForUsers.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">Showing all end users registered in this project.</p>
              </div>
              <button 
                onClick={() => setSelectedProjectForUsers(null)}
                className="p-2 bg-muted hover:bg-muted/80 rounded-full transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <div className="p-0 overflow-auto flex-1">
              {loadingUsers ? (
                <div className="flex h-40 items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground uppercase bg-muted/20 sticky top-0">
                    <tr>
                      <th className="px-6 py-4 font-medium">User ID</th>
                      <th className="px-6 py-4 font-medium">Email</th>
                      <th className="px-6 py-4 font-medium">Registered</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {projectUsers.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-6 py-8 text-center text-muted-foreground">
                          No users registered in this project yet.
                        </td>
                      </tr>
                    ) : (
                      projectUsers.map(user => (
                        <tr key={user.id} className="hover:bg-muted/10 transition-colors">
                          <td className="px-6 py-4 font-mono text-xs text-muted-foreground">{user.id}</td>
                          <td className="px-6 py-4 font-medium text-foreground">{user.email}</td>
                          <td className="px-6 py-4 text-xs text-muted-foreground">{new Date(user.created_at).toLocaleDateString()}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
