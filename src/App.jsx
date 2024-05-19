import Markdown from "react-markdown";
import { useState, useEffect } from "react";
import { VStack, Text } from "@chakra-ui/react";

function App() {
    const [isLeetCodeProblem, setIsLeetCodeProblem] = useState(false);

    useEffect(() => {
        chrome.runtime.sendMessage({ action: "isLeetCodeProblem" }, (response) => {
            if (response && response.value !== undefined) {
                setIsLeetCodeProblem(response.value);
            } else {
                setIsLeetCodeProblem(response?.error || "No response");
            }
        });
    }, []);

    return isLeetCodeProblem ? (
        <VStack align="start" spacing={4} p={4}>
            <Text fontSize="xl">This is a LeetCode problem page</Text>
        </VStack>
    ) : (
        <Text fontSize="xl">Please navigate to a LeetCode problem page</Text>
    );
}

export default App;
