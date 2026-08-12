import { useState } from 'react'
import { useCapsulexAuth } from 'capsulex-auth-sdk/react'
import { Loader2, LogOut, KeyRound, Mail, ArrowRight, ShieldCheck, UserCircle2 } from 'lucide-react'

function App() {
  const { user, isLoading, login, requestOtp, verifyOtp, logout } = useCapsulexAuth()
  
  const [activeTab, setActiveTab] = useState<'otp' | 'password'>('otp')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')
    try {
      await login(email, password)
    } catch (err: any) {
      setError(err.message || 'Login failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')
    try {
      await requestOtp(email)
      setOtpSent(true)
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')
    try {
      await verifyOtp(email, otpCode)
    } catch (err: any) {
      setError(err.message || 'Invalid OTP code')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (user) {
    return (
      <div className="min-h-screen p-8 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold">Example Tenant App</h1>
          <button 
            onClick={logout}
            className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-lg hover:bg-card/80 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>

        <div className="bg-card border border-border rounded-xl p-8 shadow-sm">
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-border">
            <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center">
              <UserCircle2 className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Welcome back!</h2>
              <p className="text-muted-foreground">{user.email}</p>
            </div>
            {user.is_email_verified && (
              <div className="ml-auto flex items-center gap-2 px-3 py-1 bg-emerald-500/10 text-emerald-500 rounded-full text-sm">
                <ShieldCheck className="h-4 w-4" />
                Verified User
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground mb-1">User ID</p>
              <p className="font-mono">{user.id}</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Account Created</p>
              <p>{new Date(user.created_at).toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]">
      <div className="w-full max-w-md bg-card/80 backdrop-blur-xl border border-border rounded-2xl p-8 shadow-2xl relative overflow-hidden">
        
        {/* Decorative background glow */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-32 h-32 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="text-center mb-8 relative z-10">
          <h1 className="text-2xl font-bold tracking-tight mb-2">Welcome Back</h1>
          <p className="text-sm text-muted-foreground">Sign in to your account to continue</p>
        </div>

        {/* Auth Method Tabs */}
        {!otpSent && (
          <div className="flex p-1 mb-8 bg-background/50 rounded-lg border border-border relative z-10">
            <button
              onClick={() => { setActiveTab('otp'); setError(''); }}
              className={`flex-1 flex justify-center items-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${
                activeTab === 'otp' ? 'bg-card shadow text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Mail className="h-4 w-4" />
              Email OTP
            </button>
            <button
              onClick={() => { setActiveTab('password'); setError(''); }}
              className={`flex-1 flex justify-center items-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${
                activeTab === 'password' ? 'bg-card shadow text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <KeyRound className="h-4 w-4" />
              Password
            </button>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium relative z-10 animate-in fade-in slide-in-from-top-2">
            {error}
          </div>
        )}

        <div className="relative z-10">
          {activeTab === 'password' ? (
            <form onSubmit={handlePasswordLogin} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium ml-1">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full h-12 bg-background/50 border border-input rounded-lg px-4 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  placeholder="name@example.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium ml-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full h-12 bg-background/50 border border-input rounded-lg px-4 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-12 mt-6 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Sign In'}
              </button>
            </form>
          ) : (
            <div>
              {!otpSent ? (
                <form onSubmit={handleRequestOtp} className="space-y-4 animate-in fade-in slide-in-from-right-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium ml-1">Email Address</label>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full h-12 bg-background/50 border border-input rounded-lg px-4 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      placeholder="name@example.com"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-12 mt-6 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Continue with Email'}
                    {!isSubmitting && <ArrowRight className="h-4 w-4" />}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-4 animate-in fade-in slide-in-from-right-4">
                  <div className="text-center mb-6">
                    <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Mail className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="font-semibold text-lg">Check your email</h3>
                    <p className="text-sm text-muted-foreground mt-1">We sent a 6-digit code to <br/><span className="font-medium text-foreground">{email}</span></p>
                  </div>
                  
                  <div className="space-y-2">
                    <input
                      type="text"
                      maxLength={6}
                      value={otpCode}
                      onChange={e => setOtpCode(e.target.value.replace(/\D/g, ''))}
                      className="w-full h-14 text-center text-2xl tracking-[0.5em] font-mono bg-background/50 border border-input rounded-lg px-4 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      placeholder="------"
                      required
                    />
                  </div>
                  
                  <button
                    type="submit"
                    disabled={isSubmitting || otpCode.length !== 6}
                    className="w-full h-12 mt-6 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Verify Code'}
                  </button>

                  <button
                    type="button"
                    onClick={() => { setOtpSent(false); setOtpCode(''); setError(''); }}
                    className="w-full h-12 text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
                  >
                    Use a different email
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default App
