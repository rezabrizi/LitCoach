import { Button } from "@components/ui/button";
import { FileText } from "lucide-react";

const PRIVACY_POLICY = "https://github.com/rezabrizi/LitCoach/blob/main/privacy-policy.md";

function PrivacyPolicyButton() {
    return (
        <Button
            variant="link"
            className="font-light h-5"
            onClick={() => window.open(PRIVACY_POLICY, "_blank", "noopener,noreferrer")}
        >
            <FileText />
            Privacy Policy
        </Button>
    );
}

export default PrivacyPolicyButton;
