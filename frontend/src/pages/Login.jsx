import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import ThreeDBackground from '../components/ThreeDBackground';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  // --- Login Form State ---
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // --- Register Form State ---
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regMobile, setRegMobile] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [regError, setRegError] = useState('');
  const [regLoading, setRegLoading] = useState(false);
  const [regSuccess, setRegSuccess] = useState(false);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);

    try {
      const res = await axios.post('/api/auth/login', { email: loginEmail, password: loginPassword });
      login(res.data.accessToken, res.data.user);
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      if (err.response && err.response.data) {
        setLoginError(err.response.data.error || 'Invalid credentials or login failure.');
      } else {
        setLoginError('Connection to backend failed. Please try again.');
      }
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setRegError('');

    if (regPassword !== regConfirmPassword) {
      setRegError('Passwords do not match.');
      return;
    }
    if (!agreeTerms) {
      setRegError('You must agree to the Terms & Conditions.');
      return;
    }

    setRegLoading(true);
    const nameParts = regName.trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    try {
      await axios.post('/api/auth/register', {
        email: regEmail,
        password: regPassword,
        firstName,
        lastName,
        mobile: regMobile,
        smsNotificationsEnabled: true
      });
      setRegSuccess(true);
      setTimeout(() => {
        setRegSuccess(false);
        setRegName('');
        setRegEmail('');
        setRegMobile('');
        setRegPassword('');
        setRegConfirmPassword('');
        setAgreeTerms(false);
        alert("Account registered successfully! You can now log in using the left panel.");
      }, 2000);
    } catch (err) {
      console.error(err);
      if (err.response && err.response.data) {
        setRegError(err.response.data.error || 'Registration failed. Check fields or email availability.');
      } else {
        setRegError('Connection to backend failed. Please try again.');
      }
    } finally {
      setRegLoading(false);
    }
  };

  return (
    <div className="auth-page-wrapper" style={{
      position: 'relative',
      minHeight: '100vh',
      width: '100%',
      overflowY: 'auto',
      overflowX: 'hidden',
      background: 'radial-gradient(circle at 50% 50%, #0a0924 0%, #02020a 100%)',
      padding: '50px 20px'
    }}>
      {/* Cinematic GPU-accelerated animated background */}
      <ThreeDBackground />

      <div className="container-fluid" style={{ maxWidth: '1280px', position: 'relative', zIndex: 10 }}>
        
        {/* ===================================================================
            HERO TEXT (TOP CENTER)
            =================================================================== */}
        <div className="text-center mb-5 fade-in-el">
          {/* Logo Header */}
          <div className="d-flex align-items-center justify-content-center gap-2 mb-3">
            <div className="d-flex align-items-center justify-content-center rounded-3" style={{
              width: '42px',
              height: '42px',
              background: 'linear-gradient(135deg, #6366f1, #a855f7)',
              boxShadow: '0 4px 14px rgba(99,102,241,0.35)',
              transform: 'rotate(-4deg)'
            }}>
              <i className="bi bi-balance2 text-white" style={{ fontSize: '1.25rem' }}></i>
            </div>
            <div className="text-start">
              <h5 className="text-white fw-bold mb-0" style={{ fontSize: '0.96rem', letterSpacing: '1px' }}>CITIZENLEX</h5>
              <span className="text-secondary small" style={{ fontSize: '0.7rem', opacity: 0.8, letterSpacing: '0.5px' }}>AI LEGAL ASSISTANT</span>
            </div>
          </div>

          {/* Large Title */}
          <h1 className="fw-extrabold text-white mb-2" style={{
            fontSize: '2.5rem',
            letterSpacing: '-1.5px',
            background: 'linear-gradient(135deg, #3b82f6 0%, #a855f7 50%, #ec4899 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            lineHeight: 1.15
          }}>
            Next Generation Legal Platform
          </h1>
          <p className="text-secondary mb-0 fw-semibold" style={{ fontSize: '1.05rem', letterSpacing: '0.5px' }}>
            Empowering Citizens. Simplifying Justice. Powered by AI.
          </p>
        </div>

        {/* ===================================================================
            SIDE-BY-SIDE EQUAL PANELS LAYOUT
            =================================================================== */}
        <div className="row g-4 align-items-stretch">
          
          {/* -----------------------------------------------------------------
              LEFT CARD: LOGIN CARD
              ----------------------------------------------------------------- */}
          <div className="col-lg-6 col-12">
            <div className="glass-premium-card shimmer-border h-100 p-4 d-flex flex-column justify-content-between" style={{
              minHeight: '620px',
              background: 'rgba(8, 10, 24, 0.48)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '26px',
              backdropFilter: 'blur(45px)',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.55), inset 0 1px 0 rgba(255,255,255,0.1)'
            }}>
              
              <div className="row g-3 h-100">
                {/* Left side inside card: 3D scale illustration */}
                <div className="col-md-6 d-none d-md-flex flex-column align-items-center justify-content-center position-relative" style={{
                  borderRight: '1px solid rgba(255,255,255,0.05)',
                  paddingRight: '24px'
                }}>
                  {/* Glowing 3D Scale Representation */}
                  <div className="scale-container text-center w-100">
                    {/* Ring glow light */}
                    <div className="position-absolute" style={{
                      width: '140px',
                      height: '140px',
                      background: 'radial-gradient(circle, rgba(99,102,241,0.2) 0%, transparent 70%)',
                      top: '40%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      filter: 'blur(10px)',
                      pointerEvents: 'none'
                    }} />

                    {/* Scale SVG drawing */}
                    <svg width="150" height="150" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ filter: 'drop-shadow(0 0 12px rgba(99, 102, 241, 0.5))' }}>
                      {/* Stand base & column */}
                      <path d="M50 15 V85" stroke="#6366f1" strokeWidth="3" strokeLinecap="round" />
                      {/* Tilting Beam */}
                      <path d="M25 35 L75 35" stroke="#6366f1" strokeWidth="4" strokeLinecap="round" />
                      {/* Left hanger */}
                      <path d="M25 35 L12 70 H38 L25 35" stroke="#f59e0b" strokeWidth="2" strokeLinejoin="round" fill="rgba(245,158,11,0.03)" />
                      {/* Right hanger */}
                      <path d="M75 35 L62 70 H88 L75 35" stroke="#f59e0b" strokeWidth="2" strokeLinejoin="round" fill="rgba(245,158,11,0.03)" />
                      {/* Bottom pedestal stand */}
                      <path d="M35 85 H65" stroke="#6366f1" strokeWidth="4.5" strokeLinecap="round" />
                    </svg>

                    {/* Circular glowing platform base line */}
                    <div className="mx-auto mt-2" style={{
                      width: '120px',
                      height: '12px',
                      borderRadius: '50%',
                      border: '2px solid rgba(99,102,241,0.4)',
                      boxShadow: '0 0 15px rgba(99,102,241,0.6)',
                      background: 'rgba(99,102,241,0.1)'
                    }} />

                    {/* Floating square hologram icon tags */}
                    <div className="position-absolute" style={{
                      top: '15%',
                      left: '20px',
                      width: '32px',
                      height: '32px',
                      background: 'rgba(99,102,241,0.15)',
                      border: '1px solid rgba(99,102,241,0.3)',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 0 10px rgba(99,102,241,0.3)'
                    }}>
                      <i className="bi bi-file-earmark-text text-white small"></i>
                    </div>

                    <div className="position-absolute" style={{
                      top: '15%',
                      right: '20px',
                      width: '32px',
                      height: '32px',
                      background: 'rgba(99,102,241,0.15)',
                      border: '1px solid rgba(99,102,241,0.3)',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 0 10px rgba(99,102,241,0.3)'
                    }}>
                      <i className="bi bi-person text-white small"></i>
                    </div>

                    <div className="position-absolute" style={{
                      bottom: '25%',
                      left: '20px',
                      width: '32px',
                      height: '32px',
                      background: 'rgba(99,102,241,0.15)',
                      border: '1px solid rgba(99,102,241,0.3)',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 0 10px rgba(99,102,241,0.3)'
                    }}>
                      <i className="bi bi-shield-check text-white small"></i>
                    </div>

                    <div className="position-absolute" style={{
                      bottom: '25%',
                      right: '20px',
                      width: '32px',
                      height: '32px',
                      background: 'rgba(99,102,241,0.15)',
                      border: '1px solid rgba(99,102,241,0.3)',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 0 10px rgba(99,102,241,0.3)'
                    }}>
                      <i className="bi bi-gavel text-white small"></i>
                    </div>

                    <span className="small text-secondary fw-bold mt-4 d-block" style={{ fontSize: '0.72rem', letterSpacing: '0.5px' }}>GLOWING SCALES OF JUSTICE</span>
                  </div>
                </div>

                {/* Right side inside card: Form inputs */}
                <div className="col-md-6 col-12 d-flex flex-column justify-content-between text-start" style={{ paddingLeft: '24px' }}>
                  <div>
                    {/* Welcome Header */}
                    <div className="mb-4">
                      <h3 className="fw-extrabold mb-1" style={{
                        fontSize: '1.9rem',
                        letterSpacing: '-0.8px',
                        background: 'linear-gradient(135deg, #3b82f6 0%, #a855f7 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text'
                      }}>Welcome Back</h3>
                      <p className="text-secondary small">Sign in to continue your legal journey</p>
                    </div>

                    {loginError && (
                      <div className="alert alert-danger d-flex align-items-center mb-3 border-0" role="alert"
                        style={{ background: 'rgba(239, 68, 68, 0.12)', color: '#ef4444', borderRadius: '12px', padding: '10px 14px', fontSize: '0.8rem' }}>
                        <i className="bi bi-exclamation-octagon-fill me-2 fs-6"></i>
                        <div>{loginError}</div>
                      </div>
                    )}

                    <form onSubmit={handleLoginSubmit}>
                      {/* Email */}
                      <div className="mb-3">
                        <label className="form-label fw-bold small text-secondary mb-1">Email Address</label>
                        <div className="input-group-auth" style={{ position: 'relative' }}>
                          <i className="bi bi-envelope input-icon" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', zIndex: 3 }}></i>
                          <input
                            type="email"
                            className="form-control form-glass-control"
                            placeholder="Enter your email"
                            value={loginEmail}
                            onChange={(e) => setLoginEmail(e.target.value)}
                            required
                            style={{ paddingLeft: '48px', height: '44px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff' }}
                          />
                        </div>
                      </div>

                      {/* Password */}
                      <div className="mb-3">
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <label className="form-label fw-bold small text-secondary mb-0">Password</label>
                          <Link to="/forgot-password" style={{ color: '#6366f1', fontSize: '0.78rem', textDecoration: 'none', fontWeight: '600' }}>
                            Forgot Password?
                          </Link>
                        </div>
                        <div className="input-group-auth" style={{ position: 'relative' }}>
                          <i className="bi bi-lock input-icon" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', zIndex: 3 }}></i>
                          <input
                            type={showLoginPassword ? 'text' : 'password'}
                            className="form-control form-glass-control"
                            placeholder="Enter your password"
                            value={loginPassword}
                            onChange={(e) => setLoginPassword(e.target.value)}
                            required
                            style={{ paddingLeft: '48px', paddingRight: '48px', height: '44px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff' }}
                          />
                          <button
                            type="button"
                            className="input-toggle-btn"
                            onClick={() => setShowLoginPassword(!showLoginPassword)}
                            tabIndex={-1}
                            style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#9ca3af', zIndex: 3, cursor: 'pointer' }}
                          >
                            <i className={`bi ${showLoginPassword ? 'bi-eye-slash' : 'bi-eye'}`} style={{ fontSize: '1.05rem' }}></i>
                          </button>
                        </div>
                      </div>

                      {/* Submit */}
                      <button type="submit" className="btn w-100 py-2.5 mt-2 d-flex align-items-center justify-content-center gap-2 text-white fw-bold" disabled={loginLoading} style={{
                        height: '44px',
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, #3b82f6 0%, #a855f7 100%)',
                        border: 'none',
                        fontSize: '0.9rem',
                        boxShadow: '0 4px 18px rgba(99, 102, 241, 0.35)'
                      }}>
                        <span>{loginLoading ? 'Sign In...' : 'Sign In'}</span>
                        <i className="bi bi-arrow-right"></i>
                      </button>
                    </form>

                    {/* Divider */}
                    <div className="my-3 d-flex align-items-center justify-content-between">
                      <hr className="flex-grow-1" style={{ borderColor: 'rgba(255,255,255,0.08)' }} />
                      <span className="mx-3 text-secondary small text-uppercase" style={{ letterSpacing: '1px', fontSize: '0.65rem' }}>or continue with</span>
                      <hr className="flex-grow-1" style={{ borderColor: 'rgba(255,255,255,0.08)' }} />
                    </div>

                    {/* Social OAuth */}
                    <div className="row g-2 mb-3">
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
                          onClick={() => alert("Apple SSO simulation.")}
                          style={{ borderRadius: '10px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', color: 'white' }}>
                          <i className="bi bi-apple text-white"></i>
                          <span className="small">Apple</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="text-center mt-3 text-secondary small">
                    New to CitizenLex?{' '}
                    <span className="fw-bold text-decoration-none text-primary" style={{ cursor: 'pointer' }} onClick={() => document.getElementById('reg-fullname')?.focus()}>
                      Create an account
                    </span>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* -----------------------------------------------------------------
              RIGHT CARD: REGISTER CARD
              ----------------------------------------------------------------- */}
          <div className="col-lg-6 col-12">
            <div className="glass-premium-card shimmer-border h-100 p-4 d-flex flex-column justify-content-between" style={{
              minHeight: '620px',
              background: 'rgba(8, 10, 24, 0.48)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '26px',
              backdropFilter: 'blur(45px)',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.55), inset 0 1px 0 rgba(255,255,255,0.1)'
            }}>
              
              <div className="row g-3 h-100">
                {/* Left half inside card: Form inputs */}
                <div className="col-md-6 col-12 d-flex flex-column justify-content-between text-start" style={{ paddingRight: '24px' }}>
                  <div>
                    {/* Register Header */}
                    <div className="mb-4">
                      <h3 className="fw-extrabold mb-1" style={{
                        fontSize: '1.9rem',
                        letterSpacing: '-0.8px',
                        background: 'linear-gradient(135deg, #a855f7 0%, #f59e0b 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text'
                      }}>Create Account</h3>
                      <p className="text-secondary small">Join CitizenLex and empower yourself</p>
                    </div>

                    {regError && (
                      <div className="alert alert-danger d-flex align-items-center mb-3 border-0" role="alert"
                        style={{ background: 'rgba(239, 68, 68, 0.12)', color: '#ef4444', borderRadius: '12px', padding: '10px 14px', fontSize: '0.8rem' }}>
                        <i className="bi bi-exclamation-triangle-fill me-2 fs-6"></i>
                        <div>{regError}</div>
                      </div>
                    )}

                    {regSuccess && (
                      <div className="alert alert-success d-flex align-items-center mb-3 border-0" role="alert"
                        style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10b981', borderRadius: '12px', padding: '10px 14px', fontSize: '0.8rem' }}>
                        <i className="bi bi-check-circle-fill me-2 fs-6"></i>
                        <div>Registration complete!</div>
                      </div>
                    )}

                    <form onSubmit={handleRegisterSubmit}>
                      {/* Name */}
                      <div className="mb-2.5">
                        <label className="form-label fw-bold small text-secondary mb-0.5">Full Name</label>
                        <div className="input-group-auth" style={{ position: 'relative' }}>
                          <i className="bi bi-person input-icon" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', zIndex: 3 }}></i>
                          <input
                            id="reg-fullname"
                            type="text"
                            className="form-control form-glass-control"
                            placeholder="Enter your full name"
                            value={regName}
                            onChange={(e) => setRegName(e.target.value)}
                            required
                            style={{ paddingLeft: '48px', height: '40px', borderRadius: '10px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', fontSize: '0.86rem' }}
                          />
                        </div>
                      </div>

                      {/* Email */}
                      <div className="mb-2.5">
                        <label className="form-label fw-bold small text-secondary mb-0.5">Email Address</label>
                        <div className="input-group-auth" style={{ position: 'relative' }}>
                          <i className="bi bi-envelope input-icon" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', zIndex: 3 }}></i>
                          <input
                            type="email"
                            className="form-control form-glass-control"
                            placeholder="Enter your email"
                            value={regEmail}
                            onChange={(e) => setRegEmail(e.target.value)}
                            required
                            style={{ paddingLeft: '48px', height: '40px', borderRadius: '10px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', fontSize: '0.86rem' }}
                          />
                        </div>
                      </div>

                      {/* Mobile */}
                      <div className="mb-2.5">
                        <label className="form-label fw-bold small text-secondary mb-0.5">Mobile Number</label>
                        <div className="d-flex gap-2">
                          <select className="form-select text-white border-secondary" style={{
                            maxWidth: '85px',
                            background: 'rgba(8, 10, 24, 0.95)',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            borderRadius: '10px',
                            fontSize: '0.8rem',
                            height: '40px'
                          }}>
                            <option value="91">+91 (IN)</option>
                          </select>
                          <div className="flex-grow-1 position-relative">
                            <i className="bi bi-telephone position-absolute" style={{ left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', zIndex: 3 }}></i>
                            <input
                              type="tel"
                              className="form-control form-glass-control"
                              placeholder="Enter your mobile number"
                              value={regMobile}
                              onChange={(e) => setRegMobile(e.target.value)}
                              required
                              style={{ paddingLeft: '48px', height: '40px', borderRadius: '10px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', fontSize: '0.86rem' }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Passwords */}
                      <div className="row g-2 mb-2.5">
                        <div className="col-6">
                          <label className="form-label fw-bold small text-secondary mb-0.5">Password</label>
                          <div className="input-group-auth" style={{ position: 'relative' }}>
                            <input
                              type={showRegPassword ? 'text' : 'password'}
                              className="form-control form-glass-control"
                              placeholder="Password"
                              value={regPassword}
                              onChange={(e) => setRegPassword(e.target.value)}
                              required
                              style={{ paddingLeft: '12px', paddingRight: '38px', height: '40px', borderRadius: '10px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', fontSize: '0.85rem' }}
                            />
                            <button
                              type="button"
                              className="input-toggle-btn"
                              onClick={() => setShowRegPassword(!showRegPassword)}
                              tabIndex={-1}
                              style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#9ca3af', zIndex: 3, cursor: 'pointer' }}
                            >
                              <i className={`bi ${showRegPassword ? 'bi-eye-slash' : 'bi-eye'}`} style={{ fontSize: '1rem' }}></i>
                            </button>
                          </div>
                        </div>

                        <div className="col-6">
                          <label className="form-label fw-bold small text-secondary mb-0.5">Confirm Password</label>
                          <div className="input-group-auth" style={{ position: 'relative' }}>
                            <input
                              type={showRegConfirmPassword ? 'text' : 'password'}
                              className="form-control form-glass-control"
                              placeholder="Confirm"
                              value={regConfirmPassword}
                              onChange={(e) => setRegConfirmPassword(e.target.value)}
                              required
                              style={{ paddingLeft: '12px', paddingRight: '38px', height: '40px', borderRadius: '10px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', fontSize: '0.85rem' }}
                            />
                            <button
                              type="button"
                              className="input-toggle-btn"
                              onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
                              tabIndex={-1}
                              style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#9ca3af', zIndex: 3, cursor: 'pointer' }}
                            >
                              <i className={`bi ${showRegConfirmPassword ? 'bi-eye-slash' : 'bi-eye'}`} style={{ fontSize: '1rem' }}></i>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Checkbox */}
                      <div className="form-check text-start mb-3">
                        <input
                          type="checkbox"
                          className="form-check-input bg-transparent border-secondary"
                          id="agreeTermsCheck"
                          checked={agreeTerms}
                          onChange={(e) => setAgreeTerms(e.target.checked)}
                          style={{ cursor: 'pointer' }}
                        />
                        <label className="form-check-label small text-secondary" htmlFor="agreeTermsCheck" style={{ cursor: 'pointer', userSelect: 'none', fontSize: '0.75rem' }}>
                          I agree to the Terms & Conditions and Privacy Policy
                        </label>
                      </div>

                      {/* Submit */}
                      <button type="submit" className="btn w-100 py-2 d-flex align-items-center justify-content-center gap-2 text-white fw-bold" disabled={regLoading} style={{
                        height: '42px',
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, #a855f7 0%, #f59e0b 100%)',
                        border: 'none',
                        fontSize: '0.88rem',
                        boxShadow: '0 4px 18px rgba(245, 158, 11, 0.25)'
                      }}>
                        <span>{regLoading ? 'Creating Workspace...' : 'Create Account'}</span>
                        <i className="bi bi-arrow-right"></i>
                      </button>
                    </form>
                  </div>

                  <div className="text-center mt-3 text-secondary small">
                    Already have an account?{' '}
                    <span className="fw-bold text-decoration-none text-primary" style={{ cursor: 'pointer' }} onClick={() => document.getElementById('login-email')?.focus()}>
                      Sign in
                    </span>
                  </div>
                </div>

                {/* Right half inside card: 3D shield illustration */}
                <div className="col-md-6 d-none d-md-flex flex-column align-items-center justify-content-center position-relative" style={{
                  borderLeft: '1px solid rgba(255,255,255,0.05)',
                  paddingLeft: '24px'
                }}>
                  {/* Glowing 3D Shield Representation */}
                  <div className="shield-container text-center w-100">
                    <div className="position-absolute" style={{
                      width: '140px',
                      height: '140px',
                      background: 'radial-gradient(circle, rgba(245,158,11,0.18) 0%, transparent 70%)',
                      top: '40%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      filter: 'blur(10px)',
                      pointerEvents: 'none'
                    }} />

                    {/* Shield SVG drawing */}
                    <svg width="150" height="150" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ filter: 'drop-shadow(0 0 12px rgba(245, 158, 11, 0.5))' }}>
                      {/* Shield Outline */}
                      <path d="M50 15 L80 25 V55 C80 75 50 85 50 85 C50 85 20 75 20 55 V25 Z" stroke="#f59e0b" strokeWidth="4.5" fill="rgba(245,158,11,0.06)" strokeLinejoin="round" />
                      {/* Inner Courthouse Pillar design */}
                      <path d="M42 42 H58 V70 H42 Z" stroke="#6366f1" strokeWidth="2.5" />
                      <path d="M50 30 V42" stroke="#6366f1" strokeWidth="2.5" />
                      {/* Column base */}
                      <path d="M38 70 H62" stroke="#6366f1" strokeWidth="3" />
                    </svg>

                    {/* Circular glowing platform base line */}
                    <div className="mx-auto mt-2" style={{
                      width: '120px',
                      height: '12px',
                      borderRadius: '50%',
                      border: '2px solid rgba(245,158,11,0.4)',
                      boxShadow: '0 0 15px rgba(245,158,11,0.6)',
                      background: 'rgba(245,158,11,0.1)'
                    }} />

                    {/* Orbit lines & floating circle icons */}
                    <div className="position-absolute" style={{
                      top: '20%',
                      left: '25px',
                      width: '32px',
                      height: '32px',
                      background: 'rgba(245,158,11,0.12)',
                      border: '1px solid rgba(245,158,11,0.3)',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 0 10px rgba(245,158,11,0.3)'
                    }}>
                      <i className="bi bi-person text-white small"></i>
                    </div>

                    <div className="position-absolute" style={{
                      top: '20%',
                      right: '25px',
                      width: '32px',
                      height: '32px',
                      background: 'rgba(245,158,11,0.12)',
                      border: '1px solid rgba(245,158,11,0.3)',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 0 10px rgba(245,158,11,0.3)'
                    }}>
                      <i className="bi bi-envelope text-white small"></i>
                    </div>

                    <span className="small text-secondary fw-bold mt-4 d-block" style={{ fontSize: '0.72rem', letterSpacing: '0.5px' }}>SECURE ENCRYPTED SHIELD</span>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* ===================================================================
            BOTTOM FEATURE STRIP (SHARED)
            =================================================================== */}
        <div className="row g-3 justify-content-center mt-5 px-3">
          {[
            { icon: 'bi-cpu-fill', title: 'AI Powered', desc: 'Smart Legal Assistance', color: '#6366f1' },
            { icon: 'bi-shield-fill-check', title: 'Secure & Private', desc: 'Your data is protected', color: '#10b981' },
            { icon: 'bi-chat-right-text-fill', title: 'Real-time Support', desc: '24/7 AI Assistance', color: '#f59e0b' },
            { icon: 'bi-people-fill', title: 'Trusted by Millions', desc: 'Join our legal community', color: '#ec4899' },
          ].map((b, idx) => (
            <div key={idx} className="col-12 col-sm-6 col-lg-3">
              <div className="d-flex align-items-center gap-3 p-3 rounded-4 animate-hover" style={{
                background: 'rgba(8, 10, 24, 0.45)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                backdropFilter: 'blur(20px)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
              }}>
                <div className="d-flex align-items-center justify-content-center rounded-3" style={{
                  width: '42px',
                  height: '42px',
                  background: `${b.color}15`,
                  color: b.color,
                  fontSize: '1.25rem',
                  border: `1px solid ${b.color}30`
                }}>
                  <i className={`bi ${b.icon}`}></i>
                </div>
                <div className="text-start">
                  <h6 className="text-white fw-bold mb-0.5" style={{ fontSize: '0.85rem' }}>{b.title}</h6>
                  <p className="text-secondary mb-0" style={{ fontSize: '0.72rem', opacity: 0.85 }}>{b.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Centered Small Footer */}
        <div className="text-center mt-5 text-secondary small" style={{ opacity: 0.7 }}>
          © 2025 CitizenLex. All rights reserved.
        </div>
      </div>
    </div>
  );
}
