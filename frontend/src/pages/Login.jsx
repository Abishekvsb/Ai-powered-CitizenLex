import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import ThreeDBackground from '../components/ThreeDBackground';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
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
      padding: '20px',
      overflow: 'hidden',
      background: 'radial-gradient(circle at 50% 50%, #08071a 0%, #020208 100%)'
    }}>
      {/* Immersive 3D Parallax & Gyroscope Constellations */}
      <ThreeDBackground />

      {/* Aurora glow mesh overlays behind the card */}
      <div className="aurora-overlay-1" style={{
        position: 'absolute',
        width: '40vw',
        height: '40vw',
        top: '10%',
        left: '10%',
        background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 60%)',
        filter: 'blur(80px)',
        pointerEvents: 'none',
        zIndex: 1
      }} />
      <div className="aurora-overlay-2" style={{
        position: 'absolute',
        width: '45vw',
        height: '45vw',
        bottom: '10%',
        right: '10%',
        background: 'radial-gradient(circle, rgba(168, 85, 247, 0.12) 0%, transparent 60%)',
        filter: 'blur(100px)',
        pointerEvents: 'none',
        zIndex: 1
      }} />

      <div className="auth-content-wrapper" style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: '450px' }}>
        {/* Neon Outline Pulse backdrop */}
        <div className="auth-card-neon-glow" style={{
          position: 'absolute',
          inset: '-2px',
          background: 'linear-gradient(135deg, #6366f1, #a855f7, #f59e0b, #6366f1)',
          backgroundSize: '300% 300%',
          borderRadius: '26px',
          opacity: '0.22',
          filter: 'blur(8px)',
          zIndex: 0,
          animation: 'shimmer 15s linear infinite'
        }} />

        <div className="auth-card glass-panel" style={{
          position: 'relative',
          zIndex: 1,
          padding: '44px 36px',
          borderRadius: '24px',
          background: 'rgba(3, 7, 18, 0.65)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.45)',
          backdropFilter: 'blur(30px)'
        }}>
          {/* Animated Header Logo */}
          <div className="text-center mb-4">
            <div className="auth-logo-icon mx-auto mb-3" style={{
              width: '60px',
              height: '60px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(99, 102, 241, 0.3)',
              transform: 'rotate(-4deg)',
              transition: 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'rotate(4deg) scale(1.06)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'rotate(-4deg) scale(1)'}
            >
              <i className="bi bi-balance2 text-white" style={{ fontSize: '1.75rem' }}></i>
            </div>
            <h2 className="fw-extrabold text-white mb-1" style={{ letterSpacing: '-0.8px', fontSize: '1.9rem' }}>CitizenLex</h2>
            <p className="text-secondary small">Your Decentralized Legal AI Advisor</p>
          </div>

          <div className="mb-4 text-center">
            <h4 className="text-white fw-bold h5 mb-1">Welcome Back</h4>
            <p className="text-secondary small">Please enter your account details below</p>
          </div>

          {error && (
            <div className="alert alert-danger d-flex align-items-center mb-4 border-0" role="alert"
              style={{ background: 'rgba(239, 68, 68, 0.12)', color: '#ef4444', borderRadius: '12px', padding: '12px 16px', fontSize: '0.85rem' }}>
              <i className="bi bi-exclamation-octagon-fill me-2 fs-5"></i>
              <div className="text-start">{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Email Address */}
            <div className="mb-3 text-start">
              <label htmlFor="login-email" className="form-label fw-semibold small text-secondary mb-1">Email Address</label>
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
                  placeholder="you@example.com"
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
                    e.target.style.background = 'rgba(255, 255, 255, 0.06)';
                    e.target.style.borderColor = '#6366f1';
                    e.target.style.boxShadow = '0 0 12px rgba(99, 102, 241, 0.25)';
                  }}
                  onBlur={e => {
                    e.target.style.background = 'rgba(255, 255, 255, 0.03)';
                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="mb-3 text-start">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <label htmlFor="login-password" className="form-label fw-semibold small text-secondary mb-0">Password</label>
                <Link to="/forgot-password" style={{ color: '#6366f1', fontSize: '0.78rem', textDecoration: 'none', fontWeight: '500' }}>
                  Forgot password?
                </Link>
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
                    e.target.style.background = 'rgba(255, 255, 255, 0.06)';
                    e.target.style.borderColor = '#6366f1';
                    e.target.style.boxShadow = '0 0 12px rgba(99, 102, 241, 0.25)';
                  }}
                  onBlur={e => {
                    e.target.style.background = 'rgba(255, 255, 255, 0.03)';
                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.08)';
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
                    right: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#9ca3af',
                    zIndex: 3,
                    cursor: 'pointer'
                  }}
                >
                  <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`} style={{ fontSize: '1.2rem' }}></i>
                </button>
              </div>
            </div>

            {/* Remember Me checkbox */}
            <div className="d-flex align-items-center justify-content-between mb-4">
              <div className="form-check text-start">
                <input
                  type="checkbox"
                  className="form-check-input bg-transparent border-secondary"
                  id="rememberMeCheck"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={{ cursor: 'pointer' }}
                />
                <label className="form-check-label small text-secondary" htmlFor="rememberMeCheck" style={{ cursor: 'pointer', userSelect: 'none' }}>
                  Remember me
                </label>
              </div>
            </div>

            {/* Submit CTA Button */}
            <button
              type="submit"
              id="login-submit-btn"
              className="btn w-100 d-flex justify-content-center align-items-center"
              disabled={loading}
              style={{
                height: '50px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                color: 'white',
                border: 'none',
                fontWeight: '600',
                fontSize: '0.98rem',
                boxShadow: '0 4px 20px rgba(99, 102, 241, 0.3)',
                transition: 'all 0.3s'
              }}
              onMouseEnter={e => {
                e.target.style.opacity = '0.94';
                e.target.style.transform = 'translateY(-1px)';
                e.target.style.boxShadow = '0 8px 24px rgba(99, 102, 241, 0.4)';
              }}
              onMouseLeave={e => {
                e.target.style.opacity = '1';
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 20px rgba(99, 102, 241, 0.3)';
              }}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Authenticating...
                </>
              ) : (
                <>
                  <i className="bi bi-shield-lock me-2"></i>
                  Sign In to Platform
                </>
              )}
            </button>
          </form>

          {/* Social Logins Section */}
          <div className="my-4 d-flex align-items-center justify-content-between">
            <hr className="flex-grow-1" style={{ borderColor: 'rgba(255,255,255,0.08)' }} />
            <span className="mx-3 text-secondary small text-uppercase" style={{ letterSpacing: '1px', fontSize: '0.7rem' }}>or continue with</span>
            <hr className="flex-grow-1" style={{ borderColor: 'rgba(255,255,255,0.08)' }} />
          </div>

          <div className="row g-2 mb-4">
            <div className="col-6">
              <button className="btn btn-glass-secondary w-100 py-2 d-flex align-items-center justify-content-center gap-2"
                onClick={() => alert("Google Single Sign-On simulation.")}
                style={{ borderRadius: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: 'white' }}>
                <i className="bi bi-google text-danger"></i>
                <span className="small">Google</span>
              </button>
            </div>
            <div className="col-6">
              <button className="btn btn-glass-secondary w-100 py-2 d-flex align-items-center justify-content-center gap-2"
                onClick={() => alert("GitHub Single Sign-On simulation.")}
                style={{ borderRadius: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: 'white' }}>
                <i className="bi bi-github text-white"></i>
                <span className="small">GitHub</span>
              </button>
            </div>
          </div>

          <div className="text-center mt-3 text-secondary small">
            New to CitizenLex?{' '}
            <Link to="/register" className="fw-bold text-decoration-none" style={{ color: '#6366f1', transition: 'color 0.2s' }}
              onMouseEnter={e => e.target.style.color = '#a855f7'}
              onMouseLeave={e => e.target.style.color = '#6366f1'}
            >
              Create accounts
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
