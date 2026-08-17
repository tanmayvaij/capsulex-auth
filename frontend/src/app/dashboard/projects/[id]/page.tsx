"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ArrowLeft, Trash2, Search, ChevronLeft, ChevronRight, CheckCircle, XCircle, CheckCircle2, Circle, EyeOff, Eye, Globe, Mail, Users as UsersIcon, Plus, Webhook as WebhookIcon, Settings, Activity, MonitorSmartphone } from "lucide-react";
import Link from "next/link";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { apiFetch } from "@/lib/api";

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
    <div className="w-full space-y-8">
      <div>

        <h2 className="text-3xl font-bold tracking-tight mb-2 text-foreground">Project: {project?.name}</h2>
        <p className="text-muted-foreground">Manage project settings and authenticated users.</p>
      </div>

      <div className="flex border-b border-border gap-6 w-full">
        <button 
          onClick={() => setActiveTab('users')} 
          className={`pb-4 flex items-center gap-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'users' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
        >
          <UsersIcon className="h-4 w-4" />
          Users
        </button>
        <button 
          onClick={() => setActiveTab('roles')} 
          className={`pb-4 flex items-center gap-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'roles' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
        >
          <CheckCircle2 className="h-4 w-4" />
          Roles
        </button>
        <button 
          onClick={() => setActiveTab('cors')} 
          className={`pb-4 flex items-center gap-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'cors' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
        >
          <Globe className="h-4 w-4" />
          CORS Settings
        </button>
        <button 
          onClick={() => setActiveTab('mail')} 
          className={`pb-4 flex items-center gap-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'mail' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
        >
          <Mail className="h-4 w-4" />
          Mail Service
        </button>
        <button 
          onClick={() => setActiveTab('webhooks')} 
          className={`pb-4 flex items-center gap-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'webhooks' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
        >
          <WebhookIcon className="h-4 w-4" />
          Webhooks
        </button>
        <button 
          onClick={() => setActiveTab('settings')} 
          className={`pb-4 flex items-center gap-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'settings' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
        >
          <Settings className="h-4 w-4" />
          Settings
        </button>
        <button 
          onClick={() => setActiveTab('analytics')} 
          className={`pb-4 flex items-center gap-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'analytics' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
        >
          <Activity className="h-4 w-4" />
          Analytics
        </button>
      </div>

      {activeTab === 'cors' && (
      <div className="bg-card border border-border rounded-md p-8 shadow-sm animate-in fade-in duration-300">
          <h3 className="text-xl font-semibold mb-2">CORS Settings</h3>
          <p className="text-sm text-muted-foreground mb-8">
              Define which domains are allowed to make authentication requests to this project's API. 
              (e.g., https://yourdomain.com).
          </p>
          <div className="w-full">
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
              className="flex gap-3 mb-8"
            >
                <input 
                    type="text" 
                    placeholder="https://clientapp.com"
                    value={newOrigin}
                    onChange={(e) => setNewOrigin(e.target.value)}
                    className="flex h-12 w-full rounded-md border border-input/50 bg-background/50 px-4 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-transparent transition-all"
                />
                <button
                  type="submit"
                  disabled={corsLoading || !newOrigin.trim()}
                  className="inline-flex items-center justify-center rounded-md text-sm font-semibold transition-all disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] h-12 px-6 shadow-sm shrink-0"
                >
                  {corsLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Plus className="mr-2 h-5 w-5" /> Add Origin</>}
                </button>
            </form>
            
            <div className="space-y-3">
              {(!project?.allowed_origins || project.allowed_origins.length === 0) ? (
                <div className="text-sm text-muted-foreground italic p-6 border-2 border-dashed border-border rounded-md text-center flex flex-col items-center">
                  <Globe className="h-8 w-8 mb-2 text-muted-foreground/50" />
                  No origins configured. API requests from browsers will be blocked.
                </div>
              ) : (
                project.allowed_origins.map((origin: string) => (
                  <div key={origin} className="flex items-center justify-between p-4 border border-border rounded-md bg-background/40 hover:border-primary/50 transition-colors">
                    <span className="text-sm font-medium">{origin}</span>
                    <button
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
                      className="text-muted-foreground hover:text-destructive transition-colors p-2 rounded-md hover:bg-destructive/10 disabled:opacity-50"
                      title="Remove Origin"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
      </div>
      )}

      {activeTab === 'mail' && (
      <div className="bg-card border border-border rounded-md p-8 shadow-sm animate-in fade-in duration-300">
          <h3 className="text-xl font-semibold mb-2">Mail Service Configuration</h3>
          <p className="text-sm text-muted-foreground mb-8">Configure how this project sends emails to its users.</p>
          
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
                    <input
                      type={showApiKey ? "text" : "password"}
                      value={mailConfig.apiKey}
                      onChange={(e) => setMailConfig({...mailConfig, apiKey: e.target.value})}
                      placeholder="Zoho-enczapikey wSsVR60j/0...."
                      className="flex h-12 w-full rounded-md border border-input/50 bg-background/50 px-4 py-2 pr-12 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-transparent transition-all"
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
                  <input
                    type="email"
                    value={mailConfig.fromAddress}
                    onChange={(e) => setMailConfig({...mailConfig, fromAddress: e.target.value})}
                    placeholder="noreply@yourdomain.com"
                    className="flex h-12 w-full rounded-md border border-input/50 bg-background/50 px-4 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-transparent transition-all"
                  />
                </div>
              </div>
            )}
            
            {mailConfig.provider === 'resend' && (
              <div className="pt-6 border-t border-border space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-foreground ml-1">Resend API Key</label>
                  <div className="relative">
                    <input
                      type={showApiKey ? "text" : "password"}
                      value={mailConfig.resendApiKey}
                      onChange={(e) => setMailConfig({...mailConfig, resendApiKey: e.target.value})}
                      placeholder="re_1234567890abcdefghijklmnopqrstuvwx"
                      className="flex h-12 w-full rounded-md border border-input/50 bg-background/50 px-4 py-2 pr-12 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-transparent transition-all"
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
                  <input
                    type="email"
                    value={mailConfig.resendFromAddress}
                    onChange={(e) => setMailConfig({...mailConfig, resendFromAddress: e.target.value})}
                    placeholder="Acme Auth <noreply@yourdomain.com>"
                    className="flex h-12 w-full rounded-md border border-input/50 bg-background/50 px-4 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-transparent transition-all"
                  />
                </div>
              </div>
            )}

            <div className="pt-6 flex items-center gap-4">
              <button
                onClick={handleMailConfigSave}
                disabled={mailLoading}
                className="inline-flex items-center justify-center rounded-md text-sm font-semibold transition-all disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] h-12 px-8 shadow-sm"
              >
                {mailLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Save Configuration"}
              </button>
              {mailSuccess && (
                <div className="flex items-center gap-2 text-sm text-emerald-500 animate-in fade-in bg-emerald-500/10 px-4 py-2 rounded-md">
                  <CheckCircle2 className="h-4 w-4" />
                  {mailSuccess}
                </div>
              )}
            </div>
          </div>
      </div>
      )}

      {activeTab === 'webhooks' && (
      <div className="bg-card border border-border rounded-md p-8 shadow-sm animate-in fade-in duration-300">
          <h3 className="text-xl font-semibold mb-2">Webhook Endpoints</h3>
          <p className="text-sm text-muted-foreground mb-8">
              Configure endpoints to receive secure HTTP POST payloads when events happen in your project.
          </p>
          <div className="w-full">
             <button
               onClick={() => {
                 setEditingWebhook(null);
                 setWebhookFormUrl("");
                 setWebhookFormEvents(AVAILABLE_EVENTS);
                 setShowWebhookModal(true);
               }}
               className="inline-flex items-center justify-center rounded-md text-sm font-semibold transition-all bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 mb-8"
             >
               <Plus className="mr-2 h-4 w-4" /> Add Endpoint
             </button>
             
            <div className="overflow-x-auto rounded-md border border-border bg-background/30">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
                  <tr>
                    <th className="px-6 py-5 font-semibold">Endpoint URL</th>
                    <th className="px-6 py-5 font-semibold">Events</th>
                    <th className="px-6 py-5 font-semibold">Signing Secret</th>
                    <th className="px-6 py-5 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {webhooks.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">
                        <div className="flex flex-col items-center justify-center">
                          <WebhookIcon className="h-8 w-8 mb-2 text-muted-foreground/50" />
                          No webhooks configured. Add one above to start receiving events.
                        </div>
                      </td>
                    </tr>
                  ) : (
                    webhooks.map((webhook: any) => (
                      <tr key={webhook.id} className="hover:bg-muted/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-foreground">{webhook.url}</span>
                            <span className="text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary px-2 py-0.5 rounded-full">Active</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2 flex-wrap">
                            {webhook.events.map((ev: string) => (
                              <span key={ev} className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded border border-border whitespace-nowrap">
                                {ev}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <code className="text-xs font-mono text-emerald-400 bg-black/40 border border-white/5 px-3 py-1.5 rounded-md select-all inline-block">
                            {webhook.secret}
                          </code>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-1">
                            <button
                              onClick={() => {
                                setEditingWebhook(webhook);
                                setWebhookFormUrl(webhook.url);
                                setWebhookFormEvents(webhook.events);
                                setShowWebhookModal(true);
                              }}
                              className="text-muted-foreground hover:text-primary transition-colors p-2 rounded-md hover:bg-primary/10 inline-flex items-center justify-center"
                              title="Edit Webhook"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                            </button>
                            <button
                              onClick={() => setWebhookToDelete(webhook)}
                              className="text-muted-foreground hover:text-destructive transition-colors p-2 rounded-md hover:bg-destructive/10 inline-flex items-center justify-center"
                              title="Delete Webhook"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
      </div>
      )}

      {activeTab === 'users' && (
      <div className="bg-card border border-border rounded-md p-8 shadow-sm animate-in fade-in duration-300">
        <h3 className="text-xl font-semibold mb-6">Users</h3>

        <div>
          <div className="mb-6 relative max-w-md">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-muted-foreground" />
            </div>
            <input
              type="text"
              placeholder="Search by email or ID..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="flex h-12 w-full rounded-md border border-input/50 bg-background/50 pl-12 pr-4 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-transparent transition-all"
            />
          </div>

          <div className="overflow-x-auto rounded-md border border-border bg-background/30">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
                <tr>
                  <th className="px-6 py-5 font-semibold">User ID</th>
                  <th className="px-6 py-5 font-semibold">Email</th>
                  <th className="px-6 py-5 font-semibold">Verified</th>
                  <th className="px-6 py-5 font-semibold">Status</th>
                  <th className="px-6 py-5 font-semibold">Roles</th>
                  <th className="px-6 py-5 font-semibold">Metadata</th>
                  <th className="px-6 py-5 font-semibold">Last Signed In</th>
                  <th className="px-6 py-5 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paginatedUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                      No users found.
                    </td>
                  </tr>
                ) : (
                  paginatedUsers.map(user => (
                    <tr key={user.id} className="hover:bg-muted/50 transition-colors">
                      <td className="px-6 py-4">
                        <code className="text-xs font-mono bg-black/40 border border-white/5 px-2 py-1 rounded-lg text-muted-foreground">
                          {user.id}
                        </code>
                      </td>
                      <td className="px-6 py-4 font-medium text-foreground">
                        {user.email}
                      </td>
                      <td className="px-6 py-4">
                        {user.is_email_verified ? (
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-full w-max border border-emerald-500/20">
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Verified</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-full w-max border border-border">
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Unverified</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <button 
                          onClick={() => handleToggleStatus(user.id, user.is_active)}
                          className={`inline-flex items-center text-xs font-semibold px-3 py-1 rounded-full border cursor-pointer hover:opacity-80 transition-opacity ${user.is_active ? 'bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 hover:border-primary/40' : 'bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20 hover:border-destructive/40'}`}
                          title={`Click to ${user.is_active ? 'disable' : 'enable'} account`}
                        >
                          {user.is_active ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {user.roles && user.roles.length > 0 ? (
                            user.roles.map((role: string) => (
                              <span key={role} className="text-[10px] bg-primary/10 text-primary border border-primary/20 px-1.5 py-0.5 rounded">
                                {role}
                              </span>
                            ))
                          ) : (
                            <span className="text-[10px] text-muted-foreground italic">None</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <code className="text-[10px] text-muted-foreground bg-muted/30 px-2 py-1 rounded border border-border truncate block max-w-[120px]" title={JSON.stringify(user.user_metadata || {}, null, 2)}>
                          {JSON.stringify(user.user_metadata || {})}
                        </code>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground text-xs">
                        {user.last_signed_in ? `${new Date(user.last_signed_in).toLocaleDateString()} ${new Date(user.last_signed_in).toLocaleTimeString()}` : '-'}
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button
                          onClick={() => {
                            setSelectedUserForRoles(user);
                            setShowUserRoleModal(true);
                          }}
                          className="inline-flex items-center justify-center text-muted-foreground hover:text-white hover:bg-white/10 p-2.5 rounded-md transition-colors cursor-pointer"
                          title="Manage Roles"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleViewSessions(user.id)}
                          className="inline-flex items-center justify-center text-muted-foreground hover:text-white hover:bg-white/10 p-2.5 rounded-md transition-colors cursor-pointer"
                          title="View Active Sessions"
                        >
                          <MonitorSmartphone className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setUserToDelete(user.id)}
                          className="inline-flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 p-2.5 rounded-md transition-colors cursor-pointer"
                          title="Delete User"
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
          
          <div className="flex items-center justify-between mt-6 pt-2">
            <div className="text-sm text-muted-foreground">
              Showing <span className="font-semibold text-foreground">{filteredUsers.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1}</span> to <span className="font-semibold text-foreground">{Math.min(currentPage * PAGE_SIZE, filteredUsers.length)}</span> of <span className="font-semibold text-foreground">{filteredUsers.length}</span> users
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="inline-flex items-center justify-center p-2 rounded-md border border-input/50 bg-background/50 hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <span className="text-sm font-medium px-2 text-muted-foreground">Page {currentPage} of {totalPages}</span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="inline-flex items-center justify-center p-2 rounded-md border border-input/50 bg-background/50 hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
      )}

      {activeTab === 'roles' && (
        <div className="bg-card border border-border rounded-md p-8 shadow-sm animate-in fade-in duration-300">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-semibold mb-2">Roles & Permissions</h3>
              <p className="text-sm text-muted-foreground">Define roles and their granular permissions to assign to your users.</p>
            </div>
            <button
              onClick={() => {
                setEditingRole(null);
                setRoleFormName('');
                setRoleFormDesc('');
                setRoleFormPerms([]);
                setShowRoleModal(true);
              }}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2 gap-2"
            >
              <Plus className="h-4 w-4" />
              Create Role
            </button>
          </div>

          <div className="space-y-4">
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
                      <span key={p.id} className="text-xs font-medium px-2.5 py-1 bg-primary/10 text-primary border border-primary/20 rounded-md">
                        {p.action}
                      </span>
                    ))}
                    {(!role.permissions || role.permissions.length === 0) && (
                      <span className="text-xs text-muted-foreground italic">No permissions assigned</span>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditingRole(role);
                      setRoleFormName(role.name);
                      setRoleFormDesc(role.description || '');
                      setRoleFormPerms(role.permissions?.map((p: any) => p.action) || []);
                      setShowRoleModal(true);
                    }}
                    className="p-2 text-muted-foreground hover:text-primary transition-colors border border-transparent hover:border-border rounded-md"
                  >
                    <Settings className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setRoleToDelete(role)}
                    className="p-2 text-muted-foreground hover:text-destructive transition-colors border border-transparent hover:border-border rounded-md"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
            {roles.length === 0 && (
              <div className="text-center py-12 border border-dashed border-border rounded-xl">
                <p className="text-muted-foreground">No roles configured yet.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
      <div className="bg-card border border-border rounded-md p-8 shadow-sm animate-in fade-in duration-300">
        <h3 className="text-xl font-semibold mb-2">Project Settings</h3>
        <p className="text-sm text-muted-foreground mb-8">
            Manage general configuration and security settings for this project.
        </p>
        
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

        <div className="w-full">
          <div className="flex items-center justify-between p-5 border border-border bg-background/30 rounded-lg max-w-2xl">
            <div className="space-y-0.5 pr-4">
              <h4 className="text-sm font-semibold text-foreground">Allow Public Registration</h4>
              <p className="text-xs text-muted-foreground">If disabled, new users cannot sign up using this project's API key. You can still manually create users via the admin dashboard.</p>
            </div>
            
            <button
              onClick={async () => {
                const newVal = !allowPublicRegistration;
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
              disabled={settingsLoading}
              className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50 ${allowPublicRegistration ? 'bg-primary' : 'bg-muted'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${allowPublicRegistration ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
        </div>
      </div>
      )}
      
      {showWebhookModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-lg shadow-xl w-full max-w-lg p-6 animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold mb-4">{editingWebhook ? 'Edit Webhook' : 'Create Webhook'}</h3>
            
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
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Endpoint URL</label>
                  <input 
                      type="url" 
                      required
                      placeholder="https://api.yourdomain.com/webhooks"
                      value={webhookFormUrl}
                      onChange={(e) => setWebhookFormUrl(e.target.value)}
                      className="flex h-11 w-full rounded-md border border-input/50 bg-background/50 px-3 py-2 text-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold mb-2">Events to Subscribe To</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto p-1">
                    {AVAILABLE_EVENTS.map(ev => (
                      <label key={ev} className={`flex items-center gap-3 p-3 rounded-md border cursor-pointer transition-colors ${webhookFormEvents.includes(ev) ? 'border-primary/50 bg-primary/10' : 'border-border bg-background/50 hover:bg-muted/50'}`}>
                        <input 
                          type="checkbox"
                          className="h-4 w-4 rounded border-primary text-primary focus:ring-primary focus:ring-offset-background bg-transparent"
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
              
              <div className="flex items-center justify-end gap-3 mt-8">
                <button
                  type="button"
                  onClick={() => setShowWebhookModal(false)}
                  className="px-4 py-2 text-sm font-medium rounded-md hover:bg-muted transition-colors border border-border"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={webhookLoading || !webhookFormUrl.trim() || webhookFormEvents.length === 0}
                  className="inline-flex items-center justify-center rounded-md text-sm font-semibold transition-all bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 h-10 px-6"
                >
                  {webhookLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  {editingWebhook ? 'Save Changes' : 'Create Webhook'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Analytics & Logs */}
      {activeTab === 'analytics' && (
        <div className="space-y-8 animate-in fade-in duration-300">
          <div className="bg-card border border-border rounded-md p-8 shadow-sm">
            <h3 className="text-xl font-semibold mb-2">Activity Overview (Last 30 Days)</h3>
            <p className="text-sm text-muted-foreground mb-8">
              Track successful user logins and new account creations.
            </p>
            {analyticsLoading ? (
              <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="h-80 w-full">
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
          </div>

          <div className="bg-card border border-border rounded-md shadow-sm overflow-hidden">
            <div className="p-6 border-b border-border">
              <h3 className="text-xl font-semibold mb-2">Audit Logs</h3>
              <p className="text-sm text-muted-foreground">
                Raw events showing the last 100 authentication actions for this project.
              </p>
            </div>
            
            {analyticsLoading ? (
              <div className="flex h-32 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : auditLogs.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground border-t border-border">
                No logs available yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground uppercase bg-muted/30 border-b border-border">
                    <tr>
                      <th className="px-6 py-4 font-medium">Timestamp</th>
                      <th className="px-6 py-4 font-medium">Event</th>
                      <th className="px-6 py-4 font-medium">User ID</th>
                      <th className="px-6 py-4 font-medium">IP Address</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-muted/10 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-muted-foreground">
                          {new Date(log.created_at).toLocaleString()}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                            log.event_type === 'user.created' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                            log.event_type.includes('success') ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                            'bg-destructive/10 text-destructive border-destructive/20'
                          }`}>
                            {log.event_type}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap font-mono text-xs text-muted-foreground">
                          {log.user_id || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap font-mono text-xs text-muted-foreground">
                          {log.ip_address || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Webhook Delete Modal */}
      {webhookToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="bg-card border border-border shadow-lg rounded-2xl p-6 w-full max-w-md animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-bold text-foreground mb-2">Delete Webhook</h3>
            <p className="text-muted-foreground text-sm mb-6">
              Are you sure you want to delete the webhook <span className="font-semibold text-foreground">{webhookToDelete.url}</span>? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setWebhookToDelete(null)}
                disabled={isDeletingItem}
                className="px-4 py-2 text-sm font-medium rounded-lg text-muted-foreground hover:bg-muted/50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteWebhook}
                disabled={isDeletingItem}
                className="px-4 py-2 text-sm font-medium rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors flex items-center gap-2"
              >
                {isDeletingItem ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Delete Modal */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="bg-card border border-border shadow-lg rounded-2xl p-6 w-full max-w-md animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-bold text-foreground mb-2">Delete User</h3>
            <p className="text-muted-foreground text-sm mb-6">
              Are you sure you want to delete this user? They will lose all access. This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setUserToDelete(null)}
                disabled={isDeletingItem}
                className="px-4 py-2 text-sm font-medium rounded-lg text-muted-foreground hover:bg-muted/50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteUser}
                disabled={isDeletingItem}
                className="px-4 py-2 text-sm font-medium rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors flex items-center gap-2"
              >
                {isDeletingItem ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {showSessionsModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-card border border-border rounded-xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
            <div className="p-6 border-b border-border flex justify-between items-center bg-muted/30">
              <div>
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <MonitorSmartphone className="h-5 w-5 text-indigo-400" />
                  Active Sessions
                </h3>
                <p className="text-sm text-muted-foreground mt-1">Manage devices where this user is currently logged in</p>
              </div>
              <button 
                onClick={() => setShowSessionsModal(false)}
                className="text-muted-foreground hover:text-foreground transition-colors p-2 rounded-full hover:bg-muted"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <div className="flex justify-end mb-4">
                <button
                  onClick={handleRevokeAllSessions}
                  disabled={sessionsLoading || activeSessions.length === 0}
                  className="px-4 py-2 text-sm font-medium rounded-lg bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Trash2 className="h-4 w-4" />
                  Revoke All Sessions
                </button>
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
                          <span className={`font-mono text-xs px-2 py-1 rounded-md ${session.is_revoked ? 'bg-destructive/20 text-destructive' : 'bg-primary/10 text-primary border border-primary/20'}`}>
                            {session.ip_address || 'Unknown IP'}
                          </span>
                          {session.is_revoked && (
                            <span className="text-xs font-medium text-destructive px-2 py-0.5 rounded-full bg-destructive/20">Revoked</span>
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
                          <button
                            onClick={() => handleRevokeSession(session.id)}
                            className="px-3 py-1.5 text-xs font-medium rounded border border-border text-foreground hover:bg-destructive hover:border-destructive hover:text-destructive-foreground transition-colors w-full md:w-auto whitespace-nowrap"
                          >
                            Revoke Access
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showRoleModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-card border border-border rounded-xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col">
            <div className="p-6 border-b border-border flex justify-between items-center bg-muted/30">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                {editingRole ? 'Edit Role' : 'Create Role'}
              </h3>
              <button 
                onClick={() => setShowRoleModal(false)}
                className="text-muted-foreground hover:text-foreground transition-colors p-2 rounded-full hover:bg-muted"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Role Name</label>
                <input
                  type="text"
                  value={roleFormName}
                  onChange={e => setRoleFormName(e.target.value)}
                  placeholder="e.g. admin, editor, viewer"
                  className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1.5">Description (Optional)</label>
                <input
                  type="text"
                  value={roleFormDesc}
                  onChange={e => setRoleFormDesc(e.target.value)}
                  placeholder="e.g. Full administrative access"
                  className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1.5">Permissions</label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
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
                    className="flex-1 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all"
                  />
                  <button
                    onClick={() => {
                      if (newPermInput.trim() && !roleFormPerms.includes(newPermInput.trim())) {
                        setRoleFormPerms([...roleFormPerms, newPermInput.trim()]);
                        setNewPermInput('');
                      }
                    }}
                    className="h-10 px-4 rounded-md bg-muted text-foreground hover:bg-muted/80 text-sm font-medium transition-colors border border-border"
                  >
                    Add
                  </button>
                </div>
                
                <div className="bg-muted/20 border border-border rounded-md p-3 min-h-[100px] flex flex-wrap gap-2 items-start content-start">
                  {roleFormPerms.map(perm => (
                    <span key={perm} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-primary/10 text-primary border border-primary/20 text-xs font-medium">
                      {perm}
                      <button onClick={() => setRoleFormPerms(roleFormPerms.filter(p => p !== perm))} className="hover:text-destructive">
                        <XCircle className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                  {roleFormPerms.length === 0 && (
                    <span className="text-sm text-muted-foreground italic w-full text-center mt-6">No permissions added</span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-border flex justify-end gap-3 bg-muted/10">
              <button 
                onClick={() => setShowRoleModal(false)}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveRole}
                disabled={rolesLoading || !roleFormName.trim()}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2 min-w-[100px] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {rolesLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Role'}
              </button>
            </div>
          </div>
        </div>
      )}

      {roleToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-card border border-border rounded-xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 flex flex-col items-center text-center space-y-4">
              <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center text-destructive mb-2">
                <Trash2 className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold text-foreground">Delete Role?</h3>
              <p className="text-sm text-muted-foreground">
                Are you sure you want to delete the role <span className="font-semibold text-foreground">{roleToDelete.name}</span>? 
                This will remove the role from any users currently assigned to it. This action cannot be undone.
              </p>
            </div>
            <div className="p-6 bg-muted/30 border-t border-border flex gap-3">
              <button
                onClick={() => setRoleToDelete(null)}
                className="flex-1 inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
                disabled={isDeletingItem}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteRole}
                disabled={isDeletingItem}
                className="flex-1 inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90 h-10 px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeletingItem ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {isDeletingItem ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showUserRoleModal && selectedUserForRoles && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-card border border-border rounded-xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col">
            <div className="p-6 border-b border-border flex justify-between items-center bg-muted/30">
              <div>
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  Manage User Roles
                </h3>
                <p className="text-sm text-muted-foreground mt-1 truncate max-w-[300px]">{selectedUserForRoles.email}</p>
              </div>
              <button 
                onClick={() => setShowUserRoleModal(false)}
                className="text-muted-foreground hover:text-foreground transition-colors p-2 rounded-full hover:bg-muted"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {roles.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">No roles configured in this project.</p>
                  <button onClick={() => { setShowUserRoleModal(false); setActiveTab('roles'); }} className="text-sm text-primary hover:underline">Go to Roles tab to create one</button>
                </div>
              ) : (
                <div className="space-y-3">
                  {roles.map(role => {
                    const hasRole = selectedUserForRoles.roles?.includes(role.name);
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
            
            <div className="p-6 border-t border-border flex justify-end gap-3 bg-muted/10">
              <button 
                onClick={() => setShowUserRoleModal(false)}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSaveUserRoles(selectedUserForRoles.id, selectedUserForRoles.roles || [])}
                disabled={roles.length === 0}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save Assignment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
