import GitHubSubmissionSync from "@components/github-submission-sync";
import SubscriptionCard from "@components/subscription-card";
import ReportIssueButton from "@components/report-issue";
import PrivacyPolicyButton from "@components/privacy-policy";

const App = () => {
    return (
        <div className="min-h-screen flex items-center justify-center p-2">
            <div className="space-y-4 flex flex-col w-full max-w-lg">
                <GitHubSubmissionSync />
                <SubscriptionCard />
                <div className="mx-auto">
                    <ReportIssueButton />
                    <PrivacyPolicyButton />
                </div>
            </div>
        </div>
    );
};

export default App;
