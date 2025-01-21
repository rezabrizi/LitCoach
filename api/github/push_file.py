import requests
from base64 import b64encode
from fastapi import HTTPException, status
from .user_info import fetch_github_user_info

def push_file_to_github(repo_name: str, file_path: str, content: str, commit_message: str, access_token: str) -> None:
    try:
        user_info = fetch_github_user_info(access_token)
    except HTTPException as e:
        raise HTTPException(status_code=e.status_code, detail=str(e))
    
    owner = user_info["login"]
    encoded_content = b64encode(content.encode()).decode()
    url = f"https://api.github.com/repos/{owner}/{repo_name}/contents/{file_path}"
    headers = {
        "Authorization": f"token {access_token}",
        "Accept": "application/vnd.github.v3+json"
    }
    data = {
        "message": commit_message,
        "content": encoded_content
    }

    # Check if file exists
    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        file_sha = response.json()["sha"]
        data["sha"] = file_sha
    except requests.RequestException:
        pass

    # Create or update file
    try:
        response = requests.put(url, headers=headers, json=data)
        response.raise_for_status()
    except requests.RequestException as e:
        status_code = getattr(e.response, "status_code", status.HTTP_500_INTERNAL_SERVER_ERROR)
        raise HTTPException(status_code=status_code, detail=str(e))