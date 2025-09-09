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

const googleInteractiveLogin = () =>
    new Promise((resolve, reject) => {
        chrome.identity.getAuthToken({ interactive: true }, (token) => {
            if (chrome.runtime.lastError || !token) {
                reject(chrome.runtime.lastError || new Error("Could not obtain token"));
            } else {
                resolve(token);
            }
        });
    });

const storeGoogleUserID = (googleUserId) =>
    new Promise((resolve) => {
        chrome.storage.sync.set({ google_user_id: googleUserId }, () => resolve());
    });

const getStoredGoogleUserID = () =>
    new Promise((resolve) => {
        chrome.storage.sync.get(["google_user_id"], (result) => resolve(result.google_user_id));
    });

const getStoredLegacyID = () =>
    new Promise((resolve) => {
        chrome.storage.sync.get(["user_id"], (result) => resolve(result.user_id));
    });

const removeStoredLegacyID = () =>
    new Promise((resolve) => {
        chrome.storage.sync.remove(["user_id"], () => resolve());
    });

export const GoogleAuth = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const handleGoogleAuth = useCallback(async () => {
        setIsLoading(true);
        let googleInfo = null;

        try {
            googleInfo = await getGoogleUserInfo();
        } catch (error) {
            console.error("Error fetching Google user info:", error);
        }


        if (!googleInfo || !googleInfo.id) {
            try {
                await googleInteractiveLogin();
                googleInfo = await getGoogleUserInfo();
            } catch (error) {
                console.error("Interactive login failed:", error);
                toast({
                    title: "Authentication Failed",
                    description: "Could not sign in with Google. Try again manually.",
                    variant: "destructive",
                });
                setIsLoading(false);
                return;
            }
        }

        const googleUserId = googleInfo.id;
        const storedGoogleUserId = await getStoredGoogleUserID();
        const storedUserId = await getStoredLegacyID();

        if (googleUserId && googleUserId === storedGoogleUserId) {
            setIsAuthenticated(true);
            setIsLoading(false);
            return;
        }

        try {
            await axios.post(`${API_URL}/user/register`, {
                google_user_id: googleUserId,
                old_user_id: storedUserId || null, // For legacy users to migrate
            });

            await storeGoogleUserID(googleUserId);
            if (storedUserId) {
                await removeStoredLegacyID();
            }
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
                <p className="text-sm font-light text-muted-foreground mt-2">Getting everything ready...</p>
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
                    <PrivacyPolicyButton />
                    <ReportIssueButton />
                </div>
            </div>
        );
    }

    return children;
};
