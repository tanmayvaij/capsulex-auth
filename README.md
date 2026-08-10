# Intellaxis Auth

Intellaxis Auth is a robust, multi-tenant authentication provider designed to easily handle end-user authentication for multiple distinct applications. It serves as a central hub where developers can manage users, security, and authentication flows for all their projects.

## 🚀 Features

- **Multi-Tenant Architecture**: Developers can create multiple "Projects," each with completely isolated end-users and distinct configuration settings.
- **Developer Dashboard**: A sleek, modern dashboard for developers to manage their projects, track user metrics, and oversee security.
- **Admin Portal**: A super-admin interface to oversee registered developers and manage global application settings (like customizing the brand name and icon).
- **Advanced Security**: 
  - API-Key based authentication for tenant projects.
  - JWTs for internal portal access.
  - **Firebase-style dynamic CORS**: Automatically intercepts and validates requests against a project's configured "Authorized Domains" to prevent API Key abuse.
- **Flexible Mail Providers**: Developers can configure a custom ZeptoMail integration to send real emails (like verification links) to their users, or use a Local Console provider for rapid development.
- **Swagger Documentation**: Beautiful, auto-generated API documentation available right out of the box.

## 🛠️ Tech Stack

- **Backend**: FastAPI (Python)
- **Database**: PostgreSQL with SQLAlchemy (Async) & Alembic for migrations
- **Frontend**: Next.js 15 (React), TailwindCSS, Lucide Icons
- **Package Managers**: `uv` (Python), `yarn` (Node.js)

## 💻 Local Development Setup

To run Intellaxis Auth locally, you'll need two terminal windows: one for the backend API and one for the frontend dashboard.

### Prerequisites
- PostgreSQL running locally
- Python 3.11+
- Node.js 18+

### 1. Database Setup
Create a PostgreSQL database (e.g., named `intellaxis`). Ensure you update the `DATABASE_URL` in your backend `.env` file to point to this database.

### 2. Backend Setup
Navigate to the `backend` directory and install the dependencies:
```bash
cd backend
uv sync
```

Run database migrations to generate the tables:
```bash
uv run alembic upgrade head
```

Start the FastAPI server:
```bash
uv run uvicorn main:app --reload
```
The backend API will run on `http://localhost:8000`. You can view the auto-generated API documentation at `http://localhost:8000/docs`.

### 3. Create a Super Admin
When you first start the application, navigate to `http://localhost:3000/login`. Since there are no admins in the database, you will be automatically redirected to a secure **First Time Setup** wizard to create your Super Admin account. Once created, the setup wizard will lock itself permanently.

### 4. Frontend Setup
Navigate to the `frontend` directory and install the dependencies:
```bash
cd frontend
yarn install
```

Start the Next.js development server:
```bash
yarn dev
```
The frontend dashboard will run on `http://localhost:3000`.

## 📖 Integrating with Tenant Applications

To use Intellaxis Auth in your own application:

1. Create a developer account at `http://localhost:3000/register`.
2. Create a new Project in the dashboard.
3. Configure your **Authorized Domains** (CORS Settings) in the project dashboard (e.g., add `http://localhost:5173` if you're building a Vite app locally).
4. Copy your project's `API Key`.
5. From your application, make requests to the Intellaxis Auth backend (e.g., `POST http://localhost:8000/api/auth/register`) and include your API Key in the headers:
   ```http
   X-API-Key: proj_YOUR_API_KEY_HERE
   ```
6. Check `http://localhost:8000/docs` for the complete list of available authentication endpoints, request payloads, and response formats.

## 🐳 Docker (Coming Soon)
Full Dockerization support for one-click deployments via `docker-compose` is actively being developed.
