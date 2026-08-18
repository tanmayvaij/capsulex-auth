# CapsuleX Auth

**CapsuleX Auth** is a robust, multi-tenant authentication provider designed to effortlessly handle end-user authentication for all of your distinct applications. It serves as a central, self-hosted hub where developers can manage users, oversee security, and integrate authentication flows—offering the beautiful developer experience of SaaS platforms like Clerk, with the data sovereignty of open-source solutions.

---

## 🏆 Why CapsuleX Auth?

The auth landscape is typically split between heavy, complex open-source tools (like Keycloak) and expensive, proprietary SaaS platforms (like Auth0 or Clerk). CapsuleX bridges the gap:

1. **Enterprise Microservices Architecture**: CapsuleX is decoupled into a blazing-fast Python FastAPI backend and a sleek Next.js SSR frontend. This allows you to scale them independently, ensuring absolute security and maximum performance.
2. **Zero-Config Developer Experience**: Stop fighting with OAuth consoles. CapsuleX Auth utilizes highly-secure, passwordless **Email OTPs**. Developers simply run `npm install capsulex-auth`, drop in their API key, and authentication works instantly.
3. **Data Sovereignty**: You own your database. No vendor lock-in, no per-MAU (Monthly Active User) pricing traps, and full compliance with local data privacy laws.

---

## 🚀 Core Features

- **Multi-Tenant Architecture**: Developers can create multiple "Projects." Each project acts as its own distinct environment with completely isolated end-users and configuration settings.
- **Enterprise Mail Configuration**: Dynamically configure your email providers directly from the dashboard. Currently supports **Resend**, **ZeptoMail**, or a local console fallback. The database utilizes a highly scalable JSONB architecture to seamlessly adapt to future providers.
- **Real-Time Webhooks Engine**: Broadcasts critical lifecycle events (`user.created`, `user.login.success`, `user.password.reset`, etc.) directly to developer-configured endpoints via HTTP `POST` requests.
- **Granular Registration Controls**: 
  - *Platform-Level*: Master admins can completely disable public developer registration to lock down the platform.
  - *Project-Level*: Developers can disable public end-user signups to create private, invite-only applications.
- **Premium "OLED" Aesthetic**: The entire platform features a stunning, modern "developer-first" true-black UI design, offering a cohesive and high-end experience out of the box.
- **Developer Dashboard**: A centralized Next.js portal to manage projects, track user metrics, manage webhooks, and configure CORS domains.
- **Admin Portal**: A super-admin interface to oversee all registered developers and enforce platform-wide settings.
- **Official NPM SDK**: A world-class React SDK (`capsulex-auth`) featuring Firebase-like observer patterns (`useCapsulexAuth`) and a plug-and-play `<CapsulexProvider>`.

---

## 🔒 Deep Dive: Security Architecture

CapsuleX Auth implements a zero-compromise, enterprise-grade security model.

### 1. HTTP-Only Cookies (Zero XSS Risk)
The administrative dashboards do **not** use `localStorage` for session management. All tokens are securely attached as `httpOnly`, `samesite="lax"` cookies. This means malicious JavaScript (XSS attacks) cannot steal user sessions.

### 2. Token Rotation & Short Expiries
CapsuleX uses a dual-token JWT architecture:
- **Access Tokens**: Ultra short-lived (15 minutes). If intercepted, the attack window is negligible.
- **Refresh Tokens**: Long-lived (7 days), stored securely in a cookie.
- **Silent Refresh**: The frontend API wrapper automatically intercepts `401 Unauthorized` responses, hits the refresh endpoint using the cookie, and seamlessly retries the user's request in the background without forcing them to log in again.

### 3. Strict Rate Limiting (DoS Protection)
Critical endpoints are strictly protected by `slowapi` to prevent brute-force attacks and OTP spamming by capping requests per IP address.

### 4. Dynamic CORS & API Keys
When integrating tenant applications, CapsuleX issues Project API Keys. It uses dynamic CORS checking to intercept and validate requests against a project's configured "Authorized Domains" (e.g., preventing a malicious website from making API requests using a stolen public API key).

---

## 📡 Deep Dive: Real-Time Webhooks

CapsuleX Auth doesn't just manage users; it allows your external services to instantly react to user events via HTTP `POST` webhooks.

### Supported Events
Developers can subscribe to the following events on a per-project basis:
- `user.created`: Triggered when a new end-user successfully verifies their OTP and creates an account.
- `user.deleted`: Triggered when a user is deleted (either manually via admin or via API).
- `user.login.success`: Triggered when a user successfully authenticates.
- `user.login.failed`: Triggered when a user fails authentication (e.g. invalid OTP).
- `user.password.reset`: Triggered when a user successfully resets their authentication credentials.
- `user.suspended`: Triggered when a user's account is suspended by an administrator.

### Webhook Payloads
All webhooks are sent as JSON `POST` requests. The payload includes the event type and the associated user data, allowing your backend systems to instantly sync user records, trigger welcome emails, or flag suspicious login attempts.

---

## 🐳 Deployment (Docker Hub)

CapsuleX Auth is officially published to Docker Hub and can be spun up anywhere using `docker-compose`.

1. Create a `docker-compose.yml` file:
```yaml
version: '3.8'

services:
  backend:
    image: tanmayvaij/capsulex-auth-backend:latest
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql+asyncpg://user:password@host/db
      - SECRET_KEY=your_super_secret_cryptographic_key
    restart: unless-stopped

  frontend:
    image: tanmayvaij/capsulex-auth-frontend:latest
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:8000
    depends_on:
      - backend
    restart: unless-stopped
```

2. Run the platform:
```bash
docker-compose up -d
```

---

## 💻 Local Development Setup

If you want to contribute or run the backend/frontend separately for development:

### 1. Backend Setup
```bash
cd backend
uv sync
uv run alembic upgrade head
uv run uvicorn main:app --reload
```

### 2. Create the Super Admin
When you first start the application, navigate to `http://localhost:3000/login`. You will be automatically redirected to a secure **First Time Setup** wizard to create your Super Admin account.

### 3. Frontend Setup
In a new terminal:
```bash
cd frontend
yarn install
yarn dev
```

---

## 📖 Integrating with Tenant Applications (React / Next.js)

To use Capsulex Auth as the backend for your own apps:

1. Create a new Project in your developer dashboard.
2. Add your app's URL (e.g., `http://localhost:5173`) to the **Authorized Domains** in the project settings.
3. Configure your **Mail Service** (e.g. Resend) in the project settings.
4. Install the official SDK:
   ```bash
   npm install capsulex-auth
   ```
5. Wrap your app in the provider:
   ```tsx
   import { CapsulexProvider } from 'capsulex-auth';

   function App() {
     return (
       <CapsulexProvider 
         apiKey="proj_YOUR_API_KEY_HERE"
         apiUrl="http://localhost:8000"
       >
         <YourApp />
       </CapsulexProvider>
     );
   }
   ```
6. Use the hook to authenticate users via Email OTP or Passwords, and manage metadata:
   ```tsx
   import { useCapsulexAuth } from 'capsulex-auth/react';
   import { useState } from 'react';

   function AuthComponent() {
     const { 
       user, isLoading, 
       register, login, 
       requestOtp, verifyOtp, 
       updateMetadata, 
       getSessions, revokeAllOtherSessions,
       logout 
     } = useCapsulexAuth();

     const [email, setEmail] = useState('');
     const [password, setPassword] = useState('');

     if (isLoading) return <div>Loading...</div>;

     if (!user) {
       return (
         <div>
           {/* Email & Password Registration with Metadata */}
           <button onClick={() => register(email, password, { role: 'admin', age: 25 })}>
             Sign Up
           </button>

           {/* Passwordless OTP Flow */}
           <button onClick={() => requestOtp(email)}>Send Login Code</button>
           <button onClick={() => verifyOtp(email, '123456', { first_name: 'John' })}>
             Verify Code
           </button>
         </div>
       );
     }

     return (
       <div>
         <h1>Welcome back, {user.user_metadata?.first_name || user.email}</h1>
         
         {/* Update Profile Metadata */}
         <button onClick={() => updateMetadata({ theme: 'dark_mode' })}>
           Enable Dark Mode
         </button>
         
         {/* Manage Active Sessions */}
         <button onClick={async () => {
           const sessions = await getSessions();
           console.log("Active Devices:", sessions);
         }}>
           View Active Devices
         </button>
         
         <button onClick={() => revokeAllOtherSessions()}>
           Log out of all other devices
         </button>

         <button onClick={logout}>Sign Out</button>
       </div>
     );
   }
   ```

---

## 📚 SDK API Reference

Capsulex Auth provides a robust TypeScript SDK for any JavaScript environment, as well as a specialized React Hook for seamless integration in React/Next.js applications.

### `useCapsulexAuth()` Hook Properties

When you call `const auth = useCapsulexAuth()`, you get access to the following properties and the **21 core authentication methods** provided by the SDK:

#### State Variables
- `user` (Object | null): The currently authenticated user object, or `null` if not logged in.
- `isLoading` (boolean): `true` if the SDK is currently checking for an active session.
- `auth` (CapsulexAuth): The raw underlying SDK class instance.

#### 🔐 Authentication Methods
- `register(email, password, metadata?)`: Creates a new user account with an email and password.
- `login(email, password)`: Authenticates an existing user and establishes a session.
- `requestOtp(email)`: Initiates a passwordless login flow by sending a 6-digit OTP.
- `verifyOtp(email, code, metadata?)`: Verifies the OTP and logs the user in.
- `logout()`: Destroys the current session and clears all tokens.

#### 📧 Account Recovery & Verification Methods
- `sendVerificationEmail(email)`: Sends an email verification link to a user.
- `verifyEmail(token)`: Verifies a user's email using a token.
- `forgotPassword(email)`: Sends a password reset link to a user.
- `resetPassword(token, new_password)`: Resets a user's password using a token.

#### 👤 User Management Methods
- `updateMetadata(metadata)`: Updates the currently authenticated user's `user_metadata` JSON object.
- `getMe(token?)`: Fetches the currently authenticated user's profile from the backend.

#### 📱 Session Management Methods
- `getSessions()`: Returns an array of active sessions for the current user.
- `revokeSession(sessionId)`: Forcefully revokes a specific session across all devices.
- `revokeAllOtherSessions()`: Forcefully revokes all sessions except the current one.

#### 🛡️ RBAC (Role-Based Access Control) Methods
- `hasRole(role)`: Instantly checks if the current user has a specific role (decoded from JWT).
- `hasPermission(permission)`: Instantly checks if the current user has a specific granular permission.
- `getRoles()`: Returns an array of all roles assigned to the user.
- `getPermissions()`: Returns an array of all permissions assigned to the user.

#### ⚙️ Token Management & Core Methods
- `setToken(token)`: Manually sets the authentication token in the storage mechanism.
- `getToken()`: Retrieves the current authentication token.
- `onAuthStateChange(callback)`: Registers a listener for authentication state changes (similar to Firebase).

### Vanilla JavaScript SDK (`CapsulexAuth`)
If you are using Vue, Svelte, Angular, or Vanilla JS, you can instantiate the core SDK directly:

```typescript
import { CapsulexAuth } from 'capsulex-auth';

const auth = new CapsulexAuth({
  apiKey: "proj_YOUR_API_KEY_HERE",
  apiUrl: "http://localhost:8000" // Your backend URL
});

// Example usage
await auth.login("user@example.com", "password123");
const user = auth.getUser();
```
The vanilla `CapsulexAuth` class provides the exact same asynchronous methods (`login`, `register`, `requestOtp`, `verifyOtp`, `updateMetadata`, `getSessions`, etc.) as the React Hook, but relies on you to manage your application's reactive state.

---

## 🌐 REST API Reference

For developers building custom wrappers, CLIs, or integrating from backend servers, Capsulex Auth exposes a beautiful JSON REST API. 

**Authentication Headers:**
All endpoints strictly require the `X-Api-Key: <YOUR_API_KEY>` header to identify your project. Endpoints that act on a specific user require the `Authorization: Bearer <TOKEN>` header.

### Account Management

#### `POST /api/auth/register`
Registers a new user with email/password.
- **Request Body**: `{ "email": "user@example.com", "password": "secure", "user_metadata": {} }`
- **Response**: `200 OK` Returns the User object.

#### `DELETE /api/auth/me`
Deletes the currently authenticated user's account.
- **Headers**: `Authorization: Bearer <TOKEN>`
- **Response**: `200 OK` `{ "message": "Account deleted successfully" }`

### Standard Authentication

#### `POST /api/auth/login`
Authenticates a user.
- **Request Body**: `{ "email": "user@example.com", "password": "secure" }`
- **Response**: `200 OK` `{ "access_token": "...", "refresh_token": "...", "token_type": "bearer" }`

#### `POST /api/auth/refresh`
Exchanges a valid refresh token for a new short-lived access token.
- **Request Body**: `{ "refresh_token": "eyJ..." }`
- **Response**: `200 OK` `{ "access_token": "...", "token_type": "bearer" }`

### Passwordless (OTP)

#### `POST /api/auth/otp/request`
Requests a 6-digit OTP code sent via email.
- **Request Body**: `{ "email": "user@example.com" }`
- **Response**: `200 OK` `{ "message": "If that email is registered, an OTP has been sent." }`

#### `POST /api/auth/otp/verify`
Verifies the OTP code and returns JWT tokens.
- **Request Body**: `{ "email": "user@example.com", "otp_code": "123456", "user_metadata": {} }`
- **Response**: `200 OK` `{ "access_token": "...", "refresh_token": "...", "token_type": "bearer", "user": { ... } }`

### Account Recovery

#### `POST /api/auth/send-verification-email`
Triggers an email verification link.
- **Request Body**: `{ "email": "user@example.com" }`
- **Response**: `200 OK` `{ "message": "If the user exists, a verification email has been sent." }`

#### `POST /api/auth/verify-email`
Verifies the token from the email link.
- **Request Body**: `{ "token": "abc123xyz" }`
- **Response**: `200 OK` `{ "message": "Email verified successfully" }`

#### `POST /api/auth/forgot-password`
Sends a password reset link to a user.
- **Request Body**: `{ "email": "user@example.com" }`
- **Response**: `200 OK` `{ "message": "If that email is registered, a password reset link has been sent." }`

#### `POST /api/auth/reset-password`
Resets a password using a valid token.
- **Request Body**: `{ "token": "abc123xyz", "new_password": "new_secure_password" }`
- **Response**: `200 OK` `{ "message": "Password has been reset successfully" }`

### User Profile

#### `GET /api/auth/me`
Retrieves the currently authenticated user's full profile.
- **Headers**: `Authorization: Bearer <TOKEN>`
- **Response**: `200 OK` Returns the User object.

#### `PATCH /api/auth/me/metadata`
Updates a user's custom `user_metadata` JSON blob.
- **Headers**: `Authorization: Bearer <TOKEN>`
- **Request Body**: `{ "user_metadata": { "theme": "dark" } }`
- **Response**: `200 OK` Returns the updated User object.

### Session Management

#### `GET /api/auth/me/sessions`
Lists all active devices and sessions for the user.
- **Headers**: `Authorization: Bearer <TOKEN>`
- **Response**: `200 OK` Returns an array of Session objects.

#### `DELETE /api/auth/me/sessions/{session_id}`
Revokes a specific session.
- **Headers**: `Authorization: Bearer <TOKEN>`
- **Response**: `200 OK` `{ "message": "Session revoked" }`

#### `DELETE /api/auth/me/sessions`
Revokes all other active sessions except the current one.
- **Headers**: `Authorization: Bearer <TOKEN>`
- **Response**: `200 OK` `{ "message": "Revoked X other sessions" }`
