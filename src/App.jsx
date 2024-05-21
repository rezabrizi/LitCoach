import { useState, useEffect } from "react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button.jsx";
import { ThemeProvider } from "@/components/theme-provider.tsx";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Markdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import { getAIHelp } from "./utils/GetAIHelp.js";

function App() {
    const [isLeetCodeProblem, setIsLeetCodeProblem] = useState(false);
    const [helpLevel, setHelpLevel] = useState("");
    const [response, setResponse] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        chrome.runtime.sendMessage({ action: "isLeetCodeProblem" }, (response) => {
            setIsLeetCodeProblem(response.value);
        });
    }, []);

    const handleSubmit = async () => {
        setIsLoading(true);

        if (!helpLevel) {
            toast.error("Please select an assistance level", {
                position: "bottom-center",
                pauseOnHover: false,
            });

            setIsLoading(false);
            return;
        }

        try {
            const aiResponse = await getAIHelp(helpLevel);
            setResponse(aiResponse);
            toast.success("Success", {
                position: "bottom-center",
                pauseOnHover: false,
            });
        } catch (error) {
            toast.error("An error occurred", {
                position: "bottom-center",
                pauseOnHover: false,
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <ThemeProvider defaultTheme="light">
            {isLeetCodeProblem ? (
                <div className="flex flex-col items-center py-4 space-y-4 px-4">
                    <p className="text-base text-center">Your Personal LeetCode Assistant</p>
                    <Select value={helpLevel} onValueChange={(value) => setHelpLevel(value)}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select Assistance Level" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="1">Minimal Assistance</SelectItem>
                            <SelectItem value="2">Moderate Assistance</SelectItem>
                            <SelectItem value="3">Extensive Assistance</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button variant="outline" size="sm" disabled={isLoading} onClick={handleSubmit}>
                        Submit
                    </Button>
                    <Markdown rehypePlugins={[rehypeHighlight]}>{response}</Markdown>
                </div>
            ) : (
                <p className="flex h-screen text-center items-center justify-center">
                    Please navigate to a LeetCode problem to use this extension. <br />
                    If you think this is an error, please reload the extension.
                </p>
            )}
            <ToastContainer />
        </ThemeProvider>
    );
}

export default App;
