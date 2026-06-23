import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar navbar-expand-lg glass-nav navbar-light">
      <div className="container">
        <Link className="navbar-brand d-flex align-items-center fw-bold text-primary" to="/" style={{ fontSize: '1.5rem' }}>
          <i className="bi bi-balance2 me-2"></i>
          <span>CitizenLex</span>
        </Link>
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0 align-items-center">
            {user && (
              <>
                <li className="nav-item">
                  <Link className={`nav-link nav-link-custom mx-2 ${isActive('/dashboard') ? 'active' : ''}`} to="/dashboard">
                    Dashboard
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className={`nav-link nav-link-custom mx-2 ${isActive('/chat') ? 'active' : ''}`} to="/chat">
                    AI Assistant
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className={`nav-link nav-link-custom mx-2 ${isActive('/complaint') ? 'active' : ''}`} to="/complaint">
                    AI Drafter
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className={`nav-link nav-link-custom mx-2 ${isActive('/analyzer') ? 'active' : ''}`} to="/analyzer">
                    Doc Analyzer
                  </Link>
                </li>
              </>
            )}
            <li className="nav-item">
              <Link className={`nav-link nav-link-custom mx-2 ${isActive('/rights') ? 'active' : ''}`} to="/rights">
                Rights Explorer
              </Link>
            </li>
            <li className="nav-item">
              <Link className={`nav-link nav-link-custom mx-2 ${isActive('/schemes') ? 'active' : ''}`} to="/schemes">
                Scheme Finder
              </Link>
            </li>
            <li className="nav-item">
              <Link className={`nav-link nav-link-custom mx-2 ${isActive('/resources') ? 'active' : ''}`} to="/resources">
                Resources
              </Link>
            </li>
            {user && isAdmin() && (
              <li className="nav-item">
                <Link className={`nav-link nav-link-custom mx-2 text-danger fw-bold ${isActive('/admin') ? 'active' : ''}`} to="/admin">
                  Admin Dashboard
                </Link>
              </li>
            )}
          </ul>
          
          <div className="d-flex align-items-center gap-3">
            <button className="dark-mode-toggle me-2" onClick={toggleTheme} title="Toggle Dark/Light Mode">
              {theme === 'light' ? <i className="bi bi-moon-stars-fill"></i> : <i className="bi bi-sun-fill text-warning"></i>}
            </button>

            {user ? (
              <div className="dropdown">
                <button className="btn btn-outline-primary dropdown-toggle d-flex align-items-center gap-2" type="button" id="userMenuBtn" data-bs-toggle="dropdown" aria-expanded="false">
                  <i className="bi bi-person-circle"></i>
                  <span>{user.firstName}</span>
                </button>
                <ul className="dropdown-menu dropdown-menu-end glass-panel" aria-labelledby="userMenuBtn">
                  <li>
                    <Link className="dropdown-item nav-link-custom" to="/profile">
                      <i className="bi bi-person me-2"></i>Profile
                    </Link>
                  </li>
                  <li><hr className="dropdown-divider" style={{ borderColor: 'var(--border-color)' }} /></li>
                  <li>
                    <button className="dropdown-item text-danger d-flex align-items-center" onClick={handleLogout}>
                      <i className="bi bi-box-arrow-right me-2"></i>Logout
                    </button>
                  </li>
                </ul>
              </div>
            ) : (
              <div className="d-flex gap-2">
                <Link className="btn btn-glass-secondary" to="/login">Login</Link>
                <Link className="btn btn-glass" to="/register">Register</Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
