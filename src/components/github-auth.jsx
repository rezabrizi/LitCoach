import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { Loader2 } from "lucide-react";
import axios from "axios";

const GITHUB_CLIENT_ID = import.meta.env.VITE_GITHUB_CLIENT_ID;
const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
const FEEDBACK_FORM = "https://forms.gle/udJ4YT3oCTiLFuC98";

const GitHubAuthComponent = ({ onAuthenticationComplete }) => {
    const { toast } = useToast();
    const [isAuthenticating, setIsAuthenticating] = useState(false);

    const handleGitHubAuth = async () => {
        setIsAuthenticating(true);
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
            onAuthenticationComplete(true);
            chrome.runtime.openOptionsPage();

            toast({
                title: "Success",
                description: "Successfully authenticated with GitHub",
            });
        } catch (error) {
            onAuthenticationComplete(false);
            toast({
                title: "Authentication Failed",
                description: "Failed to authenticate with GitHub",
                action: (
                    <ToastAction
                        altText="Report Issue"
                        onClick={() => window.open(FEEDBACK_FORM, "_blank", "noopener,noreferrer")}
                    >
                        Report Issue
                    </ToastAction>
                ),
            });
        } finally {
            setIsAuthenticating(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
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
