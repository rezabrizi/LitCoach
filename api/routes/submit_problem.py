from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from api.models import LeetcodeSubmission
from api.db import user_exists
from api.services import resolve_github_repo_id_to_repo_name, push_to_github


router = APIRouter()

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
}


@router.post("/submit_problem")
def submit_problem(request: LeetcodeSubmission):
    try:
        folder_name = (
            request.question_id + "-" + request.question_title.replace(" ", "-").lower()
        )
        readme_path = f"{folder_name}/README.md"

        extension = LANGUAGE_EXTENSIONS.get(request.language, "txt")
        code_path = f"{folder_name}/{folder_name}.{extension}"

        user = user_exists(request.user_github_id)
        if not user:
            raise HTTPException(status_code=403, details="User not found!")
        
        repo = resolve_github_repo_id_to_repo_name(
            request.github_repo_id, user.access_token
        )

        push_to_github(
            file_path=readme_path,
            content=request.question_content,
            commit_message=f"Add problem description for {request.question_title}",
            owner_name=repo.get("owner"),
            repo_name=repo.get("name"),
            access_token=user.access_token,
        )

        push_to_github(
            file_path=code_path,
            content=request.code,
            commit_message=f"Time: {request.runtime} ({request.runtime_percentile}) Space: {request.memory} ({request.memory_percentile})",
            owner_name=repo.get("owner"),
            repo_name=repo.get("name"),
            access_token=user.access_token,
        )

        return JSONResponse(
            content={
                "message": "Problem and solution successfully added to GitHub!",
                "problem": folder_name,
            },
            status_code=201,
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected Error: {str(e)}")
