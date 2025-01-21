from fastapi import APIRouter, HTTPException, status
from api.github import does_github_repo_exist, push_file_to_github
from api.models import LeetCodeSubmission

router = APIRouter()

SOLUTION_EXTENSION = {
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
    "Exlir": "ex",
}

@router.get("/push-leetcode-submission")
async def push_leetcode_submission(submission: LeetCodeSubmission):
    try:
        if not does_github_repo_exist(submission.repo_name, submission.access_token):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Repository not found")
        
        directory_name = f"{submission.problem_number}-{submission.title.replace(' ', '-')}"

        # Add README.md
        push_file_to_github(
            repo_name=submission.repo_name,
            file_path=f"{directory_name}/README.md",
            content=submission.problem_description,
            commit_message=f"Add {submission.title} problem description",
            access_token=submission.access_token
        )

        # Add solution file
        push_file_to_github(
            repo_name=submission.repo_name,
            file_path=f"{directory_name}/{submission.title}.{SOLUTION_EXTENSION.get(submission.language, 'txt')}",
            content=submission.solution,
            commit_message=f"Time: {submission.runtime} ms ({submission.runtime_rank}%), Space: {submission.space} MB ({submission.space_rank}%)",
            access_token=submission.access_token
        )

        return {"message": "Submission pushed successfully"}
    except HTTPException as e:
        status_code = getattr(e.response, "status_code", status.HTTP_500_INTERNAL_SERVER_ERROR)
        exception_detail = getattr(e, "detail", str(e))
        raise HTTPException(status_code=status_code, detail=exception_detail)





