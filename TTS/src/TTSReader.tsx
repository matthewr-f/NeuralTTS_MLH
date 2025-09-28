import { useState, useRef } from "react";
import * as pdfjsLib from "pdfjs-dist";
import "./css/homepage.css"

pdfjsLib.GlobalWorkerOptions.workerSrc =
  `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

export default function TTSReader() {
  const [pdfPages, setPdfPages] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [voice, setVoice] = useState("Kore");
  const [speed, setSpeed] = useState(1);
  const [pitch, setPitch] = useState(0);
  const [progress, setProgress] = useState({ visible: false, text: "", percent: 0 });
  const [error, setError] = useState("");
  const [audioUrls, setAudioUrls] = useState<string[]>([]);
  const [audioIndex, setAudioIndex] = useState(0);

  const audioRef = useRef<HTMLAudioElement>(null);
  const textRef = useRef(""); // full PDF text

  /** PDF upload & parse **/
  async function handleFile(file: File) {
    if (!file || file.type !== "application/pdf") return setError("Please select a valid PDF file.");
    try {
      setProgress({ visible: true, text: "Extracting text from PDF...", percent: 0 });
      const buf = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument(buf).promise;
      let text = "";
      for (let p = 1; p <= pdf.numPages; p++) {
        const page = await pdf.getPage(p);
        const c = await page.getTextContent();
        text += c.items.map(i => "str" in i ? i.str : "").join(" ") + "\n\n";
        setProgress({ visible: true, text: `Processing page ${p} of ${pdf.numPages}...`, percent: (p/pdf.numPages)*100 });
      }
      textRef.current = text.trim();
      const words = text.trim().split(/\s+/);
      const pages = [];
      for (let i = 0; i < words.length; i += 200) pages.push(words.slice(i, i + 200).join(" "));
      setPdfPages(pages);
      setProgress({ visible: false, text: "", percent: 0 });
    } catch (e: unknown) {
      console.error(e);
      setError("Error processing PDF. Please try again.");
      setProgress({ visible: false, text: "", percent: 0 });
    }
  }

  /** Drag & drop helpers **/
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    handleFile(e.dataTransfer.files[0]);
  };
  const onDrag = (e: React.DragEvent) => e.preventDefault();

  /** Text-to-Speech **/
  async function synthesizeAudio() {
    if (!textRef.current) return setError("No text to synthesize.");
    setProgress({ visible: true, text: "Sending text to TTS API...", percent: 0 });
    try {
      const res = await fetch("/synthesize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: textRef.current,
          voice,
          languageCode: "en-US",
          modelName: "gemini-2.5-pro-preview-tts",
          pitch,
          speakingRate: speed
        })
      });
      if (!res.ok) throw new Error("TTS request failed");
      const data = await res.json();
      if (!data.audioContent) throw new Error("No audio returned");
      const blob = base64ToBlob(data.audioContent, "audio/wav");
      const url = URL.createObjectURL(blob);
      setAudioUrls([url]);
      setProgress({ visible: false, text: "", percent: 100 });
    } catch (e: unknown) {
      console.error(e);
      setError(e instanceof Error ? e.message : "An error occurred");
      setProgress({ visible: false, text: "", percent: 0 });
    }
  }

  function base64ToBlob(b64: string, type: string) {
    const bin = atob(b64);
    const len = bin.length;
    const arr = new Uint8Array(len);
    for (let i = 0; i < len; i++) arr[i] = bin.charCodeAt(i);
    return new Blob([arr], { type });
  }

  /** Audio controls **/
  const play = () => { if (audioRef.current) audioRef.current.play(); };
  const pause = () => { if (audioRef.current) audioRef.current.pause(); };
  const stop = () => { if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; } };

  return (
    <div>
      {/* Upload area */}
      {!pdfPages.length && (
        <div className="upload-area" onDrop={onDrop} onDragOver={onDrag} onClick={() => document.getElementById("pdfInput")?.click()}>
          <div className="upload-content">
            <div className="upload-icon">📄</div>
            <h3>Drop your PDF here</h3>
            <p>or click to browse</p>
            <input id="pdfInput" type="file" accept=".pdf" hidden onChange={e => handleFile(e.target.files?.[0]!)}/>
          </div>
        </div>
      )}

      {/* Controls */}
      {pdfPages.length > 0 && (
        <div className="controls-section">
          <div className="text-preview">
            <h3>📖 PDF Reader</h3>
            <div className="page-navigation">
              <button disabled={currentPage === 0} onClick={() => setCurrentPage(c => c - 1)}>← Previous</button>
              <span>Page {currentPage + 1} of {pdfPages.length}</span>
              <button disabled={currentPage === pdfPages.length - 1} onClick={() => setCurrentPage(c => c + 1)}>Next →</button>
            </div>
            <div className="page-text">{pdfPages[currentPage]}</div>
          </div>

          <div className="audio-controls">
            <button onClick={synthesizeAudio}>🎵 Generate Audio</button>
            <button onClick={play} disabled={!audioUrls.length}>▶️ Play</button>
            <button onClick={pause} disabled={!audioUrls.length}>⏸️ Pause</button>
            <button onClick={stop} disabled={!audioUrls.length}>⏹️ Stop</button>

            <div className="audio-settings">
              <label>
                Voice:
                <select value={voice} onChange={e => setVoice(e.target.value)}>
                  <option value="Kore">Kore (en-US)</option>
                  <option value="en-US-Wavenet-A">Wavenet A</option>
                  <option value="en-US-Wavenet-B">Wavenet B</option>
                  <option value="en-US-Wavenet-C">Wavenet C</option>
                </select>
              </label>
              <label>
                Speed: {speed.toFixed(1)}x
                <input type="range" min="0.5" max="2" step="0.1" value={speed} onChange={e => setSpeed(parseFloat(e.target.value))}/>
              </label>
              <label>
                Pitch: {pitch}
                <input type="range" min="-20" max="20" step="1" value={pitch} onChange={e => setPitch(parseInt(e.target.value))}/>
              </label>
            </div>
          </div>

          {audioUrls.length > 0 && <audio ref={audioRef} src={audioUrls[audioIndex]} />}

          {progress.visible && (
            <div className="progress-section">
              <div className="progress-bar"><div className="progress-fill" style={{width:`${progress.percent}%`}}></div></div>
              <p>{progress.text}</p>
            </div>
          )}

          {error && <div className="error-section"><div className="error-message">{error}</div></div>}
        </div>
      )}
    </div>
  );
}
