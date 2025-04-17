import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "@sidepanel/App.jsx";
import { GoogleAuth } from "@/components/google-auth";
import { Toaster } from "@components/ui/toaster";
import "@styles/index.css";

createRoot(document.getElementById("root")).render(
    <StrictMode>
        <GoogleAuth>
            <App />
        </GoogleAuth>
        <Toaster />
    </StrictMode>,
);
