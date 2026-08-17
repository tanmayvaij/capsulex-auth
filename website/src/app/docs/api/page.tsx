export default function APIDoc() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-12 flex items-start gap-12 relative">
      <div className="flex-1 min-w-0">
        <div className="mb-12">
          <h1 className="text-4xl font-bold tracking-tight mb-4">REST API Reference</h1>
          <p className="text-lg text-muted-foreground">Interact directly with Capsulex Auth using standard HTTP requests.</p>
        </div>

        <div className="space-y-16">
          <section id="auth" className="scroll-mt-24">
            <h2 className="text-2xl font-semibold tracking-tight mb-6 border-b border-border/40 pb-2">Authentication Headers</h2>
            <p className="text-muted-foreground mb-6">
              All Capsulex API endpoints require your Project's `X-Api-Key` to identify the environment. For endpoints that require an authenticated user (like `/api/auth/me`), you must also provide the JWT access token in the `Authorization` header.
            </p>
            <div className="rounded-xl overflow-hidden border border-border/50 bg-[#0d1117] mb-6">
              <div className="flex items-center px-4 py-2 border-b border-white/10 bg-white/[0.02]">
                <span className="text-xs font-mono text-white/40">HTTP Headers</span>
              </div>
              <div className="p-4 overflow-x-auto">
                <pre className="text-sm font-mono text-white/80">
                  <code>
{`X-Api-Key: <YOUR_PROJECT_API_KEY>
Authorization: Bearer <JWT_ACCESS_TOKEN>   # (Only if user is logged in)`}
                  </code>
                </pre>
              </div>
            </div>
          </section>

          {/* Account Management */}
          <section id="account-management" className="scroll-mt-24">
            <h2 className="text-2xl font-semibold tracking-tight mb-6 border-b border-border/40 pb-2">1. Account Management</h2>
            
            <div className="space-y-12">
              {/* Register Endpoint */}
              <div id="register" className="rounded-lg border border-border bg-card overflow-hidden scroll-mt-24">
                <div className="p-6 border-b border-border/50 bg-muted/20">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="px-2 py-1 bg-green-500/10 text-green-500 rounded text-xs font-bold font-mono">POST</span>
                    <code className="text-sm font-mono text-foreground font-semibold">/api/auth/register</code>
                  </div>
                  <p className="text-sm text-muted-foreground">Registers a new user and sends an email verification link.</p>
                </div>
                
                <div className="p-6 space-y-6">
                  <div>
                    <h4 className="text-sm font-semibold mb-3">Request Body (application/json)</h4>
                    <div className="rounded-lg overflow-hidden border border-border/50 bg-[#0d1117]">
                      <div className="p-4">
                        <pre className="text-xs font-mono text-white/80">
                          <code>
{`{
  "email": "user@example.com",
  "password": "secure_password",
  "user_metadata": {
    "first_name": "Jane"
  }
}`}
                          </code>
                        </pre>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold mb-3">Response <span className="text-green-500 font-mono text-xs ml-2">200 OK</span></h4>
                    <div className="rounded-lg overflow-hidden border border-border/50 bg-[#0d1117]">
                      <div className="p-4">
                        <pre className="text-xs font-mono text-white/80">
                          <code>
{`{
  "id": "usr_123",
  "email": "user@example.com",
  "is_active": true,
  "is_email_verified": false,
  "created_at": "2024-01-01T00:00:00Z",
  "user_metadata": { "first_name": "Jane" }
}`}
                          </code>
                        </pre>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>


          {/* Standard Authentication */}
          <section id="standard-auth" className="scroll-mt-24">
            <h2 className="text-2xl font-semibold tracking-tight mb-6 border-b border-border/40 pb-2">2. Standard Authentication</h2>
            
            <div className="space-y-12">
              {/* Login Endpoint */}
              <div id="login" className="rounded-lg border border-border bg-card overflow-hidden scroll-mt-24">
                <div className="p-6 border-b border-border/50 bg-muted/20">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="px-2 py-1 bg-green-500/10 text-green-500 rounded text-xs font-bold font-mono">POST</span>
                    <code className="text-sm font-mono text-foreground font-semibold">/api/auth/login</code>
                  </div>
                  <p className="text-sm text-muted-foreground">Authenticates a user and returns an access token and refresh token.</p>
                </div>
                
                <div className="p-6 space-y-6">
                  <div>
                    <h4 className="text-sm font-semibold mb-3">Request Body (application/json)</h4>
                    <div className="rounded-lg overflow-hidden border border-border/50 bg-[#0d1117]">
                      <div className="p-4">
                        <pre className="text-xs font-mono text-white/80">
                          <code>
{`{
  "email": "user@example.com",
  "password": "secure_password"
}`}
                          </code>
                        </pre>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold mb-3">Response <span className="text-green-500 font-mono text-xs ml-2">200 OK</span></h4>
                    <div className="rounded-lg overflow-hidden border border-border/50 bg-[#0d1117]">
                      <div className="p-4">
                        <pre className="text-xs font-mono text-white/80">
                          <code>
{`{
  "access_token": "eyJhbGci...",
  "refresh_token": "eyJhbGci...",
  "token_type": "bearer"
}`}
                          </code>
                        </pre>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Refresh Endpoint */}
              <div id="refresh" className="rounded-lg border border-border bg-card overflow-hidden scroll-mt-24">
                <div className="p-6 border-b border-border/50 bg-muted/20">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="px-2 py-1 bg-green-500/10 text-green-500 rounded text-xs font-bold font-mono">POST</span>
                    <code className="text-sm font-mono text-foreground font-semibold">/api/auth/refresh</code>
                  </div>
                  <p className="text-sm text-muted-foreground">Exchanges a valid refresh token for a new short-lived access token.</p>
                </div>
                
                <div className="p-6 space-y-6">
                  <div>
                    <h4 className="text-sm font-semibold mb-3">Request Body (application/json)</h4>
                    <div className="rounded-lg overflow-hidden border border-border/50 bg-[#0d1117]">
                      <div className="p-4">
                        <pre className="text-xs font-mono text-white/80">
                          <code>
{`{
  "refresh_token": "eyJhbGci..."
}`}
                          </code>
                        </pre>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold mb-3">Response <span className="text-green-500 font-mono text-xs ml-2">200 OK</span></h4>
                    <div className="rounded-lg overflow-hidden border border-border/50 bg-[#0d1117]">
                      <div className="p-4">
                        <pre className="text-xs font-mono text-white/80">
                          <code>
{`{
  "access_token": "eyJhbGci...",
  "token_type": "bearer"
}`}
                          </code>
                        </pre>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </section>


          {/* Passwordless OTP */}
          <section id="passwordless" className="scroll-mt-24">
            <h2 className="text-2xl font-semibold tracking-tight mb-6 border-b border-border/40 pb-2">3. Passwordless (OTP)</h2>
            
            <div className="space-y-12">
              {/* OTP Request Endpoint */}
              <div id="otp-request" className="rounded-lg border border-border bg-card overflow-hidden scroll-mt-24">
                <div className="p-6 border-b border-border/50 bg-muted/20">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="px-2 py-1 bg-green-500/10 text-green-500 rounded text-xs font-bold font-mono">POST</span>
                    <code className="text-sm font-mono text-foreground font-semibold">/api/auth/otp/request</code>
                  </div>
                  <p className="text-sm text-muted-foreground">Requests a passwordless 6-digit One-Time Password sent via email.</p>
                </div>
                
                <div className="p-6">
                  <h4 className="text-sm font-semibold mb-3">Request Body (application/json)</h4>
                  <div className="rounded-lg overflow-hidden border border-border/50 bg-[#0d1117]">
                    <div className="p-4">
                      <pre className="text-xs font-mono text-white/80">
                        <code>
{`{
  "email": "user@example.com"
}`}
                        </code>
                      </pre>
                    </div>
                  </div>
                </div>
              </div>

              {/* OTP Verify Endpoint */}
              <div id="otp-verify" className="rounded-lg border border-border bg-card overflow-hidden scroll-mt-24">
                <div className="p-6 border-b border-border/50 bg-muted/20">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="px-2 py-1 bg-green-500/10 text-green-500 rounded text-xs font-bold font-mono">POST</span>
                    <code className="text-sm font-mono text-foreground font-semibold">/api/auth/otp/verify</code>
                  </div>
                  <p className="text-sm text-muted-foreground">Verifies the 6-digit code and logs the user in, returning tokens.</p>
                </div>
                
                <div className="p-6 space-y-6">
                  <div>
                    <h4 className="text-sm font-semibold mb-3">Request Body (application/json)</h4>
                    <div className="rounded-lg overflow-hidden border border-border/50 bg-[#0d1117]">
                      <div className="p-4">
                        <pre className="text-xs font-mono text-white/80">
                          <code>
{`{
  "email": "user@example.com",
  "otp_code": "123456"
}`}
                          </code>
                        </pre>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold mb-3">Response <span className="text-green-500 font-mono text-xs ml-2">200 OK</span></h4>
                    <div className="rounded-lg overflow-hidden border border-border/50 bg-[#0d1117]">
                      <div className="p-4">
                        <pre className="text-xs font-mono text-white/80">
                          <code>
{`{
  "access_token": "eyJhbGci...",
  "refresh_token": "eyJhbGci...",
  "token_type": "bearer",
  "user": {
    "id": "usr_123",
    "email": "user@example.com"
  }
}`}
                          </code>
                        </pre>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </section>

          {/* User Profile & Sessions */}
          <section id="user-profile" className="scroll-mt-24">
            <h2 className="text-2xl font-semibold tracking-tight mb-6 border-b border-border/40 pb-2">4. User Profile & Sessions</h2>
            
            <div className="space-y-12">
              {/* Get Me Endpoint */}
              <div id="get-me" className="rounded-lg border border-border bg-card overflow-hidden scroll-mt-24">
                <div className="p-6 border-b border-border/50 bg-muted/20">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="px-2 py-1 bg-blue-500/10 text-blue-500 rounded text-xs font-bold font-mono">GET</span>
                    <code className="text-sm font-mono text-foreground font-semibold">/api/auth/me</code>
                  </div>
                  <p className="text-sm text-muted-foreground">Retrieves the currently authenticated user's profile. Requires `Authorization: Bearer &lt;TOKEN&gt;` header.</p>
                </div>
              </div>

              {/* Update Metadata Endpoint */}
              <div id="patch-metadata" className="rounded-lg border border-border bg-card overflow-hidden scroll-mt-24">
                <div className="p-6 border-b border-border/50 bg-muted/20">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="px-2 py-1 bg-orange-500/10 text-orange-500 rounded text-xs font-bold font-mono">PATCH</span>
                    <code className="text-sm font-mono text-foreground font-semibold">/api/auth/me/metadata</code>
                  </div>
                  <p className="text-sm text-muted-foreground">Updates the user's custom metadata JSON object.</p>
                </div>
                
                <div className="p-6">
                  <h4 className="text-sm font-semibold mb-3">Request Body (application/json)</h4>
                  <div className="rounded-lg overflow-hidden border border-border/50 bg-[#0d1117]">
                    <div className="p-4">
                      <pre className="text-xs font-mono text-white/80">
                        <code>
{`{
  "user_metadata": {
    "theme_preference": "dark"
  }
}`}
                        </code>
                      </pre>
                    </div>
                  </div>
                </div>
              </div>

              {/* Get Sessions Endpoint */}
              <div id="get-sessions" className="rounded-lg border border-border bg-card overflow-hidden scroll-mt-24">
                <div className="p-6 border-b border-border/50 bg-muted/20">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="px-2 py-1 bg-blue-500/10 text-blue-500 rounded text-xs font-bold font-mono">GET</span>
                    <code className="text-sm font-mono text-foreground font-semibold">/api/auth/me/sessions</code>
                  </div>
                  <p className="text-sm text-muted-foreground">Retrieves all active devices/sessions for the current user.</p>
                </div>
              </div>

            </div>
          </section>

        </div>
      </div>

      {/* On This Page sidebar */}
      <div className="hidden xl:block w-64 shrink-0 sticky top-24">
        <h4 className="text-sm font-semibold mb-4 text-foreground tracking-tight">On This Page</h4>
        <div className="flex flex-col space-y-3 text-sm text-muted-foreground border-l border-border/50">
          
          <a href="#account-management" className="hover:text-foreground pl-4 border-l-2 border-transparent hover:border-primary transition-colors font-medium text-foreground">1. Account Management</a>
          <div className="flex flex-col space-y-2 pl-4">
            <a href="#register" className="hover:text-foreground pl-4 border-l-2 border-transparent hover:border-primary transition-colors text-xs">POST /register</a>
          </div>

          <a href="#standard-auth" className="hover:text-foreground pl-4 border-l-2 border-transparent hover:border-primary transition-colors font-medium text-foreground">2. Standard Auth</a>
          <div className="flex flex-col space-y-2 pl-4">
            <a href="#login" className="hover:text-foreground pl-4 border-l-2 border-transparent hover:border-primary transition-colors text-xs">POST /login</a>
            <a href="#refresh" className="hover:text-foreground pl-4 border-l-2 border-transparent hover:border-primary transition-colors text-xs">POST /refresh</a>
          </div>

          <a href="#passwordless" className="hover:text-foreground pl-4 border-l-2 border-transparent hover:border-primary transition-colors font-medium text-foreground">3. Passwordless</a>
          <div className="flex flex-col space-y-2 pl-4">
            <a href="#otp-request" className="hover:text-foreground pl-4 border-l-2 border-transparent hover:border-primary transition-colors text-xs">POST /otp/request</a>
            <a href="#otp-verify" className="hover:text-foreground pl-4 border-l-2 border-transparent hover:border-primary transition-colors text-xs">POST /otp/verify</a>
          </div>

          <a href="#user-profile" className="hover:text-foreground pl-4 border-l-2 border-transparent hover:border-primary transition-colors font-medium text-foreground">4. Profile & Sessions</a>
          <div className="flex flex-col space-y-2 pl-4">
            <a href="#get-me" className="hover:text-foreground pl-4 border-l-2 border-transparent hover:border-primary transition-colors text-xs">GET /me</a>
            <a href="#patch-metadata" className="hover:text-foreground pl-4 border-l-2 border-transparent hover:border-primary transition-colors text-xs">PATCH /me/metadata</a>
            <a href="#get-sessions" className="hover:text-foreground pl-4 border-l-2 border-transparent hover:border-primary transition-colors text-xs">GET /me/sessions</a>
          </div>

        </div>
      </div>
    </div>
  );
}
