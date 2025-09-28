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
        this.allWordTimings = [];
        
        // Book-like reading experience
        this.pdfPages = [];
        this.currentPage = 0;
        this.currentReadingPosition = 0;
        this.isReading = false;
        
        // PDF rendering
        this.pdfDocument = null;
        this.totalPages = 0;
        this.currentPDFPage = 1;
        this.pdfCanvas = null;
        this.pdfContext = null;
        
        // Audio highlighting
        this.audioStartTimes = [];
        this.currentHighlightPosition = 0;
        this.wordTimings = [];
        this.currentWordIndex = 0;
        
        // OCR functionality
        this.useOCR = false;
        this.ocrLanguage = 'eng';
        this.ocrWorker = null;
        this.ocrText = '';
        this.isProcessingOCR = false;
        
        this.initializeElements();
        this.setupEventListeners();
        this.setupPDFJS();
        this.populateVoiceList();
        
        // Expose debug function globally
        window.debugWordPositioning = () => this.debugWordPositioning();
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
            this.showProgress('Loading PDF...');
            
            const arrayBuffer = await file.arrayBuffer();
            this.pdfDocument = await pdfjsLib.getDocument(arrayBuffer).promise;
            this.totalPages = this.pdfDocument.numPages;
            
            // Extract text with positioning data for each page
            this.pdfPages = [];
            this.allWords = [];
            let fullText = '';
            
            for (let pageNum = 1; pageNum <= this.totalPages; pageNum++) {
                const page = await this.pdfDocument.getPage(pageNum);
                const viewport = page.getViewport({ scale: 1.5 });
                const textContent = await page.getTextContent();
                
                // Extract text with positioning
                const pageData = this.extractTextWithPositioning(textContent, viewport, pageNum);
                this.pdfPages.push(pageData);
                this.allWords.push(...pageData.words);
                fullText += pageData.text + '\n\n';
                
                // Update progress
                const progress = (pageNum / this.totalPages) * 100;
                this.updateProgress(progress, `Processing page ${pageNum} of ${this.totalPages}...`);
            }
            
            this.pdfText = fullText.trim();
            this.currentPage = 0;
            this.displayPDFPages();
            this.hideProgress();
            this.controlsSection.style.display = 'block';
            
            // Clean up any previous audio chunks and OCR worker when processing new PDF
            this.cleanupAudioChunks();
            await this.cleanupOCRWorker();
            
        } catch (error) {
            console.error('Error processing PDF:', error);
            this.showError('Error processing PDF. Please try a different file.');
            this.hideProgress();
        }
    }

    extractTextWithPositioning(textContent, viewport, pageNum) {
        const words = [];
        let pageText = '';
        
        textContent.items.forEach((item, index) => {
            if (item.str.trim()) {
                // Use the transform matrix for more accurate positioning
                const transform = item.transform;
                const x = transform[4];
                const y = viewport.height - transform[5]; // Flip Y coordinate
                
                // Calculate width and height more accurately
                const width = item.width;
                const height = item.height;
                
                const word = {
                    text: item.str,
                    x: x,
                    y: y,
                    width: width,
                    height: height,
                    pageNum: pageNum,
                    wordIndex: words.length,
                    globalIndex: this.allWords.length + words.length,
                    // Store original transform for debugging
                    transform: transform
                };
                words.push(word);
                pageText += item.str + ' ';
            }
        });
        
        return {
            text: pageText.trim(),
            words: words,
            pageNum: pageNum
        };
    }

    displayPDFPages() {
        // Show PDF pages instead of text
        this.showPDFViewer();
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

    showPDFViewer() {
        // Create Speechify-like PDF viewer container
        this.bookContainer = document.createElement('div');
        this.bookContainer.className = 'speechify-container';
        this.bookContainer.innerHTML = `
            <div class="reader-header">
                <div class="reader-controls">
                    <button id="prevPageBtn" class="btn btn-nav" disabled>←</button>
                    <span id="currentPageDisplay">Page 1 of ${this.totalPages}</span>
                    <button id="nextPageBtn" class="btn btn-nav">→</button>
                </div>
                <div class="reading-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" id="readingProgressFill"></div>
                    </div>
                </div>
            </div>
            <div class="pdf-reader" id="pdfReader">
                <div class="page-container" id="pageContainer">
                    <canvas id="pdfCanvas" class="pdf-canvas"></canvas>
                    <div class="word-overlay" id="wordOverlay"></div>
                </div>
            </div>
            <div class="ocr-controls">
                <div class="ocr-toggle">
                    <label for="ocrCheckbox">
                        <input type="checkbox" id="ocrCheckbox"> Enable OCR for scanned PDFs
                    </label>
                </div>
                <div class="ocr-language" id="ocrLanguageGroup" style="display: none;">
                    <label for="ocrLanguageSelect">OCR Language:</label>
                    <select id="ocrLanguageSelect">
                        <option value="eng">English</option>
                        <option value="spa">Spanish</option>
                        <option value="fra">French</option>
                        <option value="deu">German</option>
                        <option value="ita">Italian</option>
                        <option value="por">Portuguese</option>
                        <option value="rus">Russian</option>
                        <option value="chi_sim">Chinese (Simplified)</option>
                        <option value="chi_tra">Chinese (Traditional)</option>
                        <option value="jpn">Japanese</option>
                        <option value="kor">Korean</option>
                    </select>
                </div>
                <button id="processOCRBtn" class="btn btn-info" style="display: none;">🔍 Process with OCR</button>
            </div>
        `;
        
        // Replace the text preview with PDF viewer
        const textPreview = document.querySelector('.text-preview');
        textPreview.innerHTML = '';
        textPreview.appendChild(this.bookContainer);
        
        // Initialize elements
        this.pdfCanvas = document.getElementById('pdfCanvas');
        this.pdfContext = this.pdfCanvas.getContext('2d');
        this.wordOverlay = document.getElementById('wordOverlay');
        this.currentPageDisplay = document.getElementById('currentPageDisplay');
        this.prevPageBtn = document.getElementById('prevPageBtn');
        this.nextPageBtn = document.getElementById('nextPageBtn');
        this.readingProgressFill = document.getElementById('readingProgressFill');
        
        // Initialize OCR controls
        this.ocrCheckbox = document.getElementById('ocrCheckbox');
        this.ocrLanguageGroup = document.getElementById('ocrLanguageGroup');
        this.ocrLanguageSelect = document.getElementById('ocrLanguageSelect');
        this.processOCRBtn = document.getElementById('processOCRBtn');
        
        // Setup controls
        this.setupPageNavigation();
        this.setupOCRControls();
        
        // Display first page
        this.renderCurrentPDFPage();
    }

    setupPageNavigation() {
        this.prevPageBtn.addEventListener('click', () => {
            if (this.currentPage > 0) {
                this.currentPage--;
                this.renderCurrentPDFPage();
            }
        });
        
        this.nextPageBtn.addEventListener('click', () => {
            if (this.currentPage < this.totalPages - 1) {
                this.currentPage++;
                this.renderCurrentPDFPage();
            }
        });
    }

    setupOCRControls() {
        // OCR checkbox toggle
        this.ocrCheckbox.addEventListener('change', (e) => {
            this.useOCR = e.target.checked;
            this.ocrLanguageGroup.style.display = this.useOCR ? 'block' : 'none';
            this.processOCRBtn.style.display = this.useOCR ? 'inline-block' : 'none';
        });

        // OCR language selection
        this.ocrLanguageSelect.addEventListener('change', (e) => {
            this.ocrLanguage = e.target.value;
        });

        // Process OCR button
        this.processOCRBtn.addEventListener('click', () => {
            this.processPDFWithOCR();
        });
    }

    async processPDFWithOCR() {
        if (this.isProcessingOCR) {
            this.showError('OCR processing already in progress. Please wait...');
            return;
        }

        try {
            this.isProcessingOCR = true;
            this.processOCRBtn.disabled = true;
            this.showProgress('Processing PDF with OCR...');
            
            // Initialize Tesseract worker
            if (!this.ocrWorker) {
                this.updateProgress(10, 'Initializing OCR engine...');
                this.ocrWorker = await Tesseract.createWorker(this.ocrLanguage);
                await this.ocrWorker.load();
                await this.ocrWorker.loadLanguage(this.ocrLanguage);
                await this.ocrWorker.initialize(this.ocrLanguage);
            }

            let fullOCRText = '';
            const totalPages = this.totalPages;

            for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
                this.updateProgress((pageNum / totalPages) * 80 + 10, `Processing page ${pageNum} of ${totalPages} with OCR...`);
                
                // Render page to canvas
                const page = await this.pdfDocument.getPage(pageNum);
                const viewport = page.getViewport({ scale: 2.0 }); // Higher scale for better OCR
                
                // Create temporary canvas for OCR
                const tempCanvas = document.createElement('canvas');
                const tempContext = tempCanvas.getContext('2d');
                tempCanvas.width = viewport.width;
                tempCanvas.height = viewport.height;
                
                const renderContext = {
                    canvasContext: tempContext,
                    viewport: viewport
                };
                
                await page.render(renderContext).promise;
                
                // Convert canvas to image data for OCR
                const imageData = tempContext.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
                
                // Process with OCR
                const { data: { text } } = await this.ocrWorker.recognize(imageData);
                fullOCRText += text + '\n\n';
            }

            // Update the PDF text with OCR results
            this.pdfText = fullOCRText.trim();
            this.ocrText = fullOCRText.trim();
            
            // Recreate text chunks with OCR text
            this.createBookPages();
            
            this.hideProgress();
            this.showSuccess('OCR processing completed successfully!');
            
        } catch (error) {
            console.error('OCR processing error:', error);
            this.showError('Error processing PDF with OCR. Please try again.');
            this.hideProgress();
        } finally {
            this.isProcessingOCR = false;
            this.processOCRBtn.disabled = false;
        }
    }

    async renderCurrentPDFPage() {
        if (!this.pdfDocument || !this.pdfCanvas || !this.pdfPages[this.currentPage]) return;
        
        try {
            const page = await this.pdfDocument.getPage(this.currentPage + 1);
            const viewport = page.getViewport({ scale: 1.5 });
            
            // Set canvas dimensions
            this.pdfCanvas.width = viewport.width;
            this.pdfCanvas.height = viewport.height;
            
            // Render PDF page
            const renderContext = {
                canvasContext: this.pdfContext,
                viewport: viewport
            };
            
            await page.render(renderContext).promise;
            
            // Update page info
            this.currentPageDisplay.textContent = `Page ${this.currentPage + 1} of ${this.totalPages}`;
            
            // Update navigation buttons
            this.prevPageBtn.disabled = this.currentPage === 0;
            this.nextPageBtn.disabled = this.currentPage === this.totalPages - 1;
            
            // Create word overlay
            await this.createWordOverlay();
            
        } catch (error) {
            console.error('Error rendering PDF page:', error);
            this.showError('Error rendering PDF page. Please try again.');
        }
    }

    async createWordOverlay() {
        if (!this.wordOverlay || !this.pdfPages[this.currentPage]) return;
        
        // Clear existing words
        this.wordOverlay.innerHTML = '';
        
        const currentPageData = this.pdfPages[this.currentPage];
        const canvas = this.pdfCanvas;
        
        // Get the viewport to ensure our coordinate system matches the canvas
        const page = await this.pdfDocument.getPage(this.currentPage + 1);
        const viewport = page.getViewport({ scale: 1.5 });
        
        // Match the overlay div's size to the canvas's rendered size perfectly
        this.wordOverlay.style.width = `${canvas.width}px`;
        this.wordOverlay.style.height = `${canvas.height}px`;

        currentPageData.words.forEach(word => {
            const wordElement = document.createElement('span');
            wordElement.className = 'word';
            
            // CRITICAL: Do NOT add the text. Add a non-breaking space 
            // to ensure the span has a physical dimension to apply a background to.
            wordElement.innerHTML = '&nbsp;'; 
            
            wordElement.dataset.wordIndex = word.globalIndex;

            // Use the stored coordinates directly - they should already be correct
            const x = word.x;
            const y = word.y;
            const width = word.width;
            const height = word.height;

            // Apply positioning with sub-pixel precision
            wordElement.style.left = `${x}px`;
            wordElement.style.top = `${y}px`;
            wordElement.style.width = `${width}px`;
            wordElement.style.height = `${height}px`;
            
            // Add click handler for word selection
            wordElement.addEventListener('click', () => {
                this.selectWord(word.globalIndex);
            });
            
            this.wordOverlay.appendChild(wordElement);
        });
    }

    selectWord(wordIndex) {
        // Clear previous selection
        document.querySelectorAll('.word.selected').forEach(word => {
            word.classList.remove('selected');
        });
        
        // Select the clicked word
        const wordElement = document.querySelector(`[data-word-index="${wordIndex}"]`);
        if (wordElement) {
            wordElement.classList.add('selected');
            
            // Only scroll if the word is not visible (optional user control)
            const rect = wordElement.getBoundingClientRect();
            const container = document.querySelector('.pdf-reader');
            const containerRect = container.getBoundingClientRect();
            
            // Only scroll if the word is completely outside the visible area
            if (rect.bottom < containerRect.top || rect.top > containerRect.bottom) {
                wordElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            
            // If audio is playing, jump to this word's timing
            if (this.audio && this.allWordTimings.length > 0) {
                const timing = this.allWordTimings[wordIndex];
                if (timing) {
                    this.audio.currentTime = timing.timeSeconds;
                }
            }
        }
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
        if (!this.textHighlight) return;
        
        // Clear previous highlights
        this.textHighlight.innerHTML = '';
        
        if (this.isReading && this.currentHighlightPosition > 0) {
            // Create highlighted text overlay for current reading position
            const text = this.pdfText;
            const words = text.split(/(\s+)/);
            let currentPos = 0;
            let highlightedWords = [];
            
            for (let i = 0; i < words.length; i++) {
                const word = words[i];
                if (currentPos < this.currentHighlightPosition) {
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
            if (this.audioChunks.length === 0) {
                this.showError('No audio could be generated. Please check your API key and try again.');
                this.hideProgress();
                this.isProcessingChunks = false;
                this.synthesizeBtn.disabled = false;
                return;
            }
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
                
                // Store timing data if available
                if (response.timepoints && response.timepoints.length > 0) {
                    this.allWordTimings.push(...response.timepoints);
                }
                
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
            
            // If it's a critical error (API key, quota, permissions), stop processing
            if (error.message.includes('API key') || 
                error.message.includes('quota') || 
                error.message.includes('invalid') ||
                error.message.includes('PERMISSION_DENIED') ||
                error.message.includes('SERVICE_DISABLED') ||
                error.message.includes('Vertex AI API') ||
                error.message.includes('403')) {
                
                let userFriendlyMessage = 'Critical error: ';
                if (error.message.includes('Vertex AI API')) {
                    userFriendlyMessage += 'The Vertex AI API is not enabled. Please enable it in your Google Cloud Console or use a different voice model.';
                } else if (error.message.includes('API key')) {
                    userFriendlyMessage += 'Invalid API key. Please check your Google Cloud API key.';
                } else if (error.message.includes('quota')) {
                    userFriendlyMessage += 'API quota exceeded. Please try again later.';
                } else {
                    userFriendlyMessage += error.message;
                }
                
                this.showError(userFriendlyMessage);
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

            // The audio element will now be managed by our queue system
            this.audio = new Audio();
            this.setupAudioEvents(); // Standard events like play/pause
            
            this.currentChunkIndex = 0; // Reset index for playback
            this.playNextChunk(); // Start playing the first chunk

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
    
    playNextChunk() {
        if (this.currentChunkIndex < this.audioChunks.length) {
            // Set the source to the current chunk and play
            this.audio.src = this.audioChunks[this.currentChunkIndex];
            this.audio.play();

            // When this chunk ends, automatically play the next one
            this.audio.onended = () => {
                this.currentChunkIndex++;
                this.playNextChunk();
            };
        } else {
            // All chunks have finished playing
            console.log("Finished playback of all chunks.");
            this.isPlaying = false;
            this.isPaused = false;
            this.playBtn.disabled = false;
            this.pauseBtn.disabled = true;
            this.audio.onended = null; // Clean up listener
        }
    }

    async callTTSService(text = null) {
        const textToSynthesize = text || this.pdfText;
        const requestBody = {
            text: textToSynthesize,
            voice: this.voiceSelect.value,
            languageCode: "en-US",
            modelName: "standard", // Use standard TTS model instead of Gemini
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
            this.isReading = true;
            this.playBtn.disabled = true;
            this.pauseBtn.disabled = false;
            this.startHighlighting();
        });

        this.audio.addEventListener('pause', () => {
            this.isPlaying = false;
            this.isPaused = true;
            this.isReading = false;
            this.playBtn.disabled = false;
            this.pauseBtn.disabled = true;
            this.stopHighlighting();
        });

        this.audio.addEventListener('ended', () => {
            this.isPlaying = false;
            this.isPaused = false;
            this.isReading = false;
            this.playBtn.disabled = false;
            this.pauseBtn.disabled = true;
            this.stopHighlighting();
        });

        // Add time update listener for highlighting
        this.audio.addEventListener('timeupdate', () => {
            if (this.isReading) {
                this.updateHighlighting();
            }
        });
    }

    startHighlighting() {
        // Calculate approximate reading speed (words per second)
        const wordsPerSecond = 2.5; // Adjust based on speaking rate
        this.highlightInterval = setInterval(() => {
            if (this.isReading && this.audio) {
                this.updateHighlighting();
            }
        }, 200); // Update every 200ms for smooth highlighting
    }

    stopHighlighting() {
        if (this.highlightInterval) {
            clearInterval(this.highlightInterval);
            this.highlightInterval = null;
        }
        this.currentHighlightPosition = 0;
        this.updateTextHighlight();
    }

    updateHighlighting() {
        if (!this.audio || !this.isReading) return;
        
        const currentTime = this.audio.currentTime;
        
        // Use precise timing data if available
        if (this.allWordTimings.length > 0) {
            this.highlightWordWithTiming(currentTime);
        } else {
            // Fallback to approximate highlighting
            const totalTime = this.audio.duration;
            if (totalTime > 0) {
                const progress = currentTime / totalTime;
                const wordIndex = Math.floor(progress * this.allWords.length);
                this.highlightWord(wordIndex);
                this.updateReadingProgress(progress);
            }
        }
    }

    highlightWordWithTiming(currentTime) {
        // Find the current word based on timing data
        let currentWordIndex = 0;
        
        for (let i = 0; i < this.allWordTimings.length; i++) {
            const timing = this.allWordTimings[i];
            if (timing.timeSeconds <= currentTime) {
                currentWordIndex = i;
            } else {
                break;
            }
        }
        
        this.highlightWord(currentWordIndex);
        
        // Update progress based on timing
        const totalTime = this.audio.duration;
        if (totalTime > 0) {
            const progress = currentTime / totalTime;
            this.updateReadingProgress(progress);
        }
    }

    highlightWord(wordIndex) {
        // Clear previous highlights
        document.querySelectorAll('.word.highlighted').forEach(word => {
            word.classList.remove('highlighted');
        });
        
        // Highlight current word
        const wordElement = document.querySelector(`[data-word-index="${wordIndex}"]`);
        if (wordElement) {
            wordElement.classList.add('highlighted');
            
            // Optional: Only scroll if the word is not visible (but don't force it)
            const rect = wordElement.getBoundingClientRect();
            const container = document.querySelector('.pdf-reader');
            const containerRect = container.getBoundingClientRect();
            
            // Only scroll if the word is completely outside the visible area
            if (rect.bottom < containerRect.top || rect.top > containerRect.bottom) {
                wordElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    }

    updateReadingProgress(progress) {
        if (this.readingProgressFill) {
            this.readingProgressFill.style.width = `${progress * 100}%`;
        }
    }

    // Debug function to visualize word positioning
    debugWordPositioning() {
        if (!this.pdfPages || this.pdfPages.length === 0) {
            console.log('No PDF pages loaded');
            return;
        }

        const currentPageData = this.pdfPages[this.currentPage];
        console.log(`Debugging page ${this.currentPage + 1}:`);
        console.log(`Canvas size: ${this.pdfCanvas.width}x${this.pdfCanvas.height}`);
        console.log(`Overlay size: ${this.wordOverlay.style.width}x${this.wordOverlay.style.height}`);
        
        // Show first 5 words for debugging
        currentPageData.words.slice(0, 5).forEach((word, index) => {
            console.log(`Word ${index}: "${word.text}" at (${word.x}, ${word.y}) size ${word.width}x${word.height}`);
        });

        // Add visual debug overlay
        this.addDebugOverlay();
    }

    addDebugOverlay() {
        // Remove existing debug overlay
        const existingDebug = document.querySelector('.debug-overlay');
        if (existingDebug) {
            existingDebug.remove();
        }

        // Create debug overlay
        const debugOverlay = document.createElement('div');
        debugOverlay.className = 'debug-overlay';
        debugOverlay.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 10;
        `;

        const currentPageData = this.pdfPages[this.currentPage];
        currentPageData.words.slice(0, 10).forEach((word, index) => {
            const debugBox = document.createElement('div');
            debugBox.style.cssText = `
                position: absolute;
                left: ${word.x}px;
                top: ${word.y}px;
                width: ${word.width}px;
                height: ${word.height}px;
                border: 1px solid red;
                background: rgba(255, 0, 0, 0.1);
                font-size: 10px;
                color: red;
                display: flex;
                align-items: center;
                justify-content: center;
            `;
            debugBox.textContent = word.text;
            debugOverlay.appendChild(debugBox);
        });

        this.wordOverlay.appendChild(debugOverlay);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (debugOverlay.parentNode) {
                debugOverlay.remove();
            }
        }, 5000);
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

    async cleanupOCRWorker() {
        if (this.ocrWorker) {
            try {
                await this.ocrWorker.terminate();
                this.ocrWorker = null;
            } catch (error) {
                console.warn('Error terminating OCR worker:', error);
            }
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
