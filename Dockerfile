# Stage 1: Build Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package.json frontend/yarn.lock ./
RUN yarn install --frozen-lockfile

COPY frontend/ ./
# Next.js will build into the 'out' directory due to output: 'export' in next.config.ts
RUN yarn build

# Stage 2: Build Backend and Final Image
FROM python:3.11-slim
WORKDIR /app

# Install uv for fast python package management
RUN pip install uv

# Copy backend dependencies
COPY backend/pyproject.toml backend/uv.lock ./
# Install dependencies system-wide in the container
RUN uv pip install --system -r pyproject.toml

# Copy backend source code
COPY backend/ ./

# Copy statically exported frontend to the backend's 'out' directory
COPY --from=frontend-builder /app/frontend/out ./out

# Expose port
EXPOSE 8000

# Start FastAPI server
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
