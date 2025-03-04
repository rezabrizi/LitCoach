import { useState, useEffect } from "react";
import { Button } from "@components/ui/button";
import { useToast } from "@hooks/use-toast";
import { Loader2 } from "lucide-react";
import ReportIssueButton from "@components/report-issue";
import axios from "axios";

const GITHUB_CLIENT_ID = import.meta.env.VITE_GITHUB_CLIENT_ID;
const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
const FACTS = [
    "The Apollo 11 mission's onboard computer had 145,000 lines of code, handwritten by Margaret Hamilton's team at MIT. It had only 64KB of memory and helped land humans on the Moon.",
    "The web search revolution began with Larry Page and Sergey Brin's PageRank algorithm, which ranks websites based on backlinks, a direct application of graph theory.",
    "Microsoft buried a copy of all public GitHub repositories in an Arctic vault designed to last 1,000 years—just in case civilization collapses.",
    "In 2038, Unix-based systems will face a catastrophic overflow issue, much like Y2K, due to time being stored as a 32-bit integer. Some old systems may crash or reset to 1901!",
    "The modern internet runs on protocols designed in the 1970s, yet no one fully understands the entire system. It evolved too complexly for any single person to grasp.",
    "The first computer bug was a literal moth that short-circuited an early electromechanical computer. Grace Hopper coined the term 'debugging' to describe fixing it.",
    "TempleOS, created by Terry A. Davis, is a bizarre operating system built over a decade. Davis, believing God commanded him, wrote it in his own language, HolyC. Despite his mental health struggles, TempleOS remains a unique testament to his vision.",
];

export const GitHubAuth = ({ children }) => {
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
            <div className="min-h-screen flex flex-col items-center justify-center p-4 space-y-2">
                <Loader2 className="animate-spin h-8 w-8" />

                <div className="max-w-md mx-auto text-center">
                    <p className="text-xs text-muted-foreground italic">
                        {FACTS[Math.floor(Math.random() * FACTS.length)]}
                    </p>
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

                <ReportIssueButton />
            </div>
        );
    }

    return children;
};
