import { Button } from "@components/ui/button";
import { ExternalLink, Unplug } from "lucide-react";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@components/ui/hover-card";

const GITHUB_OAUTH_REMOVAL_GUIDE =
    "https://docs.github.com/en/apps/oauth-apps/maintaining-oauth-apps/deleting-an-oauth-app";

function DisconnectGitHubAccount() {
    return (
        <HoverCard>
            <HoverCardTrigger>
                <Button variant="link" className="font-light text-xs">
                    <Unplug />
                    Disconnect Account?
                </Button>
            </HoverCardTrigger>
            <HoverCardContent className="w-80">
                <div className="space-y-2">
                    <p className="text-sm">Want to disconnect your account?</p>
                    <p className="text-xs text-muted-foreground">
                        Remove LitCoach as an authorized OAuth app from your GitHub account. This will revoke
                        LitCoach&apos;s access to the initial permissions requested and disconnect your GitHub
                        account.
                    </p>
                    <Button
                        size="small"
                        variant="link"
                        className="text-xs font-light"
                        onClick={() => window.open(GITHUB_OAUTH_REMOVAL_GUIDE, "_blank")}
                    >
                        <ExternalLink />
                        GitHub OAuth Removal Guide
                    </Button>
                </div>
            </HoverCardContent>
        </HoverCard>
    );
}

export default DisconnectGitHubAccount;
