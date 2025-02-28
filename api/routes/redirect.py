from fastapi import APIRouter, HTTPException
from fastapi.responses import HTMLResponse
from api.config import logger

router = APIRouter()


@router.get("/redirect")
def redirect_to_extension():
    try:
        html_content = f"""
        <html>
            <head>
                <script>
                    window.location.href = "chrome-extension://pbkbbpmpbidfjbcapgplbdogiljdechf/src/options/index.html";
                </script>
            </head>
            <body>
                <p>Redirecting to extension...</p>
            </body>
        </html>
        """
        return HTMLResponse(content=html_content)
    except Exception as e:
        logger.error(e)
        raise HTTPException(status_code=500, detail=str(e))
