import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import ReportIssueButton from "./report-issue";
import axios from "axios";

const GITHUB_CLIENT_ID = import.meta.env.VITE_GITHUB_CLIENT_ID;
const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

export const AuthComponent = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        checkAuthentication();
    }, []);

    const checkAuthentication = async () => {
        try {
            setIsLoading(true);

            const response = await new Promise((resolve) => {
                chrome.runtime.sendMessage({ action: "isAuthenticated" }, (response) => resolve(response));
            });

            setIsAuthenticated(response);
        } catch (err) {
            console.log(err);
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

            const { data } = await axios.post(
                `${API_URL}/auth/github_access_token`,
                { code },
                { headers: { "Content-Type": "application/json" } },
            );

            await chrome.storage.sync.set({ github_user_id: data.user_id });
            await checkAuthentication();
            chrome.runtime.openOptionsPage();

            toast({
                title: "Authentication Success",
                description: "Successfully authenticated with GitHub",
            });
        } catch (error) {
            console.error(error);
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
            <div className="min-h-screen flex items-center justify-center p-4">
                <Loader2 className="h-6 w-6 animate-spin" />
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <div className="flex flex-col h-screen items-center justify-center space-y-3 p-6 text-center max-w-sm mx-auto">
                <h2 className="text-2xl font-semibold text-foreground">Authentication Required</h2>
                <p className="text-sm text-muted-foreground">Authenticate with GitHub to use this extension</p>

                <Button onClick={handleGitHubAuth} className="w-full" variant="outline" disabled={isLoading}>
                    {isLoading ? (
                        <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                    ) : (
                        <img src="/github_octocat.svg" alt="GitHub Logo" className="mr-2 h-4 w-4" />
                    )}
                    {isLoading ? "Signing in..." : "Sign in with GitHub"}
                </Button>

                <ReportIssueButton />
            </div>
        );
    }

    return children;
};
