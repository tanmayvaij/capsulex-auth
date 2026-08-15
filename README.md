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
6. Use the hook to authenticate users via Email OTP:
   ```tsx
   import { useCapsulexAuth } from 'capsulex-auth';

   const { sendOtp, verifyOtp, user, logout } = useCapsulexAuth();
   ```
