import { GoogleGenerativeAI } from "@google/generative-ai";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import InfoIcon from "@/components/InfoIcon";
import { ChevronUp, Loader2 } from "lucide-react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import ReactMarkdown from "react-markdown";

const api_url = import.meta.env.DEV
    ? "https://lit-coach.vercel.app"
    : import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

function App() {
    const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const { toast } = useToast();
    const [isLeetCodeProblem, setIsLeetCodeProblem] = useState(false);
    const [userQuestion, setUserQuestion] = useState("");
    const [aiResponse, setAiResponse] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        chrome.runtime.sendMessage({ action: "isLeetCodeProblem" }, (res) => setIsLeetCodeProblem(res.value));
        fetch(`${api_url}/api/health`); // Wake up the backend server
    }, []);

    const handleSubmit = async () => {
        setIsLoading(true);

        try {
            const problemResponse = await chrome.runtime.sendMessage({ action: "getProblemDescription" });
            const userCodeResponse = await chrome.runtime.sendMessage({ action: "getEditorValue" });

            if (!problemResponse.success) {
                throw new Error("Failed to get problem description");
            }

            if (problemResponse.value.includes("Level up your coding skills")) {
                throw new Error("Use LeetCode's new version");
            }

            if (!userCodeResponse.success) {
                throw new Error("Failed to get user code");
            }

            // const result = await model.generateContentStream(

            const queryParams = new URLSearchParams({
                leetcode_question: problemResponse.value,
                user_code: userCodeResponse.value,
                user_question: userQuestion,
            });

            const response = await fetch(`${api_url}/api/assistance?${queryParams}`, {
                method: "GET",
                headers: { "Content-Type": "application/json" },
            });

            setAiResponse("");
            setUserQuestion("");

            const reader = response.body?.getReader();
            const decoder = new TextDecoder("utf-8");

            while (reader) {
                const { done, value } = await reader.read();
                if (done) break;
                const chunk = decoder.decode(value, { stream: true });
                setAiResponse((aiResponse) => aiResponse + chunk);
            }
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
                    pre({ node, ...props }) {
                        return <>{props.children}</>;
                    },
                    code({ node, className, ...props }) {
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
                    placeholder="Ask your question here"
                    value={userQuestion}
                    onChange={(e) => setUserQuestion(e.target.value)}
                />
                <Button
                    onClick={handleSubmit}
                    disabled={isLoading || !userQuestion}
                    variant="outline"
                    className="p-2 h-10 w-10"
                >
                    {isLoading ? <Loader2 className="animate-spin" /> : <ChevronUp />}
                </Button>
            </div>
            <Toaster />
        </>
    ) : (
        <div className="flex flex-col items-center justify-center h-screen text-center space-y-2">
            <img src="404_image.svg" alt="404" className="w-72 h-72" />
            <p className="">
                This extension only works on LeetCode problem pages.         
            </p>
            <p>
                Reopen this extension if you're on a LeetCode problem page.
            </p>
        </div>
    );
}

export default App;
