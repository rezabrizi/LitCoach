import requests
from fastapi import HTTPException, status

def fetch_github_user_repos(access_code: str) -> dict:
    url = "https://api.github.com/user/repos/"
    headers={
        "Authorization": f"token {access_code}",
        "Accept": "application/vnd.github.v3+json"
    }

    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status() 
        return response.json()
    except requests.RequestException as e:
        status_code = getattr(e.response, "status_code", status.HTTP_500_INTERNAL_SERVER_ERROR)
        raise HTTPException(status_code=status_code, detail=str(e))