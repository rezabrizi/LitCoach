import { useState, useEffect } from "react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardDescription, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
} from "@/components/ui/alert-dialog";
import { Crown, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

function SubscriptionCard() {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [userData, setUserData] = useState({
        userID: "",
        hasPremium: false,
        billingDate: null,
    });

    useEffect(() => {
        const fetchUserData = async () => {
            const result = await chrome.storage.sync.get(["user_id", "user_data"]);
            setUserData({
                userID: result.user_id,
                hasPremium: result.user_data.has_premium,
                billingDate: result.user_data.billing_date,
            });
        };

        fetchUserData();
    }, [toast]); 

    const handleSubscribe = async () => {
        try {
            setIsLoading(true);
            const response = await axios.post(`${API_URL}/subscription/subscribe`, { user_id: userData.userID });
            window.location.href = response.data.url;
        } catch (error) {
            toast({
                title: "Error",
                description: "Could not process subscription request",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleUnsubscribe = async () => {
        try {
            setIsLoading(true);
            await axios.post(`${API_URL}/subscription/unsubscribe`, { user_id: userData.userID });
            setUserData({
                ...userData,
                hasPremium: false,
            });
        } catch (error) {
            toast({
                title: "Error",
                description: "Could not process cancellation request",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleRenew = async () => {
        try {
            setIsLoading(true);
            await axios.post(`${API_URL}/subscription/renew`, { user_id: userData.userID });
            setUserData({
                ...userData,
                hasPremium: true,
            });
        } catch (error) {
            toast({
                title: "Error",
                description: "Could not process renewal request",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    if (userData.hasPremium) {
        return (
            <Card className="w-full border-blue-200">
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center">
                        <Crown className="w-5 h-5 text-blue-500 mr-2" />
                        Premium Active
                    </CardTitle>
                    <CardDescription>
                        Next billing date: {new Date(userData.billingDate).toLocaleDateString()}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" className="w-full" disabled={isLoading}>
                                {isLoading ? (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : "Cancel Subscription"}
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Cancel Premium Subscription?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    You'll lose access to premium features at the end of your billing period.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
                                <AlertDialogAction onClick={handleUnsubscribe}>Cancel Subscription</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </CardContent>
            </Card>
        );
    }

    if (userData.billingDate) {
        return (
            <Card className="w-full border-amber-200">
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center">
                        <Crown className="w-5 h-5 text-amber-500 mr-2" />
                        Premium Expiring
                    </CardTitle>
                    <CardDescription>Expires: {new Date(userData.billingDate).toLocaleDateString()}</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button 
                        variant="outline" 
                        onClick={handleRenew} 
                        className="w-full" 
                        size="sm"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : "Renew Premium"}
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="w-full border-amber-200">
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
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : "Get Premium"}
                </Button>
            </CardContent>
        </Card>
    );
}

export default SubscriptionCard;