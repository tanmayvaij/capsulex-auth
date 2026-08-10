from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routes import router
from api.routes_developer import developer_router

app = FastAPI(title="Central Auth Service API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development, allow all origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api")
app.include_router(developer_router, prefix="/api")

@app.get("/")
def read_root():
    return {"status": "ok", "message": "Welcome to FastAPI!"}
