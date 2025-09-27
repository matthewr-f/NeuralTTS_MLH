class TTSReader {
    constructor() {
        this.pdfText = '';
        this.audio = null;
        this.isPlaying = false;
        this.isPaused = false;
        
        // Text chunking and queue system
        this.textChunks = [];
        this.currentChunkIndex = 0;
        this.audioChunks = [];
        this.isProcessingChunks = false;
        this.maxChunkSize = 5000; // Maximum characters per chunk
        
        // Book-like reading experience
        this.pdfPages = [];
        this.currentPage = 0;
        this.currentReadingPosition = 0;
        this.isReading = false;
        
        this.initializeElements();
        this.setupEventListeners();
        this.setupPDFJS();
        this.populateVoiceList();
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
        
        // Book-like reading elements (will be created dynamically)
        this.bookContainer = null;
        this.pageContainer = null;
        this.pageNavigation = null;
        this.currentPageDisplay = null;
    }

    populateVoiceList() {
        // Clear existing options
        this.voiceSelect.innerHTML = '';
        
        // Add voices from TTS_CONFIG
        if (typeof TTS_CONFIG !== 'undefined' && TTS_CONFIG.voices) {
            TTS_CONFIG.voices.forEach(voice => {
                const option = document.createElement('option');
                option.value = voice.name;
                option.textContent = `${voice.name} (${voice.languageCode})`;
                
                // Set default voice
                if (voice.name === TTS_CONFIG.defaultVoice?.name) {
                    option.selected = true;
                }
                
                this.voiceSelect.appendChild(option);
            });
        } else {
            // Fallback if TTS_CONFIG is not available
            const defaultVoices = [
                { name: 'Kore', languageCode: 'en-US' },
                { name: 'en-US-Wavenet-A', languageCode: 'en-US' },
                { name: 'en-US-Wavenet-B', languageCode: 'en-US' },
                { name: 'en-US-Wavenet-C', languageCode: 'en-US' },
                { name: 'en-US-Wavenet-D', languageCode: 'en-US' },
                { name: 'en-US-Wavenet-E', languageCode: 'en-US' },
                { name: 'en-US-Wavenet-F', languageCode: 'en-US' }
            ];
            
            defaultVoices.forEach(voice => {
                const option = document.createElement('option');
                option.value = voice.name;
                option.textContent = `${voice.name} (${voice.languageCode})`;
                this.voiceSelect.appendChild(option);
            });
        }
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
            this.createBookPages();
            this.displayText();
            this.hideProgress();
            this.controlsSection.style.display = 'block';
            
            // Clean up any previous audio chunks when processing new PDF
            this.cleanupAudioChunks();
            
        } catch (error) {
            console.error('Error processing PDF:', error);
            this.showError('Error processing PDF. Please try a different file.');
            this.hideProgress();
        }
    }

    displayText() {
        // Show book-like interface instead of plain text
        this.showBookInterface();
    }

    createBookPages() {
        // Split text into pages (approximately 1000 characters per page)
        const wordsPerPage = 200;
        const words = this.pdfText.split(/\s+/);
        this.pdfPages = [];
        
        for (let i = 0; i < words.length; i += wordsPerPage) {
            const pageWords = words.slice(i, i + wordsPerPage);
            this.pdfPages.push(pageWords.join(' '));
        }
        
        this.currentPage = 0;
    }

    showBookInterface() {
        // Create book-like container
        this.bookContainer = document.createElement('div');
        this.bookContainer.className = 'book-container';
        this.bookContainer.innerHTML = `
            <div class="book-header">
                <h3>📖 PDF Reader</h3>
                <div class="page-info">
                    <span id="currentPageDisplay">Page 1 of ${this.pdfPages.length}</span>
                </div>
            </div>
            <div class="book-content">
                <div class="page-navigation">
                    <button id="prevPageBtn" class="btn btn-secondary" disabled>← Previous</button>
                    <button id="nextPageBtn" class="btn btn-secondary">Next →</button>
                </div>
                <div class="page-content" id="pageContent">
                    <div class="text-highlight" id="textHighlight"></div>
                    <div class="page-text" id="pageText"></div>
                </div>
            </div>
        `;
        
        // Replace the text preview with book interface
        const textPreview = document.querySelector('.text-preview');
        textPreview.innerHTML = '';
        textPreview.appendChild(this.bookContainer);
        
        // Initialize book elements
        this.pageContainer = document.getElementById('pageContent');
        this.pageText = document.getElementById('pageText');
        this.textHighlight = document.getElementById('textHighlight');
        this.currentPageDisplay = document.getElementById('currentPageDisplay');
        this.prevPageBtn = document.getElementById('prevPageBtn');
        this.nextPageBtn = document.getElementById('nextPageBtn');
        
        // Setup page navigation
        this.setupPageNavigation();
        
        // Display first page
        this.displayCurrentPage();
    }

    setupPageNavigation() {
        this.prevPageBtn.addEventListener('click', () => {
            if (this.currentPage > 0) {
                this.currentPage--;
                this.displayCurrentPage();
            }
        });
        
        this.nextPageBtn.addEventListener('click', () => {
            if (this.currentPage < this.pdfPages.length - 1) {
                this.currentPage++;
                this.displayCurrentPage();
            }
        });
    }

    displayCurrentPage() {
        if (!this.pageText || this.pdfPages.length === 0) return;
        
        // Update page content
        this.pageText.textContent = this.pdfPages[this.currentPage];
        
        // Update page info
        this.currentPageDisplay.textContent = `Page ${this.currentPage + 1} of ${this.pdfPages.length}`;
        
        // Update navigation buttons
        this.prevPageBtn.disabled = this.currentPage === 0;
        this.nextPageBtn.disabled = this.currentPage === this.pdfPages.length - 1;
        
        // Reset reading position
        this.currentReadingPosition = 0;
        this.updateTextHighlight();
    }

    updateTextHighlight() {
        if (!this.textHighlight || !this.pageText) return;
        
        // Clear previous highlights
        this.textHighlight.innerHTML = '';
        
        if (this.isReading && this.currentReadingPosition > 0) {
            // Create highlighted text for current reading position
            const text = this.pageText.textContent;
            const words = text.split(/(\s+)/);
            let currentPos = 0;
            let highlightedWords = [];
            
            for (let i = 0; i < words.length; i++) {
                const word = words[i];
                if (currentPos < this.currentReadingPosition) {
                    highlightedWords.push(`<span class="highlighted">${word}</span>`);
                } else {
                    highlightedWords.push(word);
                }
                currentPos += word.length;
            }
            
            this.textHighlight.innerHTML = highlightedWords.join('');
        }
    }

    chunkText(text) {
        /**
         * Split text into chunks that are under the maximum character limit
         * Tries to split at paragraph boundaries first, then sentences, then words
         */
        const chunks = [];
        const paragraphs = text.split(/\n\s*\n/); // Split by double newlines (paragraphs)
        
        let currentChunk = '';
        
        for (let paragraph of paragraphs) {
            // If adding this paragraph would exceed the limit
            if (currentChunk.length + paragraph.length > this.maxChunkSize) {
                // If current chunk has content, save it
                if (currentChunk.trim()) {
                    chunks.push(currentChunk.trim());
                    currentChunk = '';
                }
                
                // If the paragraph itself is too long, split it by sentences
                if (paragraph.length > this.maxChunkSize) {
                    const sentences = paragraph.split(/(?<=[.!?])\s+/);
                    let sentenceChunk = '';
                    
                    for (let sentence of sentences) {
                        if (sentenceChunk.length + sentence.length > this.maxChunkSize) {
                            if (sentenceChunk.trim()) {
                                chunks.push(sentenceChunk.trim());
                                sentenceChunk = '';
                            }
                            
                            // If sentence is still too long, split by words
                            if (sentence.length > this.maxChunkSize) {
                                const words = sentence.split(/\s+/);
                                let wordChunk = '';
                                
                                for (let word of words) {
                                    if (wordChunk.length + word.length + 1 > this.maxChunkSize) {
                                        if (wordChunk.trim()) {
                                            chunks.push(wordChunk.trim());
                                            wordChunk = '';
                                        }
                                    }
                                    wordChunk += (wordChunk ? ' ' : '') + word;
                                }
                                
                                if (wordChunk.trim()) {
                                    chunks.push(wordChunk.trim());
                                }
                            } else {
                                sentenceChunk = sentence;
                            }
                        } else {
                            sentenceChunk += (sentenceChunk ? ' ' : '') + sentence;
                        }
                    }
                    
                    if (sentenceChunk.trim()) {
                        currentChunk = sentenceChunk;
                    }
                } else {
                    currentChunk = paragraph;
                }
            } else {
                currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
            }
        }
        
        // Add the last chunk if it has content
        if (currentChunk.trim()) {
            chunks.push(currentChunk.trim());
        }
        
        return chunks;
    }

    async synthesizeAudio() {
        if (!this.pdfText) {
            this.showError('No text available to synthesize.');
            return;
        }

        if (this.isProcessingChunks) {
            this.showError('Audio generation already in progress. Please wait...');
            return;
        }

        try {
            // Clean up any previous audio chunks
            this.cleanupAudioChunks();
            
            this.isProcessingChunks = true;
            this.synthesizeBtn.disabled = true;

            // Chunk the text
            this.textChunks = this.chunkText(this.pdfText);
            
            if (this.textChunks.length === 0) {
                throw new Error('No text chunks created');
            }

            this.showProgress(`Processing ${this.textChunks.length} text chunks...`);
            this.updateProgress(0, `Starting chunk 1 of ${this.textChunks.length}...`);

            // Start processing the first chunk
            await this.processNextChunk();
            
        } catch (error) {
            console.error('Error synthesizing audio:', error);
            this.showError('Error generating audio. Please check your API configuration.');
            this.hideProgress();
            this.isProcessingChunks = false;
            this.synthesizeBtn.disabled = false;
        }
    }

    async processNextChunk() {
        if (this.currentChunkIndex >= this.textChunks.length) {
            // All chunks processed, combine audio
            await this.combineAudioChunks();
            return;
        }

        const currentChunk = this.textChunks[this.currentChunkIndex];
        const progress = ((this.currentChunkIndex + 1) / this.textChunks.length) * 100;
        
        this.updateProgress(progress, `Processing chunk ${this.currentChunkIndex + 1} of ${this.textChunks.length}...`);

        try {
            const response = await this.callTTSService(currentChunk);
            
            if (response.audioContent) {
                // Convert base64 audio to blob and store
                const audioBlob = this.base64ToBlob(response.audioContent, 'audio/wav');
                const audioUrl = URL.createObjectURL(audioBlob);
                this.audioChunks.push(audioUrl);
                
                this.currentChunkIndex++;
                
                // Process next chunk after a short delay to prevent overwhelming the API
                setTimeout(() => {
                    this.processNextChunk();
                }, 500);
                
            } else {
                throw new Error('No audio content received for chunk');
            }
            
        } catch (error) {
            console.error(`Error processing chunk ${this.currentChunkIndex + 1}:`, error);
            
            // If it's a critical error (API key, quota), stop processing
            if (error.message.includes('API key') || error.message.includes('quota') || error.message.includes('invalid')) {
                this.showError(`Critical error: ${error.message}. Stopping audio generation.`);
                this.hideProgress();
                this.isProcessingChunks = false;
                this.synthesizeBtn.disabled = false;
                return;
            }
            
            // For other errors, continue with remaining chunks
            this.showError(`Error processing chunk ${this.currentChunkIndex + 1}: ${error.message}. Continuing with remaining chunks...`);
            this.currentChunkIndex++;
            setTimeout(() => {
                this.processNextChunk();
            }, 1000);
        }
    }

    async combineAudioChunks() {
        try {
            this.updateProgress(100, 'Combining audio chunks...');
            
            if (this.audioChunks.length === 0) {
                throw new Error('No audio chunks to combine');
            }

            if (this.audioChunks.length === 1) {
                // Single chunk, no need to combine
                this.audio = new Audio(this.audioChunks[0]);
            } else {
                // Multiple chunks - create a playlist system
                this.audio = new Audio(this.audioChunks[0]);
                this.setupChunkedAudioEvents();
            }
            
            this.setupAudioEvents();
            this.playBtn.disabled = false;
            this.stopBtn.disabled = false;
            
            this.hideProgress();
            this.showSuccess(`Audio generated successfully! (${this.audioChunks.length} chunks)`);
            
        } catch (error) {
            console.error('Error combining audio chunks:', error);
            this.showError('Error combining audio chunks. Please try again.');
        } finally {
            this.isProcessingChunks = false;
            this.synthesizeBtn.disabled = false;
        }
    }

    setupChunkedAudioEvents() {
        let currentChunkIndex = 0;
        
        this.audio.addEventListener('ended', () => {
            currentChunkIndex++;
            
            if (currentChunkIndex < this.audioChunks.length) {
                // Play next chunk
                this.audio.src = this.audioChunks[currentChunkIndex];
                this.audio.play();
            } else {
                // All chunks played, reset
                this.isPlaying = false;
                this.isPaused = false;
                this.playBtn.disabled = false;
                this.pauseBtn.disabled = true;
            }
        });
    }

    async callTTSService(text = null) {
        const textToSynthesize = text || this.pdfText;
        const requestBody = {
            text: textToSynthesize,
            voice: this.voiceSelect.value,
            languageCode: "en-US",
            modelName: "gemini-2.5-pro-preview-tts",
            pitch: parseInt(this.pitchRange.value),
            speakingRate: parseFloat(this.speedRange.value)
        };

        try {
            const response = await fetch('/synthesize', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorData.error || 'Unknown error'}`);
            }

            const data = await response.json();
            
            // If the server indicates mock audio should be used, throw a descriptive error
            if (data.mockAudio || !data.audioContent) {
                if (data.error) {
                    throw new Error(data.error);
                } else {
                    throw new Error('Could not generate audio. The API key may be invalid or you may have exceeded your quota.');
                }
            }
            
            return data;
        } catch (error) {
            console.error('TTS API Error:', error);
            // Re-throw the error with better context
            if (error.message.includes('API request failed')) {
                throw new Error(`Could not generate audio. ${error.message}`);
            } else if (error.message.includes('Network error')) {
                throw new Error('Could not generate audio. Please check your internet connection and try again.');
            } else {
                throw new Error(`Could not generate audio. ${error.message}`);
            }
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

    cleanupAudioChunks() {
        // Clean up blob URLs to prevent memory leaks
        this.audioChunks.forEach(url => {
            if (url.startsWith('blob:')) {
                URL.revokeObjectURL(url);
            }
        });
        this.audioChunks = [];
        this.textChunks = [];
        this.currentChunkIndex = 0;
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
