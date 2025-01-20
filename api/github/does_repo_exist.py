import requests
from fastapi import HTTPException
from .user_info import fetch_github_user_info

def does_github_repo_exist(repo_name: str, access_code: str) -> bool:
    try:
        user_info = fetch_github_user_info(access_code)
    except HTTPException as e:
        raise HTTPException(status_code=e.status_code, detail=str(e))
    
    owner = user_info["login"]
    url = f"https://api.github.com/repos/{owner}/{repo_name}"
    headers={
        "Authorization": f"token {access_code}",
        "Accept": "application/vnd.github.v3+json"
    }

    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        return True
    except requests.RequestException:
        return False