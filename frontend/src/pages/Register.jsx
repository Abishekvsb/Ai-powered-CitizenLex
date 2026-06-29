import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import ThreeDBackground from '../components/ThreeDBackground';

export default function Register() {
  const [step, setStep] = useState(1);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [smsOptIn, setSmsOptIn] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [registered, setRegistered] = useState(false);
  const navigate = useNavigate();

  const getPasswordStrength = () => {
    if (!password) return { score: 0, text: 'No Password Entered', color: '#9ca3af', width: '0%' };
    if (password.length < 6) return { score: 1, text: 'Too Short (Min 6)', color: '#ef4444', width: '25%' };
    
    const hasNum = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const hasAlpha = /[a-zA-Z]/.test(password);

    if (hasNum && hasSpecial && hasAlpha) {
      return { score: 3, text: 'Strong & Secure!', color: '#10b981', width: '100%' };
    }
    return { score: 2, text: 'Medium Complexity', color: '#f59e0b', width: '60%' };
  };

  const handleNextStep = (e) => {
    e.preventDefault();
    setError('');

    if (step === 1) {
      if (!firstName.trim() || !lastName.trim()) {
        setError('Please enter both your first name and last name.');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!email.trim() || !email.includes('@')) {
        setError('Please enter a valid email address.');
        return;
      }
      if (password.length < 6) {
        setError('Password must contain at least 6 characters.');
        return;
      }
      setStep(3);
    } else if (step === 3) {
      handleFinalRegister();
    }
  };

  const handleBackStep = () => {
    setError('');
    setStep(prev => Math.max(1, prev - 1));
  };

  const handleFinalRegister = async () => {
    setError('');
    setLoading(true);

    try {
      await axios.post('/api/auth/register', { 
        email, 
        password, 
        firstName, 
        lastName,
        smsNotificationsEnabled: smsOptIn
      });
      setRegistered(true);
      setStep(4);
      setTimeout(() => {
        navigate('/login');
      }, 3500);
    } catch (err) {
      console.error(err);
      if (err.response && err.response.data) {
        setError(err.response.data.error || 'Registration failed. Check fields or email availability.');
      } else {
        setError('Connection to backend failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const passwordInfo = getPasswordStrength();

  return (
    <div className="auth-page-wrapper" style={{
      position: 'relative',
      minHeight: '100vh',
      width: '100%',
      overflowX: 'hidden',
      background: 'radial-gradient(circle at 30% 30%, #0c0b24 0%, #020208 100%)'
    }}>
      {/* 3D background element */}
      <ThreeDBackground />

      {/* Decorative premium aurora glows */}
      <div className="glow-orb" style={{
        top: '20%',
        left: '15%',
        width: '350px',
        height: '350px',
        background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)',
      }} />

      {/* Confetti Animation nodes for step 4 success */}
      {registered && (
        <div className="confetti-container" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 15 }}>
          {Array.from({ length: 40 }).map((_, i) => {
            const left = Math.random() * 100;
            const delay = Math.random() * 2;
            const duration = Math.random() * 2 + 2;
            const size = Math.random() * 8 + 6;
            const colors = ['#6366f1', '#a855f7', '#10b981', '#f59e0b', '#ec4899', '#06b6d4'];
            const bg = colors[i % colors.length];
            return (
              <div key={i} style={{
                position: 'absolute',
                left: `${left}%`,
                top: `-20px`,
                width: size,
                height: size,
                borderRadius: '50%',
                background: bg,
                opacity: 0.8,
                animation: `confetti-fall ${duration}s linear ${delay}s infinite`
              }} />
            );
          })}
          <style>{`
            @keyframes confetti-fall {
              0% { transform: translateY(0) rotate(0deg); opacity: 1; }
              100% { transform: translateY(100vh) rotate(360deg); opacity: 0; }
            }
          `}</style>
        </div>
      )}

      {/* Split Screen Grid */}
      <div className="row g-0 min-vh-100 position-relative" style={{ zIndex: 10 }}>
        {/* Left Side: Cinematic Atmospheric Visuals Column */}
        <div className="col-lg-7 d-none d-lg-flex flex-column justify-content-between p-5 text-start">
          <div>
            <span className="badge rounded-pill px-3 py-1.5 fw-bold" style={{
              background: 'rgba(99, 102, 241, 0.15)',
              color: '#818cf8',
              border: '1px solid rgba(99,102,241,0.25)',
              fontSize: '0.78rem'
            }}>
              ⚖️ Decentralized Legal AI Advisor
            </span>
          </div>

          <div style={{ maxWidth: '480px', marginTop: '120px' }}>
            <h1 className="fw-extrabold text-white mb-3" style={{ fontSize: '3rem', letterSpacing: '-1.5px', lineHeight: 1.1 }}>
              Secure Onboarding
            </h1>
            <p className="text-secondary mb-4" style={{ fontSize: '1.05rem', lineHeight: 1.65 }}>
              Register your private workspace in seconds. All uploads and documents analysis are encrypted locally.
            </p>
            <div className="d-flex gap-2">
              <span className="badge bg-glass border px-3 py-2 small rounded text-white-50"><i className="bi bi-person-fill text-warning me-1"></i> Interactive Wizard</span>
              <span className="badge bg-glass border px-3 py-2 small rounded text-white-50"><i className="bi bi-check-circle-fill text-success me-1"></i> Fast Verification</span>
            </div>
          </div>

          <div className="text-secondary small">
            © 2026 CitizenLex. Security-centric legal AI platform.
          </div>
        </div>

        {/* Right Side: Credentials Card */}
        <div className="col-lg-5 col-12 d-flex align-items-center justify-content-center p-4 p-md-5">
          <div className="auth-content-wrapper w-100" style={{ maxWidth: '460px', minHeight: 'auto', padding: 0 }}>
            {/* Premium Frosted Glass Card with shimmery gradient outline */}
            <div className="glass-premium-card shimmer-border w-100" style={{ padding: '40px 32px' }}>
              
              {/* Stepper Header */}
              <div className="text-center mb-4">
                <div className="auth-logo-icon mx-auto mb-3" style={{
                  width: '54px',
                  height: '54px',
                  borderRadius: '14px',
                  background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 8px 24px rgba(99, 102, 241, 0.3)',
                  transform: 'rotate(-4deg)'
                }}>
                  <i className="bi bi-balance2 text-white" style={{ fontSize: '1.5rem' }}></i>
                </div>
                <h3 className="fw-extrabold text-white mb-1" style={{ letterSpacing: '-0.8px', fontSize: '1.65rem' }}>CitizenLex</h3>
                <p className="text-secondary small">Step {step} of 4: Onboarding Journey</p>

                {/* Progress bar dots */}
                <div className="d-flex justify-content-between align-items-center mt-3 px-3">
                  {[1, 2, 3, 4].map(s => (
                    <React.Fragment key={s}>
                      <div style={{
                        width: '30px',
                        height: '30px',
                        borderRadius: '50%',
                        background: step >= s 
                          ? 'linear-gradient(135deg, #6366f1, #a855f7)' 
                          : 'rgba(255,255,255,0.06)',
                        border: step === s ? '2px solid #fff' : '1px solid rgba(255,255,255,0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '0.78rem',
                        color: step >= s ? '#fff' : '#6b7280',
                        transition: 'all 0.4s'
                      }}>
                        {s === 4 && registered ? <i className="bi bi-check-lg"></i> : s}
                      </div>
                      {s < 4 && (
                        <div style={{
                          flexGrow: 1,
                          height: '2px',
                          background: step > s ? 'linear-gradient(90deg, #6366f1, #a855f7)' : 'rgba(255,255,255,0.06)',
                          margin: '0 6px',
                          transition: 'background 0.4s'
                        }} />
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>

              {error && (
                <div className="alert alert-danger d-flex align-items-center mb-4 border-0" role="alert"
                  style={{ background: 'rgba(239, 68, 68, 0.12)', color: '#ef4444', borderRadius: '12px', padding: '12px 16px', fontSize: '0.85rem' }}>
                  <i className="bi bi-exclamation-triangle-fill me-2 fs-5"></i>
                  <div className="text-start">{error}</div>
                </div>
              )}

              <form onSubmit={handleNextStep}>
                {/* STEP 1: Personal Details */}
                {step === 1 && (
                  <div className="fade-in-el text-start">
                    <div className="mb-4 text-center">
                      <h5 className="text-white fw-bold">Profile Details</h5>
                      <p className="text-secondary small">Tell us who you are so we can address you correctly</p>
                    </div>
                    <div className="mb-3">
                      <label className="form-label fw-bold small text-secondary mb-1">First Name</label>
                      <div className="input-group-auth" style={{ position: 'relative' }}>
                        <i className="bi bi-person input-icon" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', zIndex: 3 }}></i>
                        <input
                          id="reg-firstname"
                          type="text"
                          className="form-control form-glass-control"
                          placeholder="Jane"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          required
                          style={{ paddingLeft: '48px', height: '48px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff' }}
                        />
                      </div>
                    </div>
                    <div className="mb-4">
                      <label className="form-label fw-bold small text-secondary mb-1">Last Name</label>
                      <div className="input-group-auth" style={{ position: 'relative' }}>
                        <i className="bi bi-person input-icon" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', zIndex: 3 }}></i>
                        <input
                          id="reg-lastname"
                          type="text"
                          className="form-control form-glass-control"
                          placeholder="Doe"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          required
                          style={{ paddingLeft: '48px', height: '48px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff' }}
                        />
                      </div>
                    </div>

                    <button type="submit" className="btn w-100 py-3 mt-2 d-flex justify-content-center align-items-center text-white fw-bold"
                      style={{
                        height: '48px',
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                        border: 'none',
                        fontSize: '0.95rem',
                        boxShadow: '0 4px 18px rgba(99, 102, 241, 0.35)'
                      }}>
                      Next Step <i className="bi bi-arrow-right ms-2"></i>
                    </button>
                  </div>
                )}

                {/* STEP 2: Credentials */}
                {step === 2 && (
                  <div className="fade-in-el text-start">
                    <div className="mb-4 text-center">
                      <h5 className="text-white fw-bold">Secure Credentials</h5>
                      <p className="text-secondary small">Set up security parameters for your workspace</p>
                    </div>
                    <div className="mb-3">
                      <label className="form-label fw-bold small text-secondary mb-1">Email Address</label>
                      <div className="input-group-auth" style={{ position: 'relative' }}>
                        <i className="bi bi-envelope input-icon" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', zIndex: 3 }}></i>
                        <input
                          id="reg-email"
                          type="email"
                          className="form-control form-glass-control"
                          placeholder="you@domain.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          style={{ paddingLeft: '48px', height: '48px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff' }}
                        />
                      </div>
                    </div>

                    <div className="mb-4">
                      <label className="form-label fw-bold small text-secondary mb-1">Password (min. 6 chars)</label>
                      <div className="input-group-auth" style={{ position: 'relative' }}>
                        <i className="bi bi-lock input-icon" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', zIndex: 3 }}></i>
                        <input
                          id="reg-password"
                          type={showPassword ? 'text' : 'password'}
                          className="form-control form-glass-control"
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          style={{ paddingLeft: '48px', paddingRight: '48px', height: '48px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff' }}
                        />
                        <button
                          type="button"
                          className="input-toggle-btn"
                          onClick={() => setShowPassword(!showPassword)}
                          tabIndex={-1}
                          style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#9ca3af', zIndex: 3, cursor: 'pointer' }}
                        >
                          <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`} style={{ fontSize: '1.15rem' }}></i>
                        </button>
                      </div>

                      {/* Password strength meter */}
                      <div className="mt-2.5">
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <span className="small text-secondary" style={{ fontSize: '0.75rem' }}>Security Strength:</span>
                          <span className="fw-semibold" style={{ fontSize: '0.75rem', color: passwordInfo.color }}>{passwordInfo.text}</span>
                        </div>
                        <div className="progress" style={{ height: '5px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px' }}>
                          <div className="progress-bar" role="progressbar" style={{ width: passwordInfo.width, backgroundColor: passwordInfo.color, transition: 'all 0.3s', borderRadius: '3px' }} />
                        </div>
                      </div>
                    </div>

                    <div className="d-flex gap-2">
                      <button type="button" className="btn btn-glass-secondary py-3 flex-grow-1" onClick={handleBackStep}
                        style={{ height: '48px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', color: 'white', border: '1px solid rgba(255,255,255,0.08)', fontWeight: 600 }}>
                        Back
                      </button>
                      <button type="submit" className="btn py-3 flex-grow-1 text-white fw-bold"
                        style={{ height: '48px', borderRadius: '12px', background: 'linear-gradient(135deg, #6366f1, #a855f7)', border: 'none' }}>
                        Continue
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 3: Setup & Perks */}
                {step === 3 && (
                  <div className="fade-in-el text-start">
                    <div className="mb-4 text-center">
                      <h5 className="text-white fw-bold">Platform Safeguards</h5>
                      <p className="text-secondary small">Review security parameters and data locks</p>
                    </div>

                    <div className="glass-panel p-3 mb-4 text-start" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px' }}>
                      <div className="d-flex align-items-start gap-2.5 mb-2.5">
                        <i className="bi bi-shield-fill-check text-success fs-5"></i>
                        <div>
                          <h6 className="text-white fw-bold mb-0" style={{ fontSize: '0.86rem' }}>256-bit Encryption Lock</h6>
                          <p className="text-secondary small mb-0" style={{ fontSize: '0.72rem' }}>All legal chats and uploaded records are stored securely.</p>
                        </div>
                      </div>
                      <div className="d-flex align-items-start gap-2.5">
                        <i className="bi bi-robot text-primary fs-5"></i>
                        <div>
                          <h6 className="text-white fw-bold mb-0" style={{ fontSize: '0.86rem' }}>AI Legal Assistant</h6>
                          <p className="text-secondary small mb-0" style={{ fontSize: '0.72rem' }}>Automatic translations, welfares schemes finder, and legal procedures templates.</p>
                        </div>
                      </div>
                    </div>

                    {/* Opt-in switch */}
                    <div className="form-check form-switch mb-4 text-start">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        role="switch"
                        id="smsNotifyToggle"
                        checked={smsOptIn}
                        onChange={(e) => setSmsOptIn(e.target.checked)}
                        style={{ cursor: 'pointer' }}
                      />
                      <label className="form-check-label text-white small fw-bold" htmlFor="smsNotifyToggle" style={{ cursor: 'pointer' }}>
                        Opt-in to SMS OTP alerts & reminders
                      </label>
                      <div className="text-secondary small mt-1" style={{ fontSize: '0.72rem' }}>Receive instant mobile notifications and OTP validation codes automatically.</div>
                    </div>

                    <div className="d-flex gap-2">
                      <button type="button" className="btn btn-glass-secondary py-3 flex-grow-1" onClick={handleBackStep}
                        style={{ height: '48px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', color: 'white', border: '1px solid rgba(255,255,255,0.08)', fontWeight: 600 }}>
                        Back
                      </button>
                      <button type="submit" className="btn py-3 flex-grow-1 text-white fw-bold" disabled={loading}
                        style={{ height: '48px', borderRadius: '12px', background: 'linear-gradient(135deg, #6366f1, #a855f7)', border: 'none' }}>
                        {loading ? 'Submitting...' : 'Agree & Finish'}
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 4: Success & Confetti */}
                {step === 4 && (
                  <div className="fade-in-el text-center">
                    <div className="success-checkmark-wrapper mx-auto mb-4" style={{
                      width: '72px',
                      height: '72px',
                      borderRadius: '50%',
                      background: 'rgba(16, 185, 129, 0.12)',
                      border: '2px solid #10b981',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <i className="bi bi-patch-check-fill text-success" style={{ fontSize: '2.4rem' }}></i>
                    </div>
                    <h4 className="text-white fw-bold mb-2">Registration Complete!</h4>
                    <p className="text-secondary small px-2">
                      Welcome to CitizenLex, <strong>{firstName}</strong>. Redirecting you to sign in to your command center.
                    </p>
                    <div className="mt-4 p-3 bg-glass text-secondary small" style={{ borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" style={{ width: '0.8rem', height: '0.8rem' }}></span>
                      Opening credentials portal...
                    </div>
                  </div>
                )}
              </form>

              {step < 4 && (
                <div className="text-center mt-4 text-secondary small">
                  Already have an account?{' '}
                  <Link to="/login" className="fw-bold text-decoration-none" style={{ color: '#6366f1', transition: 'color 0.2s' }}
                    onMouseEnter={e => e.target.style.color = '#a855f7'}
                    onMouseLeave={e => e.target.style.color = '#6366f1'}
                  >
                    Sign in here
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
