import requests
from fastapi import HTTPException, status
from api.config import settings

def github_auth_callback(code: str) -> dict:
    url = "https://github.com/login/oauth/access_token"
    data = {
        "client_id": settings.CLIENT_ID,
        "client_secret": settings.CLIENT_SECRET,
        "code": code,
    }
    headers = {"Accept": "application/json"}

    try:
        response = requests.post(url, data=data, headers=headers)
        response.raise_for_status()
        data = response.json()

        if "access_token" not in data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="GitHub authentication failed"
            )

        return {"access_token": data["access_token"]}
    except requests.RequestException as e:
        status_code = getattr(e.response, "status_code", status.HTTP_500_INTERNAL_SERVER_ERROR)
        raise HTTPException(status_code=status_code, detail={str(e)})
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))