from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from api.models import LeetCodeSubmission
from api.db import resolve_user_by_legacy_user_id
from api.github import resolve_github_repo_id_to_repo_name, push_to_github

from api.config import logger

router = APIRouter()

DIFFICULTY_MAP = {
    "Easy": "green",
    "Medium": "orange",
    "Hard": "red",
}

LANGUAGE_EXTENSIONS = {
    "C++": "cpp",
    "Java": "java",
    "Python": "py",
    "Python3": "py",
    "C": "c",
    "C#": "cs",
    "JavaScript": "js",
    "TypeScript": "ts",
    "PHP": "php",
    "Swift": "swift",
    "Kotlin": "kt",
    "Dart": "dart",
    "Go": "go",
    "Ruby": "rb",
    "Scala": "scala",
    "Rust": "rs",
    "Racket": "rkt",
    "Erlang": "erl",
    "Elixir": "ex",
    "MySQL": "sql",
    "Pandas": "py",
    "MS SQL Server": "sql",
    "Oracle": "sql",
    "PostgreSQL": "sql",
    "Bash": "sh",
}


@router.post("/user/github/submission")
def user_github_submission(request: LeetCodeSubmission):
    try:
        user = None
        if request.user_id and not request.github_access_token:
            user = resolve_user_by_legacy_user_id(request.user_id)
            if not user:
                raise HTTPException(status_code=404, detail="User not found")

        access_token = user.access_token if user else request.github_access_token
        if not access_token:
            raise HTTPException(status_code=400, detail="Access token is required")

        repo = resolve_github_repo_id_to_repo_name(
            repo_id=request.github_repo_id,
            access_token=access_token,
        )
        if not repo:
            raise HTTPException(status_code=404, detail="GitHub repository not found")

        folder_name = (
            f"{int(request.question.questionId):04d}-{request.question.titleSlug}"
        )
        readme_path = f"{folder_name}/README.md"
        extension = LANGUAGE_EXTENSIONS.get(request.lang.verboseName, "txt")
        solution_path = f"{folder_name}/{request.question.titleSlug}.{extension}"
        solution_git_message = f"Time: {request.runtimeDisplay} ({request.runtimePercentile:.2f}%) Space: {request.memoryDisplay} ({request.memoryPercentile:.2f}%)"
        readme_content = f"""
# [{request.question.title}](https://leetcode.com/problems/{request.question.titleSlug}) ![](https://img.shields.io/badge/{request.question.difficulty}-{DIFFICULTY_MAP.get(request.question.difficulty, "gray")})

{request.question.content}
        """

        push_to_github(
            file_path=readme_path,
            content=readme_content,
            commit_message=f"Problem description for {request.question.title}",
            owner_name=repo["owner"],
            repo_name=repo["name"],
            access_token=access_token,
        )

        push_to_github(
            file_path=solution_path,
            content=request.code,
            commit_message=solution_git_message,
            owner_name=repo["owner"],
            repo_name=repo["name"],
            access_token=access_token,
        )

        return JSONResponse(
            content={
                "message": "Problem and solution successfully added to GitHub!",
            },
            status_code=201,
        )
    except HTTPException as e:
        logger.error(e)
        raise
    except Exception as e:
        logger.error(e)
        raise HTTPException(status_code=500, detail=f"Unexpected Error: {str(e)}")
