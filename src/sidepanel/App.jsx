import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { MessageCircle, Send, StopCircle, AlertCircle } from "lucide-react";
import { AuthComponent } from "@/components/github-auth";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";
import { Alert, AlertDescription } from "@/components/ui/alert";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

function App() {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isValidPage, setIsValidPage] = useState(false);
    const messagesEndRef = useRef(null);
    const abortControllerRef = useRef(null);
    const textAreaRef = useRef(null);
    const { toast } = useToast();

    useEffect(() => {
        checkIfLeetCodeProblem();
        if (textAreaRef.current) {
            textAreaRef.current.style.height = "auto";
            textAreaRef.current.style.height = `${Math.min(textAreaRef.current.scrollHeight, 150)}px`;
        }
    }, [newMessage]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const checkIfLeetCodeProblem = async () => {
        chrome.runtime.sendMessage({ action: "isLeetCodeProblem" }, (response) => {
            setIsValidPage(response.value);
        });
    };

    const handleStream = async (response) => {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

        try {
            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                const text = decoder.decode(value);
                setMessages((prev) => {
                    const newMessages = [...prev];
                    const lastMessage = newMessages[newMessages.length - 1];
                    lastMessage.content += text;
                    return newMessages;
                });
            }
        } catch (error) {
            if (error.name === "AbortError") return;
            throw error;
        }
    };

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !isValidPage || isLoading) return;

        setIsLoading(true);
        setMessages((prev) => [...prev, { role: "user", content: newMessage }]);
        const currentMessage = newMessage;
        setNewMessage("");

        try {
            const [codeResponse, descriptionResponse] = await Promise.all([
                new Promise((resolve) => chrome.runtime.sendMessage({ action: "getEditorValue" }, resolve)),
                new Promise((resolve) => chrome.runtime.sendMessage({ action: "getProblemDescription" }, resolve)),
            ]);

            const github_id = await new Promise((resolve) => {
                chrome.storage.sync.get(["github_user_id"], resolve);
            });

            abortControllerRef.current = new AbortController();

            const response = await fetch(`${API_URL}/ai/get_ai_help`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    leetcode_problem_description: descriptionResponse.value,
                    user_code: codeResponse.value,
                    conversation_context: messages.map((m) => `${m.role}: ${m.content}`).join("\n"),
                    user_prompt: currentMessage,
                    user_github_id: github_id.github_user_id,
                    llm: "gpt-4o-mini",
                }),
                signal: abortControllerRef.current.signal,
            });

            if (!response.ok) throw new Error(await response.text());

            await handleStream(response);
        } catch (error) {
            if (error.name !== "AbortError") {
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
        <div className={`flex ${message.role === "user" ? "justify-end" : "justify-start"} mb-6`}>
            <div
                className={`max-w-[80%] rounded-2xl p-4 shadow-sm ${
                    message.role === "user"
                        ? "bg-primary text-primary-foreground ml-12"
                        : "bg-muted mr-12 hover:bg-muted/80 transition-colors"
                }`}
            >
                {message.role === "assistant" ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                        <ReactMarkdown>{message.content}</ReactMarkdown>
                    </div>
                ) : (
                    <div className="whitespace-pre-wrap">{message.content}</div>
                )}
            </div>
        </div>
    );

    return (
        <AuthComponent>
            <Card className="h-screen flex flex-col border-0 rounded-none shadow-none">
                <CardContent className="flex-1 p-0 flex flex-col">
                    {!isValidPage && (
                        <Alert variant="destructive" className="m-4">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                                Please navigate to a LeetCode problem to use the AI assistant.
                            </AlertDescription>
                        </Alert>
                    )}

                    <ScrollArea className="flex-1 px-4">
                        <div className="space-y-2 py-6">
                            {messages.map((message, index) => (
                                <MessageBubble key={index} message={message} />
                            ))}
                            <div ref={messagesEndRef} />
                        </div>
                    </ScrollArea>

                    <div className="border-t p-4 space-y-4">
                        <Textarea
                            ref={textAreaRef}
                            placeholder={
                                isValidPage
                                    ? "Ask for help with this problem..."
                                    : "Navigate to a LeetCode problem to start"
                            }
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSendMessage();
                                }
                            }}
                            disabled={!isValidPage || isLoading}
                            className="resize-none border-0 focus-visible:ring-0 p-3 shadow-none bg-muted"
                            rows={1}
                        />
                        <div className="flex justify-end gap-2">
                            {isLoading && (
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        abortControllerRef.current?.abort();
                                        setIsLoading(false);
                                        toast({
                                            title: "Response stopped",
                                            description: "The AI response has been interrupted.",
                                        });
                                    }}
                                    className="gap-2"
                                >
                                    <StopCircle className="h-4 w-4" />
                                    Stop
                                </Button>
                            )}
                            <Button
                                onClick={handleSendMessage}
                                disabled={!isValidPage || isLoading || !newMessage.trim()}
                                className="gap-2"
                            >
                                {isLoading ? (
                                    <>
                                        <MessageCircle className="h-4 w-4 animate-spin" />
                                        Thinking...
                                    </>
                                ) : (
                                    <>
                                        <Send className="h-4 w-4" />
                                        Send
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </AuthComponent>
    );
}

export default App;
