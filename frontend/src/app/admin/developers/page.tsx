"use client";

import { useEffect, useState } from "react";
import { Loader2, Trash2, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function AdminDevelopersPage() {
  const [developers, setDevelopers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [devToDelete, setDevToDelete] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchDevelopers = async () => {
    try {
      const devsRes = await apiFetch("/api/admin/auth/developers", { role: "admin" });
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
    try {
      await apiFetch(`/api/admin/auth/developers/${devId}/status`, {
        method: "PATCH",
        role: "admin",
        headers: {
          "Content-Type": "application/json"
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
    try {
      await apiFetch(`/api/admin/auth/developers/${devId}`, {
        method: "DELETE",
        role: "admin"
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
          <h1 className="text-3xl font-bold tracking-tight">Developers</h1>
          <p className="text-muted-foreground mt-1">Manage all developer accounts.</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search by email or ID..."
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
                <TableHead>Developer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedDevelopers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    {searchQuery ? "No developers match your search." : "No developers found."}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedDevelopers.map(dev => (
                  <TableRow key={dev.id}>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {dev.id}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                          {dev.email.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium truncate max-w-[200px] sm:max-w-[300px]">{dev.email}</p>
                        </div>
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
        
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-3 border-t">
            <p className="text-sm text-muted-foreground">
              Showing <span className="font-medium text-foreground">{startIndex + 1}</span> to <span className="font-medium text-foreground">{Math.min(startIndex + itemsPerPage, filteredDevelopers.length)}</span> of <span className="font-medium text-foreground">{filteredDevelopers.length}</span> developers
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
    </div>
  );
}
