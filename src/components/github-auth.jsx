import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import axios from "axios";

const GITHUB_CLIENT_ID = import.meta.env.VITE_GITHUB_CLIENT_ID;
const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
const FEEDBACK_FORM = "https://forms.gle/udJ4YT3oCTiLFuC98";

const useAuth = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const { toast } = useToast();

    const checkAuthentication = async () => {
        try {
            setIsLoading(true);
            setError(null);

            const response = await new Promise((resolve) => {
                chrome.runtime.sendMessage({ action: "isAuthenticated" }, (response) => resolve(response));
            });

            setIsAuthenticated(response);
        } catch (err) {
            setError(err);
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
                title: "Success",
                description: "Successfully authenticated with GitHub",
            });
        } catch (error) {
            setError(error);
            toast({
                title: "Authentication Failed",
                description: "Failed to authenticate with GitHub",
            });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        checkAuthentication();
    }, []);

    return {
        isAuthenticated,
        isLoading,
        error,
        handleGitHubAuth,
        refreshAuth: checkAuthentication,
    };
};

export const AuthComponent = ({ children }) => {
    const { isAuthenticated, isLoading, handleGitHubAuth } = useAuth();

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4">
                <Card className="w-full max-w-md border-0 shadow-none">
                    <CardHeader>
                        <CardTitle>Authentication Required</CardTitle>
                        <CardDescription>Authenticate with GitHub to use this extension</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button
                            className="w-full"
                            variant="outline"
                            onClick={handleGitHubAuth}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <img src="/github_octocat.svg" alt="GitHub Logo" className="mr-2 h-4 w-4" />
                            )}
                            {isLoading ? "Signing in..." : "Sign in with GitHub"}
                        </Button>
                        <Button
                            variant="link"
                            className="w-full font-light"
                            onClick={() => window.open(FEEDBACK_FORM, "_blank", "noopener,noreferrer")}
                        >
                            Does an issue persist? Report it here.
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return children;
};
