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
  const [scrolled, setScrolled] = useState(false);

  // Monitor scroll for premium visual transition
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
    <nav className="navbar navbar-expand-lg sticky-top" style={{
      borderBottom: scrolled ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(255,255,255,0.03)',
      background: scrolled ? 'rgba(2, 3, 10, 0.85)' : 'rgba(2, 3, 10, 0.5)',
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      boxShadow: scrolled ? '0 10px 30px rgba(0, 0, 0, 0.3)' : 'none',
      transition: 'all 0.35s ease',
      padding: scrolled ? '8px 0' : '16px 0',
      zIndex: 10000
    }}>
      <div className="container">
        <Link className="navbar-brand d-flex align-items-center fw-bold" to="/"
          style={{ fontSize: '1.45rem', letterSpacing: '-0.04em', textDecoration: 'none' }}>
          <i className="bi bi-balance2 me-2" style={{ color: '#d4af37' }}></i>
          <span style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #d4af37 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            fontWeight: 800
          }}>CitizenLex</span>
        </Link>
        <button className="navbar-toggler border-0" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav"
          style={{ color: '#fff' }}>
          <i className="bi bi-list fs-3"></i>
        </button>
        
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0 align-items-lg-center">
            {user && (
              <>
                <li className="nav-item">
                  <Link className={`nav-link nav-link-custom px-2 mx-1 ${isActive('/dashboard') ? 'active' : ''}`} to="/dashboard" style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>
                    Dashboard
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className={`nav-link nav-link-custom px-2 mx-1 ${isActive('/chat') ? 'active' : ''}`} to="/chat" style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>
                    AI Assistant
                  </Link>
                </li>
                <li className="nav-item">
                  <Link
                    className={`nav-link px-2 mx-1 d-flex align-items-center gap-1 fw-semibold ${isActive('/copilot') ? 'active' : ''}`}
                    to="/copilot"
                    style={{ color: '#00d2ff', fontSize: '0.9rem', position: 'relative' }}
                  >
                    <i className="bi bi-robot"></i>
                    <span>Copilot</span>
                    <span className="badge ms-1" style={{ background: '#00d2ff', color: '#02030a', fontSize: '0.55rem', borderRadius: 4, padding: '2px 4px' }}>NEW</span>
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className={`nav-link nav-link-custom px-2 mx-1 ${isActive('/analyzer') ? 'active' : ''}`} to="/analyzer" style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>
                    Doc Analyzer
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className={`nav-link nav-link-custom px-2 mx-1 ${isActive('/drafts') ? 'active' : ''}`} to="/drafts" style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>
                    AI Drafts
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className={`nav-link nav-link-custom px-2 mx-1 ${isActive('/ocr') ? 'active' : ''}`} to="/ocr" style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>
                    OCR Scanner
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className={`nav-link nav-link-custom px-2 mx-1 ${isActive('/consultations') ? 'active' : ''}`} to="/consultations" style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>
                    Consultations
                  </Link>
                </li>
                {isLawyer() && (
                  <li className="nav-item">
                    <Link className={`nav-link nav-link-custom px-2 mx-1 fw-bold ${isActive('/lawyer/dashboard') ? 'active' : ''}`} to="/lawyer/dashboard" style={{ color: '#d4af37', fontSize: '0.9rem' }}>
                      Advocate Panel
                    </Link>
                  </li>
                )}
              </>
            )}
            <li className="nav-item">
              <Link className={`nav-link nav-link-custom px-2 mx-1 ${isActive('/rights') ? 'active' : ''}`} to="/rights" style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>
                Rights Explorer
              </Link>
            </li>
            <li className="nav-item">
              <Link className={`nav-link nav-link-custom px-2 mx-1 ${isActive('/schemes') ? 'active' : ''}`} to="/schemes" style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>
                Scheme Finder
              </Link>
            </li>
            <li className="nav-item">
              <Link className={`nav-link nav-link-custom px-2 mx-1 ${isActive('/lawDynamic') || isActive('/lawyers') ? 'active' : ''}`} to="/lawyers" style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>
                Find Lawyers
              </Link>
            </li>
            {user && isAdmin() && (
              <li className="nav-item">
                <Link className={`nav-link nav-link-custom px-2 mx-1 text-danger fw-bold ${isActive('/admin') ? 'active' : ''}`} to="/admin" style={{ fontSize: '0.9rem' }}>
                  Admin
                </Link>
              </li>
            )}
          </ul>

          <div className="d-flex align-items-center gap-2">
            {/* PWA Install Button */}
            {isInstallable && (
              <button
                className="btn btn-sm d-flex align-items-center gap-1"
                onClick={installApp}
                title="Install CitizenLex App"
                style={{
                  background: 'linear-gradient(135deg, #00d2ff, #d4af37)',
                  color: '#000',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  padding: '7px 14px',
                  boxShadow: '0 4px 15px rgba(0, 210, 255, 0.25)',
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
                  background: isActive('/notifications') ? '#d4af37' : 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: isActive('/notifications') ? 'black' : 'white',
                  textDecoration: 'none',
                  transition: 'all 0.2s',
                  flexShrink: 0
                }}
              >
                <i className="bi bi-bell-fill" style={{ fontSize: '0.98rem' }}></i>
                {unreadCount > 0 && (
                  <span style={{
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
                    border: '2px solid #02030a'
                  }}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>
            )}

            {/* Theme Toggle */}
            <button onClick={toggleTheme} title="Toggle theme" aria-label="Toggle dark/light mode" style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '10px',
              width: 38,
              height: 38,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white'
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
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '12px',
                    color: 'white',
                    fontSize: '0.88rem',
                    padding: '7px 14px',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = '#00d2ff'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'}
                >
                  {user.profileImageUrl ? (
                    <img
                      src={user.profileImageUrl}
                      alt="Profile"
                      style={{
                        width: 25,
                        height: 25,
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: '2px solid rgba(212,175,55,0.5)'
                      }}
                      onError={e => { e.target.style.display='none'; }}
                    />
                  ) : (
                    <div style={{
                      width: 25, height: 25, borderRadius: '50%',
                      background: 'linear-gradient(135deg, #00d2ff, #d4af37)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.65rem', fontWeight: 700, color: 'black', flexShrink: 0,
                    }}>
                      {`${(user.firstName||'?')[0]}${(user.lastName||'')[0]||''}`.toUpperCase()}
                    </div>
                  )}
                  <span className="d-none d-sm-inline">{user.firstName}</span>
                  <i className="bi bi-chevron-down small text-secondary"></i>
                </button>
                <ul className="dropdown-menu dropdown-menu-end glass-panel mt-1" aria-labelledby="userMenuBtn" style={{
                  border: '1px solid rgba(255,255,255,0.08)',
                  background: '#04050f',
                  boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
                  borderRadius: '12px',
                  padding: '6px'
                }}>
                  <li>
                    <Link className="dropdown-item d-flex align-items-center gap-2 text-white" to="/profile" style={{ borderRadius: '8px', padding: '8px 12px' }}>
                      <i className="bi bi-person text-info"></i>Profile Settings
                    </Link>
                  </li>
                  <li>
                    <Link className="dropdown-item d-flex align-items-center gap-2 text-white" to="/notifications" style={{ borderRadius: '8px', padding: '8px 12px' }}>
                      <i className="bi bi-bell text-warning"></i>
                      Notifications
                      {unreadCount > 0 && (
                        <span className="badge ms-auto" style={{ background: '#dc2626', color: 'white', borderRadius: 6, fontSize: '0.65rem' }}>{unreadCount}</span>
                      )}
                    </Link>
                  </li>
                  <li><hr className="dropdown-divider my-1" style={{ borderColor: 'rgba(255,255,255,0.08)' }} /></li>
                  <li>
                    <button className="dropdown-item text-danger d-flex align-items-center gap-2" onClick={handleLogout} style={{ borderRadius: '8px', padding: '8px 12px' }}>
                      <i className="bi bi-box-arrow-right"></i>Logout Account
                    </button>
                  </li>
                </ul>
              </div>
            ) : (
              <div className="d-flex gap-2">
                <Link className="btn btn-premium-outline btn-sm" to="/login" style={{ padding: '8px 16px', borderRadius: '10px' }}>Login</Link>
                <Link className="btn btn-premium-gold btn-sm" to="/register" style={{ padding: '8px 16px', borderRadius: '10px' }}>Register</Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Underline indicators styles */}
      <style>{`
        .nav-link-custom {
          position: relative;
          color: rgba(255, 255, 255, 0.7) !important;
          transition: color 0.3s ease;
        }
        .nav-link-custom::after {
          content: '';
          position: absolute;
          width: 0;
          height: 2px;
          bottom: -2px;
          left: 50%;
          background-color: #d4af37;
          transition: all 0.35s ease;
          transform: translateX(-50%);
        }
        .nav-link-custom:hover::after,
        .nav-link-custom.active::after {
          width: 100%;
        }
        .nav-link-custom:hover,
        .nav-link-custom.active {
          color: #fff !important;
        }
      `}</style>
    </nav>
  );
}
