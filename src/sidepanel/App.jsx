import { useState, useEffect } from "react";
import { useToast } from "@hooks/use-toast";
import { Toaster } from "@components/ui/toaster";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import InfoIcon from "@components/infoicon";
import { ChevronUp, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import SyntaxHighlighter from "react-syntax-highlighter/dist/esm/default-highlight";

const MAX_QUESTION_LENGTH = 75;

function App() {
    const { toast } = useToast();
    const [isLeetCodeProblem, setIsLeetCodeProblem] = useState(false);
    const [userQuestion, setUserQuestion] = useState("");
    const [aiResponse, setAiResponse] = useState(localStorage.getItem("aiResponse") || "");
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        chrome.runtime.sendMessage({ action: "isLeetCodeProblem" }, (res) => setIsLeetCodeProblem(res.value));
    }, []);

    const handleSubmit = async () => {
        if (userQuestion.length > MAX_QUESTION_LENGTH) {
            toast({
                variant: "destructive",
                title: "Question too long",
                description: `Please limit your question to ${MAX_QUESTION_LENGTH} characters.`,
            });
            return;
        }

        setIsLoading(true);

        try {
            const problemResponse = await chrome.runtime.sendMessage({ action: "getProblemDescription" });
            const userCodeResponse = await chrome.runtime.sendMessage({ action: "getEditorValue" });
            const isLeetCodeProblem = await chrome.runtime.sendMessage({ action: "isLeetCodeProblem" });

            console.log("Problem Response:", problemResponse);
            console.log("User Code Response:", userCodeResponse);
            console.log("Is LeetCode Problem:", isLeetCodeProblem);

            // localStorage.setItem("aiResponse", responseStream);
        } catch (error) {
            console.error("Error fetching AI assistance:", error);
            toast({
                variant: "destructive",
                title: "Uh oh! Something went wrong.",
                description: error.message,
            });
        } finally {
            setIsLoading(false);
        }
    };

    return isLeetCodeProblem ? (
        <>
            <InfoIcon />
            <ReactMarkdown
                className="prose pb-16 pt-12 p-4"
                components={{
                    pre({ ...props }) {
                        return <>{props.children}</>;
                    },
                    code({ className, ...props }) {
                        const match = /language-(\w+)/.exec(className || "");
                        return match ? (
                            <div className="relative">
                                <SyntaxHighlighter language={match[1]} {...props} />
                            </div>
                        ) : (
                            <span className="bg-secondary p-[3px] rounded text-sm font-mono">
                                {props.children}
                            </span>
                        );
                    },
                }}
            >
                {aiResponse}
            </ReactMarkdown>
            <div className="fixed bottom-0 left-0 w-full p-4 flex gap-2">
                <Input
                    type="text"
                    placeholder={`Ask your question here (max ${MAX_QUESTION_LENGTH} chars)`}
                    value={userQuestion}
                    onChange={(e) => {
                        if (e.target.value.length <= MAX_QUESTION_LENGTH) {
                            setUserQuestion(e.target.value);
                        }
                    }}
                />
                <Button
                    onClick={handleSubmit}
                    disabled={isLoading || !userQuestion.trim()}
                    variant="outline"
                    className="p-2 h-10 w-10"
                >
                    {isLoading ? <Loader2 className="animate-spin" /> : <ChevronUp />}
                </Button>
            </div>
            <Toaster />
        </>
    ) : (
        <div className="flex items-center justify-center h-screen text-center">
            Navigate to a LeetCode problem to use this extension. <br />
            Re-open the extension, if this is a mistake.
        </div>
    );
}

export default App;
