import { useState, useEffect } from "react";
import { VStack, Text, Button, Select, useToast, Image } from "@chakra-ui/react";
import ReactMarkdown from 'react-markdown'
import { getAIHelp } from "./GetAIHelp";

function App() {
    const [helpLevel, setHelpLevel] = useState("");
    const [response, setResponse] = useState("");
    const [isLeetCodeProblem, setIsLeetCodeProblem] = useState(false);
    const [isLoading, setIsLoading] = useState(false)
    const toast = useToast();

    useEffect(() => {
        chrome.runtime.sendMessage({ action: "isLeetCodeProblem" }, (res) => {
            setIsLeetCodeProblem(res.value);
        });
    }, []);

    const handleSubmit = async () => {
        setIsLoading(true)

        if (!helpLevel) {
            toast({
                title: "Error",
                description: "Please select a help level.",
                status: "error",
                duration: 5000,
                isClosable: true,
            });

            setIsLoading(false)
            return;
        }

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
            toast({
                title: "Error",
                description: "Failed to get AI help.",
                status: "error",
                duration: 5000,
                isClosable: true,
            });
        } finally {
            setIsLoading(false)
        }
    };

    return (
        <VStack spacing={4} p={4} align={"center"}>
            {isLeetCodeProblem ? (
                <>
                    <Text fontSize="lg">Your Personal LeetCode Assistant</Text>
                    <Select
                        placeholder="Select assistance level"
                        onChange={(e) => setHelpLevel(e.target.value)}
                    >
                        <option value="1">Minimal Assistance</option>
                        <option value="2">Moderate Assistance</option>
                        <option value="3">Extensive Assistance</option>
                    </Select>

                    <Button onClick={handleSubmit} colorScheme="teal" isLoading={isLoading}>
                        Submit
                    </Button>
                    {response && <ReactMarkdown>{response}</ReactMarkdown>}
                </>
            ) : (
                <>
                    <Text fontSize="lg">Please navigate to a LeetCode problem page.</Text>
                    <Image src="/error.svg" alt="error image" />
                    <Text fontSize="lg">
                        If you think this is an error, please refresh the page.
                    </Text>
                </>
            )}
        </VStack>
    );
}

export default App;
