from fastapi import APIRouter, HTTPException

from api.models.problem import LeetcodeSubmission
from api.services.database import user_exists
from api.utils.github import (
    get_user_repos,
    resolve_github_repo_id_to_repo_name,
    push_to_github,
    create_github_repo,
)


router = APIRouter()


@router.get("/repos")
def get_all_available_repos(github_id: int):

    try:
        print(github_id)
        user = user_exists(github_id)
        print(user)
        if not user:
            raise HTTPException(403, detail="User DNE")

        user_repos = get_user_repos(user.access_token)

        user_repos_names_and_ids = [
            {"id": repo["id"], "name": repo["name"]} for repo in user_repos
        ]

        return user_repos_names_and_ids
    except HTTPException as e:
        raise e


from pydantic import BaseModel

LANGUAGE_EXTENSIONS = {
    "C++": "cpp",
    "Java": "java",
    "python": "py",
    "Python3": "py",  # Same as Python
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
        # Generate filenames
        folder_name = (
            request.question_id + "-" + request.question_title.replace(" ", "-").lower()
        )
        readme_path = f"{folder_name}/README.md"

        extension = LANGUAGE_EXTENSIONS.get(request.language, "txt")
        print(extension)
        code_path = f"{folder_name}/{folder_name}.{extension}"

        user = user_exists(request.user_github_id)
        repo = resolve_github_repo_id_to_repo_name(
            request.github_repo_id, user.access_token
        )

        if not user:
            raise HTTPException(status_code=403, details="User not found!")

        # Push README.md
        push_to_github(
            readme_path,
            request.question_content,
            f"Add problem description for {request.question_title}",
            repo.get("owner"),
            repo.get("name"),
            user.access_token,
        )

        # Push Source Code
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


class CreateRepo(BaseModel):
    github_id: int
    repo_name: str


@router.post("/create_repo")
def create_repo(request: CreateRepo):
    try:
        user = user_exists(request.github_id)
        if not user:
            raise HTTPException(status_code=403, details="User not found!")
        repo_id = create_github_repo(request.repo_name, user.access_token)
        return {
            "message": "Repo created successfully!",
            "repo_id": repo_id,
        }
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected Error: {str(e)}")
