"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Book, Code, CheckCircle2, Copy, ShieldCheck, User, LogOut } from "lucide-react";
import Link from "next/link";
import { useAppTitle } from "@/hooks/useAppTitle";

export default function DocsPage() {
  const { title } = useAppTitle();
  const [activeTab, setActiveTab] = useState<'fetch' | 'axios' | 'sdk'>('sdk');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [developer, setDeveloper] = useState<any>(null);

  useEffect(() => {
    const fetchDev = async () => {
      const token = localStorage.getItem("developer_token");
      if (token) {
        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/developer/auth/me`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            setDeveloper(data);
          }
        } catch (e) {
          // ignore
        }
      }
    };
    fetchDev();
  }, []);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const handleLogout = () => {
    localStorage.removeItem("developer_token");
    window.location.href = "/login";
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(text);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const getCodeSnippet = (method: 'register' | 'login' | 'me' | 'send-verification-email' | 'verify-email' | 'forgot-password' | 'reset-password') => {
    if (activeTab === 'fetch') {
      if (method === 'register') {
        return `const registerUser = async (email, password) => {
  const response = await fetch("${API_URL}/api/auth/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": "proj_YOUR_API_KEY_HERE"
    },
    body: JSON.stringify({ email, password })
  });
  
  if (!response.ok) {
    throw new Error("Failed to register");
  }
  
  return await response.json();
};`;
      }
      if (method === 'login') {
        return `const loginUser = async (email, password) => {
  const response = await fetch("${API_URL}/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": "proj_YOUR_API_KEY_HERE"
    },
    body: JSON.stringify({ email, password })
  });
  
  if (!response.ok) {
    throw new Error("Invalid credentials");
  }
  
  const data = await response.json();
  // Store data.access_token securely (e.g. HttpOnly cookies or memory)
  return data;
};`;
      }
      if (method === 'me') {
        return `const getCurrentUser = async (accessToken) => {
  const response = await fetch("${API_URL}/api/auth/me", {
    method: "GET",
    headers: {
      "Authorization": "Bearer " + accessToken,
      "X-API-Key": "proj_YOUR_API_KEY_HERE"
    }
  });
  
  if (!response.ok) {
    throw new Error("Not authenticated");
  }
  
  return await response.json();
};`;
      }
      if (method === 'send-verification-email') {
        return `const sendVerificationEmail = async (email) => {
  const response = await fetch("${API_URL}/api/auth/send-verification-email", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": "proj_YOUR_API_KEY_HERE"
    },
    body: JSON.stringify({ email })
  });
  
  if (!response.ok) {
    throw new Error("Failed to send verification email");
  }
  
  return await response.json();
};`;
      }
      if (method === 'verify-email') {
        return `const verifyEmail = async (token) => {
  const response = await fetch("${API_URL}/api/auth/verify-email", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": "proj_YOUR_API_KEY_HERE"
    },
    body: JSON.stringify({ token })
  });
  
  if (!response.ok) {
    throw new Error("Failed to verify email");
  }
  
  return await response.json();
};`;
      }
      if (method === 'forgot-password') {
        return `const forgotPassword = async (email) => {
  const response = await fetch("${API_URL}/api/auth/forgot-password", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": "proj_YOUR_API_KEY_HERE"
    },
    body: JSON.stringify({ email })
  });
  
  if (!response.ok) {
    throw new Error("Failed to process forgot password request");
  }
  
  return await response.json();
};`;
      }
      if (method === 'reset-password') {
        return `const resetPassword = async (token, new_password) => {
  const response = await fetch("${API_URL}/api/auth/reset-password", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": "proj_YOUR_API_KEY_HERE"
    },
    body: JSON.stringify({ token, new_password })
  });
  
  if (!response.ok) {
    throw new Error("Failed to reset password");
  }
  
  return await response.json();
};`;
      }
    } else if (activeTab === 'axios') {
      // Axios
      if (method === 'register') {
        return `import axios from 'axios';

const api = axios.create({
  baseURL: "${API_URL}",
  headers: {
    "X-API-Key": "proj_YOUR_API_KEY_HERE"
  }
});

const registerUser = async (email, password) => {
  const response = await api.post('/api/auth/register', { email, password });
  return response.data;
};`;
      }
      if (method === 'login') {
        return `import axios from 'axios';

const api = axios.create({
  baseURL: "${API_URL}",
  headers: {
    "X-API-Key": "proj_YOUR_API_KEY_HERE"
  }
});

const loginUser = async (email, password) => {
  const response = await api.post('/api/auth/login', { email, password });
  // Store response.data.access_token securely
  return response.data;
};`;
      }
      if (method === 'me') {
        return `import axios from 'axios';

const api = axios.create({
  baseURL: "${API_URL}",
  headers: {
    "X-API-Key": "proj_YOUR_API_KEY_HERE"
  }
});

const getCurrentUser = async (accessToken) => {
  const response = await api.get('/api/auth/me', {
    headers: {
      "Authorization": "Bearer " + accessToken
    }
  });
  return response.data;
};`;
      }
      if (method === 'send-verification-email') {
        return `import axios from 'axios';

const api = axios.create({
  baseURL: "${API_URL}",
  headers: {
    "X-API-Key": "proj_YOUR_API_KEY_HERE"
  }
});

const sendVerificationEmail = async (email) => {
  const response = await api.post('/api/auth/send-verification-email', { email });
  return response.data;
};`;
      }
      if (method === 'verify-email') {
        return `import axios from 'axios';

const api = axios.create({
  baseURL: "${API_URL}",
  headers: {
    "X-API-Key": "proj_YOUR_API_KEY_HERE"
  }
});

const verifyEmail = async (token) => {
  const response = await api.post('/api/auth/verify-email', { token });
  return response.data;
};`;
      }
      if (method === 'forgot-password') {
        return `import axios from 'axios';

const api = axios.create({
  baseURL: "${API_URL}",
  headers: {
    "X-API-Key": "proj_YOUR_API_KEY_HERE"
  }
});

const forgotPassword = async (email) => {
  const response = await api.post('/api/auth/forgot-password', { email });
  return response.data;
};`;
      }
      if (method === 'reset-password') {
        return `import axios from 'axios';

const api = axios.create({
  baseURL: "${API_URL}",
  headers: {
    "X-API-Key": "proj_YOUR_API_KEY_HERE"
  }
});

const resetPassword = async (token, new_password) => {
  const response = await api.post('/api/auth/reset-password', { token, new_password });
  return response.data;
};`;
      }
    } else if (activeTab === 'sdk') {
      if (method === 'register') {
        return `import { IntellaxisAuth } from '@intellaxis/auth';

const auth = new IntellaxisAuth('proj_YOUR_API_KEY_HERE', { baseUrl: "${API_URL}" });

const registerUser = async (email, password) => {
  return await auth.register(email, password);
};`;
      }
      if (method === 'login') {
        return `import { IntellaxisAuth } from '@intellaxis/auth';

const auth = new IntellaxisAuth('proj_YOUR_API_KEY_HERE', { baseUrl: "${API_URL}" });

const loginUser = async (email, password) => {
  // SDK automatically stores token in localStorage
  return await auth.login(email, password);
};`;
      }
      if (method === 'me') {
        return `import { IntellaxisAuth } from '@intellaxis/auth';

const auth = new IntellaxisAuth('proj_YOUR_API_KEY_HERE', { baseUrl: "${API_URL}" });

const getCurrentUser = async () => {
  // SDK automatically reads token from localStorage and injects it
  return await auth.getMe();
};`;
      }
      if (method === 'send-verification-email') {
        return `import { IntellaxisAuth } from '@intellaxis/auth';

const auth = new IntellaxisAuth('proj_YOUR_API_KEY_HERE', { baseUrl: "${API_URL}" });

const sendVerificationEmail = async (email) => {
  return await auth.sendVerificationEmail(email);
};`;
      }
      if (method === 'verify-email') {
        return `import { IntellaxisAuth } from '@intellaxis/auth';

const auth = new IntellaxisAuth('proj_YOUR_API_KEY_HERE', { baseUrl: "${API_URL}" });

const verifyEmail = async (token) => {
  return await auth.verifyEmail(token);
};`;
      }
      if (method === 'forgot-password') {
        return `import { IntellaxisAuth } from '@intellaxis/auth';

const auth = new IntellaxisAuth('proj_YOUR_API_KEY_HERE', { baseUrl: "${API_URL}" });

const forgotPassword = async (email) => {
  return await auth.forgotPassword(email);
};`;
      }
      if (method === 'reset-password') {
        return `import { IntellaxisAuth } from '@intellaxis/auth';

const auth = new IntellaxisAuth('proj_YOUR_API_KEY_HERE', { baseUrl: "${API_URL}" });

const resetPassword = async (token, new_password) => {
  return await auth.resetPassword(token, new_password);
};`;
      }
    }
    return "";
  };

  return (
    <div className="min-h-screen w-full bg-background flex flex-col">
      <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center px-8 justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="mr-2 p-2 hover:bg-accent rounded-full transition-colors text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-primary bg-primary/10">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">{title}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {developer && (
              <span className="text-sm text-muted-foreground mr-4 hidden md:inline-block">
                {developer.email}
              </span>
            )}
            <Link
              href="/dashboard/docs"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-accent text-accent-foreground h-9 px-4 py-2"
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

      <main className="flex-1 p-8 w-full max-w-5xl mx-auto space-y-12 pb-24">
        
        {/* Intro */}
        <section className="space-y-4">
          <h2 className="text-3xl font-bold tracking-tight">Integrating {title}</h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Integrating {title} into your frontend application is simple. You just need to configure your <strong>Authorized Domains</strong> in the project settings, grab your <strong>API Key</strong>, and make HTTP requests to our authentication endpoints.
          </p>

          <p className="text-lg text-muted-foreground leading-relaxed">
            Alternatively, if you are using JavaScript or TypeScript, you can install our official zero-dependency SDK:
            <code className="bg-muted px-2 py-1 rounded ml-2 text-sm font-mono text-foreground">npm install @intellaxis/auth</code>
          </p>
          
          <div className="bg-primary/10 border border-primary/20 rounded-xl p-6 mt-6">
            <h3 className="text-lg font-semibold text-primary mb-2 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" />
              Security First: Authorized Domains
            </h3>
            <p className="text-sm text-foreground/80 leading-relaxed">
              Unlike traditional CORS which relies on browser preflight requests, {title} enforces security at the application level. You <strong>must</strong> add your frontend domain (e.g. <code>http://localhost:3000</code> or <code>https://myapp.com</code>) to your Project's Authorized Domains list in the dashboard. If a request is made from an unauthorized domain, it will be immediately rejected with a <code>403 Forbidden</code>, even if the API Key is correct.
            </p>
          </div>
        </section>

        {/* Code Tabs */}
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b border-border/40 pb-4">
            <h2 className="text-2xl font-bold tracking-tight">Authentication Flow</h2>
            <div className="flex bg-muted p-1 rounded-lg">
              <button
                onClick={() => setActiveTab('fetch')}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'fetch' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Fetch API
              </button>
              <button
                onClick={() => setActiveTab('axios')}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'axios' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Axios
              </button>
              <button
                onClick={() => setActiveTab('sdk')}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'sdk' ? 'bg-background shadow text-foreground text-primary' : 'text-muted-foreground hover:text-foreground'}`}
              >
                @intellaxis/auth SDK
              </button>
            </div>
          </div>

          {/* Register Block */}
          <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
            <div className="p-6 border-b border-border">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Code className="h-5 w-5 text-emerald-500" />
                1. Register a User
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Endpoint: <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">POST /api/auth/register</code>
              </p>
            </div>
            <div className="relative">
              <pre className="p-6 overflow-x-auto bg-[#0d1117] text-[#c9d1d9] text-sm font-mono leading-relaxed">
                <code>{getCodeSnippet('register')}</code>
              </pre>
              <button 
                onClick={() => copyToClipboard(getCodeSnippet('register'))}
                className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-md transition-colors text-white/70 hover:text-white"
              >
                {copiedKey === getCodeSnippet('register') ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Login Block */}
          <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
            <div className="p-6 border-b border-border">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Code className="h-5 w-5 text-blue-500" />
                2. Login
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Endpoint: <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">POST /api/auth/login</code>
              </p>
            </div>
            <div className="relative">
              <pre className="p-6 overflow-x-auto bg-[#0d1117] text-[#c9d1d9] text-sm font-mono leading-relaxed">
                <code>{getCodeSnippet('login')}</code>
              </pre>
              <button 
                onClick={() => copyToClipboard(getCodeSnippet('login'))}
                className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-md transition-colors text-white/70 hover:text-white"
              >
                {copiedKey === getCodeSnippet('login') ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Get Me Block */}
          <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
            <div className="p-6 border-b border-border">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Code className="h-5 w-5 text-purple-500" />
                3. Get Current User Profile
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Endpoint: <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">GET /api/auth/me</code>
              </p>
            </div>
            <div className="relative">
              <pre className="p-6 overflow-x-auto bg-[#0d1117] text-[#c9d1d9] text-sm font-mono leading-relaxed">
                <code>{getCodeSnippet('me')}</code>
              </pre>
              <button 
                onClick={() => copyToClipboard(getCodeSnippet('me'))}
                className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-md transition-colors text-white/70 hover:text-white"
              >
                {copiedKey === getCodeSnippet('me') ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Send Verification Email Block */}
          <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
            <div className="p-6 border-b border-border">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Code className="h-5 w-5 text-amber-500" />
                4. Send Verification Email
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Endpoint: <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">POST /api/auth/send-verification-email</code>
              </p>
            </div>
            <div className="relative">
              <pre className="p-6 overflow-x-auto bg-[#0d1117] text-[#c9d1d9] text-sm font-mono leading-relaxed">
                <code>{getCodeSnippet('send-verification-email')}</code>
              </pre>
              <button 
                onClick={() => copyToClipboard(getCodeSnippet('send-verification-email'))}
                className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-md transition-colors text-white/70 hover:text-white"
              >
                {copiedKey === getCodeSnippet('send-verification-email') ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Verify Email Block */}
          <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
            <div className="p-6 border-b border-border">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Code className="h-5 w-5 text-amber-500" />
                5. Verify Email Token
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Endpoint: <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">POST /api/auth/verify-email</code>
              </p>
            </div>
            <div className="relative">
              <pre className="p-6 overflow-x-auto bg-[#0d1117] text-[#c9d1d9] text-sm font-mono leading-relaxed">
                <code>{getCodeSnippet('verify-email')}</code>
              </pre>
              <button 
                onClick={() => copyToClipboard(getCodeSnippet('verify-email'))}
                className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-md transition-colors text-white/70 hover:text-white"
              >
                {copiedKey === getCodeSnippet('verify-email') ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Forgot Password Block */}
          <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
            <div className="p-6 border-b border-border">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Code className="h-5 w-5 text-rose-500" />
                6. Forgot Password
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Endpoint: <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">POST /api/auth/forgot-password</code>
              </p>
            </div>
            <div className="relative">
              <pre className="p-6 overflow-x-auto bg-[#0d1117] text-[#c9d1d9] text-sm font-mono leading-relaxed">
                <code>{getCodeSnippet('forgot-password')}</code>
              </pre>
              <button 
                onClick={() => copyToClipboard(getCodeSnippet('forgot-password'))}
                className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-md transition-colors text-white/70 hover:text-white"
              >
                {copiedKey === getCodeSnippet('forgot-password') ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Reset Password Block */}
          <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
            <div className="p-6 border-b border-border">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Code className="h-5 w-5 text-rose-500" />
                7. Reset Password
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Endpoint: <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">POST /api/auth/reset-password</code>
              </p>
            </div>
            <div className="relative">
              <pre className="p-6 overflow-x-auto bg-[#0d1117] text-[#c9d1d9] text-sm font-mono leading-relaxed">
                <code>{getCodeSnippet('reset-password')}</code>
              </pre>
              <button 
                onClick={() => copyToClipboard(getCodeSnippet('reset-password'))}
                className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-md transition-colors text-white/70 hover:text-white"
              >
                {copiedKey === getCodeSnippet('reset-password') ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
          </div>

        </section>

      </main>
    </div>
  );
}
