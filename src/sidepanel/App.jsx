import { useEffect, useState } from "react";
import GitHubAuthComponent from "@/components/github-auth";
import { Loader2 } from "lucide-react";

function App() {
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setAuthenticated] = useState(false);

    useEffect(() => {
        chrome.runtime.sendMessage({ action: "isAuthenticated" }, (response) => {
            setAuthenticated(response?.authenticated);
            setLoading(false);
        });
    }, [isAuthenticated]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin" />
            </div>
        );
    }

    if (!isAuthenticated) return <GitHubAuthComponent onAuthenticationComplete={setAuthenticated} />;

    return <div>Authenticated</div>;
}

export default App;
