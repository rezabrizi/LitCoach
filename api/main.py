import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise Exception("Google Gemini API key is not set")

prompt_file_path = os.path.join(os.path.dirname(__file__), "system_prompt.txt")
with open(prompt_file_path) as file:
    system_prompt = file.read()

genai.configure(api_key=GEMINI_API_KEY)
ai_model = genai.GenerativeModel(
    model_name="gemini-1.5-flash",
    system_instruction=system_prompt,
)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def stream_generated_response(question_description, user_code_snippet, user_query):
    try:
        response = ai_model.generate_content(f"""
            "Problem Description Start"
            {question_description}
            "Problem Description End"
            "User Solution Start"
            {user_code_snippet}
            "User Solution End"
            "User Question Start"
            {user_query}
            "User Question End"
            """, stream=True)

        for chunk in response:
            yield chunk.text
    except Exception as e:
        yield str(e)

@app.get("/api/assistance")
def get_assistance(leetcode_question: str, user_code: str, user_question: str):
    return StreamingResponse(
        stream_generated_response(leetcode_question, user_code, user_question),
        media_type="text/event-stream"
    )

@app.get("/api/health")
def health_check():
    return {"status": "ok"}
