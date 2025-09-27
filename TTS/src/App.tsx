import React from 'react';
import 'TTS/src/css/navbar.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from 'TTS/src/components/Navbar.tsx;
import './styles/Navbar.css';

function Page({ color }: { color: string }) {
  return (
    <div
      style={{
        backgroundColor: color,
        width: '100vw',
        height: '100vh',
        paddingTop: 'var(--navbar-height)',
      }}
    />
  );
}

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Page color="#4281A4" />} />
        <Route path="/page2" element={<Page color="#48A9A6" />} />
        <Route path="/page3" element={<Page color="#E4DFDA" />} />
        <Route path="/page4" element={<Page color="#D4B483" />} />
        <Route path="/page5" element={<Page color="#C1666B" />} />
      </Routes>
    </Router>
  );
}

export default App;