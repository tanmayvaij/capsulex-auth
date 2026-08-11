from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from api.routes import router
from api.routes_developer import developer_router
from slowapi.errors import RateLimitExceeded
from slowapi import _rate_limit_exceeded_handler
from core.rate_limit import limiter
import os

app = FastAPI(title="Central Auth Service API")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development, allow all origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api")
app.include_router(developer_router, prefix="/api")

frontend_path = os.path.join(os.path.dirname(__file__), "out")

if os.path.exists(frontend_path):
    # Mount the _next static assets explicitly
    next_assets = os.path.join(frontend_path, "_next")
    if os.path.exists(next_assets):
        app.mount("/_next", StaticFiles(directory=next_assets), name="next_assets")
        
    @app.get("/{catchall:path}")
    def serve_frontend(catchall: str):
        if catchall.startswith("api/"):
            return {"detail": "Not Found"}
            
        file_path = os.path.join(frontend_path, catchall)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
            
        html_path = os.path.join(frontend_path, f"{catchall}.html")
        if os.path.isfile(html_path):
            return FileResponse(html_path)
            
        index_path = os.path.join(frontend_path, "index.html")
        if os.path.isfile(index_path):
            return FileResponse(index_path)
            
        return {"detail": "Not Found"}
else:
    @app.get("/")
    def read_root():
        return {"status": "ok", "message": "Welcome to FastAPI! (Frontend not built)"}
