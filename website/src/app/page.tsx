"use client";

import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { 
  Code, 
  ShieldCheck, 
  Users, 
  Key, 
  Webhook, 
  MonitorSmartphone,
  ChevronRight,
  Terminal,
  Lock
} from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground selection:bg-primary/30">
      {/* Top Header */}
      <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center justify-between border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 md:px-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center mr-2">
            <ShieldCheck className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-bold text-lg tracking-tight">Capsulex</span>
        </div>
        
        <div className="flex items-center gap-4">
          <a href="https://github.com/tanmayvaij/capsulex-auth" target="_blank" rel="noreferrer" className="flex items-center hover:text-foreground text-muted-foreground transition-colors">
            <Code className="w-5 h-5" />
          </a>
          <a href="http://localhost:5173" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "font-semibold rounded-full")}>
            Sign In
          </a>
        </div>
      </header>

      <main className="flex-1 overflow-auto scroll-smooth">
        <div className="px-6 py-12 md:py-20 md:px-12 lg:px-24">
          
          {/* Introduction Landing Hero */}
          <div id="introduction" className="mb-24 scroll-mt-24 pt-8 md:pt-16 pb-8 border-b border-border/40">
            <div className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-sm font-medium text-primary mb-6">
              <span className="flex h-2 w-2 rounded-full bg-primary mr-2 animate-pulse"></span>
              v1.0.0 is now live
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 bg-gradient-to-r from-white to-white/50 bg-clip-text text-transparent">
              Open-Source Identity <br className="hidden md:block"/> for Modern Apps.
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mb-10 leading-relaxed">
              Capsulex Auth is the complete authentication and identity management platform. Self-hostable, beautifully designed, and built with developer experience in mind.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a href="/docs/installation" className={cn(buttonVariants({ size: "lg" }), "h-12 px-8 text-base font-semibold shadow-lg shadow-primary/20")}>
                Get Started
                <ChevronRight className="w-4 h-4 ml-2" />
              </a>
              <a href="https://github.com/tanmayvaij/capsulex-auth" target="_blank" rel="noreferrer" className={cn(buttonVariants({ variant: "outline", size: "lg" }), "h-12 px-8 text-base font-semibold")}>
                <Code className="w-4 h-4 mr-2" />
                View GitHub
              </a>
            </div>
          </div>

          {/* Features Grid embedded as documentation */}
          <section id="features" className="mb-24 scroll-mt-24">
            <h2 className="text-2xl font-bold tracking-tight mb-8 border-b border-border/40 pb-4">Core Features</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {features.map((feature, i) => (
                <div key={i} className="flex gap-4">
                  <div className="mt-1 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <feature.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-1">{feature.title}</h3>
                    <p className="text-muted-foreground text-sm">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Code Showcase as a Doc Step */}
          <section id="sdk" className="mb-24 scroll-mt-24">
            <h2 className="text-2xl font-bold tracking-tight mb-8 border-b border-border/40 pb-4">TypeScript SDK & RBAC</h2>
            <div className="rounded-xl overflow-hidden border border-border/50 bg-[#0d1117] shadow-2xl">
              <div className="flex items-center px-4 py-3 border-b border-white/10 bg-white/[0.02]">
                <div className="flex space-x-2">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                  <div className="w-3 h-3 rounded-full bg-green-500/80" />
                </div>
                <div className="mx-auto text-xs font-mono text-white/40">auth.ts</div>
              </div>
              <div className="p-6 overflow-x-auto">
                <pre className="text-sm font-mono text-white/80">
                  <code className="language-typescript">
<span className="text-pink-400">import</span> {'{ CapsulexAuth }'} <span className="text-pink-400">from</span> <span className="text-green-300">'capsulex-auth'</span>;{'\n\n'}
<span className="text-blue-400">const</span> auth <span className="text-pink-400">=</span> <span className="text-pink-400">new</span> CapsulexAuth({'{'}{'\n'}
  projectId: <span className="text-green-300">'prj_123abc'</span>,{'\n'}
  apiKey: process.env.CAPSULEX_API_KEY,{'\n'}
{'}'});{'\n\n'}
<span className="text-gray-500">// Log in user securely</span>{'\n'}
<span className="text-blue-400">const</span> user <span className="text-pink-400">=</span> <span className="text-pink-400">await</span> auth.login(email, password);{'\n\n'}
<span className="text-gray-500">// Enforce RBAC anywhere</span>{'\n'}
<span className="text-pink-400">if</span> (auth.hasRole(<span className="text-green-300">'admin'</span>)) {'{'}{'\n'}
  console.log(<span className="text-green-300">"Welcome to the admin panel!"</span>);{'\n'}
{'}'}
                  </code>
                </pre>
              </div>
            </div>
          </section>

        </div>
      </main>
    </div>
  );
}

const features = [
  {
    title: "Multi-Tenancy",
    description: "Built for B2B SaaS. Isolate users by project with dedicated API keys and environment boundaries.",
    icon: Users,
  },
  {
    title: "Granular RBAC",
    description: "Create custom roles, assign precise permissions, and enforce them directly from JWT claims.",
    icon: ShieldCheck,
  },
  {
    title: "Secure Sessions",
    description: "JWTs with automatic refresh token rotation. Revoke specific devices remotely at any time.",
    icon: Lock,
  },
  {
    title: "Developer Dashboard",
    description: "A stunning control plane to manage your users, roles, webhooks, and CORS settings.",
    icon: MonitorSmartphone,
  },
  {
    title: "Webhooks",
    description: "Trigger real-time events when users sign up, log in, or get assigned new roles.",
    icon: Webhook,
  },
  {
    title: "Native SDKs",
    description: "Drop-in TypeScript client that handles token storage, decoding, and API communication.",
    icon: Key,
  },
];
