import os
import openai
from dotenv import load_dotenv


load_dotenv()


class OpenApiWrapper: 
    def __init__(self):
        self.client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


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
        