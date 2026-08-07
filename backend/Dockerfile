FROM python:3.14-slim

WORKDIR /app

# Install uv from the official image
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

# Copy dependency files
COPY pyproject.toml uv.lock ./

# Install dependencies using uv sync (creates a virtualenv)
RUN uv sync --frozen --no-dev

# Copy application code
COPY . .

# Expose the application port
EXPOSE 8000

# Run the FastAPI server using the uv run command
CMD ["uv", "run", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
