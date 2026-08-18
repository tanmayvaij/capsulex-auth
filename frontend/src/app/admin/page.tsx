"use client";

import { useEffect, useState } from "react";
import { Loader2, Users, FolderOpen, User, Trash2, Eye, ArrowRight } from "lucide-react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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
          <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
          <p className="text-muted-foreground mt-1">Track and manage your platform's core metrics and users.</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Developers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.developers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.projects}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total End Users</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.users}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tables Section */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        
        {/* Developers Table */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Registered Developers</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto max-h-[600px] p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Developer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {developers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      No developers found.
                    </TableCell>
                  </TableRow>
                ) : (
                  developers.slice(0, 5).map(dev => (
                    <TableRow key={dev.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                            {dev.email.charAt(0).toUpperCase()}
                          </div>
                          <div className="font-medium truncate max-w-[150px] sm:max-w-[200px]">{dev.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={dev.is_active ? "outline" : "destructive"} 
                          className="cursor-pointer"
                          onClick={() => handleToggleDevStatus(dev.id, dev.is_active)}
                        >
                          {dev.is_active ? 'Active' : 'Suspended'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(dev.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDevToDelete(dev.id)}
                          className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
          <div className="p-4 border-t flex justify-center mt-auto">
            <Link href="/admin/developers" className={buttonVariants({ variant: "link", className: "flex items-center gap-1" })}>
              View All Developers <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </Card>

        {/* Global Projects Table */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Global Projects</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto max-h-[600px] p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project</TableHead>
                  <TableHead>Developer</TableHead>
                  <TableHead>End Users</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      No projects have been created yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  projects.slice(0, 5).map((project) => (
                    <TableRow key={project.id}>
                      <TableCell className="font-semibold">{project.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-[10px] shrink-0">
                            {(project.developer?.email || "U").charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-xs truncate max-w-[120px]">{project.developer?.email || "Unknown"}</span>
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
          <div className="p-4 border-t flex justify-center mt-auto">
            <Link href="/admin/projects" className={buttonVariants({ variant: "link", className: "flex items-center gap-1" })}>
              View All Projects <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </Card>

      </div>

      {/* Delete Developer Modal */}
      <Dialog open={!!devToDelete} onOpenChange={(open) => !open && !isDeleting && setDevToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Developer?</DialogTitle>
            <DialogDescription>
              This will permanently delete this developer account and all associated projects. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDevToDelete(null)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => handleDeleteDeveloper(devToDelete!)} disabled={isDeleting}>
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
