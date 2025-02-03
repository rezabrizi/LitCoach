import requests
from fastapi.exceptions import HTTPException
import base64
from typing import List
from api.config import settings

def resolve_github_access_token(code: str):
    try:
        response = requests.post(
            "https://github.com/login/oauth/access_token",
            json={
                "client_id": settings.GITHUB_CLIENT_ID,
                "client_secret": settings.GITHUB_CLIENT_SECRET,
                "code": code,
            },
            headers={"Accept": "application/json"},
        )

        response.raise_for_status()
        access_token = response.json().get("access_token")

        if not access_token:
            error_description = response.json().get(
                "error_description", "Unknown error"
            )
            raise HTTPException(
                status_code=400,
                detail=f"Error getting access token: {error_description}",
            )

        return access_token

    except requests.RequestException as e:
        raise HTTPException(
            status_code=500,
            detail=f"Request to GitHub failed: {str(e)}",
        )


def get_user_info_from_github(access_token: str):
    try:
        response = requests.get(
            "https://api.github.com/user",
            headers={"Authorization": f"token {access_token}"},
        )

        response.raise_for_status()
        return response.json()

    except requests.RequestException as e:
        raise HTTPException(
            status_code=getattr(e.response, "status_code", 500),
            detail=f"Error fetching GitHub user info: {str(e)}",
        )


def get_user_repos(access_token: str) -> List[dict]:
    url = "https://api.github.com/user/repos"
    headers = {"Authorization": f"token {access_token}"}
    params = {"affiliation": "owner", "per_page": 100}  

    try:
        repos = []
        page = 1
        while True:
            response = requests.get(url, headers=headers, params={**params, "page": page})
            response.raise_for_status()
            page_repos = response.json()

            if not page_repos:
                break

            repos.extend(page_repos)
            page += 1

        return repos

    except requests.RequestException as e:
        raise HTTPException(
            status_code=getattr(e.response, "status_code", 500),
            detail=f"Error fetching user's GitHub repositories: {str(e)}",
        )


def resolve_github_repo_id_to_repo_name(repo_id: int, access_token: str):
    repos = get_user_repos(access_token=access_token)

    for repo in repos:
        if repo.get("id") == repo_id:
            return {
                "name": repo.get("name"),
                "owner": repo.get("owner").get("login"),
            }

    return None


def push_to_github(
    file_path: str,
    content: str,
    commit_message: str,
    owner_login: str,
    repo_name: str,
    access_token: str,
):
    url = f"https://api.github.com/repos/{owner_login}/{repo_name}/contents/{file_path}"
    headers = {"Authorization": f"token {access_token}"}

    content_encoded = base64.b64encode(content.encode()).decode("utf-8")

    response = requests.get(url, headers=headers)
    sha = response.json().get("sha", None)  

    data = {
        "message": commit_message,
        "content": content_encoded,
        "branch": "main",
    }
    if sha:
        data["sha"] = sha 

    try:
        response = requests.put(url, json=data, headers=headers)
        response.raise_for_status()
        return {"status": "success", "file": file_path}
    except requests.RequestException as e:
        raise HTTPException(
            status_code=getattr(e.response, "status_code", 500),
            detail=f"Error pushing to GitHub: {str(e)}",
        )


def create_github_repo(repo_name: str, access_token: str) -> int:
    url = "https://api.github.com/user/repos"
    headers = {
        "Authorization": f"token {access_token}",
        "Accept": "application/vnd.github.v3+json",
    }
    data = {
        "name": repo_name,
        "description": "Collection of successful LeetCode submissions - automatically synced using LitCoach",
        "homepage": "https://chromewebstore.google.com/detail/litcoach/pbkbbpmpbidfjbcapgplbdogiljdechf",
        "private": False,
        "auto_init": True,
    }

    try:
        response = requests.post(url, headers=headers, json=data)
        response.raise_for_status()
        return response.json().get("id")
    except requests.RequestException as e:
        raise HTTPException(
            status_code=getattr(e.response, "status_code", 500),
            detail=f"Error creating GitHub repo: {str(e)}",
        )
