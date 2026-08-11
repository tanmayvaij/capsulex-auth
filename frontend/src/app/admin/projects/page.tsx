"use client";

import { useEffect, useState } from "react";
import { Loader2, ShieldCheck, Users, Eye, X, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { apiFetch } from "@/lib/api";

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProjectForUsers, setSelectedProjectForUsers] = useState<any | null>(null);
  const [projectUsers, setProjectUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchProjects = async () => {
    try {
      const projsRes = await apiFetch("/api/admin/auth/projects", { role: "admin" });
      if (projsRes.ok) {
        setProjects(await projsRes.json());
      }
    } catch (error) {
      console.error("Failed to fetch projects", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

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

  const filteredProjects = projects.filter(proj => 
    proj.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    proj.id.toString().includes(searchQuery)
  );

  const totalPages = Math.max(1, Math.ceil(filteredProjects.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProjects = filteredProjects.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="w-full p-4 lg:p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Global Projects</h1>
          <p className="text-muted-foreground mt-1">Overview of all applications across the platform.</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input 
            type="text"
            placeholder="Search by project name or ID..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 bg-muted/20 border border-border/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm transition-all"
          />
        </div>
      </div>

      <div className="bg-card border border-border/60 rounded-2xl overflow-hidden shadow-sm flex flex-col">
        <div className="overflow-auto flex-1">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/20">
              <tr>
                <th scope="col" className="px-6 py-2.5 font-medium">ID</th>
                <th scope="col" className="px-6 py-2.5 font-medium">Project</th>
                <th scope="col" className="px-6 py-2.5 font-medium">Developer</th>
                <th scope="col" className="px-6 py-2.5 font-medium">End Users</th>
                <th scope="col" className="px-6 py-2.5 font-medium">Created</th>
                <th scope="col" className="px-6 py-2.5 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {paginatedProjects.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                    {searchQuery ? "No projects match your search." : "No projects have been created yet."}
                  </td>
                </tr>
              ) : (
                paginatedProjects.map((project) => (
                  <tr key={project.id} className="hover:bg-muted/10 transition-colors">
                    <td className="px-6 py-2.5 font-mono text-xs text-muted-foreground">
                      {project.id}
                    </td>
                    <td className="px-6 py-2.5">
                      <p className="font-semibold text-foreground">{project.name}</p>
                    </td>
                    <td className="px-6 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-[10px] shrink-0">
                          {(project.developer?.email || "U").charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-foreground text-xs truncate max-w-[150px]">{project.developer?.email || "Unknown"}</span>
                      </div>
                    </td>
                    <td className="px-6 py-2.5">
                      <div className="flex items-center gap-2">
                        <Users className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="font-medium text-foreground">{project.user_count || 0}</span>
                      </div>
                    </td>
                    <td className="px-6 py-2.5 text-xs text-muted-foreground">
                      {new Date(project.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-2.5 text-right">
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
        
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-2.5 border-t border-border/40 bg-muted/5">
            <p className="text-sm text-muted-foreground">
              Showing <span className="font-medium text-foreground">{startIndex + 1}</span> to <span className="font-medium text-foreground">{Math.min(startIndex + itemsPerPage, filteredProjects.length)}</span> of <span className="font-medium text-foreground">{filteredProjects.length}</span> projects
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-lg border border-border/50 text-sm font-medium hover:bg-muted/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
              >
                <ChevronLeft className="h-4 w-4" /> Previous
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 rounded-lg border border-border/50 text-sm font-medium hover:bg-muted/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
              >
                Next <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

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
                      <th className="px-6 py-2.5 font-medium">User ID</th>
                      <th className="px-6 py-2.5 font-medium">Email</th>
                      <th className="px-6 py-2.5 font-medium">Registered</th>
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
                          <td className="px-6 py-2.5 font-mono text-xs text-muted-foreground">{user.id}</td>
                          <td className="px-6 py-2.5 font-medium text-foreground">{user.email}</td>
                          <td className="px-6 py-2.5 text-xs text-muted-foreground">{new Date(user.created_at).toLocaleDateString()}</td>
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
