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
  const isLawyer = () => user && (user.role === 'ROLE_LAWYER' || user.role === 'LAWYER');

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
    <nav className="navbar navbar-expand-lg glass-nav sticky-top" style={{
      borderBottom: '1px solid var(--border)',
      background: 'var(--nav-bg)',
      backdropFilter: 'blur(30px)',
      WebkitBackdropFilter: 'blur(30px)',
      boxShadow: '0 4px 30px rgba(0, 0, 0, 0.03)',
      transition: 'all 0.3s'
    }}>
      <div className="container">
        <Link className="navbar-brand d-flex align-items-center fw-bold text-gradient" to="/"
          style={{ fontSize: '1.45rem', letterSpacing: '-0.04em', background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
          <i className="bi bi-balance2 me-2" style={{ color: 'var(--primary)', WebkitTextFillColor: 'initial' }}></i>
          <span>CitizenLex</span>
        </Link>
        <button className="navbar-toggler border-0" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav"
          style={{ color: 'var(--text)' }}>
          <i className="bi bi-list fs-3"></i>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0 align-items-lg-center">
            {user && (
              <>
                <li className="nav-item">
                  <Link className={`nav-link nav-link-custom px-2 mx-1 ${isActive('/dashboard') ? 'active' : ''}`} to="/dashboard">
                    Dashboard
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className={`nav-link nav-link-custom px-2 mx-1 ${isActive('/chat') ? 'active' : ''}`} to="/chat">
                    AI Assistant
                  </Link>
                </li>
                {/* AI Legal Copilot — highlighted */}
                <li className="nav-item">
                  <Link
                    className={`nav-link px-2 mx-1 d-flex align-items-center gap-1 fw-semibold ${isActive('/copilot') ? 'active' : ''}`}
                    to="/copilot"
                    style={{ color: 'var(--accent)', fontSize: '0.9rem', position: 'relative' }}
                  >
                    <i className="bi bi-robot"></i>
                    <span>Copilot</span>
                    <span className="badge ms-1" style={{ background: 'var(--accent)', color: '#071530', fontSize: '0.55rem', borderRadius: 4, padding: '2px 4px' }}>NEW</span>
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className={`nav-link nav-link-custom px-2 mx-1 ${isActive('/analyzer') ? 'active' : ''}`} to="/analyzer">
                    Doc Analyzer
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className={`nav-link nav-link-custom px-2 mx-1 ${isActive('/drafts') ? 'active' : ''}`} to="/drafts">
                    AI Drafts
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className={`nav-link nav-link-custom px-2 mx-1 ${isActive('/ocr') ? 'active' : ''}`} to="/ocr">
                    OCR Scanner
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className={`nav-link nav-link-custom px-2 mx-1 ${isActive('/consultations') ? 'active' : ''}`} to="/consultations">
                    Consultations
                  </Link>
                </li>
                {isLawyer() && (
                  <li className="nav-item">
                    <Link className={`nav-link nav-link-custom px-2 mx-1 fw-bold ${isActive('/lawyer/dashboard') ? 'active' : ''}`} to="/lawyer/dashboard" style={{ color: 'var(--accent)' }}>
                      Advocate Panel
                    </Link>
                  </li>
                )}
              </>
            )}
            <li className="nav-item">
              <Link className={`nav-link nav-link-custom px-2 mx-1 ${isActive('/rights') ? 'active' : ''}`} to="/rights">
                Rights Explorer
              </Link>
            </li>
            <li className="nav-item">
              <Link className={`nav-link nav-link-custom px-2 mx-1 ${isActive('/schemes') ? 'active' : ''}`} to="/schemes">
                Scheme Finder
              </Link>
            </li>
            <li className="nav-item">
              <Link className={`nav-link nav-link-custom px-2 mx-1 ${isActive('/lawDynamic') || isActive('/lawyers') ? 'active' : ''}`} to="/lawyers">
                Find Lawyers
              </Link>
            </li>
            {user && isAdmin() && (
              <li className="nav-item">
                <Link className={`nav-link nav-link-custom px-2 mx-1 text-danger fw-bold ${isActive('/admin') ? 'active' : ''}`} to="/admin">
                  Admin
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
                  background: 'linear-gradient(135deg, var(--primary), var(--accent))',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  padding: '7px 14px',
                  boxShadow: '0 4px 15px rgba(99, 102, 241, 0.2)',
                  transition: 'all 0.3s'
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
                  background: isActive('/notifications') ? 'var(--primary)' : 'rgba(255,255,255,0.04)',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: isActive('/notifications') ? 'white' : 'var(--text)',
                  textDecoration: 'none',
                  transition: 'all 0.2s',
                  flexShrink: 0
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'scale(1.05)';
                  const icon = e.currentTarget.querySelector('i');
                  if (icon) icon.style.animation = 'bell-wobble 0.6s ease';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'scale(1)';
                  const icon = e.currentTarget.querySelector('i');
                  if (icon) icon.style.animation = 'none';
                }}
              >
                <i className={`bi bi-bell-fill ${unreadCount > 0 ? 'bell-notify-pulse' : ''}`} style={{ fontSize: '0.98rem', display: 'inline-block' }}></i>
                {unreadCount > 0 && (
                  <span className="badge-glow-primary" style={{
                    position: 'absolute',
                    top: -2,
                    right: -2,
                    background: '#dc2626',
                    color: 'white',
                    borderRadius: '50%',
                    width: 17,
                    height: 17,
                    fontSize: '0.62rem',
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

            <button className="dark-mode-toggle" onClick={toggleTheme} title="Toggle theme" aria-label="Toggle dark/light mode" style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid var(--border)',
              borderRadius: '10px',
              width: 38,
              height: 38,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text)'
            }}>
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
                    borderRadius: '12px',
                    color: 'var(--text)',
                    fontSize: '0.88rem',
                    padding: '7px 14px',
                    boxShadow: 'var(--shadow-sm)',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                >
                  {/* Profile avatar — photo or initials */}
                  {user.profileImageUrl ? (
                    <img
                      src={user.profileImageUrl}
                      alt="Profile"
                      style={{
                        width: 25,
                        height: 25,
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: '2px solid rgba(99,102,241,0.5)',
                        animation: 'avatar-pulse 2s infinite'
                      }}
                      onError={e => { e.target.style.display='none'; }}
                    />
                  ) : (
                    <div style={{
                      width: 25, height: 25, borderRadius: '50%',
                      background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.65rem', fontWeight: 700, color: 'white', flexShrink: 0,
                    }}>
                      {`${(user.firstName||'?')[0]}${(user.lastName||'')[0]||''}`.toUpperCase()}
                    </div>
                  )}
                  <span className="d-none d-sm-inline">{user.firstName}</span>
                  <i className="bi bi-chevron-down small text-secondary"></i>
                </button>
                <ul className="dropdown-menu dropdown-menu-end glass-panel mt-1" aria-labelledby="userMenuBtn" style={{
                  border: '1px solid var(--border)',
                  background: 'var(--surface)',
                  backdropFilter: 'blur(20px)',
                  boxShadow: 'var(--shadow-md)',
                  borderRadius: '12px',
                  padding: '6px'
                }}>
                  <li>
                    <Link className="dropdown-item d-flex align-items-center gap-2" to="/profile" style={{ borderRadius: '8px', padding: '8px 12px' }}>
                      <i className="bi bi-person text-primary"></i>Profile Settings
                    </Link>
                  </li>
                  <li>
                    <Link className="dropdown-item d-flex align-items-center gap-2" to="/notifications" style={{ borderRadius: '8px', padding: '8px 12px' }}>
                      <i className="bi bi-bell text-warning"></i>
                      Notifications
                      {unreadCount > 0 && (
                        <span className="badge ms-auto" style={{ background: '#dc2626', color: 'white', borderRadius: 6, fontSize: '0.65rem' }}>{unreadCount}</span>
                      )}
                    </Link>
                  </li>
                  <li><hr className="dropdown-divider my-1" style={{ borderColor: 'var(--border)' }} /></li>
                  <li>
                    <button className="dropdown-item text-danger d-flex align-items-center gap-2" onClick={handleLogout} style={{ borderRadius: '8px', padding: '8px 12px' }}>
                      <i className="bi bi-box-arrow-right"></i>Logout Account
                    </button>
                  </li>
                </ul>
              </div>
            ) : (
              <div className="d-flex gap-2">
                <Link className="btn btn-glass-secondary btn-sm" to="/login" style={{ padding: '8px 16px', borderRadius: '10px' }}>Login</Link>
                <Link className="btn btn-glass btn-sm" to="/register" style={{ padding: '8px 16px', borderRadius: '10px' }}>Register</Link>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes bell-wobble {
          0%, 100% { transform: rotate(0); }
          15% { transform: rotate(-10deg); }
          30% { transform: rotate(12deg); }
          45% { transform: rotate(-8deg); }
          60% { transform: rotate(6deg); }
          75% { transform: rotate(-4deg); }
        }
        .bell-notify-pulse {
          animation: bell-pulse 2s infinite alternate;
        }
        @keyframes bell-pulse {
          0% { transform: scale(1); filter: drop-shadow(0 0 0 rgba(220,38,38,0)); }
          100% { transform: scale(1.1); filter: drop-shadow(0 0 4px rgba(220,38,38,0.5)); }
        }
      `}</style>
    </nav>
  );
}
