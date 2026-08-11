"use client";

import { useEffect, useState } from "react";
import { Loader2, Trash2, Search, ChevronLeft, ChevronRight } from "lucide-react";

export default function AdminDevelopersPage() {
  const [developers, setDevelopers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [devToDelete, setDevToDelete] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchDevelopers = async () => {
    const token = localStorage.getItem("admin_token");
    if (!token) return;
    try {
      const devsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/admin/auth/developers`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (devsRes.ok) {
        setDevelopers(await devsRes.json());
      }
    } catch (error) {
      console.error("Failed to fetch developers", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevelopers();
  }, []);

  const handleToggleDevStatus = async (devId: number, currentStatus: boolean) => {
    const token = localStorage.getItem("admin_token");
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/admin/auth/developers/${devId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ is_active: !currentStatus })
      });
      fetchDevelopers();
    } catch (error) {
      console.error("Failed to toggle status", error);
    }
  };

  const handleDeleteDeveloper = async (devId: number) => {
    setIsDeleting(true);
    const token = localStorage.getItem("admin_token");
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/admin/auth/developers/${devId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchDevelopers();
    } catch (error) {
      console.error("Failed to delete developer", error);
    } finally {
      setIsDeleting(false);
      setDevToDelete(null);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const filteredDevelopers = developers.filter(dev => 
    dev.email.toLowerCase().includes(searchQuery.toLowerCase()) || 
    dev.id.toString().includes(searchQuery)
  );

  const totalPages = Math.max(1, Math.ceil(filteredDevelopers.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedDevelopers = filteredDevelopers.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="w-full p-4 lg:p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Developers</h1>
          <p className="text-muted-foreground mt-1">Manage all developer accounts.</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input 
            type="text"
            placeholder="Search by email or ID..."
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
                <th className="px-6 py-2.5 font-medium">ID</th>
                <th className="px-6 py-2.5 font-medium">Developer</th>
                <th className="px-6 py-2.5 font-medium">Status</th>
                <th className="px-6 py-2.5 font-medium">Created At</th>
                <th className="px-6 py-2.5 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {paginatedDevelopers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                    {searchQuery ? "No developers match your search." : "No developers found."}
                  </td>
                </tr>
              ) : (
                paginatedDevelopers.map(dev => (
                  <tr key={dev.id} className="hover:bg-muted/10 transition-colors">
                    <td className="px-6 py-2.5 font-mono text-xs text-muted-foreground">
                      {dev.id}
                    </td>
                    <td className="px-6 py-2.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                          {dev.email.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-foreground text-sm truncate max-w-[200px] sm:max-w-[300px]">{dev.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-2.5">
                      <button 
                        onClick={() => handleToggleDevStatus(dev.id, dev.is_active)}
                        className={`inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md transition-opacity hover:opacity-80 ${
                          dev.is_active ? 'bg-emerald-500/10 text-emerald-500' : 'bg-destructive/10 text-destructive'
                        }`}
                      >
                        {dev.is_active ? 'Active' : 'Suspended'}
                      </button>
                    </td>
                    <td className="px-6 py-2.5 text-xs text-muted-foreground">
                      {new Date(dev.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-2.5 text-right">
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
        
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-2.5 border-t border-border/40 bg-muted/5">
            <p className="text-sm text-muted-foreground">
              Showing <span className="font-medium text-foreground">{startIndex + 1}</span> to <span className="font-medium text-foreground">{Math.min(startIndex + itemsPerPage, filteredDevelopers.length)}</span> of <span className="font-medium text-foreground">{filteredDevelopers.length}</span> developers
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
                {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
