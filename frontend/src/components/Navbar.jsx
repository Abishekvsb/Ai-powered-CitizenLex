import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { usePWA } from '../context/PWAContext';
import axios from 'axios';

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { isInstallable, installApp } = usePWA();
  const [unreadCount, setUnreadCount] = useState(0);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  // Fetch notification badge count
  useEffect(() => {
    if (!user) { setUnreadCount(0); return; }
    const fetchCount = async () => {
      try {
        const res = await axios.get('/api/notifications/count');
        setUnreadCount(res.data.unreadCount || 0);
      } catch {}
    };
    fetchCount();
    const interval = setInterval(fetchCount, 60000); // refresh every 60s
    return () => clearInterval(interval);
  }, [user, location.pathname]);

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
                {/* AI Legal Copilot — highlighted */}
                <li className="nav-item">
                  <Link
                    className={`nav-link px-2 mx-1 d-flex align-items-center gap-1 fw-semibold ${isActive('/copilot') ? 'active' : ''}`}
                    to="/copilot"
                    style={{ color: 'var(--accent)', fontSize: '0.9rem' }}
                  >
                    <i className="bi bi-robot"></i>
                    <span>Copilot</span>
                    <span className="badge ms-1" style={{ background: 'var(--accent)', color: '#071530', fontSize: '0.6rem', borderRadius: 4, padding: '2px 5px' }}>NEW</span>
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
            {isInstallable && (
              <button
                className="btn btn-sm d-flex align-items-center gap-1 pwa-install-btn"
                onClick={installApp}
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

            {/* Notification Bell */}
            {user && (
              <Link
                to="/notifications"
                title="Notifications"
                style={{
                  position: 'relative',
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: isActive('/notifications') ? 'var(--primary)' : 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: isActive('/notifications') ? 'white' : 'var(--text)',
                  textDecoration: 'none',
                  transition: 'all 0.2s',
                  flexShrink: 0
                }}
              >
                <i className="bi bi-bell-fill" style={{ fontSize: '0.95rem' }}></i>
                {unreadCount > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: -4,
                    right: -4,
                    background: '#dc2626',
                    color: 'white',
                    borderRadius: '50%',
                    width: 18,
                    height: 18,
                    fontSize: '0.6rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px solid var(--nav-bg)'
                  }}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>
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
                  <li>
                    <Link className="dropdown-item" to="/notifications">
                      <i className="bi bi-bell me-2 text-primary"></i>
                      Notifications
                      {unreadCount > 0 && (
                        <span className="badge ms-2" style={{ background: '#dc2626', color: 'white', borderRadius: 6, fontSize: '0.65rem' }}>{unreadCount}</span>
                      )}
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
