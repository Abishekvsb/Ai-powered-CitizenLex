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
      width: '100%',
      overflowX: 'hidden',
      background: 'radial-gradient(circle at 30% 30%, #0c0b24 0%, #020208 100%)'
    }}>
      {/* Immersive 3D Parallax & Gyroscope Lady Justice Statue background */}
      <ThreeDBackground />

      {/* Aurora mesh overlay behind the split view */}
      <div className="glow-orb" style={{
        top: '20%',
        left: '15%',
        width: '350px',
        height: '350px',
        background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)',
      }} />
      <div className="glow-orb" style={{
        bottom: '15%',
        right: '10%',
        width: '400px',
        height: '400px',
        background: 'radial-gradient(circle, rgba(168, 85, 247, 0.1) 0%, transparent 70%)',
      }} />

      {/* Split Screen Container */}
      <div className="row g-0 min-vh-100 position-relative" style={{ zIndex: 10 }}>
        {/* Left Side: Cinematic Atmospheric Visuals Column (Visible only on desktop >= 992px) */}
        <div className="col-lg-7 d-none d-lg-flex flex-column justify-content-between p-5 text-start" style={{ position: 'relative' }}>
          {/* Top Branding Tag */}
          <div className="d-flex align-items-center gap-2">
            <span className="badge rounded-pill px-3 py-1.5 fw-bold" style={{
              background: 'rgba(99, 102, 241, 0.15)',
              color: '#818cf8',
              border: '1px solid rgba(99,102,241,0.25)',
              fontSize: '0.78rem'
            }}>
              ⚖️ Decentralized Legal AI Advisor
            </span>
          </div>

          {/* Core Central Title Block */}
          <div style={{ maxWidth: '480px', marginTop: '120px' }}>
            <h1 className="fw-extrabold text-white mb-3" style={{ fontSize: '3rem', letterSpacing: '-1.5px', lineHeight: 1.1 }}>
              CitizenLex Intelligence
            </h1>
            <p className="text-secondary mb-4" style={{ fontSize: '1.05rem', lineHeight: 1.65 }}>
              Simplifying legal systems, scanning documentation contracts, and resolving public welfare schemes instantly.
            </p>
            <div className="d-flex gap-2">
              <span className="badge bg-glass border px-3 py-2 small rounded text-white-50"><i className="bi bi-cpu-fill text-warning me-1"></i> NLP Models</span>
              <span className="badge bg-glass border px-3 py-2 small rounded text-white-50"><i className="bi bi-shield-check text-success me-1"></i> Data Lock</span>
            </div>
          </div>

          {/* Bottom Footer Notice */}
          <div className="text-secondary small">
            © 2026 CitizenLex. Security-centric legal AI platform.
          </div>
        </div>

        {/* Right Side: Centered Premium Authentication Card Column */}
        <div className="col-lg-5 col-12 d-flex align-items-center justify-content-center p-4 p-md-5">
          <div className="auth-content-wrapper w-100" style={{ maxWidth: '440px', minHeight: 'auto', padding: 0 }}>
            {/* Premium Frosted Glass Card with shimmery gradient outline */}
            <div className="glass-premium-card shimmer-border w-100" style={{ padding: '44px 36px' }}>
              
              {/* Header Logo */}
              <div className="text-center mb-4">
                <div className="auth-logo-icon mx-auto mb-3" style={{
                  width: '58px',
                  height: '58px',
                  borderRadius: '16px',
                  background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 8px 24px rgba(99, 102, 241, 0.3)',
                  transform: 'rotate(-4deg)',
                  transition: 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'rotate(4deg) scale(1.05)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'rotate(-4deg) scale(1)'}
                >
                  <i className="bi bi-balance2 text-white" style={{ fontSize: '1.65rem' }}></i>
                </div>
                <h3 className="fw-extrabold text-white mb-1" style={{ letterSpacing: '-0.8px', fontSize: '1.8rem' }}>CitizenLex</h3>
                <p className="text-secondary small">Sign in to command center</p>
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
                <div className="mb-3.5 text-start">
                  <label htmlFor="login-email" className="form-label fw-bold small text-secondary mb-1">Email Address</label>
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
                      placeholder="name@domain.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      style={{
                        paddingLeft: '48px',
                        height: '48px',
                        borderRadius: '12px',
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        color: '#fff',
                        transition: 'all 0.3s'
                      }}
                      onFocus={e => {
                        e.target.style.background = 'rgba(255, 255, 255, 0.05)';
                        e.target.style.borderColor = '#6366f1';
                        e.target.style.boxShadow = '0 0 12px rgba(99, 102, 241, 0.2)';
                      }}
                      onBlur={e => {
                        e.target.style.background = 'rgba(255, 255, 255, 0.02)';
                        e.target.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="mb-3.5 text-start">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <label htmlFor="login-password" className="form-label fw-bold small text-secondary mb-0">Password</label>
                    <Link to="/forgot-password" style={{ color: '#6366f1', fontSize: '0.78rem', textDecoration: 'none', fontWeight: '600' }}>
                      Reset?
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
                        height: '48px',
                        borderRadius: '12px',
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        color: '#fff',
                        transition: 'all 0.3s'
                      }}
                      onFocus={e => {
                        e.target.style.background = 'rgba(255, 255, 255, 0.05)';
                        e.target.style.borderColor = '#6366f1';
                        e.target.style.boxShadow = '0 0 12px rgba(99, 102, 241, 0.2)';
                      }}
                      onBlur={e => {
                        e.target.style.background = 'rgba(255, 255, 255, 0.02)';
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
                      <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`} style={{ fontSize: '1.15rem' }}></i>
                    </button>
                  </div>
                </div>

                {/* Remember Me */}
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
                      Keep me signed in
                    </label>
                  </div>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  id="login-submit-btn"
                  className="btn w-100 d-flex justify-content-center align-items-center text-white fw-bold"
                  disabled={loading}
                  style={{
                    height: '48px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                    border: 'none',
                    fontSize: '0.96rem',
                    boxShadow: '0 4px 18px rgba(99, 102, 241, 0.35)',
                    transition: 'all 0.3s'
                  }}
                  onMouseEnter={e => {
                    e.target.style.transform = 'translateY(-1px)';
                    e.target.style.boxShadow = '0 8px 24px rgba(99, 102, 241, 0.45)';
                  }}
                  onMouseLeave={e => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 4px 18px rgba(99, 102, 241, 0.35)';
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
                      Sign In to Console
                    </>
                  )}
                </button>
              </form>

              {/* Social authentication divider */}
              <div className="my-4 d-flex align-items-center justify-content-between">
                <hr className="flex-grow-1" style={{ borderColor: 'rgba(255,255,255,0.08)' }} />
                <span className="mx-3 text-secondary small text-uppercase" style={{ letterSpacing: '1px', fontSize: '0.68rem' }}>or continue with</span>
                <hr className="flex-grow-1" style={{ borderColor: 'rgba(255,255,255,0.08)' }} />
              </div>

              <div className="row g-2 mb-4">
                <div className="col-6">
                  <button className="btn w-100 py-2 d-flex align-items-center justify-content-center gap-2"
                    onClick={() => alert("Google SSO simulation.")}
                    style={{ borderRadius: '10px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', color: 'white' }}>
                    <i className="bi bi-google text-danger"></i>
                    <span className="small">Google</span>
                  </button>
                </div>
                <div className="col-6">
                  <button className="btn w-100 py-2 d-flex align-items-center justify-content-center gap-2"
                    onClick={() => alert("GitHub SSO simulation.")}
                    style={{ borderRadius: '10px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', color: 'white' }}>
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
                  Create Account
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
