import { useEffect, useState } from "react";
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

function GetPremiumPopUp({ googleUserID, isOpen, message, onClose }) {
    const { toast } = useToast();
    const [formattedMessage, setFormattedMessage] = useState(message);

    useEffect(() => {
        if (!isOpen) return;

        const formatMessage = () => {
            const timestampMatch = message.match(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d+\+\d{2}:\d{2}/);
            if (!timestampMatch) return message;

            const date = new Date(timestampMatch[0]);
            const now = new Date();
            const options =
                date - now <= 5 * 60 * 60 * 1000
                    ? { hour: "2-digit", minute: "2-digit" }
                    : { month: "2-digit", day: "2-digit", year: "numeric" };

            return message.replace(timestampMatch[0], date.toLocaleString(undefined, options));
        };

        setFormattedMessage(formatMessage());
    }, [isOpen, message]);

    const handleSubscribe = async () => {
        try {
            const { data } = await axios.post(`${API_URL}/subscription/subscribe`, {
                google_user_id: googleUserID,
            });
            window.open(data.url, "_blank", "noopener,noreferrer");
        } catch (error) {
            console.error("Failed to process subscription request", error);
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
                    <AlertDialogTitle className="flex items-center justify-center md:justify-start">
                        <Crown className="w-5 h-5 text-amber-500 mr-1" />
                        Upgrade to Premium
                    </AlertDialogTitle>
                    <AlertDialogDescription className="space-y-4">
                        <div className="text-center md:text-left">{formattedMessage}</div>
                        <div className="bg-amber-50 p-4 rounded-lg border border-amber-200 space-y-2 text-center">
                            <div className="text-sm">
                                Get unlimited AI assistance to ace your coding interviews!
                            </div>
                            <div className="flex items-baseline justify-center">
                                <span className="text-2xl font-semibold">$1.99</span>
                                <span className="ml-1">/ month</span>
                            </div>
                        </div>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="flex flex-col sm:flex-row">
                    <AlertDialogAction
                        onClick={handleSubscribe}
                        className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700"
                    >
                        Upgrade Now
                    </AlertDialogAction>
                    <AlertDialogCancel onClick={onClose}>Maybe Later</AlertDialogCancel>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

export default GetPremiumPopUp;
