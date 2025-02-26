import { useState } from "react";
import axios from "axios";
import { Shuffle, Info, Loader2 } from "lucide-react";
import { Button } from "@components/ui/button";
import { useToast } from "@hooks/use-toast";
import ReportIssueButton from "@components/report-issue";

const OPTIONS_PAGE = "chrome-extension://pbkbbpmpbidfjbcapgplbdogiljdechf/src/options/index.html";
const LEETCODE_GRAPHQL_URL = "https://leetcode.com/graphql";
const LEETCODE_RANDOM_QUESTION_QUERY = `
    query randomQuestion($categorySlug: String, $filters: QuestionListFilterInput) {
        randomQuestion(categorySlug: $categorySlug, filters: $filters) {
            titleSlug
        }
    }
`;

const InvalidPage = () => {
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const goToRandomProblem = async () => {
        setIsLoading(true);
        try {
            const response = await axios.post(LEETCODE_GRAPHQL_URL, {
                operationName: "randomQuestion",
                variables: { categorySlug: "", filters: {} },
                query: LEETCODE_RANDOM_QUESTION_QUERY,
            });

            const randomProblemId = response.data.data?.randomQuestion?.titleSlug;

            if (!randomProblemId) {
                console.error("Failed to fetch a random problem.");
                return;
            }

            window.open(`https://leetcode.com/problems/${randomProblemId}`, "_blank");
        } catch {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to fetch a random problem",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <div className="absolute top-2 left-2">
                <Button variant="ghost" size="icon" onClick={() => window.open(OPTIONS_PAGE)}>
                    <Info className="w-6 h-6" />
                </Button>
            </div>

            <div className="flex flex-col h-screen items-center justify-center space-y-3 p-6 text-center max-w-sm mx-auto">
                <h2 className="text-2xl font-semibold text-foreground">Navigate to LeetCode</h2>
                <p className="text-sm text-muted-foreground">
                    Please visit a LeetCode problem page to get AI assistance with your solution.
                </p>

                <Button onClick={goToRandomProblem} className="w-full" variant="outline" disabled={isLoading}>
                    {isLoading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <Shuffle className="w-4 h-4" />
                    )}
                    {isLoading ? "Going to problem..." : "Try a Random Problem"}
                </Button>

                <ReportIssueButton />
            </div>
        </>
    );
};

export default InvalidPage;
