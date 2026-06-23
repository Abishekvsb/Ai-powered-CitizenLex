import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import ThreeDBackground from '../components/ThreeDBackground';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await axios.post('/api/auth/login', { email, password });
      login(res.data.accessToken, res.data.user);
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      if (err.response && err.response.data) {
        setError(err.response.data.error || 'Invalid credentials or login failure.');
      } else {
        setError('Connection to backend failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-wrapper">
      <ThreeDBackground />
      <div className="auth-content-wrapper">
        <div className="auth-card fade-in-el">

          {/* Logo / Brand */}
          <div className="text-center mb-5">
            <div className="auth-logo-icon mx-auto mb-3">
              <i className="bi bi-balance2"></i>
            </div>
            <h1 className="auth-brand-title">CitizenLex</h1>
            <p className="auth-brand-subtitle">Your AI-powered legal companion</p>
          </div>

          <h2 className="auth-heading mb-1">Welcome back</h2>
          <p className="text-secondary mb-4 small">Sign in to access your legal dashboard</p>

          {error && (
            <div className="alert alert-danger d-flex align-items-center mb-4 border-0" role="alert"
              style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444', borderRadius: '10px' }}>
              <i className="bi bi-exclamation-triangle-fill me-2"></i>
              <div>{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label fw-semibold small text-secondary">Email Address</label>
              <div className="input-group-auth">
                <i className="bi bi-envelope input-icon"></i>
                <input
                  id="login-email"
                  type="email"
                  className="form-control form-glass-control ps-5"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="form-label fw-semibold small text-secondary">Password</label>
              <div className="input-group-auth">
                <i className="bi bi-lock input-icon"></i>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  className="form-control form-glass-control ps-5 pe-5"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="input-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                </button>
              </div>
            </div>

            <button
              type="submit"
              id="login-submit-btn"
              className="btn btn-glass w-100 py-3 d-flex justify-content-center align-items-center"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Authenticating...
                </>
              ) : (
                <>
                  <i className="bi bi-box-arrow-in-right me-2"></i>
                  Sign In
                </>
              )}
            </button>
          </form>

          <div className="text-center mt-4 text-secondary small">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary fw-bold text-decoration-none">
              Create one free
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
