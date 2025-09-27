// Google Cloud TTS Configuration
const TTS_CONFIG = {
    // Replace with your actual Google Cloud API key
    apiKey: 'YOUR_GOOGLE_CLOUD_API_KEY_HERE',
    
    // TTS API endpoint
    endpoint: 'https://texttospeech.googleapis.com/v1beta1/text:synthesize',
    
    // Default voice settings
    defaultVoice: {
        languageCode: 'en-US',
        modelName: 'gemini-2.5-pro-preview-tts',
        name: 'Kore'
    },
    
    // Available voices
    voices: [
        { name: 'Kore', languageCode: 'en-US', modelName: 'gemini-2.5-pro-preview-tts' },
        { name: 'en-US-Wavenet-A', languageCode: 'en-US', modelName: 'neural' },
        { name: 'en-US-Wavenet-B', languageCode: 'en-US', modelName: 'neural' },
        { name: 'en-US-Wavenet-C', languageCode: 'en-US', modelName: 'neural' },
        { name: 'en-US-Wavenet-D', languageCode: 'en-US', modelName: 'neural' },
        { name: 'en-US-Wavenet-E', languageCode: 'en-US', modelName: 'neural' },
        { name: 'en-US-Wavenet-F', languageCode: 'en-US', modelName: 'neural' }
    ],
    
    // Audio settings
    audioConfig: {
        audioEncoding: 'LINEAR16',
        sampleRateHertz: 24000,
        pitch: 0,
        speakingRate: 1.0
    }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TTS_CONFIG;
}
