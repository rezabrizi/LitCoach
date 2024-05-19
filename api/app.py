from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import openai
from dotenv import load_dotenv


load_dotenv()


app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "https://leetcode.com"}}, supports_credentials=True)
client = openai.OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))


with open(os.path.join(os.path.dirname(__file__), "help_prompt.txt"), "r") as f:
    HELP_PROMPT = f.read()


def construct_user_message(problem, user_code, help_level):
    return f"""
    "Problem Description Start"
    {problem}
    "Problem Description End"
    "User Solution Start"
    {user_code}
    "User Solution End"
    "Help Level": {help_level}
    """


def help_open_ai(problem, user_code, help_level): 
    try:
        openai_response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": HELP_PROMPT},
                {"role": "user", "content": construct_user_message(problem, user_code, help_level)}
            ],
            temperature=0.1, 
            max_tokens=512,
            top_p=0.5,
            frequency_penalty=0,
            presence_penalty=0
        )
        return openai_response.choices[0].message.content
    except openai.RateLimitError:
        raise Exception("Error - Rate limit exceeded. Please try again later.")
    except openai.AuthenticationError:
        raise Exception("Authentication Error - Check your API keys.")
    except openai.OpenAIError as e:
        raise Exception(f"OpenAI Error: {str(e)}")
    except Exception as e:
        raise Exception(f"An unexpected error occurred: {str(e)}")


@app.route("/api/help", methods=['POST'])
def get_help():
    data = request.json
    problem, user_code, help_level = data.get("problem"), data.get("user_code"), data.get("help_level")
    response_dict = {"help_response": None}
    try:
        response_dict['help_response'] = help_open_ai(problem, user_code, help_level)
        return jsonify(response_dict), 200
    except Exception as e:
        print(f"help error - {str(e)}")
        return jsonify({"error": {str(e)}}), 500


@app.route("/api/health", methods=['GET'])
def health():
    return jsonify({"status": "healthy"}), 200


if __name__ == '__main__':
    app.run(debug=True)
