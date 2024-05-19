import axios from "axios";

const api_url = import.meta.env.VITE_API_URL;

export const getAIHelp = async (help_level) => {
    try {
        const problemResponse = await chrome.runtime.sendMessage({
            action: "getProblemDescription",
        });
        const userCodeResponse = await chrome.runtime.sendMessage({ action: "getEditorValue" });

        const problem = problemResponse.value;
        const user_code = userCodeResponse.value;

        if (!problem || !user_code) {
            throw new Error("Problem description or editor value not found.");
        }

        const response = await axios.post(
            `${api_url}/api/help`,
            {
                problem: problem,
                user_code: user_code,
                help_level: help_level,
            },
            {
                headers: {
                    "Content-Type": "application/json",
                },
            },
        );

        return response.data.help_response;
    } catch (error) {
        console.error("Failed to get AI help:", error);
        throw error;
    }
};
