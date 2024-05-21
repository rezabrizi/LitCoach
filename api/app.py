from flask import Flask, request, jsonify, make_response
from flask_cors import CORS
from .openai_utilities import OpenApiWrapper


app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)

    
openaiwrapper = OpenApiWrapper()


@app.route("/api/help", methods=['POST'])
def get_help():
    data = request.json
    problem, user_code, help_level = data.get("problem"), data.get("user_code"), data.get("help_level")
    response_dict = {"help_response": None}
    try:
        response_dict['help_response'] = openaiwrapper.help_open_ai(problem, user_code, help_level)
        response = jsonify(response_dict)
        return response, 200
    except Exception as e:
        response = jsonify({"error": str(e)})
        return response, 500


@app.route("/api/health", methods=['GET'])
def health():
    return jsonify({"status": "healthy"}), 200


if __name__ == '__main__':
    app.run(debug=True)
