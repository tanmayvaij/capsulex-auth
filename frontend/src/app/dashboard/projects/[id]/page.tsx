"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ArrowLeft, Trash2, Search, ChevronLeft, ChevronRight, CheckCircle, XCircle, CheckCircle2, Circle, EyeOff, Eye, Globe, Mail, Users as UsersIcon, Plus } from "lucide-react";
import Link from "next/link";
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

  // Mail Config State
  const [mailConfig, setMailConfig] = useState({
    provider: 'console',
    apiKey: '',
    fromAddress: ''
  });
  const [showApiKey, setShowApiKey] = useState(false);
  const [mailSuccess, setMailSuccess] = useState('');
  const [mailLoading, setMailLoading] = useState(false);

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
        const [projectRes, usersRes] = await Promise.all([
          apiFetch(`/api/developer/projects/${id}`),
          apiFetch(`/api/developer/projects/${id}/users`)
        ]);

        if (!projectRes.ok) {
           router.push("/dashboard");
           return;
        }
        
        const projectData = await projectRes.json();
        const usersData = await usersRes.json();
        
        setProject(projectData);
        setUsers(usersData);
        setMailConfig({
            provider: projectData.mail_provider || 'console',
            apiKey: projectData.zeptomail_api_key || '',
            fromAddress: projectData.zeptomail_from_address || ''
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
                mail_provider: mailConfig.provider,
                zeptomail_api_key: mailConfig.apiKey || null,
                zeptomail_from_address: mailConfig.fromAddress || null
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

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) return;
    
    try {
      const res = await apiFetch(`/api/developer/projects/${id}/users/${userId}`, {
        method: "DELETE",
      });
      
      if (res.ok) {
        setUsers(users.filter(u => u.id !== userId));
      }
    } catch (error) {
      console.error("Failed to delete user", error);
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
      </div>

      {activeTab === 'cors' && (
      <div className="bg-card border border-border rounded-md p-8 shadow-sm animate-in fade-in duration-300">
          <h3 className="text-xl font-semibold mb-2">CORS Settings</h3>
          <p className="text-sm text-muted-foreground mb-8">
              Define which domains are allowed to make authentication requests to this project's API. 
              (e.g., https://yourdomain.com).
          </p>
          <div className="max-w-2xl">
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
          
          <div className="space-y-8 max-w-2xl">
            <div className="space-y-4">
              <label className="text-sm font-semibold text-foreground ml-1">Active Provider</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div 
                  className={`flex items-start p-5 border-2 rounded-md cursor-pointer transition-all ${
                    mailConfig.provider === 'console' 
                      ? 'border-emerald-500/50 bg-emerald-500/5 shadow-[0_0_15px_rgba(16,185,129,0.1)]' 
                      : 'border-border bg-background/30 hover:border-border hover:bg-background/50'
                  }`}
                  onClick={() => setMailConfig({...mailConfig, provider: 'console'})}
                >
                  <div className="flex items-center h-6 mt-0.5">
                    {mailConfig.provider === 'console' ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="ml-4">
                    <span className="block text-sm font-bold text-foreground">Console (Local Dev)</span>
                    <span className="block text-xs text-muted-foreground mt-1">
                      Emails will be printed to the backend terminal instead of being sent.
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
                  <th className="px-6 py-5 font-semibold">Last Signed In</th>
                  <th className="px-6 py-5 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paginatedUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
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
                      <td className="px-6 py-4 text-muted-foreground text-xs">
                        {user.last_signed_in ? `${new Date(user.last_signed_in).toLocaleDateString()} ${new Date(user.last_signed_in).toLocaleTimeString()}` : '-'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleDeleteUser(user.id)}
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
    </div>
  );
}
