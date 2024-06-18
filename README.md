<p align="center">
  <img src="assets/Preview1.jpg" alt="Sample Image 1" width="300"/>
  <img src="assets/Preview2.jpg" alt="Sample Image 2" width="300"/>
  <img src="assets/Preview3.jpeg" alt="Sample Image 3" width="300"/>
</p>

[![Chrome Web Store](https://img.shields.io/badge/Featured_on-Chrome_Web_Store-cce7e8?style=for-the-badge)](https://chromewebstore.google.com/detail/litcoach/pbkbbpmpbidfjbcapgplbdogiljdechf?hl=en&authuser=0)

## Technologies Used

### Backend

- [![Flask](https://img.shields.io/badge/Powered_by-Flask-000000?style=for-the-badge&logo=flask)](https://flask.palletsprojects.com/)
- [![OpenAI](https://img.shields.io/badge/Powered_by-OpenAI-FF6600?style=for-the-badge&logo=openai)](https://www.openai.com/)
- [![Vercel](https://img.shields.io/badge/Deployed_on-Vercel-000000?style=for-the-badge&logo=vercel)](https://vercel.com/)

### Frontend

- [![Vite](https://img.shields.io/badge/Powered_by-Vite-646CFF?style=for-the-badge&logo=vite)](https://vitejs.dev/)
- [![React](https://img.shields.io/badge/Powered_by-React-61DAFB?style=for-the-badge&logo=react)](https://reactjs.org/)
- [![Chakra UI](https://img.shields.io/badge/Styled_with-Chakra_UI-319795?style=for-the-badge&logo=chakra-ui)](https://chakra-ui.com/)
- [![Axios](https://img.shields.io/badge/HTTP_requests_with-Axios-009688?style=for-the-badge&logo=axios)](https://www.npmjs.com/package/axios/)

## Local Development Instructions

> **Note:** This project uses the `concurrently` package to run the server and extension simultaneously. Check the `package.json` file for more details.

### Prerequisites

Ensure you have the following software installed on your machine:

- [Node.js](https://nodejs.org/)
- [Python](https://www.python.org/)
- [Anaconda (optional)](https://www.anaconda.com/products/distribution) for managing virtual environments

### Setup Steps

1. **Clone the repository:**

    ```bash
    git clone https://github.com/rezabrizi/LitCoach.git
    ```

2. **Navigate to the project directory:**

    ```bash
    cd LitCoach
    ```

3. **Set up a Python virtual environment:**

    Using `venv`:

    ```bash
    # Create a virtual environment
    python -m venv venv

    # Activate the virtual environment
    # On Windows
    venv\Scripts\activate
    # On Unix or MacOS
    source venv/bin/activate
    ```

    Using `conda`:

    ```bash
    # Create a conda environment
    conda create --name litcoach-env python=3.12

    # Activate the conda environment
    conda activate litcoach-env
    ```

4. **Install necessary dependencies:**

    ```bash
    npm install
    ```
    > **Note:** This command not only installs the Node.js dependencies but also triggers a post-install script that installs the required Python packages.

5. **Start the server and extension concurrently:**

    ```bash
    npm run dev
    ```

6. **Enable Developer Mode in Chrome:**

    - Navigate to `chrome://extensions/`.
    - Enable Developer Mode.

7. **Load the extension:**

    - Click "Load unpacked".
    - Select the `dist` folder.
    - The extension is now ready for seamless testing and development.