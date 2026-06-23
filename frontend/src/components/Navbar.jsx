import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  // PWA Install prompt
  const [installPrompt, setInstallPrompt] = useState(null);
  const [showInstallBtn, setShowInstallBtn] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
      setShowInstallBtn(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    // If already installed, hide button
    window.addEventListener('appinstalled', () => setShowInstallBtn(false));
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    const result = await installPrompt.prompt();
    if (result.outcome === 'accepted') {
      setShowInstallBtn(false);
      setInstallPrompt(null);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar navbar-expand-lg glass-nav">
      <div className="container">
        <Link className="navbar-brand d-flex align-items-center fw-bold" to="/"
          style={{ fontSize: '1.4rem', color: 'var(--primary)', letterSpacing: '-0.03em' }}>
          <i className="bi bi-balance2 me-2"></i>
          <span>CitizenLex</span>
        </Link>
        <button className="navbar-toggler border-0" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav"
          style={{ color: 'var(--text)' }}>
          <i className="bi bi-list fs-4"></i>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0 align-items-lg-center">
            {user && (
              <>
                <li className="nav-item">
                  <Link className={`nav-link nav-link-custom px-2 mx-1 ${isActive('/dashboard') ? 'active' : ''}`} to="/dashboard">
                    <i className="bi bi-speedometer2 me-1 d-lg-none"></i>Dashboard
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className={`nav-link nav-link-custom px-2 mx-1 ${isActive('/chat') ? 'active' : ''}`} to="/chat">
                    <i className="bi bi-chat-dots me-1 d-lg-none"></i>AI Assistant
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className={`nav-link nav-link-custom px-2 mx-1 ${isActive('/analyzer') ? 'active' : ''}`} to="/analyzer">
                    <i className="bi bi-file-earmark-text me-1 d-lg-none"></i>Doc Analyzer
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className={`nav-link nav-link-custom px-2 mx-1 ${isActive('/drafts') ? 'active' : ''}`} to="/drafts">
                    <i className="bi bi-file-earmark-diff me-1 d-lg-none"></i>AI Drafts
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className={`nav-link nav-link-custom px-2 mx-1 ${isActive('/ocr') ? 'active' : ''}`} to="/ocr">
                    <i className="bi bi-upc-scan me-1 d-lg-none"></i>OCR Scanner
                  </Link>
                </li>
              </>
            )}
            <li className="nav-item">
              <Link className={`nav-link nav-link-custom px-2 mx-1 ${isActive('/rights') ? 'active' : ''}`} to="/rights">
                <i className="bi bi-book me-1 d-lg-none"></i>Rights Explorer
              </Link>
            </li>
            <li className="nav-item">
              <Link className={`nav-link nav-link-custom px-2 mx-1 ${isActive('/schemes') ? 'active' : ''}`} to="/schemes">
                <i className="bi bi-search-heart me-1 d-lg-none"></i>Scheme Finder
              </Link>
            </li>
            {user && isAdmin() && (
              <li className="nav-item">
                <Link className={`nav-link nav-link-custom px-2 mx-1 text-danger fw-bold ${isActive('/admin') ? 'active' : ''}`} to="/admin">
                  <i className="bi bi-shield-fill me-1 d-lg-none"></i>Admin
                </Link>
              </li>
            )}
          </ul>

          <div className="d-flex align-items-center gap-2">

            {/* PWA Install Button */}
            {showInstallBtn && (
              <button
                className="btn btn-sm d-flex align-items-center gap-1 pwa-install-btn"
                onClick={handleInstall}
                title="Install CitizenLex App"
                style={{
                  background: 'linear-gradient(135deg, #2563eb, #06b6d4)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  padding: '6px 12px',
                  animation: 'fadeInUp 0.4s ease'
                }}
              >
                <i className="bi bi-download"></i>
                <span className="d-none d-md-inline">Install App</span>
              </button>
            )}

            <button className="dark-mode-toggle" onClick={toggleTheme} title="Toggle theme" aria-label="Toggle dark/light mode">
              {theme === 'light' ? <i className="bi bi-moon-stars-fill"></i> : <i className="bi bi-sun-fill"></i>}
            </button>

            {user ? (
              <div className="dropdown">
                <button
                  className="btn d-flex align-items-center gap-2 fw-semibold"
                  type="button"
                  id="userMenuBtn"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: '10px',
                    color: 'var(--text)',
                    fontSize: '0.88rem',
                    padding: '7px 14px',
                  }}
                >
                  <i className="bi bi-person-circle text-primary"></i>
                  <span>{user.firstName}</span>
                  <i className="bi bi-chevron-down small"></i>
                </button>
                <ul className="dropdown-menu dropdown-menu-end glass-panel mt-1" aria-labelledby="userMenuBtn">
                  <li>
                    <Link className="dropdown-item" to="/profile">
                      <i className="bi bi-person me-2 text-primary"></i>Profile
                    </Link>
                  </li>
                  <li><hr className="dropdown-divider my-1" style={{ borderColor: 'var(--border)' }} /></li>
                  <li>
                    <button className="dropdown-item text-danger d-flex align-items-center" onClick={handleLogout}>
                      <i className="bi bi-box-arrow-right me-2"></i>Logout
                    </button>
                  </li>
                </ul>
              </div>
            ) : (
              <div className="d-flex gap-2">
                <Link className="btn btn-glass-secondary btn-sm" to="/login" style={{ padding: '8px 18px' }}>Login</Link>
                <Link className="btn btn-glass btn-sm" to="/register" style={{ padding: '8px 18px' }}>Register</Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
