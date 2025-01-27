import React, { useEffect, useState } from "react";
import GithubAuth from "@/components/github-auth";

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        chrome.runtime.sendMessage({ action: "is_authenticated" }, (response) => {
            if (response?.authenticated) {
                setIsAuthenticated(true);
            } else {
                setIsAuthenticated(false);
            }
        });
    }, []);

    return (
        <div>
            <h1>Side Panel</h1>
            {!isAuthenticated ? (
                <GithubAuth />
            ) : (
                <p>You are authenticated with GitHub. Access your features!</p>
            )}
        </div>
    );
}

export default App;
