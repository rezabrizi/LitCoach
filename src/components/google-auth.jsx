import { useState, useEffect, useCallback } from "react";
import { Button } from "@components/ui/button";
import { Loader2 } from "lucide-react";
import ReportIssueButton from "@components/report-issue";
import PrivacyPolicyButton from "@components/privacy-policy";
import { useToast } from "@hooks/use-toast";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

const getGoogleUserInfo = () =>
    new Promise((resolve, reject) => {
        chrome.identity.getProfileUserInfo({ accountStatus: "ANY" }, (info) => {
            if (chrome.runtime.lastError || !info.id) {
                reject(chrome.runtime.lastError || new Error("No user ID found"));
            } else {
                resolve(info);
            }
        });
    });

const getStoredUserId = () =>
    new Promise((resolve) => {
        chrome.storage.sync.get(["user_id"], (result) => resolve(result.user_id));
    });

const setStoredUserId = (userId) =>
    new Promise((resolve) => {
        chrome.storage.sync.set({ user_id: userId }, resolve);
    });

export const GoogleAuth = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    const handleGoogleAuth = useCallback(async () => {
        setIsLoading(true);
        try {
            const { id: googleUserId } = await getGoogleUserInfo();
            const storedUserId = await getStoredUserId();

            await axios.post(`${API_URL}/user`, {
                google_user_id: googleUserId,
                old_user_id: storedUserId || null,
            });

            await setStoredUserId(googleUserId);
            setIsAuthenticated(true);
        } catch (err) {
            console.error("Authentication error:", err);
            toast({
                title: "Authentication Failed",
                description: "Could not sign in with Google. Try again manually.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        handleGoogleAuth();
    }, [handleGoogleAuth]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4">
                <Loader2 className="animate-spin h-8 w-8" />
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <div className="flex flex-col h-screen items-center justify-center space-y-3 p-4 text-center max-w-sm mx-auto">
                <h2 className="text-2xl font-semibold text-foreground">Authentication Required</h2>
                <p className="text-sm text-muted-foreground">Authenticate with Google to use this extension</p>

                <Button onClick={handleGoogleAuth} className="w-full" variant="outline">
                    <img src="/google.svg" alt="Google Logo" className="mr-1 h-4 w-4" />
                    Sign in with Google
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
