import { useState, useEffect } from "react";
import { Button } from "@components/ui/button";
import { useToast } from "@hooks/use-toast";
import { Loader2 } from "lucide-react";
import ReportIssueButton from "@components/report-issue";
import axios from "axios";

const GITHUB_CLIENT_ID = import.meta.env.VITE_GITHUB_CLIENT_ID;
const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
const FACTS = [
    "DNA sequencing algorithms use suffix trees to efficiently find patterns in genomes.",
    "Financial markets use Fenwick trees for real-time stock price aggregation and updates.",
    "Air traffic control systems use interval trees to detect potential aircraft collisions.",
    "Databases use B-Trees instead of binary trees to optimize disk reads and writes.",
    "Cache eviction policies like LRU (Least Recently Used) rely on linked hash maps to track usage efficiently.",
    "Ride-sharing apps use bipartite graph matching to optimally pair riders with drivers in real-time.",
    "Music streaming services use locality-sensitive hashing (LSH) to identify similar songs for recommendations.",
    "Computer vision algorithms use k-d trees to speed up nearest neighbor searches in image recognition.",
    "Cybersecurity systems use Merkle trees to verify data integrity in blockchain transactions.",
    "Video compression techniques use Huffman coding to reduce file sizes without quality loss.",
    "Search engines use inverted indexes to quickly retrieve documents containing specific words.",
    "Social networks use graph databases to efficiently manage and query relationships between users.",
    "Recommendation systems use collaborative filtering to suggest products based on user behavior.",
    "Natural language processing uses Markov chains to model and predict text sequences.",
    "Robotics uses A* algorithm for pathfinding to navigate through obstacles efficiently.",
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
