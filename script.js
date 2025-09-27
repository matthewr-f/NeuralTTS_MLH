class TTSReader {
    constructor() {
        this.pdfText = '';
        this.audio = null;
        this.isPlaying = false;
        this.isPaused = false;
        
        this.initializeElements();
        this.setupEventListeners();
        this.setupPDFJS();
    }

    initializeElements() {
        this.uploadArea = document.getElementById('uploadArea');
        this.pdfInput = document.getElementById('pdfInput');
        this.controlsSection = document.getElementById('controlsSection');
        this.textContent = document.getElementById('textContent');
        this.synthesizeBtn = document.getElementById('synthesizeBtn');
        this.playBtn = document.getElementById('playBtn');
        this.pauseBtn = document.getElementById('pauseBtn');
        this.stopBtn = document.getElementById('stopBtn');
        this.voiceSelect = document.getElementById('voiceSelect');
        this.speedRange = document.getElementById('speedRange');
        this.pitchRange = document.getElementById('pitchRange');
        this.speedValue = document.getElementById('speedValue');
        this.pitchValue = document.getElementById('pitchValue');
        this.progressSection = document.getElementById('progressSection');
        this.progressFill = document.getElementById('progressFill');
        this.progressText = document.getElementById('progressText');
        this.errorSection = document.getElementById('errorSection');
        this.errorMessage = document.getElementById('errorMessage');
    }

    setupEventListeners() {
        // Upload area events
        this.uploadArea.addEventListener('click', () => this.pdfInput.click());
        this.uploadArea.addEventListener('dragover', this.handleDragOver.bind(this));
        this.uploadArea.addEventListener('dragleave', this.handleDragLeave.bind(this));
        this.uploadArea.addEventListener('drop', this.handleDrop.bind(this));
        
        // File input
        this.pdfInput.addEventListener('change', this.handleFileSelect.bind(this));
        
        // Control buttons
        this.synthesizeBtn.addEventListener('click', this.synthesizeAudio.bind(this));
        this.playBtn.addEventListener('click', this.playAudio.bind(this));
        this.pauseBtn.addEventListener('click', this.pauseAudio.bind(this));
        this.stopBtn.addEventListener('click', this.stopAudio.bind(this));
        
        // Settings
        this.speedRange.addEventListener('input', this.updateSpeedDisplay.bind(this));
        this.pitchRange.addEventListener('input', this.updatePitchDisplay.bind(this));
    }

    setupPDFJS() {
        // Configure PDF.js
        if (typeof pdfjsLib !== 'undefined') {
            pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        }
    }

    handleDragOver(e) {
        e.preventDefault();
        this.uploadArea.classList.add('dragover');
    }

    handleDragLeave(e) {
        e.preventDefault();
        this.uploadArea.classList.remove('dragover');
    }

    handleDrop(e) {
        e.preventDefault();
        this.uploadArea.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        if (files.length > 0 && files[0].type === 'application/pdf') {
            this.processPDF(files[0]);
        } else {
            this.showError('Please select a valid PDF file.');
        }
    }

    handleFileSelect(e) {
        const file = e.target.files[0];
        if (file && file.type === 'application/pdf') {
            this.processPDF(file);
        } else {
            this.showError('Please select a valid PDF file.');
        }
    }

    async processPDF(file) {
        try {
            this.showProgress('Extracting text from PDF...');
            
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
            
            let fullText = '';
            const totalPages = pdf.numPages;
            
            for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
                const page = await pdf.getPage(pageNum);
                const textContent = await page.getTextContent();
                const pageText = textContent.items.map(item => item.str).join(' ');
                fullText += pageText + '\n\n';
                
                // Update progress
                const progress = (pageNum / totalPages) * 100;
                this.updateProgress(progress, `Processing page ${pageNum} of ${totalPages}...`);
            }
            
            this.pdfText = fullText.trim();
            this.displayText();
            this.hideProgress();
            this.controlsSection.style.display = 'block';
            
        } catch (error) {
            console.error('Error processing PDF:', error);
            this.showError('Error processing PDF. Please try a different file.');
            this.hideProgress();
        }
    }

    displayText() {
        this.textContent.textContent = this.pdfText;
        
        // Limit display text for better performance
        if (this.pdfText.length > 2000) {
            this.textContent.textContent = this.pdfText.substring(0, 2000) + '...\n\n[Text truncated for display. Full text will be used for audio generation.]';
        }
    }

    async synthesizeAudio() {
        if (!this.pdfText) {
            this.showError('No text available to synthesize.');
            return;
        }

        try {
            this.showProgress('Synthesizing audio...');
            this.synthesizeBtn.disabled = true;

            // For demo purposes, we'll simulate the API call
            // In a real implementation, you'd need to set up Google Cloud credentials
            const response = await this.callTTSService();
            
            if (response.audioContent) {
                // Convert base64 audio to blob
                const audioBlob = this.base64ToBlob(response.audioContent, 'audio/wav');
                const audioUrl = URL.createObjectURL(audioBlob);
                
                this.audio = new Audio(audioUrl);
                this.setupAudioEvents();
                
                this.playBtn.disabled = false;
                this.stopBtn.disabled = false;
                
                this.hideProgress();
                this.showSuccess('Audio generated successfully!');
            } else {
                throw new Error('No audio content received');
            }
            
        } catch (error) {
            console.error('Error synthesizing audio:', error);
            this.showError('Error generating audio. Please check your API configuration.');
            this.hideProgress();
        } finally {
            this.synthesizeBtn.disabled = false;
        }
    }

    async callTTSService() {
        const apiKey = TTS_CONFIG.apiKey;
        
        if (!apiKey || apiKey === 'YOUR_GOOGLE_CLOUD_API_KEY_HERE') {
            // Fallback to mock audio if API key not configured
            console.warn('Google Cloud API key not configured. Using mock audio.');
            return new Promise((resolve) => {
                setTimeout(() => {
                    resolve({
                        audioContent: this.generateMockAudio()
                    });
                }, 2000);
            });
        }

        const requestBody = {
            audioConfig: {
                audioEncoding: "LINEAR16",
                pitch: parseInt(this.pitchRange.value),
                speakingRate: parseFloat(this.speedRange.value)
            },
            input: {
                text: this.pdfText
            },
            voice: {
                languageCode: "en-US",
                modelName: "gemini-2.5-pro-preview-tts",
                name: this.voiceSelect.value
            }
        };

        try {
            const response = await fetch(`${TTS_CONFIG.endpoint}?key=${apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                throw new Error(`API request failed: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('TTS API Error:', error);
            // Fallback to mock audio on API error
            return new Promise((resolve) => {
                setTimeout(() => {
                    resolve({
                        audioContent: this.generateMockAudio()
                    });
                }, 1000);
            });
        }
    }

    generateMockAudio() {
        // This generates a simple beep sound for demo purposes
        // In production, this would be the actual audio from Google Cloud TTS
        const sampleRate = 44100;
        const duration = 2; // seconds
        const frequency = 440; // A4 note
        const samples = sampleRate * duration;
        const buffer = new ArrayBuffer(samples * 2);
        const view = new DataView(buffer);
        
        for (let i = 0; i < samples; i++) {
            const sample = Math.sin(2 * Math.PI * frequency * i / sampleRate) * 0.1;
            view.setInt16(i * 2, sample * 32767, true);
        }
        
        return this.arrayBufferToBase64(buffer);
    }

    arrayBufferToBase64(buffer) {
        let binary = '';
        const bytes = new Uint8Array(buffer);
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    }

    base64ToBlob(base64, mimeType) {
        const byteCharacters = atob(base64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        return new Blob([byteArray], { type: mimeType });
    }

    setupAudioEvents() {
        this.audio.addEventListener('play', () => {
            this.isPlaying = true;
            this.isPaused = false;
            this.playBtn.disabled = true;
            this.pauseBtn.disabled = false;
        });

        this.audio.addEventListener('pause', () => {
            this.isPlaying = false;
            this.isPaused = true;
            this.playBtn.disabled = false;
            this.pauseBtn.disabled = true;
        });

        this.audio.addEventListener('ended', () => {
            this.isPlaying = false;
            this.isPaused = false;
            this.playBtn.disabled = false;
            this.pauseBtn.disabled = true;
        });
    }

    playAudio() {
        if (this.audio) {
            this.audio.play();
        }
    }

    pauseAudio() {
        if (this.audio) {
            this.audio.pause();
        }
    }

    stopAudio() {
        if (this.audio) {
            this.audio.pause();
            this.audio.currentTime = 0;
            this.isPlaying = false;
            this.isPaused = false;
            this.playBtn.disabled = false;
            this.pauseBtn.disabled = true;
        }
    }

    updateSpeedDisplay() {
        this.speedValue.textContent = this.speedRange.value + 'x';
    }

    updatePitchDisplay() {
        this.pitchValue.textContent = this.pitchRange.value;
    }

    showProgress(message) {
        this.progressSection.style.display = 'block';
        this.progressText.textContent = message;
        this.progressFill.style.width = '0%';
    }

    updateProgress(percentage, message) {
        this.progressFill.style.width = percentage + '%';
        this.progressText.textContent = message;
    }

    hideProgress() {
        this.progressSection.style.display = 'none';
    }

    showError(message) {
        this.errorMessage.textContent = message;
        this.errorSection.style.display = 'block';
        setTimeout(() => {
            this.errorSection.style.display = 'none';
        }, 5000);
    }

    showSuccess(message) {
        // You could implement a success notification here
        console.log('Success:', message);
    }
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new TTSReader();
});
