https://chromewebstore.google.com/detail/litcoach/pbkbbpmpbidfjbcapgplbdogiljdechf?hl=en&authuser=0

### Prerequisites  
Ensure the following are installed:  
- Node.js
- Python  
- Poetry  

### Environment Variables  
Set up the following environment variables. 
There is a `.env.example` file in the root of the project that you can use as a template.

#### **Frontend**  
```plaintext
VITE_API_URL=http://127.0.0.1:8000
VITE_GITHUB_CLIENT_ID=
```  

#### **Backend**  
```plaintext
MONGO_DB_URI=
OPENAI_KEY=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
STRIPE_WEBHOOK_SECRET=
STRIPE_API_KEY=
BASE_URL=http://127.0.0.1:8000
```  

### Installation  

1. Clone the repository:  
   ```bash
   git clone https://github.com/rezabrizi/LitCoach.git && cd LitCoach
   ```  
2. Install dependencies:  
   ```bash
   npm install
   ```  
3. Start the development server:  
   ```bash
   npm run start
   ```  
4. Load the extension in Chrome:  
   - Go to `chrome://extensions/`  
   - Enable Developer Mode  
   - Click Load unpacked and select the `dist` folder  
