# CapsuleX Auth

![CapsuleX Auth Logo](/frontend/public/logo.png)

**CapsuleX Auth** is a robust, multi-tenant authentication provider designed to effortlessly handle end-user authentication for all of your distinct applications. It serves as a central, self-hosted hub where developers can manage users, oversee security, and integrate authentication flows—offering the beautiful developer experience of SaaS platforms like Clerk, with the data sovereignty of open-source solutions.

---

## 🏆 Why CapsuleX Auth?

The auth landscape is typically split between heavy, complex open-source tools (like Keycloak) and expensive, proprietary SaaS platforms (like Auth0 or Clerk). CapsuleX bridges the gap:

1. **The "Single Docker Image" Advantage**: Unlike other self-hosted auth platforms that require massive `docker-compose` stacks with a dozen microservices, CapsuleX compiles its sleek Next.js frontend and high-performance FastAPI backend into **one single, lightweight Docker container**. You can run a production-ready auth server on a $5 VPS or a Raspberry Pi in seconds.
2. **Modern Developer Experience**: The dashboard is written in Next.js 15 with TailwindCSS, providing a blazing fast, intuitive interface that developers actually enjoy using.
3. **Data Sovereignty**: You own your database. No vendor lock-in, no per-MAU (Monthly Active User) pricing traps, and full compliance with local data privacy laws.

---

## 🚀 Core Features

- **Multi-Tenant Architecture**: Developers can create multiple "Projects." Each project acts as its own distinct environment with completely isolated end-users and configuration settings.
- **Developer Dashboard**: A centralized portal to manage projects, track user metrics, and configure environment variables.
- **Admin Portal**: A super-admin interface to oversee all registered developers on the platform and manage global platform configurations.
- **Flexible Mail Providers**: Out-of-the-box support for **ZeptoMail** to send real emails (like verification links and password resets), or a **Local Console** provider that prints emails to your terminal for rapid local development.
- **Auto-Generated Swagger Docs**: Complete OpenAPI documentation available immediately at `/docs`.

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
Critical endpoints (like `/login`, `/register`, and `/forgot-password`) are strictly protected by `slowapi`. This prevents brute-force password guessing and credential stuffing attacks by capping requests per IP address.

### 4. Role-Based Access Control (RBAC)
The JWT payloads embed explicit roles (`admin` or `developer`). Backend endpoints rigorously verify these claims. An active developer token can never be exploited to hit a super-admin endpoint.

### 5. Dynamic CORS & API Keys
When integrating tenant applications, CapsuleX issues Project API Keys. It uses dynamic CORS checking to intercept and validate requests against a project's configured "Authorized Domains" (e.g., preventing a malicious website from making API requests using a stolen public API key).

---

## 🐳 Deployment (The Single Docker Image)

Deploying CapsuleX is incredibly simple. We use a multi-stage Docker build:
1. **Stage 1**: The Next.js frontend is built and statically exported (`output: 'export'`) into raw HTML/CSS/JS.
2. **Stage 2**: The Python FastAPI environment is set up. The static frontend files are copied into the backend's directory.
3. **Serving**: FastAPI serves the Next.js static files alongside the API routes, running the entire stack on port `8000`.

### Running in Production
```bash
# Build the image
docker build -t capsulex-auth .

# Run the container (Requires a running PostgreSQL instance)
docker run -d \
  -p 80:8000 \
  -e DATABASE_URL="postgresql+asyncpg://user:password@host:5432/db" \
  -e SECRET_KEY="your-super-secret-key" \
  capsulex-auth
```

---

## 💻 Local Development Setup

If you want to contribute or run the backend/frontend separately for development:

### Prerequisites
- PostgreSQL running locally (e.g., named `capsulex`)
- Python 3.11+
- Node.js 18+

### 1. Backend Setup
```bash
cd backend
# Install dependencies using 'uv'
uv sync

# Run database migrations to generate the tables
uv run alembic upgrade head

# Start the FastAPI server on port 8000
uv run uvicorn main:app --reload
```

### 2. Create the Super Admin
When you first start the application, navigate to `http://localhost:3000/login`. You will be automatically redirected to a secure **First Time Setup** wizard to create your Super Admin account. Once created, this wizard locks permanently.

### 3. Frontend Setup
In a new terminal:
```bash
cd frontend
# Install dependencies
yarn install

# Start the Next.js development server on port 3000
yarn dev
```

---

## 📖 Integrating with Tenant Applications

To use Capsulex Auth as the backend for your own apps:
1. Register as a developer on your deployed dashboard.
2. Create a new Project.
3. Add your app's URL (e.g., `http://localhost:5173` for Vite) to the **Authorized Domains** in the project settings.
4. Copy your project's `API Key`.
5. Make REST API calls from your frontend directly to CapsuleX Auth:
   ```http
   POST /api/auth/register
   X-API-Key: proj_YOUR_API_KEY_HERE
   ```
6. Check your deployment's `/docs` page for all available API routes and payload schemas.
