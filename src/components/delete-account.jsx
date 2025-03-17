import { Button } from "@components/ui/button";
import { ExternalLink, Trash2 } from "lucide-react";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@components/ui/hover-card";

const GITHUB_OAUTH_DOC = "https://docs.github.com/en/apps/oauth-apps/maintaining-oauth-apps/deleting-an-oauth-app";

function DeleteAccountButton() {
    return (
        <HoverCard>
            <HoverCardTrigger>
                <Button variant="link" className="font-light h-5">
                    <Trash2 />
                    Delete Account?
                </Button>
            </HoverCardTrigger>
            <HoverCardContent className="w-80">
                <div className="space-y-2">
                    <p className="text-sm">Remove LitCoach OAuth</p>
                    <p className="text-xs text-muted-foreground">
                        To delete your account, remove LitCoach as an authorized OAuth app from your GitHub
                        account. This will revoke LitCoach&apos;s access to the initial permissions we requested
                        and log you out of the extension.
                    </p>
                    <Button
                        size="small"
                        variant="link"
                        className="text-xs font-light"
                        onClick={() => window.open(GITHUB_OAUTH_DOC, "_blank")}
                    >
                        <ExternalLink />
                        GitHub OAuth Removal Guide
                    </Button>
                </div>
            </HoverCardContent>
        </HoverCard>
    );
}

export default DeleteAccountButton;
