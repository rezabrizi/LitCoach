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

        # Extract the access token from the response
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
        # Handle request errors and return an HTTPException
        raise HTTPException(
            status_code=500,
            detail=f"Request to GitHub failed: {str(e)}",
        )


def get_user_info_from_github(access_token: str):
    """
    Fetch GitHub user information using an access token.

    :param access_token: GitHub OAuth access token.
    :return: A dictionary with GitHub user information.
    :raises HTTPException: If the request to GitHub fails.
    """
    try:
        # Call the GitHub API to get user information
        response = requests.get(
            "https://api.github.com/user",
            headers={"Authorization": f"token {access_token}"},
        )

        # Raise an exception for non-200 responses
        response.raise_for_status()

        # Parse and return the user data
        return response.json()

    except requests.RequestException as e:
        raise HTTPException(
            status_code=getattr(e.response, "status_code", 500),
            detail=f"Error fetching GitHub user info: {str(e)}",
        )


def get_user_repos(access_token: str) -> List[dict]:
    """
    Fetch all GitHub repositories for the authenticated user by handling pagination.

    :param access_token: GitHub OAuth access token.
    :return: A list of repository dictionaries.
    """
    try:
        repos = []
        page = 1
        while True:
            response = requests.get(
                "https://api.github.com/user/repos",
                headers={"Authorization": f"token {access_token}"},
                params={"affiliation": "owner", "per_page": 100, "page": page},  # Get up to 100 per page
            )

            response.raise_for_status()

            page_repos = response.json()
            if not page_repos:  # Stop if no more repositories
                break

            repos.extend(page_repos)
            page += 1  # Move to the next page

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
            try:
                return {
                    "name": repo.get("name"),
                    "owner": repo.get("owner").get("login"),
                }
            except Exception as e:
                raise HTTPException(
                    status_code=500,
                    detail="Unable to retrieve the github repo info to push to",
                )
    return None


# GitHub API function to create/update a file
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

    # Encode content in base64
    content_encoded = base64.b64encode(content.encode()).decode("utf-8")

    # Check if the file already exists (required for updating)
    response = requests.get(url, headers=headers)
    sha = response.json().get("sha", None)  # Get file SHA if it exists

    # Create payload for GitHub API request
    data = {
        "message": commit_message,
        "content": content_encoded,
        "branch": "main",
    }
    if sha:
        data["sha"] = sha  # Required for updating existing files

    # Send request to GitHub API
    response = requests.put(url, json=data, headers=headers)
    if response.status_code in [200, 201]:
        return {"status": "success", "file": file_path}
    else:
        raise HTTPException(
            status_code=500, detail=f"GitHub API Error: {response.json()}"
        )
    
def create_github_repo(repo_name: str, access_token: str) -> int:
    url = "https://api.github.com/user/repos"
    headers = {
        "Authorization": f"token {access_token}",
        "Accept": "application/vnd.github.v3+json"
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
        status_code = getattr(e.response, "status_code", 500)
        raise HTTPException(status_code=status_code, detail=str(e))

    
