import { useState, useEffect, useMemo } from "react";
import { Button } from "@components/ui/button";
import { useToast } from "@hooks/use-toast";
import { Loader2 } from "lucide-react";
import ReportIssueButton from "@components/report-issue";
import axios from "axios";

const GITHUB_CLIENT_ID = import.meta.env.VITE_GITHUB_CLIENT_ID;
const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
const quotes = [
    {
        quote: "C makes it easy to shoot yourself in the foot; C++ makes it harder, but when you do, it blows your whole leg off.",
        by: "Bjarne Stroustrup",
    },
    {
        quote: "There are only two kinds of programming languages: those people always complain about and those nobody uses.",
        by: "Bjarne Stroustrup",
    },
    {
        quote: "If you can’t solve a problem, then there is an easier problem you can solve: find it.",
        by: "George Polya",
    },
    {
        quote: "Talk is cheap. Show me the code.",
        by: "Linus Torvalds",
    },
    {
        quote: "The question of whether computers can think is like the question of whether submarines can swim.",
        by: "Ken Thompson",
    },
    {
        quote: "The computing scientist’s main challenge is not to get confused by the complexities of his own making",
        by: "Edsger Dijkstra",
    },
    {
        quote: "The world needs more dreamers and doers, not just talkers",
        by: "Jensen Huang",
    },
    {
        quote: "There are only two hard problems in Computer Science: cache invalidation and naming things",
        by: "Phil Karlton",
    },
];

export const GitHubAuth = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const quote = useMemo(() => quotes[Math.floor(Math.random() * quotes.length)], []);
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
        } catch {
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
            <div className="min-h-screen flex flex-col items-center justify-center p-4">
                <Loader2 className="animate-spin mb-4 h-8 w-8" />

                <div className="max-w-md mx-auto text-center">
                    <p className="text-xs text-muted-foreground italic">
                        {quote.quote} — {quote.by}
                    </p>
                </div>
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
                        <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
                            <Loader2 className="animate-spin mb-4" />
                        </div>
                    ) : (
                        <img src="/github_octocat.svg" alt="GitHub Logo" className="mr-1 h-4 w-4" />
                    )}
                    {isLoading ? "Signing in..." : "Sign in with GitHub"}
                </Button>

                <ReportIssueButton />
            </div>
        );
    }

    return children;
};
