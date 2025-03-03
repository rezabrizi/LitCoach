from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from api.routes import router
from api.config import get_settings

app = FastAPI()
settings = get_settings()


@app.middleware("http")
async def restrict_origins(request: Request, call_next):
    if request.method == "OPTIONS":
        return JSONResponse(status_code=200, content={})

    if request.url.path == "/health":
        return await call_next(request)

    allowed_origins = {
        "chrome-extension://pbkbbpmpbidfjbcapgplbdogiljdechf",
    }
    origin = request.headers.get("origin")

    if not origin or origin not in allowed_origins:
        return JSONResponse(status_code=403, content={"detail": "Forbidden origin"})

    return await call_next(request)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
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
