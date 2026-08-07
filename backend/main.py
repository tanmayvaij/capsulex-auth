from fastapi import FastAPI
from api.routes import router

app = FastAPI(title="Backend API")

app.include_router(router, prefix="/api")

@app.get("/")
def read_root():
    return {"status": "ok", "message": "Welcome to FastAPI!"}
