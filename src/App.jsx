import system_prompt from "./components/system_prompt";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import InfoIcon from "@/components/infoicon";
import { ChevronUp, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import SyntaxHighlighter from "react-syntax-highlighter/dist/esm/default-highlight";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash", systemInstruction: system_prompt });

function App() {
    const { toast } = useToast();
    const [isLeetCodeProblem, setIsLeetCodeProblem] = useState(false);
    const [userQuestion, setUserQuestion] = useState("");
    const [aiResponse, setAiResponse] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        chrome.runtime.sendMessage({ action: "isLeetCodeProblem" }, (res) => setIsLeetCodeProblem(res.value));
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

            const result = await model.generateContentStream(`
                Problem Description Start 
                ${problemResponse.value}
                Problem Description End
                User Solution Start
                ${userCodeResponse.value}
                User Solution End
                User Question Start
                ${userQuestion}
                User Question End
            `);

            setAiResponse("");
            setUserQuestion("");

            for await (const chunk of result.stream) {
                const chunkText = chunk.text();
                setAiResponse((aiResponse) => aiResponse + chunkText);
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
        <img src="404.svg" alt="404" className=" flex flex-col items-center justify-center h-screen" />
    );
}

export default App;
