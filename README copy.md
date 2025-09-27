# TTS PDF Reader

A web application that converts PDF documents to speech using Google Cloud Text-to-Speech API.

## Features

- 📄 PDF text extraction
- 🎵 Text-to-speech conversion using Google Cloud TTS
- 🎛️ Voice selection and audio controls
- ⚡ Speed and pitch adjustment
- 📱 Responsive design
- 🎨 Modern UI with drag-and-drop support

## Quick Start

1. **Clone or download this repository**

2. **Set up Google Cloud TTS API**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one
   - Enable the Text-to-Speech API
   - Create credentials (API Key)
   - Update `config.js` with your API key

3. **Open the application**
   - Simply open `index.html` in your web browser
   - Or use a local server (recommended):
     ```bash
     # Using Python
     python -m http.server 8000
     
     # Using Node.js
     npx http-server
     
     # Using PHP
     php -S localhost:8000
     ```

4. **Use the application**
   - Drag and drop a PDF file or click to browse
   - Wait for text extraction to complete
   - Click "Generate Audio" to synthesize speech
   - Use the audio controls to play, pause, or stop

## API Configuration

Update the `config.js` file with your Google Cloud API key:

```javascript
const TTS_CONFIG = {
    apiKey: 'YOUR_GOOGLE_CLOUD_API_KEY_HERE',
    // ... rest of config
};
```

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
- Verify your Google Cloud API key is correct
- Check that the Text-to-Speech API is enabled
- Ensure you have sufficient API quota

### CORS Issues
- Use a local server instead of opening the HTML file directly
- The Google Cloud TTS API requires proper CORS handling

## Development

### Project Structure
```
/
├── index.html          # Main HTML file
├── styles.css          # CSS styles
├── script.js           # Main JavaScript application
├── config.js           # Configuration file
└── README.md           # This file
```

### Key Components
- **TTSReader Class**: Main application logic
- **PDF.js Integration**: PDF text extraction
- **Google Cloud TTS**: Text-to-speech synthesis
- **Audio Controls**: Playback management

## License

Built for Sunhacks 2025 Hackathon

## Support

For issues or questions, please check the browser console for error messages and ensure all API credentials are properly configured.
