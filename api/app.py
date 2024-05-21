from flask import Flask, request, jsonify, make_response
from flask_cors import CORS
import os
import openai

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)

class open_api_wrapper: 
    def __init__(self):
        self.client = openai.OpenAI()

    def sys_help_prompt(self):
        with open(os.path.join(os.path.dirname(__file__), "help_prompt.txt"), "r") as f:
            return f.read()
        
    def construct_user_message(self, problem, user_code, help_level):
        return f"""
        "Problem Description Start"
        {problem}
        "Problem Description End"
        "User Solution Start"
        {user_code}
        "User Solution End"
        "Help Level": {help_level}
        """

    def help_open_ai(self, problem, user_code, help_level): 
        prompt = self.sys_help_prompt()
        print(prompt)
        try:
            openai_response = self.client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": prompt},
                    {"role": "user", "content": self.construct_user_message(problem, user_code, help_level)}
                ],
                temperature=0, 
                max_tokens=1024,
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
        
    
openaiwrapper = open_api_wrapper()


@app.route("/api/help", methods=['POST'])
def get_help():
    # if request.method == 'OPTIONS':
    #     response = make_response()
    #     response.headers.add("Access-Control-Allow-Origin", "chrome-extension://niidabkahodeiboimeffglfogcmfhpkb")
    #     response.headers.add("Access-ContaSrol-Allow-Methods", "POST, OPTIONS")
    #     response.headers.add("Access-Control-Allow-Headers", "Content-Type")
    #     return response
    
    
    data = request.json
    problem, user_code, help_level = data.get("problem"), data.get("user_code"), data.get("help_level")
    response_dict = {"help_response": None}
    try:
        response_dict['help_response'] = openaiwrapper.help_open_ai(problem, user_code, help_level)
        response = jsonify(response_dict)
        #response.headers.add("Access-Control-Allow-Origin", "chrome-extension://niidabkahodeiboimeffglfogcmfhpkb")
        return response, 200
    except Exception as e:
        response = jsonify({"error": str(e)})
        #response.headers.add("Access-Control-Allow-Origin", "chrome-extension://niidabkahodeiboimeffglfogcmfhpkb")
        return response, 500


@app.route("/api/health", methods=['GET'])
def health():
    return jsonify({"status": "healthy"}), 200


if __name__ == '__main__':
    app.run(debug=True)
