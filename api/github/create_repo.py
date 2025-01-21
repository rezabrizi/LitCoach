import requests
from fastapi import HTTPException, status

def create_github_repo(repo_name: str, access_token: str) -> None:
    url = f"https://api.github.com/repos/{repo_name}"
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
    except requests.RequestException as e:
        status_code = getattr(e.response, "status_code", status.HTTP_500_INTERNAL_SERVER_ERROR)
        raise HTTPException(status_code=status_code, detail=str(e))