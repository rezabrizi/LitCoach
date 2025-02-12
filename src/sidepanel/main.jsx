import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "@sidepanel/App.jsx";
import { AuthComponent } from "@components/auth";
import { Toaster } from "@components/ui/toaster";
import "@styles/index.css";

createRoot(document.getElementById("root")).render(
    <StrictMode>
        <AuthComponent>
            <App />
        </AuthComponent>
        <Toaster />
    </StrictMode>,
);
