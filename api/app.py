from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routes import callback_router, leetcode_push_router, repo_exist_router, user_repos_router

app = FastAPI(title="LitCoach Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(callback_router)
app.include_router(leetcode_push_router)
app.include_router(repo_exist_router)
app.include_router(user_repos_router)

@app.get("/health")
async def health_check():
    return {"message": "healthy"}
