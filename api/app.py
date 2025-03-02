from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.routes import router
from api.config import get_settings

app = FastAPI()
settings = get_settings()

from fastapi import Request, HTTPException


@app.middleware("http")
async def restrict_origins(request: Request, call_next):
    allowed_origins = {
        "http://localhost:5173",
        "chrome-extension://pbkbbpmpbidfjbcapgplbdogiljdechf",
    }
    origin = request.headers.get("origin")

    if origin and origin not in allowed_origins:
        raise HTTPException(status_code=403, detail="Forbidden origin")

    return await call_next(request)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "chrome-extension://pbkbbpmpbidfjbcapgplbdogiljdechf",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(router)


@app.get("/health")
def health_check():
    return {"message": "healthy"}
