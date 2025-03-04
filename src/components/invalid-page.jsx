import { useState } from "react";
import axios from "axios";
import { Shuffle, Info, Loader2 } from "lucide-react";
import { Button } from "@components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@components/ui/select";
import { useToast } from "@hooks/use-toast";
import ReportIssueButton from "@components/report-issue";

const OPTIONS_PAGE = "chrome-extension://pbkbbpmpbidfjbcapgplbdogiljdechf/src/options/index.html";
const LEETCODE_GRAPHQL_URL = "https://leetcode.com/graphql";

const DIFFICULTY_OPTIONS = [
    { value: "EASY", label: "Easy" },
    { value: "MEDIUM", label: "Medium" },
    { value: "HARD", label: "Hard" },
    { value: "ANY", label: "Surprise Me!" },
];

const LEETCODE_RANDOM_QUESTION_QUERY = `
    query randomQuestion($categorySlug: String, $filters: QuestionListFilterInput) {
        randomQuestion(categorySlug: $categorySlug, filters: $filters) {
            titleSlug
        }
    }
`;

const InvalidPage = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [selectedDifficulty, setSelectedDifficulty] = useState("MEDIUM"); // Default to Medium
    const { toast } = useToast();

    const goToRandomProblem = async () => {
        setIsLoading(true);
        try {
            const filters = selectedDifficulty !== "ANY" ? { difficulty: selectedDifficulty } : {};
            const response = await axios.post(LEETCODE_GRAPHQL_URL, {
                operationName: "randomQuestion",
                variables: {
                    categorySlug: "",
                    filters: filters,
                },
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

            <div className="flex flex-col h-screen items-center justify-center space-y-3 p-4 text-center max-w-sm mx-auto">
                <h2 className="text-2xl font-semibold text-foreground">Navigate to LeetCode</h2>
                <p className="text-sm text-muted-foreground mb-4">
                    Please visit a LeetCode problem page to get AI assistance with your solution.
                </p>

                <div className="flex w-full space-x-2">
                    <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
                        <SelectTrigger className="w-1/3">
                            <SelectValue placeholder="Select Difficulty" />
                        </SelectTrigger>
                        <SelectContent>
                            {DIFFICULTY_OPTIONS.map((difficulty) => (
                                <SelectItem key={difficulty.value} value={difficulty.value}>
                                    {difficulty.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Button
                        onClick={goToRandomProblem}
                        className="w-2/3 flex-grow"
                        variant="outline"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Shuffle className="h-4 w-4" />
                        )}
                        {isLoading ? "Fetching..." : "Try a Random Problem"}
                    </Button>
                </div>

                <ReportIssueButton />
            </div>
        </>
    );
};

export default InvalidPage;
