import { useState, useEffect } from "react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardDescription, CardTitle } from "@components/ui/card";
import { Button } from "@components/ui/button";
import { Crown } from "lucide-react";
import { useToast } from "@hooks/use-toast";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

function SubscriptionManagementCard() {
    const { toast } = useToast();
    const [isDataLoading, setIsDataLoading] = useState(true);
    const [checkoutUrl, setCheckoutUrl] = useState("");
    const [customerPortalUrl, setCustomerPortalUrl] = useState("");
    const [nextBillingDate, setNextBillingDate] = useState("");
    const [hasPremium, setHasPremium] = useState(false);

    useEffect(() => {
        const fetchUserData = async () => {
            setIsDataLoading(true);
            try {
                const { google_user_id } = await new Promise((resolve) => {
                    chrome.storage.sync.get(["google_user_id"], resolve);
                });

                const response = await axios.get(`${API_URL}/subscription/manage`, {
                    params: { google_user_id: google_user_id },
                });

                if (response.data?.checkout_url) {
                    setCheckoutUrl(response.data.checkout_url);
                }

                if (response.data?.customer_portal_url) {
                    setCustomerPortalUrl(response.data.customer_portal_url);
                }

                if (response.data?.next_billing_date) {
                    setNextBillingDate(response.data.next_billing_date);
                }

                if (response.data?.has_premium) {
                    setHasPremium(response.data.has_premium);
                }
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

    if (isDataLoading) {
        return (
            <Card className="border-amber-200/40 animate-pulse">
                <CardHeader>Loading subscription info...</CardHeader>
            </Card>
        );
    }

    if (customerPortalUrl) {
        return (
            <Card className="border-blue-200">
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center">
                        <Crown className="w-5 h-5 text-blue-500 mr-2" />
                        {hasPremium ? "Premium Active" : "Premium Expiring"}
                    </CardTitle>
                    <CardDescription>
                        {hasPremium ? "Next billing date: " : "Expiration date: "}{" "}
                        {nextBillingDate ? new Date(nextBillingDate).toLocaleDateString() : "Loading..."}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                            window.open(customerPortalUrl, "_blank");
                        }}
                    >
                        Manage Subscription
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
                    className="w-full"
                    onClick={() => {
                        window.open(checkoutUrl, "_blank");
                    }}
                >
                    Get Premium
                </Button>
            </CardContent>
        </Card>
    );
}

export default SubscriptionManagementCard;
