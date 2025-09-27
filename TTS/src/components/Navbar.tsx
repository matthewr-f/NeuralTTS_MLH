import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import '../css/navbar.css';

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLUListElement | null>(null);
  const hamburgerRef = useRef<HTMLDivElement | null>(null);

  const toggleMenu = () => setIsOpen(prev => !prev);
  const closeMenu = () => setIsOpen(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        hamburgerRef.current &&
        !hamburgerRef.current.contains(event.target as Node)
      ) {
        closeMenu();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <ul className="navbar-menu">
          <li><Link to="/">Home</Link></li>
          <li><Link to="/page2">About</Link></li>
        </ul>

        <div className="navbar-action">
          <a
            href="https://jamesbuckhouse.substack.com/"
            className="navbar-newsletter"
            target="_blank"
            rel="noopener noreferrer"
          >
            Login
          </a>

          <a
            href="https://jamesbuckhouse.substack.com/"
            className="navbar-newsletter"
            target="_blank"
            rel="noopener noreferrer"
          >
            Signup
          </a>

        </div>

        <div className="navbar-hamburger" onClick={toggleMenu} ref={hamburgerRef}>
          <span></span>
          <span></span>
          <span></span>
        </div>

        <ul className={`navbar-mobile-menu ${isOpen ? 'active' : ''}`} ref={menuRef}>
        <li><Link to="/" onClick={closeMenu}>Home</Link></li>
        <li><Link to="/page2" onClick={closeMenu}>About</Link></li>

          <li>
            <a 
              href="https://jamesbuckhouse.substack.com/"
              target="_blank"
              rel="noopener noreferrer"
              onClick={closeMenu}
            >
                Login
            </a>

            <a 
              href="https://jamesbuckhouse.substack.com/"
              target="_blank"
              rel="noopener noreferrer"
              onClick={closeMenu}
            >
                Signup
            </a>

          </li>
        </ul>
      </div>
    </nav>
  );
}

export default Navbar;