https://chromewebstore.google.com/detail/litcoach/pbkbbpmpbidfjbcapgplbdogiljdechf?hl=en&authuser=0

### Prerequisites

Ensure you have:

-   Node.js
-   Python
-   Poetry
-   Stripe CLI
-   GitHub OAuth App
-   Stripe Account
-   MongoDB Cluster
-   OpenAI API Key

### Environment Variables

Copy `.env.example` to `.env` and fill in:

```plaintext
VITE_API_URL=http://127.0.0.1:8000
VITE_GITHUB_CLIENT_ID=

MONGO_DB_URI=
OPENAI_KEY=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
STRIPE_WEBHOOK_SECRET=
STRIPE_API_KEY=
```

### Installation

1. Clone the repo:

    ```bash
    git clone https://github.com/rezabrizi/LitCoach.git && cd LitCoach
    ```

2. Set up Python environment:

    ```bash
    python -m venv venv && source venv/bin/activate  # or use conda
    ```

3. Install dependencies:

    ```bash
    npm install
    poetry install
    ```

4. Start the frontend server:

    ```bash
    npm run start
    ```

5. Start the backend server:

    ```bash
    uvicorn api.app:app --reload
    ```

6. Set up Stripe webhook:

    ```bash
    stripe listen --forward-to http://localhost:8000/stripe/webhook
    ```

7. Load the extension:
    - Go to `chrome://extensions/`
    - Enable Developer Mode
    - Click **Load unpacked** and select the `dist` folder.
