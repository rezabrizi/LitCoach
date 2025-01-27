import requests
from fastapi import HTTPException


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


def user_has_enough_tokens(github_id: str, tokens: int):
    pass


def is_user_premium(github_id: str):
    pass


def get_token_count(model: str, string: str):
    pass
