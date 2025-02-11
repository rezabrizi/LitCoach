import React from "react";
import axios from "axios";
import { Shuffle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";

const OPTINS_PAGE = "chrome-extension://pbkbbpmpbidfjbcapgplbdogiljdechf/src/options/index.html";
const FEEDBACK_FORM = "https://forms.gle/p2Qv8c7uJSgpK6zB7";
const LEETCODE_GRAPHQL_URL = "https://leetcode.com/graphql";
const LEETCODE_RANDOM_QUESTION_QUERY = `
    query randomQuestion($categorySlug: String, $filters: QuestionListFilterInput) {
        randomQuestion(categorySlug: $categorySlug, filters: $filters) {
            titleSlug
        }
    }
`;

const InvalidPage = () => {
    const goToRandomProblem = async () => {
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
        } catch (error) {
            console.error("Error fetching random problem:", error);
        }
    };

    return (
        <>
            <div className="absolute top-2 left-2">
                <Button variant="ghost" size="icon" onClick={() => window.open(OPTINS_PAGE)}>
                    <Info className="w-6 h-6" />
                </Button>
            </div>

            <div className="flex flex-col h-screen items-center justify-center space-y-4 p-6">
                <div className="text-center space-y-2">
                    <h2 className="text-2xl font-semibold text-foreground">Navigate to LeetCode</h2>
                    <p className="text-sm text-muted-foreground">
                        Please visit a LeetCode problem page to get AI assistance with your solution.
                    </p>
                </div>

                <Button onClick={goToRandomProblem} className="w-full flex items-center justify-center gap-2">
                    <Shuffle className="w-4 h-4" />
                    Try a Random Problem
                </Button>

                <a
                    href={FEEDBACK_FORM}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-muted-foreground hover:underline"
                >
                    Is this a bug? Report it here.
                </a>
            </div>
        </>
    );
};

export default InvalidPage;
