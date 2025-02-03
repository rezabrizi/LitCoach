from fastapi import APIRouter, HTTPException
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
        repo = resolve_github_repo_id_to_repo_name(
            request.github_repo_id, user.access_token
        )

        if not user:
            raise HTTPException(status_code=403, details="User not found!")

        push_to_github(
            readme_path,
            request.question_content,
            f"Add problem description for {request.question_title}",
            repo.get("owner"),
            repo.get("name"),
            user.access_token,
        )

        push_to_github(
            code_path,
            request.code,
            f"Time: {request.runtime} ({request.runtime_percentile}) Space: {request.memory} ({request.memory_percentile})",
            repo.get("owner"),
            repo.get("name"),
            user.access_token,
        )

        return {
            "message": "Problem and solution successfully added to GitHub!",
            "problem": folder_name,
        }

    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected Error: {str(e)}")