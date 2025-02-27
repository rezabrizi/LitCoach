import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "@options/App.jsx";
import { Toaster } from "@components/ui/toaster";
import { GitHubAuth } from "@components/github-auth";
import "@styles/index.css";

createRoot(document.getElementById("root")).render(
    <StrictMode>
        <GitHubAuth>
            <App />
        </GitHubAuth>
        <Toaster />
    </StrictMode>,
);
