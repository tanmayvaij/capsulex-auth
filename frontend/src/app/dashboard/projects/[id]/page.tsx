"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ArrowLeft, Trash2, Search, ChevronLeft, ChevronRight, CheckCircle, XCircle, CheckCircle2, Circle, EyeOff, Eye, Globe, Mail, Users as UsersIcon, Plus, Webhook as WebhookIcon, Settings, Activity, MonitorSmartphone, Download, Copy } from "lucide-react";
import Link from "next/link";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { apiFetch } from "@/lib/api";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";

export default function ProjectUsersPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [project, setProject] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const router = useRouter();
  const PAGE_SIZE = 20;
  const [activeTab, setActiveTab] = useState("users");
  const [newOrigin, setNewOrigin] = useState("");
  const [corsLoading, setCorsLoading] = useState(false);
  const [webhooks, setWebhooks] = useState<any[]>([]);
  const [webhookLoading, setWebhookLoading] = useState(false);
  const [showWebhookModal, setShowWebhookModal] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<any>(null);
  const [webhookFormUrl, setWebhookFormUrl] = useState("");
  const [webhookFormEvents, setWebhookFormEvents] = useState<string[]>([]);
  const [webhookToDelete, setWebhookToDelete] = useState<any>(null);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [isDeletingItem, setIsDeletingItem] = useState(false);
  
  // Add User State
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [addUserError, setAddUserError] = useState("");
  const [addUserSuccess, setAddUserSuccess] = useState(false);
  const [newUserMetadata, setNewUserMetadata] = useState("");
  
  // Sessions Modal State
  const [showSessionsModal, setShowSessionsModal] = useState(false);
  const [selectedUserForSessions, setSelectedUserForSessions] = useState<any>(null);
  const [activeSessions, setActiveSessions] = useState<any[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const AVAILABLE_EVENTS = ["user.created", "user.deleted", "user.login.success", "user.login.failed", "user.password.reset", "user.suspended"];

  // Roles State
  const [roles, setRoles] = useState<any[]>([]);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [editingRole, setEditingRole] = useState<any>(null);
  const [roleFormName, setRoleFormName] = useState("");
  const [roleFormDesc, setRoleFormDesc] = useState("");
  const [roleFormPerms, setRoleFormPerms] = useState<string[]>([]);
  const [newPermInput, setNewPermInput] = useState("");
  const [roleToDelete, setRoleToDelete] = useState<any>(null);
  const [showUserRoleModal, setShowUserRoleModal] = useState(false);
  const [selectedUserForRoles, setSelectedUserForRoles] = useState<any>(null);

  // Mail Config State
  const [mailConfig, setMailConfig] = useState({
    provider: 'none',
    apiKey: '',
    fromAddress: '',
    resendApiKey: '',
    resendFromAddress: ''
  });
  const [showApiKey, setShowApiKey] = useState(false);
  const [mailSuccess, setMailSuccess] = useState('');
  const [mailLoading, setMailLoading] = useState(false);

  // Settings Config State
  const [allowPublicRegistration, setAllowPublicRegistration] = useState(true);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState("");
  const [settingsError, setSettingsError] = useState("");

  // Analytics & Logs State
  const [analyticsData, setAnalyticsData] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) || 
    user.id.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const totalPages = Math.ceil(filteredUsers.length / PAGE_SIZE) || 1;
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const generatePassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
    let pwd = "";
    for (let i = 0; i < 16; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pwd;
  };

  useEffect(() => {
    if (showAddUserModal && !newUserPassword && !addUserSuccess) {
      setNewUserPassword(generatePassword());
    }
  }, [showAddUserModal, newUserPassword, addUserSuccess]);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddUserError("");
    setIsAddingUser(true);

    let parsedMetadata = {};
    if (newUserMetadata.trim()) {
      try {
        parsedMetadata = JSON.parse(newUserMetadata);
      } catch (err) {
        setAddUserError("Invalid JSON format in metadata. Please correct it.");
        setIsAddingUser(false);
        return;
      }
    }

    try {
      const res = await apiFetch(`/api/developer/projects/${id}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newUserEmail, password: newUserPassword, user_metadata: parsedMetadata })
      });
      if (res.ok) {
        const user = await res.json();
        setUsers([user, ...users]);
        setAddUserSuccess(true);
      } else {
        const data = await res.json();
        setAddUserError(data.detail || "Failed to create user.");
      }
    } catch (err) {
      setAddUserError("An error occurred.");
    } finally {
      setIsAddingUser(false);
    }
  };

  const downloadCsv = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
        + "Email,Password\n" 
        + `${newUserEmail},${newUserPassword}`;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `user_credentials_${newUserEmail}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const resetAddUserModal = () => {
    setShowAddUserModal(false);
    setTimeout(() => {
      setNewUserEmail("");
      setNewUserPassword("");
      setNewUserMetadata("");
      setAddUserSuccess(false);
      setAddUserError("");
    }, 300);
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;

      try {
        const [projectRes, usersRes, webhooksRes, rolesRes] = await Promise.all([
          apiFetch(`/api/developer/projects/${id}`),
          apiFetch(`/api/developer/projects/${id}/users`),
          apiFetch(`/api/developer/projects/${id}/webhooks`),
          apiFetch(`/api/developer/projects/${id}/roles`)
        ]);

        if (!projectRes.ok) {
           router.push("/dashboard");
           return;
        }
        
        const projectData = await projectRes.json();
        const usersData = await usersRes.json();
        const webhooksData = await webhooksRes.json();
        const rolesData = rolesRes.ok ? await rolesRes.json() : [];
        
        setProject(projectData);
        setUsers(usersData);
        setWebhooks(webhooksData || []);
        setRoles(rolesData || []);
        setAllowPublicRegistration(projectData.allow_public_registration ?? true);
        const mailConf = projectData.mail_config || {};
        setMailConfig({
            provider: mailConf.provider || 'none',
            apiKey: mailConf.apiKey || '',
            fromAddress: mailConf.fromAddress || '',
            resendApiKey: mailConf.resendApiKey || '',
            resendFromAddress: mailConf.resendFromAddress || ''
        });
      } catch (error: any) {
        console.error("Failed to fetch project data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, router]);

  const handleMailConfigSave = async () => {
    setMailLoading(true);
    setMailSuccess("");
    try {
        const res = await apiFetch(`/api/developer/projects/${id}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                mail_config: mailConfig
            })
        });
        if (res.ok) {
            setMailSuccess("Mail configuration saved successfully");
            setTimeout(() => setMailSuccess(""), 3000);
        }
    } catch (err) {
        console.error(err);
    } finally {
        setMailLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    setIsDeletingItem(true);
    
    try {
      const res = await apiFetch(`/api/developer/projects/${id}/users/${userToDelete}`, {
        method: "DELETE",
      });
      
      if (res.ok) {
        setUsers(users.filter(u => u.id !== userToDelete));
        setUserToDelete(null);
      }
    } catch (error) {
      console.error("Failed to delete user", error);
    } finally {
      setIsDeletingItem(false);
    }
  };

  const handleViewSessions = async (userId: string) => {
    setSelectedUserForSessions(userId);
    setShowSessionsModal(true);
    setSessionsLoading(true);
    try {
      const res = await apiFetch(`/api/developer/projects/${id}/users/${userId}/sessions`);
      if (res.ok) {
        setActiveSessions(await res.json());
      }
    } catch (error) {
      console.error("Failed to fetch sessions", error);
    } finally {
      setSessionsLoading(false);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    if (!selectedUserForSessions) return;
    try {
      const res = await apiFetch(`/api/developer/projects/${id}/users/${selectedUserForSessions}/sessions/${sessionId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setActiveSessions(activeSessions.map(s => s.id === sessionId ? { ...s, is_revoked: true } : s));
      }
    } catch (error) {
      console.error("Failed to revoke session", error);
    }
  };

  const handleRevokeAllSessions = async () => {
    if (!selectedUserForSessions) return;
    try {
      const res = await apiFetch(`/api/developer/projects/${id}/users/${selectedUserForSessions}/sessions`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setActiveSessions(activeSessions.map(s => ({ ...s, is_revoked: true })));
      }
    } catch (error) {
      console.error("Failed to revoke all sessions", error);
    }
  };

  const handleDeleteWebhook = async () => {
    if (!webhookToDelete) return;
    setIsDeletingItem(true);
    
    try {
        const res = await apiFetch(`/api/developer/projects/${id}/webhooks/${webhookToDelete.id}`, { method: "DELETE" });
        if (res.ok) {
            setWebhooks(webhooks.filter((w: any) => w.id !== webhookToDelete.id));
            setWebhookToDelete(null);
        }
    } catch (err) {
        console.error(err);
    } finally {
        setIsDeletingItem(false);
    }
  };

  const handleSaveRole = async () => {
    if (!roleFormName.trim()) return;
    setRolesLoading(true);
    try {
      const payload = {
        name: roleFormName,
        description: roleFormDesc,
        permissions: roleFormPerms
      };
      
      let res;
      if (editingRole) {
        res = await apiFetch(`/api/developer/projects/${id}/roles/${editingRole.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      } else {
        res = await apiFetch(`/api/developer/projects/${id}/roles`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      }
      
      if (res.ok) {
        const savedRole = await res.json();
        if (editingRole) {
          setRoles(roles.map((r: any) => r.id === savedRole.id ? savedRole : r));
        } else {
          setRoles([...roles, savedRole]);
        }
        setShowRoleModal(false);
      } else {
        const err = await res.json();
        alert(err.detail || "Failed to save role");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setRolesLoading(false);
    }
  };

  const handleDeleteRole = async () => {
    if (!roleToDelete) return;
    setIsDeletingItem(true);
    try {
      const res = await apiFetch(`/api/developer/projects/${id}/roles/${roleToDelete.id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        setRoles(roles.filter((r: any) => r.id !== roleToDelete.id));
        setRoleToDelete(null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsDeletingItem(false);
    }
  };

  const handleSaveUserRoles = async (userId: string, newRoles: string[]) => {
    try {
      const res = await apiFetch(`/api/developer/projects/${id}/users/${userId}/roles`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roles: newRoles })
      });
      if (res.ok) {
        setUsers(users.map(u => u.id === userId ? { ...u, roles: newRoles } : u));
        setShowUserRoleModal(false);
      } else {
        const err = await res.json();
        alert(err.detail || "Failed to update user roles");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const res = await apiFetch(`/api/developer/projects/${id}/users/${userId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ is_active: !currentStatus })
      });
      
      if (res.ok) {
        const updatedUser = await res.json();
        setUsers(users.map(u => u.id === userId ? updatedUser : u));
      }
    } catch (error) {
      console.error("Failed to update user status", error);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">Project: {project?.name}</h2>
          <p className="text-muted-foreground">Manage project settings and authenticated users.</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
        <TabsList className="bg-transparent border-b rounded-none w-full justify-start h-auto p-0 space-x-6">
          <TabsTrigger value="users" className="data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent rounded-none px-0 py-3 data-[state=active]:text-foreground text-muted-foreground hover:text-foreground">
            <UsersIcon className="h-4 w-4 mr-2" /> Users
          </TabsTrigger>
          <TabsTrigger value="roles" className="data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent rounded-none px-0 py-3 data-[state=active]:text-foreground text-muted-foreground hover:text-foreground">
            <CheckCircle2 className="h-4 w-4 mr-2" /> Roles
          </TabsTrigger>
          <TabsTrigger value="cors" className="data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent rounded-none px-0 py-3 data-[state=active]:text-foreground text-muted-foreground hover:text-foreground">
            <Globe className="h-4 w-4 mr-2" /> CORS Settings
          </TabsTrigger>
          <TabsTrigger value="mail" className="data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent rounded-none px-0 py-3 data-[state=active]:text-foreground text-muted-foreground hover:text-foreground">
            <Mail className="h-4 w-4 mr-2" /> Mail Service
          </TabsTrigger>
          <TabsTrigger value="webhooks" className="data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent rounded-none px-0 py-3 data-[state=active]:text-foreground text-muted-foreground hover:text-foreground">
            <WebhookIcon className="h-4 w-4 mr-2" /> Webhooks
          </TabsTrigger>
          <TabsTrigger value="settings" className="data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent rounded-none px-0 py-3 data-[state=active]:text-foreground text-muted-foreground hover:text-foreground">
            <Settings className="h-4 w-4 mr-2" /> Settings
          </TabsTrigger>
          <TabsTrigger value="analytics" className="data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent rounded-none px-0 py-3 data-[state=active]:text-foreground text-muted-foreground hover:text-foreground">
            <Activity className="h-4 w-4 mr-2" /> Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="cors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>CORS Settings</CardTitle>
              <CardDescription>
                Define which domains are allowed to make authentication requests to this project's API. 
                (e.g., https://yourdomain.com).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form 
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!newOrigin.trim()) return;
                  
                  const originToAdd = newOrigin.trim();
                  const currentOrigins = project?.allowed_origins || [];
                  if (currentOrigins.includes(originToAdd)) {
                    setNewOrigin("");
                    return;
                  }
                  
                  const updatedOrigins = [...currentOrigins, originToAdd];
                  
                  setCorsLoading(true);
                  try {
                      const res = await apiFetch(`/api/developer/projects/${id}`, {
                          method: "PATCH",
                          headers: {
                              "Content-Type": "application/json",
                          },
                          body: JSON.stringify({ allowed_origins: updatedOrigins })
                      });
                      if (res.ok) {
                          setProject({ ...project, allowed_origins: updatedOrigins });
                          setNewOrigin("");
                      }
                  } catch (err) {
                      console.error(err);
                  } finally {
                      setCorsLoading(false);
                  }
                }}
                className="flex gap-3 mb-8 items-center"
              >
                  <Input 
                      type="text" 
                      placeholder="https://clientapp.com"
                      value={newOrigin}
                      onChange={(e) => setNewOrigin(e.target.value)}
                      className="max-w-md"
                  />
                  <Button
                    type="submit"
                    disabled={corsLoading || !newOrigin.trim()}
                  >
                    {corsLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                    Add Origin
                  </Button>
              </form>
              
              <div className="space-y-3">
                {(!project?.allowed_origins || project.allowed_origins.length === 0) ? (
                  <div className="text-sm text-muted-foreground italic p-6 border-2 border-dashed rounded-md text-center flex flex-col items-center">
                    <Globe className="h-8 w-8 mb-2 text-muted-foreground/50" />
                    No origins configured. API requests from browsers will be blocked.
                  </div>
                ) : (
                  project.allowed_origins.map((origin: string) => (
                    <div key={origin} className="flex items-center justify-between p-4 border rounded-md bg-muted/40">
                      <span className="text-sm font-medium">{origin}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={async () => {
                          const updatedOrigins = project.allowed_origins.filter((o: string) => o !== origin);
                          
                          setCorsLoading(true);
                          try {
                              const res = await apiFetch(`/api/developer/projects/${id}`, {
                                  method: "PATCH",
                                  headers: {
                                      "Content-Type": "application/json",
                                  },
                                  body: JSON.stringify({ allowed_origins: updatedOrigins })
                              });
                              if (res.ok) {
                                  setProject({ ...project, allowed_origins: updatedOrigins });
                              }
                          } catch (err) {
                              console.error(err);
                          } finally {
                              setCorsLoading(false);
                          }
                        }}
                        disabled={corsLoading}
                        className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        title="Remove Origin"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mail" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Mail Service Configuration</CardTitle>
              <CardDescription>Configure how this project sends emails to its users.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-8 w-full">
                <div className="space-y-4">
                  <label className="text-sm font-semibold text-foreground ml-1">Active Provider</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div 
                      className={`flex items-start p-5 border-2 rounded-md cursor-pointer transition-all ${
                        mailConfig.provider === 'none' 
                          ? 'border-emerald-500/50 bg-emerald-500/5 shadow-[0_0_15px_rgba(16,185,129,0.1)]' 
                          : 'border-border bg-background/30 hover:border-border hover:bg-background/50'
                      }`}
                      onClick={() => setMailConfig({...mailConfig, provider: 'none'})}
                    >
                      <div className="flex items-center h-6 mt-0.5">
                        {mailConfig.provider === 'none' ? (
                          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                        ) : (
                          <Circle className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                      <div className="ml-4">
                        <span className="block text-sm font-bold text-foreground">None</span>
                        <span className="block text-xs text-muted-foreground mt-1">
                          Emails will be skipped entirely.
                        </span>
                      </div>
                    </div>
                    
                    <div 
                      className={`flex items-start p-5 border-2 rounded-md cursor-pointer transition-all ${
                        mailConfig.provider === 'zeptomail' 
                          ? 'border-emerald-500/50 bg-emerald-500/5 shadow-[0_0_15px_rgba(16,185,129,0.1)]' 
                          : 'border-border bg-background/30 hover:border-border hover:bg-background/50'
                      }`}
                      onClick={() => setMailConfig({...mailConfig, provider: 'zeptomail'})}
                    >
                      <div className="flex items-center h-6 mt-0.5">
                        {mailConfig.provider === 'zeptomail' ? (
                          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                        ) : (
                          <Circle className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                      <div className="ml-4">
                        <span className="block text-sm font-bold text-foreground">ZeptoMail</span>
                        <span className="block text-xs text-muted-foreground mt-1">
                          Send real emails using the Zoho ZeptoMail API.
                        </span>
                      </div>
                    </div>
                    
                    <div 
                      className={`flex items-start p-5 border-2 rounded-md cursor-pointer transition-all ${
                        mailConfig.provider === 'resend' 
                          ? 'border-emerald-500/50 bg-emerald-500/5 shadow-[0_0_15px_rgba(16,185,129,0.1)]' 
                          : 'border-border bg-background/30 hover:border-border hover:bg-background/50'
                      }`}
                      onClick={() => setMailConfig({...mailConfig, provider: 'resend'})}
                    >
                      <div className="flex items-center h-6 mt-0.5">
                        {mailConfig.provider === 'resend' ? (
                          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                        ) : (
                          <Circle className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                      <div className="ml-4">
                        <span className="block text-sm font-bold text-foreground">Resend</span>
                        <span className="block text-xs text-muted-foreground mt-1">
                          Send beautiful emails using the modern Resend API.
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {mailConfig.provider === 'zeptomail' && (
                  <div className="pt-6 border-t border-border space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="space-y-3">
                      <label className="text-sm font-semibold text-foreground ml-1">ZeptoMail API Key</label>
                      <div className="relative">
                        <Input
                          type={showApiKey ? "text" : "password"}
                          value={mailConfig.apiKey}
                          onChange={(e) => setMailConfig({...mailConfig, apiKey: e.target.value})}
                          placeholder="Zoho-enczapikey wSsVR60j/0...."
                          className="pr-12"
                        />
                        <button 
                          type="button"
                          onClick={() => setShowApiKey(!showApiKey)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-2 rounded-lg hover:bg-primary/10 text-primary transition-colors"
                        >
                          {showApiKey ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-sm font-semibold text-foreground ml-1">From Address</label>
                      <Input
                        type="email"
                        value={mailConfig.fromAddress}
                        onChange={(e) => setMailConfig({...mailConfig, fromAddress: e.target.value})}
                        placeholder="noreply@yourdomain.com"
                      />
                    </div>
                  </div>
                )}
                
                {mailConfig.provider === 'resend' && (
                  <div className="pt-6 border-t border-border space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="space-y-3">
                      <label className="text-sm font-semibold text-foreground ml-1">Resend API Key</label>
                      <div className="relative">
                        <Input
                          type={showApiKey ? "text" : "password"}
                          value={mailConfig.resendApiKey}
                          onChange={(e) => setMailConfig({...mailConfig, resendApiKey: e.target.value})}
                          placeholder="re_1234567890abcdefghijklmnopqrstuvwx"
                          className="pr-12"
                        />
                        <button 
                          type="button"
                          onClick={() => setShowApiKey(!showApiKey)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-2 rounded-lg hover:bg-primary/10 text-primary transition-colors"
                        >
                          {showApiKey ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-sm font-semibold text-foreground ml-1">From Address</label>
                      <Input
                        type="email"
                        value={mailConfig.resendFromAddress}
                        onChange={(e) => setMailConfig({...mailConfig, resendFromAddress: e.target.value})}
                        placeholder="Acme Auth <noreply@yourdomain.com>"
                      />
                    </div>
                  </div>
                )}

                <div className="pt-6 flex items-center gap-4">
                  <Button
                    onClick={handleMailConfigSave}
                    disabled={mailLoading}
                  >
                    {mailLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Save Configuration
                  </Button>
                  {mailSuccess && (
                    <div className="flex items-center gap-2 text-sm text-emerald-500 animate-in fade-in bg-emerald-500/10 px-4 py-2 rounded-md">
                      <CheckCircle2 className="h-4 w-4" />
                      {mailSuccess}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="webhooks" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="space-y-1">
                <CardTitle>Webhook Endpoints</CardTitle>
                <CardDescription>
                  Configure endpoints to receive secure HTTP POST payloads when events happen in your project.
                </CardDescription>
              </div>
              <Button
               onClick={() => {
                 setEditingWebhook(null);
                 setWebhookFormUrl("");
                 setWebhookFormEvents(AVAILABLE_EVENTS);
                 setShowWebhookModal(true);
               }}
              >
                <Plus className="mr-2 h-4 w-4" /> Add Endpoint
              </Button>
            </CardHeader>
            <CardContent>
              {webhooks.length === 0 ? (
                <div className="text-center py-12 border border-dashed rounded-md flex flex-col items-center justify-center mt-4">
                  <WebhookIcon className="h-8 w-8 mb-2 text-muted-foreground/50" />
                  <p className="text-muted-foreground font-medium mb-1">No webhooks configured</p>
                  <p className="text-sm text-muted-foreground">Add one above to start receiving events.</p>
                </div>
              ) : (
                <Table className="mt-4">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Endpoint URL</TableHead>
                      <TableHead>Events</TableHead>
                      <TableHead>Signing Secret</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {webhooks.map((webhook: any) => (
                      <TableRow key={webhook.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-foreground">{webhook.url}</span>
                            <Badge variant="default" className="text-[10px] uppercase">Active</Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2 flex-wrap">
                            {webhook.events.map((ev: string) => (
                              <Badge variant="secondary" key={ev} className="text-xs font-normal">
                                {ev}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <code className="text-xs font-mono text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-md">
                            {webhook.secret}
                          </code>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditingWebhook(webhook);
                              setWebhookFormUrl(webhook.url);
                              setWebhookFormEvents(webhook.events);
                              setShowWebhookModal(true);
                            }}
                          >
                            <Settings className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setWebhookToDelete(webhook)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="space-y-1">
                <CardTitle>Authenticated Users</CardTitle>
                <CardDescription>
                  View and manage users who have signed up through this project.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 mt-4 gap-4">
                <div className="relative w-full max-w-md">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <Input
                    type="text"
                    placeholder="Search by email or ID..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="pl-9"
                  />
                </div>
                <Button onClick={() => setShowAddUserModal(true)}>
                  <Plus className="mr-2 h-4 w-4" /> Add User
                </Button>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User ID</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Verified</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Roles</TableHead>
                      <TableHead>Metadata</TableHead>
                      <TableHead>Last Signed In</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="h-24 text-center">
                          No users found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <code className="text-xs font-mono bg-muted px-2 py-1 rounded-md text-muted-foreground">
                              {user.id}
                            </code>
                          </TableCell>
                          <TableCell className="font-medium">
                            {user.email}
                          </TableCell>
                          <TableCell>
                            {user.is_email_verified ? (
                              <Badge variant="outline" className="text-emerald-500 border-emerald-500/20 bg-emerald-500/10">
                                <CheckCircle className="w-3 h-3 mr-1" /> Verified
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-muted-foreground">
                                <XCircle className="w-3 h-3 mr-1" /> Unverified
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Button 
                              variant={user.is_active ? "outline" : "destructive"}
                              size="sm"
                              onClick={() => handleToggleStatus(user.id, user.is_active)}
                              className={`h-6 text-xs px-2 ${user.is_active ? 'text-primary border-primary/20 bg-primary/10 hover:bg-primary/20' : ''}`}
                            >
                              {user.is_active ? 'Active' : 'Inactive'}
                            </Button>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {user.roles && user.roles.length > 0 ? (
                                user.roles.map((role: string) => (
                                  <Badge variant="secondary" key={role} className="text-[10px]">
                                    {role}
                                  </Badge>
                                ))
                              ) : (
                                <span className="text-[10px] text-muted-foreground italic">None</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <code className="text-[10px] text-muted-foreground bg-muted px-2 py-1 rounded border border-border truncate block max-w-[120px]" title={JSON.stringify(user.user_metadata || {}, null, 2)}>
                              {JSON.stringify(user.user_metadata || {})}
                            </code>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-xs">
                            {user.last_signed_in ? `${new Date(user.last_signed_in).toLocaleDateString()} ${new Date(user.last_signed_in).toLocaleTimeString()}` : '-'}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedUserForRoles(user);
                                setShowUserRoleModal(true);
                              }}
                              title="Manage Roles"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleViewSessions(user.id)}
                              title="View Active Sessions"
                            >
                              <MonitorSmartphone className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setUserToDelete(user.id)}
                              title="Delete User"
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  Showing <span className="font-semibold text-foreground">{filteredUsers.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1}</span> to <span className="font-semibold text-foreground">{Math.min(currentPage * PAGE_SIZE, filteredUsers.length)}</span> of <span className="font-semibold text-foreground">{filteredUsers.length}</span> users
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm font-medium px-2 text-muted-foreground">Page {currentPage} of {totalPages}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="space-y-1">
                <CardTitle>Roles & Permissions</CardTitle>
                <CardDescription>Define roles and their granular permissions to assign to your users.</CardDescription>
              </div>
              <Button
                onClick={() => {
                  setEditingRole(null);
                  setRoleFormName('');
                  setRoleFormDesc('');
                  setRoleFormPerms([]);
                  setShowRoleModal(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Role
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 mt-4">
                {roles.map((role) => (
                  <div key={role.id} className="p-5 border border-border bg-background/50 rounded-xl flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="text-lg font-semibold">{role.name}</h4>
                        <span className="text-xs font-mono bg-muted text-muted-foreground px-2 py-0.5 rounded">{role.id}</span>
                      </div>
                      {role.description && <p className="text-sm text-muted-foreground mb-4">{role.description}</p>}
                      
                      <div className="flex flex-wrap gap-2">
                        {role.permissions?.map((p: any) => (
                          <Badge variant="secondary" key={p.id} className="text-xs font-medium">
                            {p.action}
                          </Badge>
                        ))}
                        {(!role.permissions || role.permissions.length === 0) && (
                          <span className="text-xs text-muted-foreground italic">No permissions assigned</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditingRole(role);
                          setRoleFormName(role.name);
                          setRoleFormDesc(role.description || '');
                          setRoleFormPerms(role.permissions?.map((p: any) => p.action) || []);
                          setShowRoleModal(true);
                        }}
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => setRoleToDelete(role)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {roles.length === 0 && (
                  <div className="text-center py-12 border border-dashed border-border rounded-xl">
                    <p className="text-muted-foreground">No roles configured yet.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Project Settings</CardTitle>
              <CardDescription>
                Manage general configuration and security settings for this project.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {settingsSuccess && (
                <div className="mb-6 p-4 rounded-md bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                  <p className="text-sm text-emerald-500 font-medium">{settingsSuccess}</p>
                </div>
              )}
              {settingsError && (
                <div className="mb-6 p-4 rounded-md bg-destructive/10 border border-destructive/20 flex items-center gap-3">
                  <XCircle className="h-5 w-5 text-destructive shrink-0" />
                  <p className="text-sm text-destructive font-medium">{settingsError}</p>
                </div>
              )}

              <div className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <h4 className="text-sm font-medium">Allow Public Registration</h4>
                  <p className="text-sm text-muted-foreground">If disabled, new users cannot sign up using this project's API key. You can still manually create users via the admin dashboard.</p>
                </div>
                <Switch
                  checked={allowPublicRegistration}
                  disabled={settingsLoading}
                  onCheckedChange={async (newVal) => {
                    setSettingsLoading(true);
                    setSettingsSuccess("");
                    setSettingsError("");
                    try {
                      const res = await apiFetch(`/api/developer/projects/${id}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ allow_public_registration: newVal })
                      });
                      if (res.ok) {
                        setAllowPublicRegistration(newVal);
                        setProject({...project, allow_public_registration: newVal});
                        setSettingsSuccess(`Public registration has been ${newVal ? 'enabled' : 'disabled'}.`);
                      } else {
                         setSettingsError("Failed to update registration settings.");
                      }
                    } catch (e) {
                      setSettingsError("Failed to update registration settings.");
                    } finally {
                      setSettingsLoading(false);
                    }
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      
      <Dialog open={showWebhookModal} onOpenChange={setShowWebhookModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingWebhook ? 'Edit Webhook' : 'Create Webhook'}</DialogTitle>
            <DialogDescription className="hidden">
              Form to create or edit a webhook
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={async (e) => {
            e.preventDefault();
            if (!webhookFormUrl.trim() || webhookFormEvents.length === 0) return;
            
            setWebhookLoading(true);
            try {
              if (editingWebhook) {
                // Update
                const res = await apiFetch(`/api/developer/projects/${id}/webhooks/${editingWebhook.id}`, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ url: webhookFormUrl.trim(), events: webhookFormEvents })
                });
                if (res.ok) {
                  const updatedWebhook = await res.json();
                  setWebhooks(webhooks.map((w: any) => w.id === updatedWebhook.id ? updatedWebhook : w));
                  setShowWebhookModal(false);
                } else {
                  const err = await res.json();
                  alert(err.detail || "Failed to update webhook");
                }
              } else {
                // Create
                const res = await apiFetch(`/api/developer/projects/${id}/webhooks`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ url: webhookFormUrl.trim(), events: webhookFormEvents })
                });
                if (res.ok) {
                  const newWebhook = await res.json();
                  setWebhooks([...webhooks, newWebhook]);
                  setShowWebhookModal(false);
                } else {
                  const err = await res.json();
                  alert(err.detail || "Failed to create webhook");
                }
              }
            } catch (err) {
              console.error(err);
              alert("An error occurred");
            } finally {
              setWebhookLoading(false);
            }
          }}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Endpoint URL</label>
                <Input 
                  type="url" 
                  required
                  placeholder="https://api.yourdomain.com/webhooks"
                  value={webhookFormUrl}
                  onChange={(e) => setWebhookFormUrl(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Events to Subscribe To</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto p-1">
                  {AVAILABLE_EVENTS.map(ev => (
                    <label key={ev} className={`flex items-center gap-3 p-3 rounded-md border cursor-pointer transition-colors ${webhookFormEvents.includes(ev) ? 'border-primary/50 bg-primary/10' : 'border-border bg-card hover:bg-muted/50'}`}>
                      <input 
                        type="checkbox"
                        className="h-4 w-4 rounded border-input text-primary focus:ring-primary focus:ring-offset-background"
                        checked={webhookFormEvents.includes(ev)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setWebhookFormEvents([...webhookFormEvents, ev]);
                          } else {
                            setWebhookFormEvents(webhookFormEvents.filter(e => e !== ev));
                          }
                        }}
                      />
                      <span className="text-sm font-medium">{ev}</span>
                    </label>
                  ))}
                </div>
                {webhookFormEvents.length === 0 && <p className="text-xs text-destructive mt-1.5">Please select at least one event.</p>}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowWebhookModal(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={webhookLoading || !webhookFormUrl.trim() || webhookFormEvents.length === 0}>
                {webhookLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {editingWebhook ? 'Save Changes' : 'Create Webhook'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Analytics & Logs */}
      <TabsContent value="analytics" className="space-y-4">
        <div className="space-y-8 animate-in fade-in duration-300">
          <Card>
            <CardHeader>
              <CardTitle>Activity Overview (Last 30 Days)</CardTitle>
              <CardDescription>Track successful user logins and new account creations.</CardDescription>
            </CardHeader>
            <CardContent>
              {analyticsLoading ? (
                <div className="flex h-64 items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="h-80 w-full mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={analyticsData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorSignups" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorLogins" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                      <XAxis 
                        dataKey="date" 
                        stroke="#888888" 
                        fontSize={12} 
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => {
                          const d = new Date(value);
                          return `${d.getMonth()+1}/${d.getDate()}`;
                        }}
                      />
                      <YAxis 
                        stroke="#888888" 
                        fontSize={12} 
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `${value}`}
                      />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#111', borderColor: '#333', borderRadius: '8px' }}
                        itemStyle={{ color: '#fff' }}
                      />
                      <Area type="monotone" dataKey="signups" stroke="#10b981" fillOpacity={1} fill="url(#colorSignups)" />
                      <Area type="monotone" dataKey="logins" stroke="#3b82f6" fillOpacity={1} fill="url(#colorLogins)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Audit Logs</CardTitle>
              <CardDescription>Raw events showing the last 100 authentication actions for this project.</CardDescription>
            </CardHeader>
            <CardContent>
              {analyticsLoading ? (
                <div className="flex h-32 items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : auditLogs.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground border border-dashed rounded-md mt-4">
                  No logs available yet.
                </div>
              ) : (
                <Table className="mt-4">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Event</TableHead>
                      <TableHead>User ID</TableHead>
                      <TableHead>IP Address</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="text-muted-foreground whitespace-nowrap">
                          {new Date(log.created_at).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`${
                            log.event_type === 'user.created' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                            log.event_type.includes('success') ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                            'bg-destructive/10 text-destructive border-destructive/20'
                          }`}>
                            {log.event_type}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap">
                          {log.user_id || '-'}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap">
                          {log.ip_address || '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </TabsContent>
      </Tabs>

      {/* Webhook Delete Modal */}
      <Dialog open={!!webhookToDelete} onOpenChange={(open) => !open && !isDeletingItem && setWebhookToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Webhook</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the webhook <span className="font-semibold text-foreground">{webhookToDelete?.url}</span>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWebhookToDelete(null)} disabled={isDeletingItem}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteWebhook} disabled={isDeletingItem}>
              {isDeletingItem ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* User Delete Modal */}
      <Dialog open={!!userToDelete} onOpenChange={(open) => !open && !isDeletingItem && setUserToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this user? They will lose all access. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUserToDelete(null)} disabled={isDeletingItem}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteUser} disabled={isDeletingItem}>
              {isDeletingItem ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showSessionsModal} onOpenChange={setShowSessionsModal}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MonitorSmartphone className="h-5 w-5 text-indigo-400" />
              Active Sessions
            </DialogTitle>
            <DialogDescription>
              Manage devices where this user is currently logged in
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end mb-4">
            <Button
              variant="destructive"
              onClick={handleRevokeAllSessions}
              disabled={sessionsLoading || activeSessions.length === 0}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Revoke All Sessions
            </Button>
          </div>
          {sessionsLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : activeSessions.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-border rounded-lg bg-muted/10">
              <MonitorSmartphone className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
              <h4 className="text-foreground font-medium mb-1">No Active Sessions</h4>
              <p className="text-sm text-muted-foreground">This user is not logged in on any devices.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activeSessions.map((session: any) => (
                <div key={session.id} className={`p-4 rounded-lg border flex flex-col md:flex-row md:items-center justify-between gap-4 ${session.is_revoked ? 'border-destructive/30 bg-destructive/5' : 'border-border bg-card'}`}>
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant={session.is_revoked ? "destructive" : "secondary"} className="font-mono text-xs">
                        {session.ip_address || 'Unknown IP'}
                      </Badge>
                      {session.is_revoked && (
                        <Badge variant="destructive" className="text-xs">Revoked</Badge>
                      )}
                    </div>
                    <p className="text-sm text-foreground truncate mt-2" title={session.user_agent}>
                      {session.user_agent || 'Unknown Device'}
                    </p>
                    <div className="text-xs text-muted-foreground flex items-center gap-3 mt-2">
                      <span>Started: {new Date(session.created_at).toLocaleString()}</span>
                      <span>Last Active: {new Date(session.last_active_at).toLocaleString()}</span>
                    </div>
                  </div>
                  <div>
                    {!session.is_revoked && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRevokeSession(session.id)}
                      >
                        Revoke Access
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showRoleModal} onOpenChange={setShowRoleModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              {editingRole ? 'Edit Role' : 'Create Role'}
            </DialogTitle>
            <DialogDescription className="hidden">
              Form to create or edit a role
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Role Name</label>
              <Input
                value={roleFormName}
                onChange={e => setRoleFormName(e.target.value)}
                placeholder="e.g. admin, editor, viewer"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description (Optional)</label>
              <Input
                value={roleFormDesc}
                onChange={e => setRoleFormDesc(e.target.value)}
                placeholder="e.g. Full administrative access"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Permissions</label>
              <div className="flex gap-2">
                <Input
                  value={newPermInput}
                  onChange={e => setNewPermInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (newPermInput.trim() && !roleFormPerms.includes(newPermInput.trim())) {
                        setRoleFormPerms([...roleFormPerms, newPermInput.trim()]);
                        setNewPermInput('');
                      }
                    }
                  }}
                  placeholder="e.g. read:users, write:posts"
                />
                <Button
                  variant="secondary"
                  onClick={() => {
                    if (newPermInput.trim() && !roleFormPerms.includes(newPermInput.trim())) {
                      setRoleFormPerms([...roleFormPerms, newPermInput.trim()]);
                      setNewPermInput('');
                    }
                  }}
                >
                  Add
                </Button>
              </div>
              <div className="bg-muted/20 border border-border rounded-md p-3 min-h-[100px] flex flex-wrap gap-2 items-start content-start mt-2">
                {roleFormPerms.map(perm => (
                  <Badge variant="secondary" key={perm} className="flex items-center gap-1 font-normal pr-1">
                    {perm}
                    <button onClick={() => setRoleFormPerms(roleFormPerms.filter(p => p !== perm))} className="hover:text-destructive">
                      <XCircle className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                {roleFormPerms.length === 0 && (
                  <span className="text-sm text-muted-foreground italic w-full text-center mt-6">No permissions added</span>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRoleModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveRole} disabled={rolesLoading || !roleFormName.trim()}>
              {rolesLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!roleToDelete} onOpenChange={(open) => !open && !isDeletingItem && setRoleToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Role?</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the role <span className="font-semibold text-foreground">{roleToDelete?.name}</span>? 
              This will remove the role from any users currently assigned to it. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleToDelete(null)} disabled={isDeletingItem}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteRole} disabled={isDeletingItem}>
              {isDeletingItem ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {isDeletingItem ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showUserRoleModal && !!selectedUserForRoles} onOpenChange={setShowUserRoleModal}>
        <DialogContent className="sm:max-w-md max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              Manage User Roles
            </DialogTitle>
            <DialogDescription className="truncate max-w-[300px]">
              {selectedUserForRoles?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto py-4">
            {roles.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">No roles configured in this project.</p>
                <Button variant="link" onClick={() => { setShowUserRoleModal(false); setActiveTab('roles'); }}>
                  Go to Roles tab to create one
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {roles.map(role => {
                  const hasRole = selectedUserForRoles?.roles?.includes(role.name);
                  return (
                    <label key={role.id} className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${hasRole ? 'border-primary/50 bg-primary/5' : 'border-border bg-card hover:bg-muted/50'}`}>
                      <div className="mt-0.5 flex items-center h-5">
                        <input
                          type="checkbox"
                          checked={hasRole}
                          onChange={(e) => {
                            const newRoles = e.target.checked 
                              ? [...(selectedUserForRoles.roles || []), role.name]
                              : (selectedUserForRoles.roles || []).filter((r: string) => r !== role.name);
                            setSelectedUserForRoles({ ...selectedUserForRoles, roles: newRoles });
                          }}
                          className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
                        />
                      </div>
                      <div>
                        <div className="font-medium text-sm text-foreground">{role.name}</div>
                        {role.description && <div className="text-xs text-muted-foreground mt-0.5">{role.description}</div>}
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUserRoleModal(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => handleSaveUserRoles(selectedUserForRoles?.id, selectedUserForRoles?.roles || [])}
              disabled={roles.length === 0}
            >
              Save Assignment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add User Modal */}
      <Dialog open={showAddUserModal} onOpenChange={(open) => !open && resetAddUserModal()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{addUserSuccess ? "User Created Successfully" : "Register New User"}</DialogTitle>
            <DialogDescription>
              {addUserSuccess 
                ? "The user has been successfully created and added to this project." 
                : "Manually register a user for this project. They will be marked as verified immediately."}
            </DialogDescription>
          </DialogHeader>
          
          {addUserSuccess ? (
            <div className="space-y-4">
              <div className="p-4 bg-muted/50 rounded-md border flex flex-col items-center text-center space-y-2">
                <CheckCircle2 className="h-10 w-10 text-emerald-500 mb-2" />
                <div className="font-semibold text-foreground">{newUserEmail}</div>
                <div className="text-sm text-muted-foreground">Account is now active</div>
              </div>
              <div className="p-4 bg-muted/50 rounded-md border">
                <p className="text-sm font-medium mb-2">Temporary Password</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 p-2 bg-background border rounded font-mono text-sm">
                    {newUserPassword}
                  </code>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Make sure to save this password or download the credentials. You won't be able to see it again.
                </p>
              </div>
              <DialogFooter className="sm:justify-between flex-row">
                <Button type="button" variant="outline" onClick={downloadCsv}>
                  <Download className="mr-2 h-4 w-4" /> Save to CSV
                </Button>
                <Button type="button" onClick={resetAddUserModal}>
                  Done
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <form onSubmit={handleAddUser}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email Address</label>
                  <Input 
                    type="email" 
                    value={newUserEmail} 
                    onChange={e => setNewUserEmail(e.target.value)} 
                    placeholder="user@example.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Generated Password</label>
                  <div className="relative">
                    <Input 
                      type="text" 
                      value={newUserPassword} 
                      onChange={e => setNewUserPassword(e.target.value)} 
                      required
                      className="pr-10 font-mono"
                    />
                    <button 
                      type="button" 
                      onClick={() => setNewUserPassword(generatePassword())}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground hover:text-foreground rounded hover:bg-muted"
                      title="Regenerate Password"
                    >
                      <Activity className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">A secure password is auto-generated. You can modify it if needed.</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Metadata (Optional JSON)</label>
                  <textarea 
                    value={newUserMetadata} 
                    onChange={e => setNewUserMetadata(e.target.value)} 
                    placeholder='{"role": "user", "plan": "pro"}'
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                  <p className="text-xs text-muted-foreground">Custom JSON metadata to attach to the user.</p>
                </div>
                {addUserError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-600 rounded-md text-sm flex items-start">
                    <XCircle className="h-4 w-4 mr-2 mt-0.5 shrink-0" />
                    {addUserError}
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={resetAddUserModal} disabled={isAddingUser}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isAddingUser || !newUserEmail || !newUserPassword}>
                  {isAddingUser && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create User
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
