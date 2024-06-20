 
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
from fuzzywuzzy import fuzz
from fuzzywuzzy import process
from textblob import TextBlob
import requests
from twilio.twiml.messaging_response import MessagingResponse 
from google.cloud import speech_v1p1beta1 as speech
from google.cloud import translate_v2 as translate
from google.cloud import texttospeech
import base64
load_dotenv()
speech_client = speech.SpeechClient.from_service_account_json('cred.json')
translate_client = translate.Client.from_service_account_json("cred.json")
client1 = texttospeech.TextToSpeechClient()


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
pairs.append((' ', 'Stick to agriculture-related questions'))
pairs.append(('my name is (.*)', 'Hello %1, how are you today?'))
# Add greeting response
# pairs.append(('(hi|hello|hey)', 'Hello!'))
# pairs.append(('hey', 'Hello'))
# Add name response
pairs.append(('(.*) your name ?', 'My name is chatBot.'))

# Add default response for 'how are you' question
pairs.append(('how are you (.*)', 'I am doing well, thank you!'))
pairs.append(('laptop mice', 'I am doing well, thank you!'))
pairs.append(('hey', 'hi, how are you doing'))
pairs.append(('hi', 'hi, how are you doing'))
pairs.append(('hello', 'hi, how are you doing'))
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
user_patterns = [pattern for pattern, response in pairs] #querytesxt
responses = [response for pattern, response in pairs]   #response

# Tokenizer and vectorizer
tokenizer = nltk.tokenize.RegexpTokenizer(r'\w+')
vectorizer = TfidfVectorizer(tokenizer=tokenizer.tokenize)
tfidf_matrix = vectorizer.fit_transform(user_patterns)

class SuggestionTracker:
    def __init__(self, suggestions):
        self.suggestions = suggestions
        self.suggestions_sent = True

def replace_placeholders(response, match):
    """Replace placeholders in the response with matched groups."""
    for i in range(len(match.groups())):
        response = response.replace(f'%{i+1}', match.group(i+1))
    return response

def preprocess_text(text):
    """Normalize text by removing extra spaces and converting to lowercase."""
    return re.sub(r'\s+', ' ', text.strip().lower())

def fuzzy_match(query, patterns, threshold=80):
    """Find the best fuzzy match for a query from a list of patterns."""
    best_match = process.extractOne(query, patterns, scorer=fuzz.token_sort_ratio)
    if best_match and best_match[1] >= threshold:
        return best_match[0]
    return None
def another_response(user_input):
    # Compute the TF-IDF matrix
    user_tfidf = vectorizer.transform([user_input])
    cosine_similarities = cosine_similarity(user_tfidf, tfidf_matrix).flatten()
    best_match_index = np.argmax(cosine_similarities)
    best_pattern = user_patterns[best_match_index]
    response = responses[best_match_index]
    match = re.match(best_pattern, user_input, re.IGNORECASE)

    if match:
        response = replace_placeholders(response, match)
    
    return response

def another_response_specific(user_input):
    # Compute the TF-IDF matrix
    threshold=0.3
    user_tfidf = vectorizer.transform([user_input])
    cosine_similarities = cosine_similarity(user_tfidf, tfidf_matrix).flatten()
    best_match_index = np.argmax(cosine_similarities)
    best_pattern = user_patterns[best_match_index]
    similarity_score = cosine_similarities[best_match_index]

    # Check if similarity score exceeds the threshold
    if similarity_score >= threshold:
        response = responses[best_match_index]
        match = re.match(best_pattern, user_input, re.IGNORECASE)
        if match:
            response = replace_placeholders(response, match)
    else:
        response = "Please stick to agriculture questions."
    
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
def verify():
    # Parse params from the webhook verification request
    mode = request.args.get("hub.mode")
    token = request.args.get("hub.verify_token")
    challenge = request.args.get("hub.challenge")
    # Check if a token and mode were sent
    if mode and token:
        # Check the mode and token sent are correct
        if mode == "subscribe" and token == current_app.config["1234"]:
            # Respond with 200 OK and challenge token from the request
            logging.info("WEBHOOK_VERIFIED")
            return challenge, 200
        else:
            # Responds with '403 Forbidden' if verify tokens do not match
            logging.info("VERIFICATION_FAILED")
            return jsonify({"status": "error", "message": "Verification failed"}), 403
    else:
        # Responds with '400 Bad Request' if verify tokens do not match
        logging.info("MISSING_PARAMETER")
        return jsonify({"status": "error", "message": "Missing parameters"}),400

def get_top_questions2(keyword, top_n=5):
    threshold = 0.4
    keyword_vector = vectorizer.transform([keyword])
    similarities = cosine_similarity(keyword_vector, tfidf_matrix).flatten()
    # indices = [i for i, question in enumerate(user_patterns) if keyword.lower() in question.lower()]
    sorted_indices = np.argsort(-similarities)[:top_n]  # Get indices of top_n highest similarities
    top_questions = [user_patterns[i] for i in sorted_indices if similarities[i] > threshold]
    return top_questions

def get_top_questions(keyword, top_n=5):
    keyword = preprocess_text(keyword)
    fuzzy_matches = process.extract(keyword, user_patterns, scorer=fuzz.token_sort_ratio, limit=top_n)
    top_questions = [match[0] for match in fuzzy_matches if match[1] >= 80]
    return top_questions

def should_suggest_questions(user_message):
    user_message = preprocess_text(user_message)
    keyword_vector = vectorizer.transform([user_message])
    similarities = cosine_similarity(keyword_vector, tfidf_matrix).flatten()
    close_matches = [i for i, similarity in enumerate(similarities) if similarity > 0.3]
    print("Number of close matches:", len(close_matches))  # Add this line to log the length
    print("Similarities:", similarities)  # Add this line to print similarities
    print("Close matches:", close_matches) 
    return len(close_matches) > 1
def correct_spelling(text):
    return str(TextBlob(text).correct())
def should_suggest_questions1(user_message):
    keyword_vector = vectorizer.transform([user_message])
    similarities = cosine_similarity(keyword_vector, tfidf_matrix).flatten()
    close_matches = [i for i, similarity in enumerate(similarities) if similarity > 0.4]
    print("Number of close matches:", len(close_matches))  # Add this line to log the length
    print("Similarities:", similarities)  # Add this line to print similarities
    # print("Close matches:", close_matches) 
    # for index in close_matches:
        # print(f"Row {index}: {user_patterns[index]} with similarity {similarities[index]}")
    return len(close_matches)> 1
def should_suggest_questions12(user_message):
    keyword_vector = vectorizer.transform([user_message])
    similarities = cosine_similarity(keyword_vector, tfidf_matrix).flatten()
    close_matches = [i for i, similarity in enumerate(similarities) if similarity > 0.9]
    print("Number of close matches:", len(close_matches))  # Add this line to log the length
    print("Similarities:", similarities)  # Add this line to print similarities
    print("Close matches:", close_matches) 
    for index in close_matches:
        print(f"Row {index}: {user_patterns[index]} with similarity {similarities[index]}")
    return len(close_matches) > 1


def handle_npk_values(npk_values):
    # Here you can handle the NPK values as per your requirement
    response_message = (
        f"Nitrogen - {npk_values['Nitrogen']}, "
        f"Phosphorous - {npk_values['Phosphorous']}, "
        f"Potassium - {npk_values['Potassium']}, "
        f"Carbon - {npk_values['Carbon']}, "
        f"State - {npk_values['State']}, "
        f"Crops - {', '.join(npk_values['Crops'])}"
    )
    return response_message



app = Flask(__name__)
suggestion_tracker = None
CORS(app)
logging.basicConfig(level=logging.DEBUG)
logging.getLogger('gql.transport.requests').setLevel(logging.WARNING)
@app.route("/")
def home():
    return render_template("index.html")
@app.route('/api/translate', methods=['POST'])
def translate_text():
    data = request.json
    text = data['message']
    language1 = data['language']
    # Translate the text to English
    translation = translate_client.translate(text, target_language="en")
    user_message= translation['translatedText']
    print(user_message)
    if check_similar_report(user_message): #works
        response = "Please enter your phone number"
        translated_response = translate_client.translate(response, target_language=language1)['translatedText']
        print(translated_response)
        response=translated_response
        
    elif re.fullmatch(r'\d{10}', user_message):
        response = chatbot_response(user_message) #screw this 
    # elif should_suggest_questions1(user_message):
    #     top_questions = get_top_questions(user_message)
    #     response = {"suggestions": top_questions}
    elif should_suggest_questions1(user_message):
        
        top_questions = get_top_questions2(user_message)
        print(top_questions)
        for i in range(len(top_questions)):
            translated_response = translate_client.translate(top_questions[i], target_language=language1)
            top_questions[i] = translated_response['translatedText']
            
    #     # translated_response1 = translate_client.translate(top_questions, target_language=language1)['translatedText']
    #     # print(top_questions)
        response = {"suggestions": top_questions}
    else:
        response = another_response(user_message)
        # print(user_message)
        translated_response = translate_client.translate(response, target_language=language1)['translatedText']
        print(translated_response)
        response=translated_response
    return jsonify({"response": response})

  

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

@app.route("/webhook", methods=["POST"])
def webhook():
    verify();
    data = request.json
    if not data:
        app.logger.error("No JSON data received")
        return jsonify({"error": "No data received"}), 400

    # Extract the message and sender's number
    message = data['messages'][0]['text']['body']
    user_id = data['messages'][0]['from']

    # Process the message with your existing chatbot logic
    if check_similar_report(message): 
        response = "Please enter your phone number"
    elif re.fullmatch(r'\d{10}', message):
        response = chatbot_response(message)
    elif should_suggest_questions1(message):
        top_questions = get_top_questions2(message)
        response = {"suggestions": top_questions}
    else:
        response = another_response(message)

    # Send the response back to the user via WhatsApp
    send_whatsapp_message(user_id, response)
    
    return "OKII", 200

def send_whatsapp_message(to, message):
    
    url = 'https://graph.facebook.com/v13.0/323491497519721/messages'
    headers = {
        'Authorization': 'Bearer EAADuvofXu8gBOx7iTuCoDZATWoLPh5gKx23238sefrCrg55qgZCVrZAEL7QslYIz3vAc5LA3fJSDgOY2uOBT3LMW2AJukLIp7c6zWGivw62OnTZCOHMn9IyAR75WVAAUCjK8NAiLdDqzC18XCZBPeEhgOxQ9iTAPsZCTy2DPC5vtzKGG34CzbMlp5AwMBXTXfFOftV6eogUdCGV47SuNMZD',
        'Content-Type': 'application/json'
    }
    payload = {
        'messaging_product': 'whatsapp',
        'to': to,
        'type': 'text',
        'text': {
            'body': message
        }
    }
    response = requests.post(url, json=payload, headers=headers)
    return response.json()
@app.route("/npk", methods=["POST"])
def handle_npk():
    npk_values = request.json  # Parse the JSON data
    # print(npk_values)
    # if npk_values:
    #     # response = handle_npk_values(npk_values)
    #     return jsonify({"response": response})
    # else:
    return jsonify({"response": npk_values}), 200

flag=0

@app.route("/chat1", methods=["POST"])
def chat1():
    user_message = request.json.get("message")
    language1 = request.json.get("language")
    user_message = translate_client.translate(user_message, target_language="en")['translatedText']
    if check_similar_report(user_message): 
        response = "Please enter your phone number"
    elif re.fullmatch(r'\d{10}', user_message):
        response = chatbot_response(user_message)
    else:
        response = another_response(user_message)   
    response = translate_client.translate(response, target_language=language1)['translatedText']
    return jsonify({"response": response})



@app.route("/chat", methods=["POST"])
def chat():
    user_message = request.json.get("message")
    if check_similar_report(user_message): #works
        response = "Please enter your phone number"
    elif re.fullmatch(r'\d{10}', user_message):
        response = chatbot_response(user_message) 
    # elif should_suggest_questions1(user_message):
    #     top_questions = get_top_questions(user_message)
    #     response = {"suggestions": top_questions}
    elif should_suggest_questions1(user_message):
        top_questions = get_top_questions2(user_message)
        print(top_questions)
        response = {"suggestions": top_questions}
    else:
        response = another_response(user_message)
    return jsonify({"response": response})

@app.route("/chat2", methods=["POST"])  #not needed 
def chat2():
    user_message = request.json.get("message")
    if check_similar_report(user_message): 
        response = "Please enter your phone number"
    elif re.fullmatch(r'\d{10}', user_message):
        response = chatbot_response(user_message)
    else:
        response = another_response(user_message)
    return jsonify({"response": response})

def generate_answer(user_message):
    if check_similar_report(user_message): 
        response = "Please enter your phone number"
    elif re.fullmatch(r'\d{10}', user_message):
        response = chatbot_response(user_message)
    else:
        response = another_response_specific(user_message)
    return response

@app.route("/chatgpt", methods=["POST"])  #not needed 
def chatgpt():
    incoming_que = request.values.get('Body', '').lower()
    print(incoming_que)
    answer = generate_answer(incoming_que)
    print(f"Generated answer: {answer}")
    
    bot_resp = MessagingResponse()
    
    bot_resp.message(answer)
    
    response_str = str(bot_resp)
    print(f"Response to be sent: {response_str}")
    
    return response_str
 
@app.route('/api/tts', methods=['POST'])
def tts():
    data = request.get_json()
    text = data.get('text')
    language_code = data.get('languageCode', 'en-US')

    input_text = texttospeech.SynthesisInput(text=text)
    voice = texttospeech.VoiceSelectionParams(
        language_code=language_code, 
        ssml_gender=texttospeech.SsmlVoiceGender.NEUTRAL
    )
    audio_config = texttospeech.AudioConfig(
        audio_encoding=texttospeech.AudioEncoding.MP3
    )

    response = client1.synthesize_speech(
        input=input_text, 
        voice=voice, 
        audio_config=audio_config
    )

    audio_content = base64.b64encode(response.audio_content).decode('utf-8')

    return jsonify({'audioContent': audio_content})

if __name__ == "__main__":
    app.run(debug=True)
 