import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { MessageCircle, Send, AlertCircle, StopCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AuthComponent } from "@/components/github-auth";
import ReactMarkdown from "react-markdown";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

function App() {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isValidPage, setIsValidPage] = useState(false);
    const [error, setError] = useState("");
    const messagesEndRef = useRef(null);
    const responseText = useRef("");
    const abortControllerRef = useRef(null);
    const textAreaRef = useRef(null);

    useEffect(() => {
        checkIfLeetCodeProblem();
        
        // Auto-resize textarea
        const textarea = textAreaRef.current;
        if (textarea) {
            textarea.style.height = 'auto';
            textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`;
        }
    }, [newMessage]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const checkIfLeetCodeProblem = async () => {
        chrome.runtime.sendMessage({ action: "isLeetCodeProblem" }, (response) => {
            setIsValidPage(response.value);
            if (!response.value) {
                setError("Please navigate to a LeetCode problem page to use the AI assistant.");
            }
        });
    };

    const getProblemContext = async () => {
        const [codeResponse, descriptionResponse] = await Promise.all([
            new Promise((resolve) => chrome.runtime.sendMessage({ action: "getEditorValue" }, resolve)),
            new Promise((resolve) => chrome.runtime.sendMessage({ action: "getProblemDescription" }, resolve)),
        ]);

        if (!codeResponse.success || !descriptionResponse.success) {
            throw new Error("Failed to fetch problem context");
        }

        return {
            code: codeResponse.value,
            problem: descriptionResponse.value,
        };
    };

    const processStream = async (reader, signal) => {
        const decoder = new TextDecoder();
        let buffer = "";

        try {
            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split("\n");
                buffer = lines.pop();

                for (const line of lines) {
                    if (line.startsWith("data: ")) {
                        const content = line.slice(5).trim();
                        if (content === "[DONE]") {
                            return;
                        }

                        responseText.current += content;
                        setMessages((prev) => {
                            const newMessages = [...prev];
                            newMessages[newMessages.length - 1].content = responseText.current;
                            return newMessages;
                        });
                    }
                }
            }
        } catch (error) {
            console.log(error);
            if (error.name === "AbortError") return;
            throw error;
        }
    };

    const stopResponse = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
            setIsLoading(false);
        }
    };

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !isValidPage || isLoading) return;

        setIsLoading(true);
        setError('');
        const userMessage = { role: 'user', content: newMessage };
        setMessages(prev => [...prev, userMessage]);
        setNewMessage('');
        responseText.current = '';

        try {
            const context = await getProblemContext();
            const github_id = await new Promise(resolve => {
                chrome.storage.sync.get(['github_user_id'], (data) => {
                    resolve(data.github_user_id);
                });
            });

            abortControllerRef.current = new AbortController();
            const response = await fetch(`${API_URL}/ai/get_ai_help`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    problem: context.problem,
                    code: context.code,
                    context: messages.map(m => `${m.role}: ${m.content}`).join('\n') + '\nuser: ' + newMessage,
                    github_id: github_id,
                    llm: 'gpt-4o-mini'
                }),
                signal: abortControllerRef.current.signal
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || `API error: ${response.statusText}`);
            }

            setMessages(prev => [...prev, { role: 'assistant', content: '' }]);
            const reader = response.body.getReader();
            await processStream(reader, abortControllerRef.current.signal);

        } catch (error) {
            console.log(error);
            if (error.name !== "AbortError") {
                setError(error.message);
                setMessages(prev => prev.slice(0, -1));
            }
        } finally {
            setIsLoading(false);
            abortControllerRef.current = null;
        }
    };

    const MessageBubble = ({ message }) => (
        <div
            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"} mb-4`}
        >
            <div
                className={`max-w-[85%] rounded-lg p-4 ${
                    message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
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
            <Card className="h-screen flex flex-col">
                <CardContent className="flex-1 p-4 flex flex-col gap-4">
                    {error && (
                        <Alert variant="destructive" className="animate-in slide-in-from-top">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    <ScrollArea className="flex-1 pr-4">
                        <div className="space-y-2 py-4">
                            {messages.map((message, index) => (
                                <MessageBubble key={index} message={message} />
                            ))}
                            <div ref={messagesEndRef} />
                        </div>
                    </ScrollArea>

                    <div className="flex flex-col gap-2">
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
                            className="flex-1 min-h-[44px] max-h-[150px] resize-none"
                            rows={1}
                        />
                        <div className="flex gap-2 justify-end">
                            {isLoading && (
                                <Button 
                                    variant="outline" 
                                    onClick={stopResponse}
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