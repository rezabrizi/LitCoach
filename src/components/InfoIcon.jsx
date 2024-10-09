import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Info, MessageCircle } from "lucide-react";

function InfoIcon() {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" className="fixed top-2 right-2 p-2 h-8 w-8">
                    <Info />
                </Button>
            </DialogTrigger>
            <DialogContent className="w-72">
                <DialogHeader>
                    <DialogTitle>Options</DialogTitle>
                    <DialogClose />
                </DialogHeader>
                <DialogDescription className="space-y-2">
                    <Button
                        variant="outline"
                        className="w-full"
                        onClick={() =>
                            window.open(
                                "https://docs.google.com/forms/d/e/1FAIpQLSev-gcJlLJLnhc8Q-wynfpQJ7UnDWKJ_QL0ryeWGQ-UfI93aw/viewform?usp=sf_link",
                                "_blank",
                            )
                        }
                    >
                        <MessageCircle className="mr-2" />
                        Feedback Form
                    </Button>
                    <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => window.open("https://github.com/rezabrizi/LitCoach", "_blank")}
                    >
                        <img src="/github_octocat_icon.svg" alt="GitHub" className="w-5 mr-2" />
                        GitHub Repository
                    </Button>
                </DialogDescription>
            </DialogContent>
        </Dialog>
    );
}

export default InfoIcon;
