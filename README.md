LitCoach is a Chrome extension that provides real-time feedback on LeetCode problems and automatically syncs your solutions to a GitHub repository—making it easy to track your progress.

https://chromewebstore.google.com/detail/litcoach/pbkbbpmpbidfjbcapgplbdogiljdechf

![LitCoach Diagram](assets/diagram.png)  
Image from gitdiagram.com

### Prerequisites

Make sure you have the following installed and set up:

-   [Node.js](https://nodejs.org/)
-   [Python 3.12+](https://www.python.org/downloads/)
-   [Poetry](https://python-poetry.org/docs/#installation)
-   [Stripe CLI](https://stripe.com/docs/stripe-cli)
-   [MongoDB Atlas](https://www.mongodb.com/atlas/database)
-   [OpenAI API Key](https://platform.openai.com/account/api-keys)
-   [GitHub OAuth App](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/creating-an-oauth-app)
-   [Stripe Account](https://dashboard.stripe.com/register)

### Environment Setup

1. Copy the example environment file:

    ```bash
    cp .env.example .env
    ```

2. Fill in the required values:

    ```env
    # Frontend
    VITE_API_URL=http://127.0.0.1:8000
    VITE_GITHUB_CLIENT_ID=

    # Backend
    MONGO_DB_URI=
    OPENAI_KEY=
    GITHUB_CLIENT_ID=
    GITHUB_CLIENT_SECRET=
    STRIPE_WEBHOOK_SECRET=
    STRIPE_API_KEY=
    ```

> [!IMPORTANT]
> When creating the GitHub OAuth App, set the Authorization callback URL to:  
> `https://pbkbbpmpbidfjbcapgplbdogiljdechf.chromiumapp.org`  
> This is required for Chrome extension authentication to work properly.

> [!NOTE]
> For help finding API keys or setting up services, refer to the linked platforms above.

### Installation

1. Clone the repository:

    ```bash
    git clone https://github.com/rezabrizi/LitCoach.git && cd LitCoach
    ```

2. Set up Python virtual environment:

    ```bash
    python3.12 -m venv venv && source venv/bin/activate
    ```

3. Install dependencies:

    ```bash
    npm install
    poetry install
    ```

4. Start servers:

    ```bash
    npm run dev                        # Frontend
    uvicorn api.app:app --reload      # Backend
    ```

5. Start Stripe webhook listener:

    ```bash
    stripe listen --forward-to http://localhost:8000/stripe/webhook
    ```

### Load the Extension

1. Go to `chrome://extensions/`

2. Enable Developer Mode

3. Click Load unpacked and select the `dist` folder
