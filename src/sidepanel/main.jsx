import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "@sidepanel/App.jsx";
import { GitHubAuth } from "@components/github-auth";
import { Toaster } from "@components/ui/toaster";
import "@styles/index.css";

createRoot(document.getElementById("root")).render(
    <StrictMode>
        <GitHubAuth>
            <App />
        </GitHubAuth>
        <Toaster />
    </StrictMode>,
);
