import axios from "axios";

const api_url = import.meta.env.DEV ? "http://127.0.0.1:8000" : "https://lit-coach.vercel.app";

export const getAIHelp = async (help_level) => {
    try {
        const problemResponse = await chrome.runtime.sendMessage({
            action: "getProblemDescription",
        });
        const userCodeResponse = await chrome.runtime.sendMessage({ action: "getEditorValue" });

        const problem = problemResponse.value;
        console.log(problem);

        const user_code = userCodeResponse.value;
        console.log(user_code);

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

        localStorage.setItem("help_response", response.data.help_response);
        return response.data.help_response;
    } catch (error) {
        console.error("Failed to get AI help:", error);
        throw error;
    }
};
