import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import ThreeDBackground from '../components/ThreeDBackground';

export default function Register() {
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
      padding: '40px 20px'
    }}>
      {/* Background canvas elements */}
      <ThreeDBackground />

      <div className="container-fluid" style={{ maxWidth: '1200px', position: 'relative', zIndex: 10 }}>
        {/* Unified Side-by-Side Split Grid */}
        <div className="row g-4 align-items-stretch">
          
          {/* ===================================================================
              LEFT PANEL: LOGIN CARD
              =================================================================== */}
          <div className="col-lg-6 col-12">
            <div className="glass-premium-card shimmer-border h-100 d-flex flex-column justify-content-between" style={{
              padding: '36px 28px',
              background: 'rgba(8, 10, 24, 0.45)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '24px',
              backdropFilter: 'blur(35px)',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.4)'
            }}>
              <div>
                {/* Header Logo */}
                <div className="d-flex align-items-center gap-2 mb-4">
                  <div className="d-flex align-items-center justify-content-center rounded-3" style={{
                    width: '38px',
                    height: '38px',
                    background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                    boxShadow: '0 4px 12px rgba(99,102,241,0.35)'
                  }}>
                    <i className="bi bi-balance2 text-white" style={{ fontSize: '1.15rem' }}></i>
                  </div>
                  <div className="text-start">
                    <h6 className="text-white fw-bold mb-0" style={{ fontSize: '0.88rem', letterSpacing: '0.5px' }}>CITIZENLEX</h6>
                    <span className="text-secondary small" style={{ fontSize: '0.65rem', opacity: 0.7 }}>AI LEGAL ASSISTANT</span>
                  </div>
                </div>

                {/* Welcome Title */}
                <div className="text-start mb-4">
                  <h2 className="fw-extrabold mb-1" style={{
                    fontSize: '1.9rem',
                    letterSpacing: '-0.8px',
                    background: 'linear-gradient(135deg, #3b82f6 0%, #a855f7 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}>Welcome Back</h2>
                  <p className="text-secondary small">Sign in to continue your legal journey</p>
                </div>

                {loginError && (
                  <div className="alert alert-danger d-flex align-items-center mb-4 border-0" role="alert"
                    style={{ background: 'rgba(239, 68, 68, 0.12)', color: '#ef4444', borderRadius: '12px', padding: '12px 16px', fontSize: '0.85rem' }}>
                    <i className="bi bi-exclamation-octagon-fill me-2 fs-5"></i>
                    <div className="text-start">{loginError}</div>
                  </div>
                )}

                {/* Form Fields */}
                <form onSubmit={handleLoginSubmit}>
                  <div className="mb-3 text-start">
                    <label className="form-label fw-bold small text-secondary mb-1">Email Address</label>
                    <div className="input-group-auth" style={{ position: 'relative' }}>
                      <i className="bi bi-envelope input-icon" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', zIndex: 3 }}></i>
                      <input
                        type="email"
                        className="form-control form-glass-control"
                        placeholder="you@domain.com"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        required
                        style={{ paddingLeft: '48px', height: '48px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff' }}
                      />
                    </div>
                  </div>

                  <div className="mb-3 text-start">
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
                        placeholder="••••••••"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        required
                        style={{ paddingLeft: '48px', paddingRight: '48px', height: '48px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff' }}
                      />
                      <button
                        type="button"
                        className="input-toggle-btn"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                        tabIndex={-1}
                        style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#9ca3af', zIndex: 3, cursor: 'pointer' }}
                      >
                        <i className={`bi ${showLoginPassword ? 'bi-eye-slash' : 'bi-eye'}`} style={{ fontSize: '1.15rem' }}></i>
                      </button>
                    </div>
                  </div>

                  <button type="submit" className="btn w-100 py-3 mt-3 d-flex align-items-center justify-content-center gap-2 text-white fw-bold" disabled={loginLoading} style={{
                    height: '48px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #3b82f6 0%, #a855f7 100%)',
                    border: 'none',
                    fontSize: '0.95rem',
                    boxShadow: '0 4px 18px rgba(99, 102, 241, 0.35)'
                  }}>
                    <span>{loginLoading ? 'Authenticating...' : 'Sign In'}</span>
                    <i className="bi bi-arrow-right"></i>
                  </button>
                </form>

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
                      onClick={() => alert("Apple SSO simulation.")}
                      style={{ borderRadius: '10px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', color: 'white' }}>
                      <i className="bi bi-apple text-white"></i>
                      <span className="small">Apple</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Left illustration inside card */}
              <div>
                <div className="d-flex flex-column align-items-center justify-content-center p-3 mt-4 position-relative" style={{
                  background: 'rgba(99, 102, 241, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  borderRadius: '16px',
                  minHeight: '140px',
                  overflow: 'hidden'
                }}>
                  <svg width="70" height="70" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M50 15 V85" stroke="#6366f1" strokeWidth="4" strokeLinecap="round" />
                    <path d="M20 35 H80" stroke="#6366f1" strokeWidth="5" strokeLinecap="round" />
                    <path d="M20 35 L10 70 H30 Z" stroke="#f59e0b" strokeWidth="2.5" fill="rgba(245,158,11,0.05)" strokeLinejoin="round" />
                    <path d="M80 35 L70 70 H90 Z" stroke="#f59e0b" strokeWidth="2.5" fill="rgba(245,158,11,0.05)" strokeLinejoin="round" />
                    <path d="M35 85 H65" stroke="#6366f1" strokeWidth="4" strokeLinecap="round" />
                  </svg>
                  <div className="position-absolute w-100 h-100" style={{ pointerEvents: 'none' }}>
                    <i className="bi bi-file-earmark-text text-primary position-absolute" style={{ top: '20px', left: '30px', fontSize: '1rem', opacity: 0.7 }}></i>
                    <i className="bi bi-person-fill text-indigo position-absolute" style={{ top: '20px', right: '30px', fontSize: '1rem', opacity: 0.7 }}></i>
                    <i className="bi bi-shield-fill-check text-success position-absolute" style={{ bottom: '20px', left: '30px', fontSize: '1rem', opacity: 0.7 }}></i>
                    <i className="bi bi-gavel text-warning position-absolute" style={{ bottom: '20px', right: '30px', fontSize: '1rem', opacity: 0.7 }}></i>
                  </div>
                  <span className="small text-secondary fw-bold mt-2" style={{ fontSize: '0.72rem', letterSpacing: '0.5px' }}>GLOWING SCALES OF JUSTICE ENGINE</span>
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

          {/* ===================================================================
              RIGHT PANEL: REGISTER CARD
              =================================================================== */}
          <div className="col-lg-6 col-12">
            <div className="glass-premium-card shimmer-border h-100 d-flex flex-column justify-content-between" style={{
              padding: '36px 28px',
              background: 'rgba(8, 10, 24, 0.45)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '24px',
              backdropFilter: 'blur(35px)',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.4)'
            }}>
              <div>
                {/* Header Logo */}
                <div className="d-flex align-items-center gap-2 mb-4">
                  <div className="d-flex align-items-center justify-content-center rounded-3" style={{
                    width: '38px',
                    height: '38px',
                    background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                    boxShadow: '0 4px 12px rgba(99,102,241,0.35)'
                  }}>
                    <i className="bi bi-balance2 text-white" style={{ fontSize: '1.15rem' }}></i>
                  </div>
                  <div className="text-start">
                    <h6 className="text-white fw-bold mb-0" style={{ fontSize: '0.88rem', letterSpacing: '0.5px' }}>CITIZENLEX</h6>
                    <span className="text-secondary small" style={{ fontSize: '0.65rem', opacity: 0.7 }}>AI LEGAL ASSISTANT</span>
                  </div>
                </div>

                {/* Welcome Title */}
                <div className="text-start mb-4">
                  <h2 className="fw-extrabold mb-1" style={{
                    fontSize: '1.9rem',
                    letterSpacing: '-0.8px',
                    background: 'linear-gradient(135deg, #a855f7 0%, #f59e0b 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}>Create Account</h2>
                  <p className="text-secondary small">Join CitizenLex and empower yourself</p>
                </div>

                {regError && (
                  <div className="alert alert-danger d-flex align-items-center mb-4 border-0" role="alert"
                    style={{ background: 'rgba(239, 68, 68, 0.12)', color: '#ef4444', borderRadius: '12px', padding: '12px 16px', fontSize: '0.85rem' }}>
                    <i className="bi bi-exclamation-triangle-fill me-2 fs-5"></i>
                    <div className="text-start">{regError}</div>
                  </div>
                )}

                {regSuccess && (
                  <div className="alert alert-success d-flex align-items-center mb-4 border-0" role="alert"
                    style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10b981', borderRadius: '12px', padding: '12px 16px', fontSize: '0.85rem' }}>
                    <i className="bi bi-check-circle-fill me-2 fs-5"></i>
                    <div className="text-start">Registration complete! Swapping context...</div>
                  </div>
                )}

                {/* Form Fields */}
                <form onSubmit={handleRegisterSubmit}>
                  {/* Full Name */}
                  <div className="mb-3 text-start">
                    <label className="form-label fw-bold small text-secondary mb-1">Full Name</label>
                    <div className="input-group-auth" style={{ position: 'relative' }}>
                      <i className="bi bi-person input-icon" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', zIndex: 3 }}></i>
                      <input
                        id="reg-fullname"
                        type="text"
                        className="form-control form-glass-control"
                        placeholder="Jane Doe"
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        required
                        style={{ paddingLeft: '48px', height: '44px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff' }}
                      />
                    </div>
                  </div>

                  {/* Email Address */}
                  <div className="mb-3 text-start">
                    <label className="form-label fw-bold small text-secondary mb-1">Email Address</label>
                    <div className="input-group-auth" style={{ position: 'relative' }}>
                      <i className="bi bi-envelope input-icon" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', zIndex: 3 }}></i>
                      <input
                        type="email"
                        className="form-control form-glass-control"
                        placeholder="you@domain.com"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        required
                        style={{ paddingLeft: '48px', height: '44px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff' }}
                      />
                    </div>
                  </div>

                  {/* Mobile Number */}
                  <div className="mb-3 text-start">
                    <label className="form-label fw-bold small text-secondary mb-1">Mobile Number</label>
                    <div className="d-flex gap-2">
                      <select className="form-select text-white border-secondary" style={{
                        maxWidth: '90px',
                        background: 'rgba(8, 10, 24, 0.95)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '12px',
                        fontSize: '0.85rem'
                      }}>
                        <option value="91">+91 (IN)</option>
                      </select>
                      <div className="flex-grow-1 position-relative">
                        <i className="bi bi-telephone position-absolute" style={{ left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', zIndex: 3 }}></i>
                        <input
                          type="tel"
                          className="form-control form-glass-control"
                          placeholder="9876543210"
                          value={regMobile}
                          onChange={(e) => setRegMobile(e.target.value)}
                          required
                          style={{ paddingLeft: '48px', height: '44px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff' }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Password & Confirm */}
                  <div className="row g-2 mb-3">
                    <div className="col-6 text-start">
                      <label className="form-label fw-bold small text-secondary mb-1">Password</label>
                      <div className="input-group-auth" style={{ position: 'relative' }}>
                        <input
                          type={showRegPassword ? 'text' : 'password'}
                          className="form-control form-glass-control"
                          placeholder="••••••••"
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                          required
                          style={{ paddingLeft: '16px', paddingRight: '42px', height: '44px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff' }}
                        />
                        <button
                          type="button"
                          className="input-toggle-btn"
                          onClick={() => setShowRegPassword(!showRegPassword)}
                          tabIndex={-1}
                          style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#9ca3af', zIndex: 3, cursor: 'pointer' }}
                        >
                          <i className={`bi ${showRegPassword ? 'bi-eye-slash' : 'bi-eye'}`} style={{ fontSize: '1.05rem' }}></i>
                        </button>
                      </div>
                    </div>

                    <div className="col-6 text-start">
                      <label className="form-label fw-bold small text-secondary mb-1">Confirm Password</label>
                      <div className="input-group-auth" style={{ position: 'relative' }}>
                        <input
                          type={showRegConfirmPassword ? 'text' : 'password'}
                          className="form-control form-glass-control"
                          placeholder="••••••••"
                          value={regConfirmPassword}
                          onChange={(e) => setRegConfirmPassword(e.target.value)}
                          required
                          style={{ paddingLeft: '16px', paddingRight: '42px', height: '44px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff' }}
                        />
                        <button
                          type="button"
                          className="input-toggle-btn"
                          onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
                          tabIndex={-1}
                          style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#9ca3af', zIndex: 3, cursor: 'pointer' }}
                        >
                          <i className={`bi ${showRegConfirmPassword ? 'bi-eye-slash' : 'bi-eye'}`} style={{ fontSize: '1.05rem' }}></i>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Agree Checkbox */}
                  <div className="form-check text-start mb-3">
                    <input
                      type="checkbox"
                      className="form-check-input bg-transparent border-secondary"
                      id="agreeTermsCheck"
                      checked={agreeTerms}
                      onChange={(e) => setAgreeTerms(e.target.checked)}
                      style={{ cursor: 'pointer' }}
                    />
                    <label className="form-check-label small text-secondary" htmlFor="agreeTermsCheck" style={{ cursor: 'pointer', userSelect: 'none' }}>
                      I agree to the Terms & Conditions and Privacy Policy
                    </label>
                  </div>

                  <button type="submit" className="btn w-100 py-3 d-flex align-items-center justify-content-center gap-2 text-white fw-bold" disabled={regLoading} style={{
                    height: '48px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #a855f7 0%, #f59e0b 100%)',
                    border: 'none',
                    fontSize: '0.95rem',
                    boxShadow: '0 4px 18px rgba(245, 158, 11, 0.25)'
                  }}>
                    <span>{regLoading ? 'Creating Workspace...' : 'Create Account'}</span>
                    <i className="bi bi-arrow-right"></i>
                  </button>
                </form>
              </div>

              {/* Right illustration inside card */}
              <div>
                <div className="d-flex flex-column align-items-center justify-content-center p-3 mt-4 position-relative" style={{
                  background: 'rgba(245, 158, 11, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  borderRadius: '16px',
                  minHeight: '140px',
                  overflow: 'hidden'
                }}>
                  <svg width="70" height="70" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M50 15 L80 25 V55 C80 75 50 85 50 85 C50 85 20 75 20 55 V25 L50 15 Z" stroke="#f59e0b" strokeWidth="4" fill="rgba(245,158,11,0.05)" strokeLinejoin="round" />
                    <path d="M42 42 H58 V70 H42 Z" stroke="#6366f1" strokeWidth="3" />
                    <path d="M50 30 V42" stroke="#6366f1" strokeWidth="3" />
                  </svg>
                  <div className="position-absolute w-100 h-100" style={{ pointerEvents: 'none' }}>
                    <i className="bi bi-person position-absolute" style={{ top: '20px', left: '30px', fontSize: '1rem', opacity: 0.7 }}></i>
                    <i className="bi bi-envelope position-absolute" style={{ top: '20px', right: '30px', fontSize: '1rem', opacity: 0.7 }}></i>
                    <i className="bi bi-lock position-absolute" style={{ bottom: '20px', left: '30px', fontSize: '1rem', opacity: 0.7 }}></i>
                  </div>
                  <span className="small text-secondary fw-bold mt-2" style={{ fontSize: '0.72rem', letterSpacing: '0.5px' }}>SECURE ENCRYPTED SHIELD PLATFORM</span>
                </div>

                <div className="text-center mt-3 text-secondary small">
                  Already have an account?{' '}
                  <span className="fw-bold text-decoration-none text-primary" style={{ cursor: 'pointer' }} onClick={() => document.getElementById('login-email')?.focus()}>
                    Sign in
                  </span>
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
