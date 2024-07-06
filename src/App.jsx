import { useState, useEffect } from "react";
import { VStack, Text, Button, Select, useToast } from "@chakra-ui/react";
import ReactMarkdown from "react-markdown";
import ChakraUIRenderer from "chakra-ui-markdown-renderer";
import { getAIHelp } from "./GetAIHelp";
import axios from "axios";

const api_url = import.meta.env.DEV
    ? "http://127.0.0.1:8000"
    : import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

function App() {
    const [helpLevel, setHelpLevel] = useState("");
    const [response, setResponse] = useState(localStorage.getItem("help_response") || "");
    const [isLeetCodeProblem, setIsLeetCodeProblem] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const toast = useToast();

    useEffect(() => {
        chrome.runtime.sendMessage({ action: "isLeetCodeProblem" }, (res) => {
            setIsLeetCodeProblem(res.value);
        });

        // Wake up server
        axios.get(`${api_url}/api/health`);
    }, []);

    const handleSubmit = async () => {
        if (!helpLevel) {
            toast({
                title: "Error",
                description: "Please select a help level.",
                status: "error",
                duration: 5000,
                isClosable: true,
            });
            return;
        }

        setIsLoading(true);

        try {
            const aiResponse = await getAIHelp(helpLevel);
            setResponse(aiResponse);
            toast({
                title: "Success",
                description: "AI help received successfully.",
                status: "success",
                duration: 5000,
                isClosable: true,
            });
        } catch (error) {
            const errorMessage =
                error.message === "Problem description or editor value not found."
                    ? "Please navigate to a LeetCode problem"
                    : "Failed to get AI help.";
            toast({
                title: "Error",
                description: errorMessage,
                status: "error",
                duration: 5000,
                isClosable: true,
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <VStack spacing={3} p={4} align="stretch">
            {isLeetCodeProblem ? (
                <>
                    <Text fontSize="md" align="center">
                        Your Personal LeetCode Assistant
                    </Text>
                    <Select
                        placeholder="Select assistance level"
                        onChange={(e) => setHelpLevel(e.target.value)}
                    >
                        <option value="1">Minimal</option>
                        <option value="2">Moderate</option>
                        <option value="3">Extensive</option>
                    </Select>
                    <Button onClick={handleSubmit} isLoading={isLoading}>
                        Submit
                    </Button>
                    {response && (
                        <ReactMarkdown components={ChakraUIRenderer()} skipHtml>
                            {response}
                        </ReactMarkdown>
                    )}
                </>
            ) : (
                <Text align="center">
                    Please navigate to a LeetCode problem to use this extension. <br />
                    If you think this is an error, please reload the extension.
                </Text>
            )}
        </VStack>
    );
}

export default App;
