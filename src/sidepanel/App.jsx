import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Info, Send, StopCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import InvalidPage from "@/components/invalid-page";

const OPTIONS_PAGE = "chrome-extension://pbkbbpmpbidfjbcapgplbdogiljdechf/src/options/index.html";
const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
const MAX_CONTEXT_MESSAGES = 3;
const MAX_CHAR_LIMIT = 75;
const SUGGESTIONS = [
    "Help me optimize this code",
    "Explain the time complexity",
    "What's wrong with my approach?",
    "How can I improve this solution?",
    "Debug this code",
    "Suggest a better algorithm",
    "Explain the edge cases",
    "Help with space complexity",
];

function App() {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isValidPage, setIsValidPage] = useState(false);
    const [selectedModel, setSelectedModel] = useState("gpt-4o-mini");
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(true);
    const messagesEndRef = useRef(null);
    const abortControllerRef = useRef(null);
    const { toast } = useToast();

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    useEffect(() => {
        chrome.tabs.query({ active: true, currentWindow: true }, ([currentTab]) => {
            setIsValidPage(currentTab?.url?.startsWith("https://leetcode.com/problems/") || false);
        });

        const shuffled = [...SUGGESTIONS].sort(() => 0.5 - Math.random());
        setSuggestions(shuffled.slice(0, 5));

        chrome.runtime.onMessage.addListener(updateIsValidPage);
        return () => {
            chrome.runtime.onMessage.removeListener(updateIsValidPage);
        };
    }, []);

    const updateIsValidPage = (message) => {
        if (message.isLeetCodeProblem !== undefined) {
            setIsValidPage(message.isLeetCodeProblem);
        }
    };

    const handleInputChange = (e) => {
        setShowSuggestions(false);
        const newValue = e.target.value;
        if (newValue.length <= MAX_CHAR_LIMIT) {
            setInput(newValue);
        }
    };

    const handleSendMessage = async () => {
        if (!input.trim() || isLoading) return;

        setIsLoading(true);
        const currentMessage = input;
        setInput("");

        try {
            const [codeRes, descRes, data] = await Promise.all([
                new Promise((resolve) => chrome.runtime.sendMessage({ action: "getEditorValue" }, resolve)),
                new Promise((resolve) => chrome.runtime.sendMessage({ action: "getProblemDescription" }, resolve)),
                new Promise((resolve) => chrome.storage.sync.get(["github_user_id"], resolve)),
            ]);

            if (!codeRes || !descRes) {
                throw new Error("Failed to fetch code or problem description");
            }

            if (!data.github_user_id) {
                throw new Error("Please login to GitHub");
            }

            const newMessages = [...messages, { role: "user", content: currentMessage }];
            setMessages(newMessages);

            abortControllerRef.current = new AbortController();
            const response = await fetch(`${API_URL}/ai/generate_ai_response`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    problem_description: descRes,
                    code: codeRes,
                    context: messages.slice(-MAX_CONTEXT_MESSAGES) || [],
                    prompt: currentMessage,
                    github_id: data.github_user_id,
                    llm: selectedModel,
                }),
                signal: abortControllerRef.current.signal,
            });

            if (!response.ok) throw new Error(await response.text());

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let assistantMessage = { role: "assistant", content: "" };
            setMessages((prev) => [...prev, assistantMessage]);

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                const text = decoder.decode(value);
                assistantMessage.content += text;
                setMessages((prev) => [...prev.slice(0, -1), { ...assistantMessage }]);
            }
        } catch (error) {
            if (error.name !== "AbortError") {
                console.error("Error fetching AI response:", error);
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: error.message,
                });
                setMessages((prev) => prev.slice(0, -1));
            }
        } finally {
            setIsLoading(false);
            abortControllerRef.current = null;
        }
    };

    const MessageBubble = ({ message }) => (
        <div className={`flex ${message.role === "user" ? "justify-end" : "justify-start"} mb-4`}>
            <div
                className={`max-w-[80%] rounded-lg p-3 ${
                    message.role === "user" ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted shadow-sm"
                }`}
            >
                {message.role === "assistant" ? (
                    <div className="prose prose-sm max-w-none">
                        <ReactMarkdown>{message.content}</ReactMarkdown>
                    </div>
                ) : (
                    <div className="whitespace-pre-wrap">{message.content}</div>
                )}
            </div>
        </div>
    );

    const content = (
        <div className="h-screen flex flex-col">
            <div className="p-2 border-b flex items-center justify-between">
                <Button variant="ghost" size="icon" onClick={() => window.open(OPTIONS_PAGE)}>
                    <Info className="h-5 w-5" />
                </Button>
                <Select value={selectedModel} onValueChange={setSelectedModel}>
                    <SelectTrigger className="w-40">
                        <SelectValue placeholder="Select Model" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="gpt-4o-mini">gpt-4o-mini</SelectItem>
                        <SelectItem value="deepseek-chat">deepseek-chat</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="flex-1 overflow-hidden relative">
                <ScrollArea className="h-full px-4">
                    <div className="py-2 space-y-4">
                        {messages.map((message, index) => (
                            <MessageBubble key={index} message={message} />
                        ))}
                        <div ref={messagesEndRef} />
                    </div>
                </ScrollArea>

                {showSuggestions && (
                    <div className="absolute bottom-4 left-4 flex gap-2 flex-wrap">
                        {suggestions.map((suggestion, index) => (
                            <Button
                                key={index}
                                variant="outline"
                                size="sm"
                                className="text-sm hover:bg-muted"
                                onClick={() => {
                                    setInput(suggestion);
                                    setShowSuggestions(false);
                                }}
                            >
                                {suggestion}
                            </Button>
                        ))}
                    </div>
                )}
            </div>

            <div className="border-t">
                <div className="p-4 flex gap-2">
                    <Input
                        placeholder={"Ask a question..."}
                        value={input}
                        onChange={handleInputChange}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleSendMessage();
                            }
                        }}
                        disabled={isLoading}
                        className="flex-1"
                    />
                    {isLoading ? (
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => {
                                abortControllerRef.current?.abort();
                                setIsLoading(false);
                            }}
                        >
                            <StopCircle className="h-5 w-5" />
                        </Button>
                    ) : (
                        <Button size="icon" disabled={!input.trim()} onClick={handleSendMessage}>
                            <Send className="h-5 w-5" />
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );

    return isValidPage ? content : <InvalidPage />;
}

export default App;
