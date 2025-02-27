import { useState, useEffect } from "react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@components/ui/alert-dialog";
import { Crown } from "lucide-react";
import { useToast } from "@hooks/use-toast";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

function GetPremiumPopUp({ userID, isOpen, message, onClose }) {
    const { toast } = useToast();
    const [formattedTime, setFormattedTime] = useState("");

    useEffect(() => {
        if (!isOpen) return;

        const timestampMatch = message.match(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d+\+\d{2}:\d{2}/);
        if (timestampMatch) {
            const date = new Date(timestampMatch[0]);
            const now = new Date();
            const timeDifference = date - now;

            const options = timeDifference <= 5 * 60 * 60 * 1000
                ? { hour: "2-digit", minute: "2-digit" }
                : { month: "2-digit", day: "2-digit", year: "numeric" };

            const formattedDate = date.toLocaleString(undefined, options);
            setFormattedTime(message.replace(timestampMatch[0], formattedDate));
        } else {
            setFormattedTime(message);
        }
    }, [message]);

    const handleSubscribe = async () => {
        try {
            const response = await axios.post(`${API_URL}/subscription/subscribe`, { user_id: userID });
            window.open(response.data.url, "_blank", "noopener,noreferrer");
        } catch {
            toast({
                title: "Error",
                description: "Could not process subscription request",
                variant: "destructive",
            });
        }
    };

    return (
        <AlertDialog open={isOpen} onOpenChange={onClose}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center md:justify-start justify-center">
                        <Crown className="w-5 h-5 text-amber-500 mr-1" />
                        Upgrade to Premium
                    </AlertDialogTitle>
                    <AlertDialogDescription className="space-y-4">
                        <div className="md:justify-start justify-center">{formattedTime}</div>
                        <div className="bg-amber-50 p-4 rounded-lg border border-amber-200 space-y-2">
                            <div className="text-sm text-center text-muted-foreground">
                                Get unlimited AI assistance to ace your coding interviews!
                            </div>
                            <div className="flex items-baseline justify-center">
                                <span className="text-2xl font-semibold">$1.99</span>
                                <span className="text-muted-foreground ml-1">/ month</span>
                            </div>
                        </div>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="flex flex-col sm:flex-row">
                    <AlertDialogAction
                        variant="default"
                        onClick={handleSubscribe}
                        className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700"
                    >
                        Upgrade Now
                    </AlertDialogAction>
                    <AlertDialogCancel variant="outline" onClick={onClose}>
                        Maybe Later
                    </AlertDialogCancel>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

export default GetPremiumPopUp;
