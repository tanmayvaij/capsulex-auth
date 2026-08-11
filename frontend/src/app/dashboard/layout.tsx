"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Loader2, LayoutDashboard, User, Book, LogOut, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useAppTitle } from "@/hooks/useAppTitle";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [developer, setDeveloper] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { title } = useAppTitle();

  useEffect(() => {
    const fetchDev = async () => {
      const token = localStorage.getItem("developer_token");
      if (!token) {
        router.push("/login");
        return;
      }

      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/developer/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (!res.ok) {
          throw new Error("Unauthorized");
        }
        
        const data = await res.json();
        setDeveloper(data);
      } catch (e) {
        localStorage.removeItem("developer_token");
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };
    
    fetchDev();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("developer_token");
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Profile", href: "/dashboard/profile", icon: User },
  ];

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside className={`${isCollapsed ? 'w-20' : 'w-64'} transition-all duration-300 flex-shrink-0 bg-card border-r border-border/50 hidden md:flex flex-col relative`}>
        {/* Toggle Button */}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-8 bg-card border border-border/50 rounded-full p-1 text-muted-foreground hover:text-foreground z-10"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`}>
            <path d="m15 18-6-6 6-6"/>
          </svg>
        </button>

        <div className="h-20 flex items-center px-4">
          <div className="flex items-center gap-3 overflow-hidden whitespace-nowrap">
            <div className="w-10 h-10 rounded-md flex items-center justify-center text-primary bg-primary/10 shrink-0 mx-auto">
              <ShieldCheck className="h-5 w-5" />
            </div>
            {!isCollapsed && (
              <div>
                <h1 className="font-bold tracking-tight text-foreground">{title}</h1>
                <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Developer</p>
              </div>
            )}
          </div>
        </div>

        <nav className="flex-1 px-3 py-6 space-y-2 overflow-hidden">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            const Icon = item.icon;
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-3 rounded-full transition-all font-medium whitespace-nowrap ${
                  isActive 
                    ? "text-foreground bg-primary/10 text-primary font-bold" 
                    : "text-muted-foreground hover:text-foreground hover:bg-primary/5"
                } ${isCollapsed ? 'justify-center' : ''}`}
                title={isCollapsed ? item.name : undefined}
              >
                <div className={`p-2 rounded-full transition-colors shrink-0 ${isActive ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30" : "bg-transparent text-muted-foreground"}`}>
                  <Icon className="h-4 w-4" />
                </div>
                {!isCollapsed && <span>{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-border/50 overflow-hidden">
          {developer && !isCollapsed && (
            <div className="flex items-center gap-3 px-3 py-3 mb-2 whitespace-nowrap">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold shrink-0">
                {developer.email.charAt(0).toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-medium text-foreground truncate">{developer.email}</p>
              </div>
            </div>
          )}
          
          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors whitespace-nowrap ${isCollapsed ? 'justify-center mt-2' : ''}`}
            title={isCollapsed ? "Sign Out" : undefined}
          >
            <LogOut className="h-5 w-5 shrink-0" />
            {!isCollapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Nav Header */}
        <header className="h-16 border-b border-border/50 bg-card md:hidden flex items-center justify-between px-4">
           <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-primary bg-primary/10">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <h1 className="font-bold tracking-tight text-foreground">{title}</h1>
          </div>
          <button onClick={handleLogout} className="p-2 text-muted-foreground hover:text-destructive">
            <LogOut className="h-5 w-5" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
