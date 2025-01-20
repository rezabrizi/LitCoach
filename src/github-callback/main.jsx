import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "@github-callback/App.jsx";
import "@styles/index.css";

createRoot(document.getElementById("root")).render(
    <StrictMode>
        <App />
    </StrictMode>,
);
