import { useState, useEffect, useRef } from "react";
import { Button } from "@components/ui/button";
import { ScrollArea } from "@components/ui/scroll-area";
import { Input } from "@components/ui/input";
import InvalidPage from "@components/invalid-page";
import GetPremiumPopUp from "@components/get-premium";
import { useToast } from "@hooks/use-toast";
import { Info, Send, StopCircle } from "lucide-react";
import ReactMarkdown from "react-markdown";
import SyntaxHighlighter from "react-syntax-highlighter/dist/esm/default-highlight";

const OPTIONS_PAGE =
  "chrome-extension://pbkbbpmpbidfjbcapgplbdogiljdechf/src/options/index.html";
const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
const MAX_CHAR_LIMIT = 275;
const SUGGESTIONS = {
  normal: [
    "Help me optimize this code",
    "Explain the time complexity",
    "What's wrong with my approach?",
    "How can I improve this solution?",
    "Why is my solution not working?",
    "Are there better solutions?",
    "Can you explain the edge cases?",
    "What is the time complexity?",
  ],

  interview: [
    "Can you provide me a hint?",
    "Are you okay with my current approach: ",
    "Do you have any feedback for me so far?",
    "Would you like me to change my approach? ",
  ],

  concise: [
    "Can you provide me a hint?",
    "What are the main algorithms to solve this problem?",
    "What optimal time complexity can be achieved when solving this problem?",
    "Can you provide psuedo-code that solves the problem?",
  ],
};

function App() {
  const { toast } = useToast();
  const messagesEndRef = useRef(null);
  const abortControllerRef = useRef(null);
  const [userID, setUserID] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isValidPage, setIsValidPage] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [premiumAlert, setPremiumAlert] = useState({
    open: false,
    alertMessage: null,
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const fetchData = async () => {
      const [currentTab] = await new Promise((resolve) => {
        chrome.tabs.query({ active: true, currentWindow: true }, resolve);
      });

      setIsValidPage(
        currentTab?.url?.startsWith("https://leetcode.com/problems/") || false
      );

      const data = await new Promise((resolve) => {
        chrome.storage.sync.get(["user_id"], resolve);
      });

      setUserID(data.user_id);
    };

    fetchData();

    const shuffled = [...SUGGESTIONS["interview"]].sort(
      () => 0.5 - Math.random()
    );
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

  const getPageData = async () => {
    const [code, description] = await Promise.all([
      new Promise((resolve) =>
        chrome.runtime.sendMessage({ action: "getEditorValue" }, resolve)
      ),
      new Promise((resolve) =>
        chrome.runtime.sendMessage({ action: "getProblemDescription" }, resolve)
      ),
    ]);

    if (!code || !description) {
      throw new Error("Failed to fetch code or problem description");
    }

    return { code, description };
  };

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    if (newValue.length <= MAX_CHAR_LIMIT) {
      setInput(newValue);
      setShowSuggestions(false);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    setIsLoading(true);
    setInput("");

    try {
      const { code, description } = await getPageData();
      abortControllerRef.current = new AbortController();

      const response = await fetch(`${API_URL}/ai/assistance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problem_description: description,
          context: messages,
          code,
          prompt: input,
          user_id: userID,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        if (response.status === 403) {
          const errorData = await response.json();
          setPremiumAlert({ open: true, alertMessage: errorData.detail });
          return;
        }
        throw new Error(`Server responded with ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = { role: "assistant", content: "" };

      setMessages((prev) => [
        ...prev,
        { role: "user", content: input },
        assistantMessage,
      ]);

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        assistantMessage.content += decoder.decode(value);
        setMessages((prev) => [...prev.slice(0, -1), { ...assistantMessage }]);
      }
    } catch (error) {
      if (error.name !== "AbortError") {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not process AI request",
        });
        setMessages((prev) => prev.slice(0, -1));
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
        className={`max-w-[80%] rounded-lg p-3 ${
          message.role === "user"
            ? "bg-primary text-primary-foreground shadow-sm"
            : "bg-muted shadow-sm"
        }`}
      >
        {message.role === "assistant" ? (
          <ReactMarkdown
            className='prose prose-sm max-w-none'
            components={{
              pre({ ...props }) {
                return props.children;
              },
              code({ className, ...props }) {
                const match = /language-(\w+)/.exec(className || "");
                return match ? (
                  <div className='relative'>
                    <SyntaxHighlighter language={match[1]} {...props} />
                  </div>
                ) : (
                  <span className='bg-secondary p-[3px] rounded text-sm font-mono'>
                    {props.children}
                  </span>
                );
              },
            }}
          >
            {message.content}
          </ReactMarkdown>
        ) : (
          <div className='whitespace-pre-wrap'>{message.content}</div>
        )}
      </div>
    </div>
  );

  const content = (
    <div className='h-screen flex flex-col'>
      <div className='p-2 border-b flex justify-between'>
        <Button
          variant='ghost'
          size='icon'
          onClick={() => window.open(OPTIONS_PAGE)}
        >
          <Info className='h-5 w-5' />
        </Button>
      </div>

      <div className='flex-1 overflow-hidden relative'>
        <ScrollArea className='h-full px-4'>
          <div className='py-2 space-y-4'>
            {messages.map((message, index) => (
              <MessageBubble key={index} message={message} />
            ))}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {showSuggestions && (
          <div className='absolute bottom-4 left-4 flex gap-2 flex-wrap'>
            {suggestions.map((suggestion, index) => (
              <Button
                key={index}
                variant='outline'
                size='sm'
                className='text-sm hover:bg-muted'
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

      <div className='border-t'>
        <div className='p-4 flex gap-2'>
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
            className='flex-1'
          />
          {isLoading ? (
            <Button
              variant='outline'
              size='icon'
              onClick={() => {
                abortControllerRef.current?.abort();
                setIsLoading(false);
              }}
            >
              <StopCircle className='h-5 w-5' />
            </Button>
          ) : (
            <Button
              size='icon'
              disabled={!input.trim()}
              onClick={handleSendMessage}
            >
              <Send className='h-5 w-5' />
            </Button>
          )}
        </div>
      </div>

      <GetPremiumPopUp
        userID={userID}
        isOpen={premiumAlert.open}
        message={premiumAlert.alertMessage}
        onClose={() => setPremiumAlert({ open: false })}
      />
    </div>
  );

  return isValidPage ? content : <InvalidPage />;
}

export default App;
