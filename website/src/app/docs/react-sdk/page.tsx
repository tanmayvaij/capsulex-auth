import { cn } from "@/lib/utils";

export default function ReactSDKDoc() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12 flex items-start gap-12 relative">
      <div className="flex-1 min-w-0">
        <div className="mb-12">
          <h1 className="text-4xl font-bold tracking-tight mb-4">React SDK</h1>
          <p className="text-lg text-muted-foreground">Integrate Capsulex Auth seamlessly into your React applications using our official hooks and Context provider.</p>
        </div>

        <div className="space-y-16">
          <section id="installation" className="scroll-mt-24">
            <h2 className="text-2xl font-semibold tracking-tight mb-6 border-b border-border/40 pb-2">1. Installation</h2>
            <p className="text-muted-foreground mb-4">
              Install the React SDK via your preferred package manager.
            </p>
            <div className="rounded-xl overflow-hidden border border-border/50 bg-[#0d1117] mb-6">
              <div className="flex items-center px-4 py-2 border-b border-white/10 bg-white/[0.02]">
                <span className="text-xs font-mono text-white/40">Terminal</span>
              </div>
              <div className="p-4">
                <pre className="text-sm font-mono text-white/80">
                  <code>
npm install capsulex-auth
                  </code>
                </pre>
              </div>
            </div>
          </section>

          <section id="provider" className="scroll-mt-24">
            <h2 className="text-2xl font-semibold tracking-tight mb-6 border-b border-border/40 pb-2">2. Wrap Your App</h2>
            <p className="text-muted-foreground mb-6">
              Before you can use any hooks, you must wrap your application tree with the {'`<CapsulexProvider>`'}. You must provide your Project's `apiKey`.
            </p>
            
            <div className="rounded-xl overflow-hidden border border-border/50 bg-[#0d1117] mb-6">
              <div className="flex items-center px-4 py-2 border-b border-white/10 bg-white/[0.02]">
                <span className="text-xs font-mono text-white/40">main.tsx</span>
              </div>
              <div className="p-4 overflow-x-auto">
                <pre className="text-sm font-mono text-white/80">
                  <code>
{`import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { CapsulexProvider } from 'capsulex-auth/react'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <CapsulexProvider 
      apiKey={import.meta.env.VITE_CAPSULEX_API_KEY}
      baseUrl="http://localhost:8000" // Optional: Defaults to https://api.capsulex.com
      autoStoreToken={true}           // Optional: Automatically stores JWT in localStorage
    >
      <App />
    </CapsulexProvider>
  </React.StrictMode>
)`}
                  </code>
                </pre>
              </div>
            </div>
          </section>

          <section id="hooks" className="scroll-mt-24">
            <h2 className="text-2xl font-semibold tracking-tight mb-6 border-b border-border/40 pb-2">3. The `useCapsulexAuth` Hook</h2>
            <p className="text-muted-foreground mb-6">
              The primary way to interact with the current user session is via `useCapsulexAuth()`. It provides robust methods for authentication, session management, and RBAC (Role-Based Access Control).
            </p>
            
            <div className="rounded-xl border border-border bg-card overflow-hidden mb-6">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    <th className="px-4 py-3 font-semibold w-1/4">Property</th>
                    <th className="px-4 py-3 font-semibold w-1/4">Type</th>
                    <th className="px-4 py-3 font-semibold">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-muted-foreground">
                  <tr>
                    <td className="px-4 py-3 font-mono text-foreground font-medium">user</td>
                    <td className="px-4 py-3 font-mono text-xs">User | null</td>
                    <td className="px-4 py-3">The currently authenticated user object.</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-mono text-foreground font-medium">isLoading</td>
                    <td className="px-4 py-3 font-mono text-xs">boolean</td>
                    <td className="px-4 py-3">True while verifying the session token on initial load.</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-mono text-foreground font-medium">login()</td>
                    <td className="px-4 py-3 font-mono text-xs">(email, password) {'=>'} Promise</td>
                    <td className="px-4 py-3">Logs in a user with email and password.</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-mono text-foreground font-medium">requestOtp()</td>
                    <td className="px-4 py-3 font-mono text-xs">(email) {'=>'} Promise</td>
                    <td className="px-4 py-3">Sends a magic link / OTP to the user's email.</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-mono text-foreground font-medium">logout()</td>
                    <td className="px-4 py-3 font-mono text-xs">() {'=>'} void</td>
                    <td className="px-4 py-3">Clears local tokens and revokes the current session.</td>
                  </tr>
                  <tr className="bg-muted/10">
                    <td className="px-4 py-3 font-mono text-foreground font-medium text-primary">auth.hasRole()</td>
                    <td className="px-4 py-3 font-mono text-xs">(role) {'=>'} boolean</td>
                    <td className="px-4 py-3">Checks if the current user has a specific role (parsed instantly from JWT).</td>
                  </tr>
                  <tr className="bg-muted/10">
                    <td className="px-4 py-3 font-mono text-foreground font-medium text-primary">auth.hasPermission()</td>
                    <td className="px-4 py-3 font-mono text-xs">(perm) {'=>'} boolean</td>
                    <td className="px-4 py-3">Checks if the current user has a specific granular permission.</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3 className="text-lg font-semibold mt-8 mb-4">Example Implementation</h3>
            <div className="rounded-xl overflow-hidden border border-border/50 bg-[#0d1117] mb-6">
              <div className="flex items-center px-4 py-2 border-b border-white/10 bg-white/[0.02]">
                <span className="text-xs font-mono text-white/40">App.tsx</span>
              </div>
              <div className="p-4 overflow-x-auto">
                <pre className="text-sm font-mono text-white/80">
                  <code>
{`import { useCapsulexAuth } from 'capsulex-auth/react'

export default function App() {
  const { user, isLoading, logout, auth } = useCapsulexAuth()

  if (isLoading) return <div>Loading session...</div>

  if (!user) {
    return <LoginForm />
  }

  return (
    <div>
      <h1>Welcome back, {user.email}</h1>
      
      {/* RBAC check without making API requests! */}
      {auth.hasRole('admin') && (
        <button className="bg-red-500">Delete Project</button>
      )}
      
      <button onClick={logout}>Sign Out</button>
    </div>
  )
}`}
                  </code>
                </pre>
              </div>
            </div>
          </section>

          <section id="sessions" className="scroll-mt-24">
            <h2 className="text-2xl font-semibold tracking-tight mb-6 border-b border-border/40 pb-2">4. Session Management</h2>
            <p className="text-muted-foreground mb-6">
              Capsulex Auth gives users full control over their active sessions across different devices to monitor IP addresses and revoke rogue logins.
            </p>
            
            <div className="rounded-xl overflow-hidden border border-border/50 bg-[#0d1117] mb-6">
              <div className="p-4 overflow-x-auto">
                <pre className="text-sm font-mono text-white/80">
                  <code>
{`const { getSessions, revokeSession, revokeAllOtherSessions } = useCapsulexAuth()

// Fetch all active devices (returns array of Session objects)
const sessions = await getSessions()

// Revoke a specific rogue session
await revokeSession(sessionId)

// Secure the account by revoking everything except the current device
await revokeAllOtherSessions()`}
                  </code>
                </pre>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* On This Page sidebar */}
      <div className="hidden xl:block w-64 shrink-0 sticky top-24">
        <h4 className="text-sm font-semibold mb-4 text-foreground tracking-tight">On This Page</h4>
        <div className="flex flex-col space-y-3 text-sm text-muted-foreground border-l border-border/50">
          <a href="#installation" className="hover:text-foreground pl-4 border-l-2 border-transparent hover:border-primary transition-colors">Installation</a>
          <a href="#provider" className="hover:text-foreground pl-4 border-l-2 border-transparent hover:border-primary transition-colors">Wrap Your App</a>
          <a href="#hooks" className="hover:text-foreground pl-4 border-l-2 border-transparent hover:border-primary transition-colors">The useCapsulexAuth Hook</a>
          <a href="#sessions" className="hover:text-foreground pl-4 border-l-2 border-transparent hover:border-primary transition-colors">Session Management</a>
        </div>
      </div>
    </div>
  );
}
