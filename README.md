# TTS PDF Reader

A secure web application that converts PDF documents to speech using Google Cloud Text-to-Speech API with backend API key protection.

## Features

- 📄 PDF text extraction
- 🎵 Text-to-speech conversion using Google Cloud TTS
- 🎛️ Voice selection and audio controls
- ⚡ Speed and pitch adjustment
- 📱 Responsive design
- 🎨 Modern UI with drag-and-drop support
- 🔐 **Secure API key handling** - API keys are stored securely on the backend
- 📚 **Smart text chunking** - Automatically splits large PDFs into manageable chunks
- 🔄 **Queue processing** - Processes chunks sequentially to avoid API limits
- 🎧 **Seamless playback** - Chunks play continuously as a single audio stream
- 📖 **Book-like reading experience** - Page-based navigation with text highlighting
- 🎯 **Dynamic voice selection** - Automatically populated voice list from configuration
- ⚠️ **Enhanced error handling** - Descriptive error messages instead of silent fallbacks

## Quick Start

1. **Clone or download this repository**

2. **Install Python dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Set up Google Cloud TTS API**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one
   - Enable the Text-to-Speech API
   - Create credentials (API Key)

4. **Configure your API key securely**
   
   **Option A: Environment Variable (Recommended)**
   ```bash
   export GOOGLE_CLOUD_API_KEY='your-api-key-here'
   ```
   
   **Option B: .env file**
   Create a `.env` file in the project root:
   ```
   GOOGLE_CLOUD_API_KEY=your-api-key-here
   ```

5. **Start the secure server**
   ```bash
   python server.py
   ```
   
   The server will automatically open your browser to `http://localhost:8000`

6. **Use the application**
   - Drag and drop a PDF file or click to browse
   - Wait for text extraction to complete
   - Click "Generate Audio" to synthesize speech
   - Use the audio controls to play, pause, or stop

## Security Features

- 🔐 **API Key Protection**: Google Cloud API key is stored securely on the backend server
- 🛡️ **No Client-Side Exposure**: API keys are never exposed to the browser
- 🔒 **Environment Variables**: Secure configuration using environment variables
- 🚫 **CORS Protection**: Proper CORS handling for secure API communication

## Available Voices

The application supports various Google Cloud TTS voices:
- **Kore** (Gemini 2.5 Pro Preview) - Default
- **Wavenet A-F** - Neural voices with different characteristics

## Audio Controls

- **Generate Audio**: Creates audio from extracted PDF text
- **Play/Pause**: Control audio playback
- **Stop**: Stop and reset audio
- **Speed**: Adjust speaking rate (0.5x to 2.0x)
- **Pitch**: Adjust voice pitch (-20 to +20)

## Text Chunking System

The application automatically handles large PDFs by implementing intelligent text chunking:

- **Smart Splitting**: Text is split at paragraph boundaries first, then sentences, then words
- **Size Limits**: Each chunk is limited to 5,000 characters to stay within API limits
- **Queue Processing**: Chunks are processed sequentially to avoid overwhelming the API
- **Seamless Playback**: Audio chunks play continuously as a single stream
- **Progress Tracking**: Real-time progress updates show chunk processing status
- **Error Recovery**: If one chunk fails, processing continues with remaining chunks

## Enhanced User Experience

The application now provides a modern, book-like reading experience:

- **📖 Book Interface**: PDFs are displayed in a paginated, book-like format
- **📄 Page Navigation**: Navigate through pages with Previous/Next buttons
- **🎯 Text Highlighting**: Current reading position is highlighted as audio plays
- **🎵 Dynamic Voice List**: Voice options are automatically populated from configuration
- **⚠️ Smart Error Handling**: Descriptive error messages help users understand issues
- **📱 Responsive Design**: Optimized for both desktop and mobile devices

## Browser Compatibility

- Chrome (recommended)
- Firefox
- Safari
- Edge

## Troubleshooting

### PDF Processing Issues
- Ensure the PDF contains selectable text (not scanned images)
- Try with a different PDF file
- Check browser console for error messages

### Audio Generation Issues
- Verify your Google Cloud API key is set correctly in the environment
- Check that the Text-to-Speech API is enabled in Google Cloud Console
- Ensure you have sufficient API quota
- Check server logs for detailed error messages

### Server Issues
- Make sure all Python dependencies are installed: `pip install -r requirements.txt`
- Verify the API key is set: `echo $GOOGLE_CLOUD_API_KEY`
- Check that port 8000 is available
- Review server console output for error messages

### API Key Configuration
- **Environment Variable**: `export GOOGLE_CLOUD_API_KEY='your-key'`
- **Health Check**: Visit `http://localhost:8000/health` to verify API key status
- **Server Logs**: Check console output when starting the server

## Development

### Project Structure
```
/
├── index.html          # Main HTML file
├── styles.css          # CSS styles
├── script.js           # Frontend JavaScript application
├── config.js           # Frontend configuration (no API keys)
├── server.py           # Secure Flask backend server
├── requirements.txt    # Python dependencies
└── README.md           # This file
```

### Key Components
- **Frontend (script.js)**: PDF processing and UI controls
- **Backend (server.py)**: Secure API key handling and TTS synthesis
- **PDF.js Integration**: Client-side PDF text extraction
- **Google Cloud TTS**: Server-side text-to-speech synthesis
- **Audio Controls**: Client-side playback management

### API Endpoints
- `GET /` - Serves the main application
- `POST /synthesize` - Secure TTS synthesis endpoint
- `GET /health` - Health check and API key status

## License

Built for Sunhacks 2025 Hackathon

## Support

For issues or questions, please check the browser console for error messages and ensure all API credentials are properly configured.
