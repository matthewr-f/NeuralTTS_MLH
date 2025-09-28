#!/usr/bin/env python3
"""
Secure Flask server for TTS PDF Reader
Run with: python server.py
"""

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
import webbrowser
import requests
import json
from urllib.parse import urlparse

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Google Cloud TTS Configuration
GOOGLE_CLOUD_API_KEY = os.getenv('GOOGLE_CLOUD_API_KEY')
TTS_ENDPOINT = 'https://texttospeech.googleapis.com/v1beta1/text:synthesize'

@app.route('/')
def index():
    """Serve the main HTML file"""
    return send_from_directory('.', 'index.html')

@app.route('/<path:filename>')
def serve_static(filename):
    """Serve static files"""
    return send_from_directory('.', filename)

@app.route('/synthesize', methods=['POST'])
def synthesize():
    """
    Secure endpoint for text-to-speech synthesis
    Accepts text and voice parameters, calls Google Cloud TTS API
    """
    try:
        # Get request data
        data = request.get_json()
        
        if not data or 'text' not in data:
            return jsonify({'error': 'Text is required'}), 400
        
        text = data['text']
        voice_name = data.get('voice', 'Kore')
        language_code = data.get('languageCode', 'en-US')
        model_name = data.get('modelName', 'gemini-2.5-pro-preview-tts')
        pitch = data.get('pitch', 0)
        speaking_rate = data.get('speakingRate', 1.0)
        
        # Validate API key
        if not GOOGLE_CLOUD_API_KEY:
            return jsonify({
                'error': 'Google Cloud API key not configured. Please set GOOGLE_CLOUD_API_KEY environment variable.',
                'mockAudio': True
            }), 500
        
        # Prepare request for Google Cloud TTS
        tts_request = {
            "audioConfig": {
                "audioEncoding": "LINEAR16",
                "pitch": pitch,
                "speakingRate": speaking_rate,
                "enableTimePointing": ["SSML"]  # Request word timings
            },
            "input": {
                "text": text
            },
            "voice": {
                "languageCode": language_code,
                "modelName": model_name,
                "name": voice_name
            }
        }
        
        # Call Google Cloud TTS API
        response = requests.post(
            f"{TTS_ENDPOINT}?key={GOOGLE_CLOUD_API_KEY}",
            headers={'Content-Type': 'application/json'},
            json=tts_request,
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            return jsonify({
                'audioContent': result.get('audioContent'),
                'timepoints': result.get('timepoints', []),
                'success': True
            })
        else:
            return jsonify({
                'error': f'Google Cloud TTS API error: {response.status_code} - {response.text}',
                'mockAudio': True
            }), 500
            
    except requests.exceptions.Timeout:
        return jsonify({'error': 'Request timeout. Please try again.'}), 408
    except requests.exceptions.RequestException as e:
        return jsonify({'error': f'Network error: {str(e)}', 'mockAudio': True}), 500
    except Exception as e:
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'api_key_configured': bool(GOOGLE_CLOUD_API_KEY)
    })

def main():
    PORT = 8000
    
    # Change to the directory containing this script
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    print(f"🚀 TTS PDF Reader server running at http://localhost:{PORT}")
    print("📁 Serving files from:", os.getcwd())
    print("🔐 API Key configured:", bool(GOOGLE_CLOUD_API_KEY))
    
    if not GOOGLE_CLOUD_API_KEY:
        print("⚠️  WARNING: GOOGLE_CLOUD_API_KEY environment variable not set!")
        print("   Set it with: export GOOGLE_CLOUD_API_KEY='your-api-key-here'")
        print("   Or create a .env file with: GOOGLE_CLOUD_API_KEY=your-api-key-here")
    
    print("🌐 Opening browser...")
    webbrowser.open(f'http://localhost:{PORT}')
    
    print("\n💡 To stop the server, press Ctrl+C")
    print("📖 Check README.md for setup instructions")
    
    try:
        app.run(host='0.0.0.0', port=PORT, debug=False)
    except KeyboardInterrupt:
        print("\n👋 Server stopped. Goodbye!")

if __name__ == "__main__":
    main()
