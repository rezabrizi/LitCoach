import { Button } from "@components/ui/button";
import { ExternalLink } from "lucide-react";

const FEEDBACK_FORM = "https://forms.gle/p2Qv8c7uJSgpK6zB7";

function ReportIssueButton() {
    return (
        <Button
            variant="link"
            className="font-light h-5"
            onClick={() => window.open(FEEDBACK_FORM, "_blank", "noopener,noreferrer")}
        >
            <ExternalLink />
            Report Issue?
        </Button>
    );
}

export default ReportIssueButton;
