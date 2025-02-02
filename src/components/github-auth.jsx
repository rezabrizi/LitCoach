import axios from "axios";
import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const GITHUB_CLIENT_ID = import.meta.env.VITE_GITHUB_CLIENT_ID;
const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

const GitHubAuthComponent = ({ onAuthenticationComplete }) => {
    const { toast } = useToast();
    const [isAuthenticating, setIsAuthenticating] = useState(false);

    const handleGitHubAuth = async () => {
        setIsAuthenticating(true);
        const redirectURL = chrome.identity.getRedirectURL();
        const authUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${redirectURL}&scope=read:user%20repo`;

        chrome.identity.launchWebAuthFlow({ url: authUrl, interactive: true }, async (responseUrl) => {
            if (chrome.runtime.lastError || !responseUrl) {
                console.error(chrome.runtime.lastError?.message || "Auth failed");
                setIsAuthenticating(false);
                return;
            }

            const urlParams = new URLSearchParams(new URL(responseUrl).search);
            const code = urlParams.get("code");

            if (!code) {
                console.error("No authorization code received");
                setIsAuthenticating(false);
                return;
            }

            try {
                const response = await axios.post(
                    `${API_URL}/auth/github_access_token`,
                    JSON.stringify({ code }),
                    { headers: { "Content-Type": "application/json" } },
                );

                await chrome.storage.sync.set({ github_user_id: response.data.user_id });

                onAuthenticationComplete(true);
                chrome.runtime.openOptionsPage();

                toast({
                    title: "Success",
                    description: "Successfully authenticated with GitHub",
                });
            } catch (error) {
                console.error(error.response?.data?.error || "Token exchange failed");
                onAuthenticationComplete(false);
                toast({
                    title: "Error",
                    description: "Failed to authenticate with GitHub",
                    variant: "destructive",
                });
            } finally {
                setIsAuthenticating(false);
            }
        });
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="flex items-center">
                        <img src="/github_octocat.svg" alt="GitHub Logo" className="mr-2 h-4 w-4" />
                        Authentication Required
                    </CardTitle>
                    <CardDescription>
                        Please authenticate with GitHub to continue using this extension.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button
                        className="w-full"
                        variant="outline"
                        onClick={handleGitHubAuth}
                        disabled={isAuthenticating}
                    >
                        {isAuthenticating ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <img src="/github_octocat.svg" alt="GitHub Logo" className="mr-2 h-4 w-4" />
                        )}
                        {isAuthenticating ? "Signing in..." : "Sign in with GitHub"}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
};

export default GitHubAuthComponent;
