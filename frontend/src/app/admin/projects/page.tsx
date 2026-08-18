"use client";

import { useEffect, useState } from "react";
import { Loader2, Users, Eye, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
          <h1 className="text-3xl font-bold tracking-tight">Global Projects</h1>
          <p className="text-muted-foreground mt-1">Overview of all applications across the platform.</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search by project name or ID..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-9"
          />
        </div>
      </div>

      <Card className="flex flex-col">
        <CardContent className="p-0 overflow-auto flex-1">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Developer</TableHead>
                <TableHead>End Users</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedProjects.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    {searchQuery ? "No projects match your search." : "No projects have been created yet."}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedProjects.map((project) => (
                  <TableRow key={project.id}>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {project.id}
                    </TableCell>
                    <TableCell className="font-semibold">
                      {project.name}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-[10px] shrink-0">
                          {(project.developer?.email || "U").charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-xs truncate max-w-[150px]">{project.developer?.email || "Unknown"}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Users className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="font-medium">{project.user_count || 0}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(project.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleViewUsers(project)}
                        className="h-8 rounded-full"
                      >
                        <Eye className="h-3 w-3 mr-1.5" /> Users
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
        
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-3 border-t">
            <p className="text-sm text-muted-foreground">
              Showing <span className="font-medium text-foreground">{startIndex + 1}</span> to <span className="font-medium text-foreground">{Math.min(startIndex + itemsPerPage, filteredProjects.length)}</span> of <span className="font-medium text-foreground">{filteredProjects.length}</span> projects
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4 mr-1" /> Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* View Project Users Modal */}
      <Dialog open={!!selectedProjectForUsers} onOpenChange={(open) => !open && setSelectedProjectForUsers(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Users: {selectedProjectForUsers?.name}</DialogTitle>
            <DialogDescription>
              Showing all end users registered in this project.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-auto">
            {loadingUsers ? (
              <div className="flex h-40 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User ID</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Registered</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projectUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                        No users registered in this project yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    projectUsers.map(user => (
                      <TableRow key={user.id}>
                        <TableCell className="font-mono text-xs text-muted-foreground">{user.id}</TableCell>
                        <TableCell className="font-medium">{user.email}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{new Date(user.created_at).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
