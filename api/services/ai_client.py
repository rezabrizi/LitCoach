from openai import OpenAI, OpenAIError, RateLimitError, AuthenticationError, APIError

MAX_CONTEXT_MSGS = 4


class AIClient:
    def __init__(self, openai_api_key: str):
        self.oa_client = OpenAI(api_key=openai_api_key)

    def call_chat_model(self, messages: list):
        try:
            response = self.oa_client.chat.completions.create(
                model="gpt-4o",
                messages=messages,
                stream=True,
                stream_options={"include_usage": True},
            )
            for chunk in response:
                yield chunk
        except (RateLimitError, AuthenticationError, APIError) as e:
            raise OpenAIError(f"{e.__class__.__name__}: {str(e)}")
        except Exception as e:
            raise OpenAIError(f"An unexpected error occurred: {str(e)}")


def get_ai_prompt(problem: str, chat_context: list, user_code: str, question: str):
    system_message = {
        "role": "system",
        "content": """
            You are an AI assistant specializing in technical interview tutoring, particularly for LeetCode-style coding problems. 
            Your primary role is to guide users in understanding their mistakes and improving problem-solving skills rather than 
            directly providing solutions. You analyze users' code for logical errors, inefficiencies, or syntax issues and explain 
            them clearly without immediately offering corrections. You provide hints and suggest strategies while encouraging independent 
            problem-solving. Only when explicitly asked should you provide complete solutions or corrected code.  
            You should respond like a friend. Be educational and focus on constructive feedback. Get straight to the point in your response.
            Always aim for short responses as much as possible.
        """,
    }
    user_message = {
        "role": "user",
        "content": f"""
            LeetCode problem:\n{problem}\n
            User's current code attempt:\n{user_code}\n
            User's question:\n{question}
        """,
    }
    formatted_chat_context = [
        {"role": message.role, "content": message.content}
        for message in chat_context[-MAX_CONTEXT_MSGS:]
    ]
    return [system_message] + formatted_chat_context + [user_message]


#   [
#       {
#           'role': 'system',
#           'content': "\n            You are an AI assistant specializing in technical interview tutoring, particularly for LeetCode-style coding problems. \n            Your primary role is to guide users in understanding their mistakes and improving problem-solving skills rather than \n            directly providing solutions. You analyze users' code for logical errors, inefficiencies, or syntax issues and explain \n            them clearly without immediately offering corrections. You provide hints and suggest strategies while encouraging independent \n            problem-solving. Only when explicitly asked should you provide complete solutions or corrected code.  \n            You should respond like a friend. Be educational and focus on constructive feedback. Get straight to the point in your response.\n            Always aim for short responses as much as possible.\n        "
#       },
#       {
#           'role': 'user',
#           'content': 'fsdf'
#       },
#       {
#           'role': 'assistant',
#           'content': "Looks like you're just getting started on the problem. Let's break down what you need to do:\n\n1. **Top View (xy-plane)**: Count all cells with a non-zero value, as each of those contributes at least one unit to the projection area.\n\n2. **Front View (yz-plane)**: For each column, find the tallest tower (maximum value in each column).\n\n3. **"
#       },
#       {
#           'role': 'user',
#           'content': 'sada'
#       },
#       {
#           'role': 'assistant',
#           'content': "It looks like you're starting with an empty method. Here are some tips on how to approach solving this problem:\n\n1. **Top View (xy-plane)**: Count all cells in the grid with a value greater than zero. Each non-zero cell represents a visible cube from the top view.\n\n2. **Front View (yz-plane)**:"
#       },
#       {
#           'role': 'user',
#           'content': '\n            LeetCode problem:\nCan you solve this real interview question? Projection Area of 3D Shapes - You are given an n x n grid where we place some 1 x 1 x 1 cubes that are axis-aligned with the x, y, and z axes.\n\nEach value v = grid[i][j] represents a tower of v cubes placed on top of the cell (i, j).\n\nWe view the projection of these cubes onto the xy, yz, and zx planes.\n\nA projection is like a shadow, that maps our 3-dimensional figure to a 2-dimensional plane. We are viewing the "shadow" when looking at the cubes from the top, the front, and the side.\n\nReturn the total area of all three projections.\n\n\xa0\n\nExample 1:\n\n[https://s3-lc-upload.s3.amazonaws.com/uploads/2018/08/02/shadow.png]\n\n\nInput: grid = [[1,2],[3,4]]\nOutput: 17\nExplanation: Here are the three projections ("shadows") of the shape made with each axis-aligned plane.\n\n\nExample 2:\n\n\nInput: grid = [[2]]\nOutput: 5\n\n\nExample 3:\n\n\nInput: grid = [[1,0],[0,2]]\nOutput: 8\n\n\n\xa0\n\nConstraints:\n\n * n == grid.length == grid[i].length\n * 1 <= n <= 50\n * 0 <= grid[i][j] <= 50\n\n            User\'s current code attempt:\nclass Solution {\npublic:\n    int projectionArea(vector<vector<int>>& grid) {\n        \n    }\n};\n\n            User\'s question:\ndasd\n        '
#       }
#   ]
