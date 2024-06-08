import html
from flask import Flask, render_template, request, jsonify
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np  
import nltk
import re
from dotenv import load_dotenv
from gql import Client, gql
from gql.transport.requests import RequestsHTTPTransport
import json
import os
from flask_cors import CORS
import logging

load_dotenv()

# Get the JSON token from environment variables
tokens = os.getenv("GRAPHQL_TOKEN")

# Extract the token and refresh token



transport = RequestsHTTPTransport(
    url="https://shc-dev.krishitantra.com/",
    headers={"Authorization": f"Bearer {tokens}"},#with token we are going there
    use_json=True,
)

client = Client(transport=transport, fetch_schema_from_transport=False)

import pandas as pd

# Initialize the list to store pairs
pairs = []
pairs.append(('', 'Stick to agriculture-related questions'))
pairs.append(('my name is (.*)', 'Hello %1, how are you today?'))
# Add greeting response
pairs.append(('(hi|hello|hey)', 'Hello!'))

# Add name response
pairs.append(('(.*) your name ?', 'My name is chatBot.'))

# Add default response for 'how are you' question
pairs.append(('how are you (.*)', 'I am doing well, thank you!'))

# Add default response for 'location' question
pairs.append(('(.*) (location|city) ?', 'I am a virtual assistant, I live in the cloud.'))

# Add exit response
pairs.append(('quit', 'Bye! Take care.'))
# Define the file path
file_path = 'Book2.csv'

# Define the column numbers containing the query text and answer
query_text_column = 2  # Assuming the 11th column (0-indexed) contains query text
query_answer_column = 3  # Assuming the 12th column (0-indexed) contains query answer

# Define the chunk size for reading the file
chunk_size = 100000  # Adjust as needed based on your system's memory capacity

# Iterate over chunks of the CSV file
for chunk in pd.read_csv(file_path, chunksize=chunk_size, encoding='utf-8',dtype=str):
    # Iterate over rows in the chunk and extract query text and answer
    for index, row in chunk.iterrows():
        query_text = row.iloc[query_text_column]
        query_answer = row.iloc[query_answer_column]
        pairs.append((query_text, query_answer))

# Extract user patterns and responses
user_patterns = [pattern for pattern, response in pairs]
responses = [response for pattern, response in pairs]

# Tokenizer and vectorizer
tokenizer = nltk.tokenize.RegexpTokenizer(r'\w+')
vectorizer = TfidfVectorizer(tokenizer=tokenizer.tokenize)
def replace_placeholders(response, match):
    """Replace placeholders in the response with matched groups."""
    for i in range(len(match.groups())):
        response = response.replace(f'%{i+1}', match.group(i+1))
    return response

def another_response(user_input):
    # Compute the TF-IDF matrix
    tfidf_matrix = vectorizer.fit_transform(user_patterns + [user_input])
    # Compute the cosine similarity
    cosine_similarities = cosine_similarity(tfidf_matrix[-1], tfidf_matrix[:-1])
    # Find the index of the best match
    best_match_index = np.argmax(cosine_similarities)

    # Get the best matching pattern and response
    best_pattern = user_patterns[best_match_index]
    response = responses[best_match_index]

    # Match the user input against the best pattern to find groups
    match = re.match(best_pattern, user_input, re.IGNORECASE)

    if match:
        # Replace placeholders in the response
        response = replace_placeholders(response, match)
    
    return response
def check_similar_report(message):
  message = message.lower().strip()

  # Define keywords related to reports
  report_words = ["report", "test"]

  # Check for at least one keyword and some similarity
  for word in report_words:
    if word in message and any(w.startswith(word) for w in message.split()):
      return True
  return False

def chatbot_response(user_message):
    
     # Example GraphQL query
    query = gql("""
    query GetTestForPortal($phone: String, $locale: String) {
  getTestForPortal(phone: $phone) {
    html(locale: $locale)
  }
}
    """)
    params = {"phone": user_message}

    try:
        response = client.execute(query, variable_values=params)
        # print("hello"+response.get('getTestForPortal'))
        # rep=html.unescape(response['getTestForPortal'][0]['html'])
        if response.get('getTestForPortal') is None or not response['getTestForPortal']:
            return "The phone number does not exist in the database."
        return response
        
    except Exception as e:
        return f"Sorry, I couldn't process your request at the moment. Error: {str(e)}"



app = Flask(__name__)
CORS(app)
logging.basicConfig(level=logging.DEBUG)
logging.getLogger('gql.transport.requests').setLevel(logging.WARNING)
@app.route("/")
def home():
    return render_template("index.html")

@app.route("/getcenters",methods=["POST"])
def get_nearest_centers():
    data = request.get_json()
    if not data:
        app.logger.error("No JSON data received")
        return jsonify({"error": "No data received"}), 400
    latitude = data.get('latitude')
    longitude = data.get('longitude')
    # app.logger.debug(f"Received latitude: {latitude}, longitude: {longitude}")  
    if not latitude or not longitude:
        app.logger.error("Latitude or longitude is missing in the request")

        return jsonify({"error": "Invalid latitude or longitude"}), 400

    # Query a Geocoding API to get state and district
    # geocode_url = f'https://api.yourgeocodingapi.com/geocode?lat={latitude}&lon={longitude}&key=YOUR_GEOCODING_API_KEY'
    # geocode_response = requests.get(geocode_url)
    # if geocode_response.status_code != 200:
    #     return jsonify({"error": "Failed to get geocode data"}), 500

    # geocode_data = geocode_response.json()
    # state = geocode_data['state']
    # district = geocode_data['district']

    # Query the GraphQL endpoint
    try:
        latitude = float(latitude)
        longitude = float(longitude)
    except ValueError:
        app.logger.error("Latitude or longitude is not a valid number")
        return jsonify({"error": "Invalid latitude or longitude"}), 400
    
    query = gql("""
    query GetTestCenters {
        getTestCenters {
                      name
                      region
                      timing
                      phone
                      address
                      authenticatedUser
                      createdAt
                      updatedAt
                      email
        }
    }
    """)
    try:
        # this block is basically not working
        gql_response = client.execute(query)
        # app.logger.debug(f"GraphQL response: {gql_response}")
        test_centers = gql_response['getTestCenters']
        # print(test_centers)
        # Calculate distance and filter nearby test centers (within 50 km radius for example)
        def calculate_distance(lat1, lon1, lat2, lon2):
            from math import radians, sin, cos, sqrt, atan2

            R = 6371  # Radius of the Earth in km
            dlat = radians(lat2 - lat1)
            dlon = radians(lon2 - lon1)
            a = sin(dlat / 2) ** 2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon / 2) ** 2
            c = 2 * atan2(sqrt(a), sqrt(1 - a))
            distance = R * c
            return distance
        
        
        # for center in :
        print(test_centers[0]['region']['geolocation']['coordinates'][1])
        valid_centers = []
        for center in test_centers:
            if ('region' in center and 
                'geolocation' in center['region'] and 
                'coordinates' in center['region']['geolocation'] and
                len(center['region']['geolocation']['coordinates']) == 2):
                
                try:
                    center_latitude = float(center['region']['geolocation']['coordinates'][1])
                    center_longitude = float(center['region']['geolocation']['coordinates'][0])
                    
                    app.logger.debug(f"Processing center: {center['name']}, lat: {center_latitude}, lon: {center_longitude}")
                    
                    if calculate_distance(latitude, longitude, center_latitude, center_longitude) <= 150:
                        valid_centers.append(center)
                except (ValueError, TypeError) as e:
                    app.logger.error(f"Invalid geolocation data for center {center['name']}: {e}")
        print(valid_centers[0])
        return jsonify(valid_centers)

        
        
        # return jsonify(nearby_centers)
        
    except Exception as e:
        app.logger.error(f"Error querying test centers: {str(e)}")
        return jsonify({"error": str(e)}), 500


@app.route("/chat", methods=["POST"])
def chat():
    user_message = request.json.get("message")
    print(user_message)
    if check_similar_report(user_message):
      response = "Please enter your phone number"
    elif re.fullmatch(r'\d{10}', user_message):  # Check if the message is a 10-digit number
        response = chatbot_response(user_message)
    else:
        response = another_response(user_message)

    return jsonify({"response": response})
    
    
    

if __name__ == "__main__":
    app.run(debug=True)
