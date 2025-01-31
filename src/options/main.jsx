import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "@options/App.jsx";
import { Toaster } from "@/components/ui/toaster";
import "@styles/index.css";

createRoot(document.getElementById("root")).render(
    <StrictMode>
        <App />
        <Toaster />
    </StrictMode>,
);
