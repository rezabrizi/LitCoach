import { useState, useEffect } from "react";
import { Button } from "@components/ui/button";
import { useToast } from "@hooks/use-toast";
import { Loader2 } from "lucide-react";
import { FACTS } from "@components/facts";
import ReportIssueButton from "@components/report-issue";
import PrivacyPolicyButton from "@components/privacy-policy";
import axios from "axios";

const GITHUB_CLIENT_ID = import.meta.env.VITE_GITHUB_CLIENT_ID;
const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

export const GitHubAuth = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [currentFact, setCurrentFact] = useState(() => FACTS[Math.floor(Math.random() * FACTS.length)]);
    const { toast } = useToast();

    useEffect(() => {
        checkAuthentication();

        const factInterval = setInterval(() => {
            setCurrentFact(FACTS[Math.floor(Math.random() * FACTS.length)]);
        }, 4500);

        return () => clearInterval(factInterval);
    }, []);

    const checkAuthentication = async () => {
        try {
            setIsLoading(true);

            const response = await new Promise((resolve) => {
                chrome.runtime.sendMessage({ action: "isAuthenticated" }, (response) => resolve(response));
            });

            setIsAuthenticated(response);
        } catch {
            setIsAuthenticated(false);
        } finally {
            setIsLoading(false);
        }
    };

    const handleGitHubAuth = async () => {
        setIsLoading(true);
        const redirectURL = chrome.identity.getRedirectURL();
        const authUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${redirectURL}&scope=read:user%20repo`;

        try {
            const responseUrl = await new Promise((resolve, reject) => {
                chrome.identity.launchWebAuthFlow({ url: authUrl, interactive: true }, (response) => {
                    if (chrome.runtime.lastError || !response) {
                        reject(new Error(chrome.runtime.lastError?.message || "Authentication failed"));
                    }
                    resolve(response);
                });
            });

            const code = new URLSearchParams(new URL(responseUrl).search).get("code");
            if (!code) throw new Error("No authorization code received");

            const { data } = await axios.post(`${API_URL}/auth/github`, { code });
            await new Promise((resolve) => {
                chrome.storage.sync.set({ user_id: data.user_id }, resolve);
            });

            await checkAuthentication();
            chrome.runtime.openOptionsPage();

            toast({
                title: "Authentication Success",
                description: "Successfully authenticated with GitHub",
            });
        } catch (error) {
            console.error("Failed to authenticate with GitHub", error);
            toast({
                title: "Authentication Failed",
                description: "Failed to authenticate with GitHub",
            });
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4 space-y-2">
                <Loader2 className="animate-spin h-8 w-8" />
                <div className="max-w-md mx-auto text-center">
                    <p className="text-xs text-muted-foreground italic">{currentFact}</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <div className="flex flex-col h-screen items-center justify-center space-y-3 p-4 text-center max-w-sm mx-auto">
                <h2 className="text-2xl font-semibold text-foreground">Authentication Required</h2>
                <p className="text-sm text-muted-foreground">Authenticate with GitHub to use this extension</p>

                <Button onClick={handleGitHubAuth} className="w-full" variant="outline" disabled={isLoading}>
                    {isLoading ? (
                        <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
                            <Loader2 className="animate-spin mb-4" />
                        </div>
                    ) : (
                        <img src="/github_octocat.svg" alt="GitHub Logo" className="mr-1 h-4 w-4" />
                    )}
                    {isLoading ? "Signing in..." : "Sign in with GitHub"}
                </Button>
                <div>
                    <ReportIssueButton />
                    <PrivacyPolicyButton />
                </div>
            </div>
        );
    }

    return children;
};
