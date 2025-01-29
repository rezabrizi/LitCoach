import requests
from fastapi.exceptions import HTTPException
import os
from dotenv import load_dotenv
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

        print(f"code: {code}")
        print(f"GITHUB_CLIENT_ID: {settings.GITHUB_CLIENT_ID}")
        print(f"GITHUB_CLIENT_SECRET: {settings.GITHUB_CLIENT_SECRET}")
        print(response.json())

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
    try:
        response = requests.get(
            "https://api.github.com/user/repos",
            headers={"Authorization": f"token {access_token}"},
        )

        response.raise_for_status()

        return response.json()
    except requests.RequestException as e:
        raise HTTPException(
            status_code=getattr(e.response, "status_code", 500),
            detail=f"Error fetching user's Github repositories: {str(e)}",
        )
