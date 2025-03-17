import { Button } from "@components/ui/button";
import { FileText } from "lucide-react";

const PRIVACY_POLICY =
    "https://docs.google.com/document/d/1Vbf2u66bcTIfLqHc8WEiJBmFQ35ujtUeV-clPWlnKmo/edit?usp=sharing";

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
