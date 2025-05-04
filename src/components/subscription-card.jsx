import { useState, useEffect } from "react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardDescription, CardTitle } from "@components/ui/card";
import { Button } from "@components/ui/button";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@components/ui/alert-dialog";
import { Crown, Loader2 } from "lucide-react";
import { useToast } from "@hooks/use-toast";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

function SubscriptionCard() {
    const { toast } = useToast();
    const [isDataLoading, setIsDataLoading] = useState(true);
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [userData, setUserData] = useState({
        google_user_id: null,
        hasPremium: false,
        billingDate: null,
    });

    useEffect(() => {
        const fetchUserData = async () => {
            setIsDataLoading(true);
            try {
                const { google_user_id } = await new Promise((resolve) => {
                    chrome.storage.sync.get(["google_user_id"], resolve);
                });

                const response = await axios.get(`${API_URL}/user/subscription/info`, {
                    params: { google_user_id: google_user_id },
                });

                setUserData({
                    google_user_id: google_user_id,
                    hasPremium: response.data.has_premium,
                    billingDate: response.data.billing_date,
                });
            } catch (error) {
                console.error("Failed to fetch subscription data", error);
                toast({
                    title: "Error",
                    description: "Could not load subscription information",
                    variant: "destructive",
                });
            } finally {
                setIsDataLoading(false);
            }
        };

        fetchUserData();
    }, [toast]);

    const handleSubscribe = async () => {
        try {
            setIsActionLoading(true);
            const response = await axios.post(`${API_URL}/subscription/subscribe`, {
                google_user_id: userData.google_user_id,
            });
            window.location.href = response.data.url;
        } catch (error) {
            console.error("Failed to process subscription request", error);
            toast({
                title: "Error",
                description: "Could not process subscription request",
                variant: "destructive",
            });
            setIsActionLoading(false);
        }
    };

    const handleUnsubscribe = async () => {
        try {
            setIsActionLoading(true);
            await axios.post(`${API_URL}/subscription/unsubscribe`, { google_user_id: userData.google_user_id });
            setUserData({
                ...userData,
                hasPremium: false,
            });
            toast({
                title: "Sorry To See You Go",
                description: "Your subscription has been canceled",
            });
        } catch (error) {
            console.error("Failed to process cancellation request", error);
            toast({
                title: "Error",
                description: "Could not process cancellation request",
                variant: "destructive",
            });
        } finally {
            setIsActionLoading(false);
        }
    };

    const handleRenew = async () => {
        try {
            setIsActionLoading(true);
            await axios.post(`${API_URL}/subscription/renew`, { google_user_id: userData.google_user_id });
            setUserData({
                ...userData,
                hasPremium: true,
            });
            toast({
                title: "Success",
                description: "Your subscription has been renewed",
            });
        } catch (error) {
            console.error("Failed to process renewal request", error);
            toast({
                title: "Error",
                description: "Could not process renewal request",
                variant: "destructive",
            });
        } finally {
            setIsActionLoading(false);
        }
    };

    if (isDataLoading) {
        return (
            <Card className="border-amber-200/40 animate-pulse">
                <CardHeader>Loading subscription info...</CardHeader>
            </Card>
        );
    }

    if (userData.hasPremium) {
        return (
            <Card className="border-blue-200">
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center">
                        <Crown className="w-5 h-5 text-blue-500 mr-2" />
                        Premium Active
                    </CardTitle>
                    <CardDescription>
                        Next billing date:{" "}
                        {userData.billingDate ? new Date(userData.billingDate).toLocaleDateString() : "Loading..."}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" className="w-full" disabled={isActionLoading}>
                                {isActionLoading ? (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                    "Cancel Subscription"
                                )}
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Cancel Premium Subscription?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    You&apos;ll lose your access to unlimited AI assistance on LeetCode after the
                                    current billing cycle ends
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
                                <AlertDialogAction onClick={handleUnsubscribe}>
                                    Cancel Subscription
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </CardContent>
            </Card>
        );
    }

    if (userData.billingDate) {
        return (
            <Card className="border-amber-200">
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center">
                        <Crown className="w-5 h-5 text-amber-500 mr-2" />
                        Premium Expiring
                    </CardTitle>
                    <CardDescription>
                        Expires: {new Date(userData.billingDate).toLocaleDateString()}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button
                        variant="outline"
                        onClick={handleRenew}
                        className="w-full"
                        size="sm"
                        disabled={isActionLoading}
                    >
                        {isActionLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Renew Premium"}
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-amber-200">
            <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                    <Crown className="w-5 h-5 text-amber-500 mr-2" />
                    Upgrade to Premium
                </CardTitle>
                <CardDescription>
                    Want to ace that FAANG interview? Subscribe to LitCoach premium for unlimited AI assistance!
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
                <div className="flex items-baseline justify-center">
                    <span className="text-3xl font-semibold">$1.99</span>
                    <span className="text-muted-foreground ml-1">/ month</span>
                </div>
                <Button
                    variant="outline"
                    onClick={handleSubscribe}
                    className="w-full"
                    size="sm"
                    disabled={isActionLoading}
                >
                    {isActionLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Get Premium"}
                </Button>
            </CardContent>
        </Card>
    );
}

export default SubscriptionCard;
