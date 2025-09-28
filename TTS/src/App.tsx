import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar.tsx';
import TTSReader from './TTSReader.tsx';
import './css/navbar.css';

export default function App() {
  const fullText = "What are we reading tonight?";
  const [displayed, setDisplayed] = useState("");

  useEffect(() => {
    let i = 0;
    const timer = setInterval(() => {
      setDisplayed(fullText.slice(0, i + 1));
      i++;
      if (i === fullText.length) clearInterval(timer);
    }, 100);
    return () => clearInterval(timer);
  }, []);
  

  return (
    <Router>
      <Navbar />
      <div className="homepage-container">
        <header>
          <h1>{displayed}</h1>
        </header>
        <main>
          <Routes>
            <Route path="/" element={<TTSReader />} />
            <Route path="/page2" element={<TTSReader />} />
            <Route path="/page3" element={<TTSReader />} />
            <Route path="/page4" element={<TTSReader />} />
            <Route path="/page5" element={<TTSReader />} />
          </Routes>
        </main>
        <footer>
          <p>Powered by Google Cloud TTS | Built for Sunhacks 2025</p>
        </footer>
      </div>
    </Router>
  );
}
