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
    <div className="auth-page-wrapper" style={{
      position: 'relative',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      overflow: 'hidden',
      background: 'radial-gradient(circle at 50% 50%, #111827 0%, #030712 100%)'
    }}>
      {/* Dynamic constellation and floating legal watermark elements */}
      <ThreeDBackground />

      {/* Decorative premium radial mesh overlay for deep space feeling */}
      <div className="mesh-radial-overlay" style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 1,
        background: 'radial-gradient(circle at 20% 30%, rgba(99, 102, 241, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(139, 92, 246, 0.08) 0%, transparent 50%)'
      }} />

      <div className="auth-content-wrapper" style={{ position: 'relative', zIndex: 2, width: '100%', maxWidth: '440px' }}>
        {/* Glow backdrop effect behind the glass card */}
        <div className="auth-card-glow" style={{
          position: 'absolute',
          inset: '-20px',
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.18) 0%, transparent 65%)',
          filter: 'blur(30px)',
          pointerEvents: 'none',
          zIndex: 0
        }} />

        <div className="auth-card glass-panel" style={{
          position: 'relative',
          zIndex: 1,
          padding: '40px 32px',
          borderRadius: '24px',
          background: 'rgba(17, 24, 39, 0.65)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.35)',
          backdropFilter: 'blur(20px)',
          textAlign: 'center'
        }}>
          {/* Animated Brand Header */}
          <div className="text-center mb-4">
            <div className="auth-logo-icon mx-auto mb-3" style={{
              width: '64px',
              height: '64px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(99, 102, 241, 0.35)',
              transform: 'rotate(-5deg)',
              transition: 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'rotate(5deg) scale(1.08)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'rotate(-5deg) scale(1)'}
            >
              <i className="bi bi-balance2 text-white" style={{ fontSize: '1.8rem' }}></i>
            </div>
            <h1 className="auth-brand-title fw-bold text-white mb-1" style={{ letterSpacing: '-0.5px', fontSize: '1.85rem' }}>CitizenLex</h1>
            <p className="auth-brand-subtitle text-secondary small mb-0">Democratizing Legal Assistance</p>
          </div>

          <div className="mb-4">
            <h2 className="auth-heading text-white fw-bold h4 mb-1">Welcome back</h2>
            <p className="text-secondary small">Securely access your personalized legal copilot</p>
          </div>

          {error && (
            <div className="alert alert-danger d-flex align-items-center mb-4 border-0" role="alert"
              style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444', borderRadius: '12px', padding: '12px 16px', fontSize: '0.85rem' }}>
              <i className="bi bi-exclamation-triangle-fill me-2" style={{ fontSize: '1rem' }}></i>
              <div className="text-start">{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Email Field */}
            <div className="mb-3 text-start">
              <label className="form-label fw-semibold small text-secondary mb-1">Email Address</label>
              <div className="input-group-auth" style={{ position: 'relative' }}>
                <i className="bi bi-envelope input-icon" style={{
                  position: 'absolute',
                  left: '16px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#9ca3af',
                  zIndex: 3
                }}></i>
                <input
                  id="login-email"
                  type="email"
                  className="form-control form-glass-control"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={{
                    paddingLeft: '48px',
                    height: '50px',
                    borderRadius: '12px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    color: '#fff',
                    transition: 'all 0.3s'
                  }}
                  onFocus={e => {
                    e.target.style.background = 'rgba(255,255,255,0.05)';
                    e.target.style.borderColor = '#6366f1';
                    e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.2)';
                  }}
                  onBlur={e => {
                    e.target.style.background = 'rgba(255,255,255,0.03)';
                    e.target.style.borderColor = 'rgba(255,255,255,0.08)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="mb-4 text-start">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <label className="form-label fw-semibold small text-secondary mb-0">Password</label>
                <span className="small text-primary-hover" style={{ color: '#6366f1', fontSize: '0.78rem', cursor: 'pointer', textDecoration: 'none' }}>Forgot?</span>
              </div>
              <div className="input-group-auth" style={{ position: 'relative' }}>
                <i className="bi bi-lock input-icon" style={{
                  position: 'absolute',
                  left: '16px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#9ca3af',
                  zIndex: 3
                }}></i>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  className="form-control form-glass-control"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{
                    paddingLeft: '48px',
                    paddingRight: '48px',
                    height: '50px',
                    borderRadius: '12px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    color: '#fff',
                    transition: 'all 0.3s'
                  }}
                  onFocus={e => {
                    e.target.style.background = 'rgba(255,255,255,0.05)';
                    e.target.style.borderColor = '#6366f1';
                    e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.2)';
                  }}
                  onBlur={e => {
                    e.target.style.background = 'rgba(255,255,255,0.03)';
                    e.target.style.borderColor = 'rgba(255,255,255,0.08)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
                <button
                  type="button"
                  className="input-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#9ca3af',
                    zIndex: 3,
                    cursor: 'pointer'
                  }}
                >
                  <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`} style={{ fontSize: '1.15rem' }}></i>
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              id="login-submit-btn"
              className="btn btn-glass w-100 py-3 d-flex justify-content-center align-items-center"
              disabled={loading}
              style={{
                height: '50px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                color: '#white',
                border: 'none',
                fontWeight: '600',
                fontSize: '0.95rem',
                boxShadow: '0 4px 15px rgba(99, 102, 241, 0.25)',
                transition: 'all 0.3s'
              }}
              onMouseEnter={e => {
                e.target.style.opacity = '0.92';
                e.target.style.transform = 'translateY(-1px)';
                e.target.style.boxShadow = '0 6px 20px rgba(99, 102, 241, 0.35)';
              }}
              onMouseLeave={e => {
                e.target.style.opacity = '1';
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 15px rgba(99, 102, 241, 0.25)';
              }}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" style={{ width: '1rem', height: '1rem' }}></span>
                  Authenticating...
                </>
              ) : (
                <>
                  <i className="bi bi-box-arrow-in-right me-2" style={{ fontSize: '1.1rem' }}></i>
                  Sign In
                </>
              )}
            </button>
          </form>

          <div className="text-center mt-4 text-secondary small">
            Don't have an account?{' '}
            <Link to="/register" className="fw-bold text-decoration-none" style={{ color: '#6366f1', transition: 'color 0.2s' }}
              onMouseEnter={e => e.target.style.color = '#8b5cf6'}
              onMouseLeave={e => e.target.style.color = '#6366f1'}
            >
              Create one free
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
