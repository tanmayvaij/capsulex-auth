"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ArrowLeft, Trash2, ShieldCheck, LogOut, Search, ChevronLeft, ChevronRight, Settings, CheckCircle, XCircle, CheckCircle2, Circle, EyeOff, Eye, Globe, Mail, Users as UsersIcon, Plus, Book, User } from "lucide-react";
import Link from "next/link";
import { useAppTitle } from "@/hooks/useAppTitle";

export default function ProjectUsersPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [project, setProject] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [developer, setDeveloper] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const { title } = useAppTitle();
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
      const token = localStorage.getItem("developer_token");
      if (!token) {
        router.push("/login");
        return;
      }
      
      if (!id) return;

      try {
        const [projectRes, usersRes, devRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/developer/projects/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/developer/projects/${id}/users`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/developer/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
          })
        ]);

        if (!projectRes.ok) {
           if (projectRes.status === 401 || projectRes.status === 403) {
             throw new Error("Unauthorized");
           }
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
        if (error.message === "Unauthorized") {
          localStorage.removeItem("admin_token");
          router.push("/login");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, router]);

  const handleMailConfigSave = async () => {
    setMailLoading(true);
    setMailSuccess("");
    const token = localStorage.getItem("developer_token");
    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/developer/projects/${id}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
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
    
    const token = localStorage.getItem("developer_token");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/developer/projects/${id}/users/${userId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      
      if (res.ok) {
        setUsers(users.filter(u => u.id !== userId));
      }
    } catch (error) {
      console.error("Failed to delete user", error);
    }
  };

  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    const token = localStorage.getItem("developer_token");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/developer/projects/${id}/users/${userId}/status`, {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${token}`,
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

  const handleLogout = () => {
    localStorage.removeItem("developer_token");
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-background flex flex-col">
      <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center px-8 justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-primary/20 text-primary border border-primary/30">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
              {title}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {developer && (
              <span className="text-sm text-muted-foreground mr-4 hidden md:inline-block">
                {developer.email}
              </span>
            )}
            <Link
              href="/dashboard/docs"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2 text-muted-foreground hover:text-foreground"
            >
              <Book className="mr-2 h-4 w-4" />
              Docs
            </Link>
            <Link
              href="/dashboard/profile"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2 text-muted-foreground hover:text-foreground"
            >
              <User className="mr-2 h-4 w-4" />
              Profile
            </Link>
            <button
              onClick={handleLogout}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-destructive/10 hover:text-destructive h-9 px-4 py-2 text-muted-foreground"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      <main className="flex-1 p-8 w-full">
        <div className="mb-8">
          <Link 
            href="/dashboard"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Projects
          </Link>
          
          <h2 className="text-3xl font-bold tracking-tight mb-2">Project: {project?.name}</h2>
          <p className="text-muted-foreground mb-8">Manage project settings and authenticated users.</p>

          <div className="flex border-b border-border/40 gap-6 w-full">
            <button 
              onClick={() => setActiveTab('users')} 
              className={`pb-3 flex items-center gap-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'users' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
            >
              <UsersIcon className="h-4 w-4" />
              Users
            </button>
            <button 
              onClick={() => setActiveTab('cors')} 
              className={`pb-3 flex items-center gap-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'cors' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
            >
              <Globe className="h-4 w-4" />
              CORS Settings
            </button>
            <button 
              onClick={() => setActiveTab('mail')} 
              className={`pb-3 flex items-center gap-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'mail' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
            >
              <Mail className="h-4 w-4" />
              Mail Service
            </button>
          </div>
        </div>

        {activeTab === 'cors' && (
        <div className="bg-background/50 border border-border rounded-lg p-6 mb-8 animate-in fade-in duration-300">
            <h3 className="text-lg font-semibold mb-4">CORS Settings</h3>
            <p className="text-sm text-muted-foreground mb-6">
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
                  const token = localStorage.getItem("developer_token");
                  
                  setCorsLoading(true);
                  try {
                      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/developer/projects/${id}`, {
                          method: "PATCH",
                          headers: {
                              "Content-Type": "application/json",
                              "Authorization": `Bearer ${token}`
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
                className="flex gap-2 mb-6"
              >
                  <input 
                      type="text" 
                      placeholder="https://clientapp.com"
                      value={newOrigin}
                      onChange={(e) => setNewOrigin(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={corsLoading || !newOrigin.trim()}
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 shrink-0"
                  >
                    {corsLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Plus className="mr-2 h-4 w-4" /> Add</>}
                  </button>
              </form>
              
              <div className="space-y-2">
                {(!project?.allowed_origins || project.allowed_origins.length === 0) ? (
                  <div className="text-sm text-muted-foreground italic p-4 border border-dashed border-border rounded-md text-center">
                    No origins configured. API requests from browsers will be blocked.
                  </div>
                ) : (
                  project.allowed_origins.map((origin: string) => (
                    <div key={origin} className="flex items-center justify-between p-3 border border-border rounded-md bg-background hover:border-primary/30 transition-colors">
                      <span className="text-sm font-medium">{origin}</span>
                      <button
                        onClick={async () => {
                          const updatedOrigins = project.allowed_origins.filter((o: string) => o !== origin);
                          const token = localStorage.getItem("developer_token");
                          
                          setCorsLoading(true);
                          try {
                              const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/developer/projects/${id}`, {
                                  method: "PATCH",
                                  headers: {
                                      "Content-Type": "application/json",
                                      "Authorization": `Bearer ${token}`
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
                        className="text-muted-foreground hover:text-destructive transition-colors p-1 rounded-md hover:bg-destructive/10 disabled:opacity-50"
                        title="Remove Origin"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
        </div>
        )}

        {activeTab === 'mail' && (
        <div className="bg-background/50 border border-border rounded-lg p-6 mb-8 animate-in fade-in duration-300">
            <h3 className="text-lg font-semibold mb-6">Mail Service Configuration</h3>
            
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-sm font-medium">Active Provider</label>
                <div className="grid grid-cols-2 gap-4">
                  <div 
                    className={`flex items-start p-4 border rounded-md cursor-pointer transition-colors ${
                      mailConfig.provider === 'console' 
                        ? 'border-emerald-500/50 bg-emerald-500/5' 
                        : 'border-border bg-background hover:bg-accent/50'
                    }`}
                    onClick={() => setMailConfig({...mailConfig, provider: 'console'})}
                  >
                    <div className="flex items-center h-5">
                      {mailConfig.provider === 'console' ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <Circle className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <div className="ml-3">
                      <span className="block text-sm font-medium">Console (Local Dev)</span>
                      <span className="block text-xs text-muted-foreground mt-1">
                        Emails will be printed to the backend terminal instead of being sent.
                      </span>
                    </div>
                    {mailConfig.provider === 'console' && (
                      <span className="ml-auto text-[10px] font-medium uppercase tracking-wider text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                        Active
                      </span>
                    )}
                  </div>
                  
                  <div 
                    className={`flex items-start p-4 border rounded-md cursor-pointer transition-colors ${
                      mailConfig.provider === 'zeptomail' 
                        ? 'border-emerald-500/50 bg-emerald-500/5' 
                        : 'border-border bg-background hover:bg-accent/50'
                    }`}
                    onClick={() => setMailConfig({...mailConfig, provider: 'zeptomail'})}
                  >
                    <div className="flex items-center h-5">
                      {mailConfig.provider === 'zeptomail' ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <Circle className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <div className="ml-3">
                      <span className="block text-sm font-medium">ZeptoMail</span>
                      <span className="block text-xs text-muted-foreground mt-1">
                        Send real emails using the Zoho ZeptoMail API.
                      </span>
                    </div>
                    {mailConfig.provider === 'zeptomail' && (
                      <span className="ml-auto text-[10px] font-medium uppercase tracking-wider text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                        Active
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {mailConfig.provider === 'zeptomail' && (
                <div className="pt-4 border-t border-border space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">ZeptoMail API Key</label>
                    <div className="relative">
                      <input
                        type={showApiKey ? "text" : "password"}
                        value={mailConfig.apiKey}
                        onChange={(e) => setMailConfig({...mailConfig, apiKey: e.target.value})}
                        placeholder="Zoho-enczapikey wSsVR60j/0...."
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 pr-10 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-colors"
                      />
                      <button 
                        type="button"
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">From Address</label>
                    <input
                      type="email"
                      value={mailConfig.fromAddress}
                      onChange={(e) => setMailConfig({...mailConfig, fromAddress: e.target.value})}
                      placeholder="noreply@yourdomain.com"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-colors"
                    />
                  </div>
                </div>
              )}

              <div className="pt-4 flex items-center gap-4">
                <button
                  onClick={handleMailConfigSave}
                  disabled={mailLoading}
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                >
                  {mailLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Save Mail Config
                </button>
                {mailSuccess && (
                  <span className="text-sm text-emerald-500 animate-in fade-in">{mailSuccess}</span>
                )}
              </div>
            </div>
        </div>
        )}

        {activeTab === 'users' && (
        <div className="animate-in fade-in duration-300">
        <h3 className="text-2xl font-bold tracking-tight mb-4">Users</h3>

        <div className="bg-background/50 border border-border rounded-lg p-6">
          <div className="mb-6 relative max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-muted-foreground" />
            </div>
            <input
              type="text"
              placeholder="Search by email or ID..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="flex h-10 w-full rounded-md border border-input bg-background pl-10 pr-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border/50">
                <tr>
                  <th className="px-6 py-4 font-medium">User ID</th>
                  <th className="px-6 py-4 font-medium">Email</th>
                  <th className="px-6 py-4 font-medium">Verified</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Last Signed In</th>
                  <th className="px-6 py-4 font-medium">Created At</th>
                  <th className="px-6 py-4 font-medium">Updated At</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedUsers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-muted-foreground italic bg-background/30">
                      No users found.
                    </td>
                  </tr>
                ) : (
                  paginatedUsers.map(user => (
                    <tr key={user.id} className="bg-background border-b border-border/30 hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4">
                        <code className="text-xs bg-muted border border-border/50 px-2 py-1 rounded text-muted-foreground">
                          {user.id}
                        </code>
                      </td>
                      <td className="px-6 py-4 font-medium text-foreground">
                        {user.email}
                      </td>
                      <td className="px-6 py-4">
                        {user.is_email_verified ? (
                          <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-full w-max border border-emerald-500/20">
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Verified</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded-full w-max border border-border">
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Unverified</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <button 
                          onClick={() => handleToggleStatus(user.id, user.is_active)}
                          className={`inline-flex items-center text-xs px-2.5 py-1 rounded-full border cursor-pointer hover:opacity-80 transition-opacity ${user.is_active ? 'bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 hover:border-primary/40' : 'bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20 hover:border-destructive/40'}`}
                          title={`Click to ${user.is_active ? 'disable' : 'enable'} account`}
                        >
                          {user.is_active ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {user.last_signed_in ? `${new Date(user.last_signed_in).toLocaleDateString()} ${new Date(user.last_signed_in).toLocaleTimeString()}` : '-'}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {new Date(user.created_at).toLocaleDateString()} {new Date(user.created_at).toLocaleTimeString()}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {user.updated_at ? `${new Date(user.updated_at).toLocaleDateString()} ${new Date(user.updated_at).toLocaleTimeString()}` : '-'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="inline-flex items-center justify-center text-muted-foreground hover:text-red-500 hover:bg-red-500/10 p-2 rounded-md transition-colors cursor-pointer"
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
          
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-border/50">
            <div className="text-sm text-muted-foreground">
              Showing <span className="font-medium text-foreground">{filteredUsers.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1}</span> to <span className="font-medium text-foreground">{Math.min(currentPage * PAGE_SIZE, filteredUsers.length)}</span> of <span className="font-medium text-foreground">{filteredUsers.length}</span> users
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="inline-flex items-center justify-center p-2 rounded-md border border-input bg-background hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-sm px-2 text-muted-foreground">Page {currentPage} of {totalPages}</span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="inline-flex items-center justify-center p-2 rounded-md border border-input bg-background hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
        </div>
        )}
      </main>
    </div>
  );
}
