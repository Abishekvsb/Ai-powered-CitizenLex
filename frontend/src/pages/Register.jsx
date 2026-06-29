import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import ThreeDBackground from '../components/ThreeDBackground';

export default function Register() {
  const [step, setStep] = useState(1); // Steps 1 to 4
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

  // Evaluate Password Strength
  const getPasswordStrength = () => {
    if (!password) return { score: 0, text: 'No Password Entered', color: '#9ca3af', width: '0%' };
    if (password.length < 6) return { score: 1, text: 'Too Short (Min 6)', color: '#ef4444', width: '25%' };
    
    // Check complexity
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
        smsNotificationsEnabled: smsOptIn // pass the opt-in state to user table
      });
      setRegistered(true);
      setStep(4);
      // Wait 3.5 seconds then redirect to login page
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
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      overflow: 'hidden',
      background: 'radial-gradient(circle at 50% 50%, #08071a 0%, #020208 100%)'
    }}>
      {/* Dynamic particles & floating 3D watermarks */}
      <ThreeDBackground />

      {/* Decorative premium aurora glows */}
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
      
      {/* Step 4 confetti animation simulation nodes */}
      {registered && (
        <div className="confetti-container" style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 15
        }}>
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

      <div className="auth-content-wrapper" style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: '480px' }}>
        {/* Glow board */}
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
          padding: '40px 32px',
          borderRadius: '24px',
          background: 'rgba(3, 7, 18, 0.65)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.45)',
          backdropFilter: 'blur(30px)'
        }}>
          {/* Header */}
          <div className="text-center mb-4">
            <div className="auth-logo-icon mx-auto mb-2" style={{
              width: '56px',
              height: '56px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(99, 102, 241, 0.3)',
              transform: 'rotate(-4deg)'
            }}>
              <i className="bi bi-balance2 text-white" style={{ fontSize: '1.6rem' }}></i>
            </div>
            <h2 className="fw-extrabold text-white mb-1" style={{ letterSpacing: '-0.8px', fontSize: '1.75rem' }}>CitizenLex</h2>
            <p className="text-secondary small">Step {step} of 4: Onboarding Journey</p>

            {/* Stepper Progress bar indicators */}
            <div className="d-flex justify-content-between align-items-center mt-3 px-3">
              {[1, 2, 3, 4].map(s => (
                <React.Fragment key={s}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: step >= s 
                      ? 'linear-gradient(135deg, #6366f1, #a855f7)' 
                      : 'rgba(255,255,255,0.06)',
                    border: step === s ? '2px solid #fff' : '1px solid rgba(255,255,255,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '0.8rem',
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
            {/* STEP 1: Personal Profile Details */}
            {step === 1 && (
              <div className="fade-in-el">
                <div className="mb-4 text-center">
                  <h5 className="text-white fw-bold">Let's start with your profile</h5>
                  <p className="text-secondary small">Tell us who you are so we can address you correctly</p>
                </div>
                <div className="mb-3 text-start">
                  <label className="form-label fw-semibold small text-secondary mb-1">First Name</label>
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
                      style={{ paddingLeft: '48px', height: '48px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff' }}
                    />
                  </div>
                </div>
                <div className="mb-4 text-start">
                  <label className="form-label fw-semibold small text-secondary mb-1">Last Name</label>
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
                      style={{ paddingLeft: '48px', height: '48px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff' }}
                    />
                  </div>
                </div>

                <button type="submit" className="btn w-100 py-3 mt-2 d-flex justify-content-center align-items-center"
                  style={{ height: '48px', borderRadius: '12px', background: 'linear-gradient(135deg, #6366f1, #a855f7)', color: 'white', border: 'none', fontWeight: 600 }}>
                  Next Step <i className="bi bi-arrow-right ms-2"></i>
                </button>
              </div>
            )}

            {/* STEP 2: Security & Credentials */}
            {step === 2 && (
              <div className="fade-in-el">
                <div className="mb-4 text-center">
                  <h5 className="text-white fw-bold">Secure your account</h5>
                  <p className="text-secondary small">Choose a secure password to guard your legal workspace</p>
                </div>
                <div className="mb-3 text-start">
                  <label className="form-label fw-semibold small text-secondary mb-1">Email Address</label>
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
                      style={{ paddingLeft: '48px', height: '48px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff' }}
                    />
                  </div>
                </div>

                <div className="mb-4 text-start">
                  <label className="form-label fw-semibold small text-secondary mb-1">Password (min. 6 chars)</label>
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
                      style={{ paddingLeft: '48px', paddingRight: '48px', height: '48px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff' }}
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

                  {/* Password Strength Meter */}
                  <div className="mt-2">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <span className="small text-secondary" style={{ fontSize: '0.75rem' }}>Password Strength:</span>
                      <span className="fw-semibold" style={{ fontSize: '0.75rem', color: passwordInfo.color }}>{passwordInfo.text}</span>
                    </div>
                    <div className="progress" style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px' }}>
                      <div className="progress-bar" role="progressbar" style={{ width: passwordInfo.width, backgroundColor: passwordInfo.color, transition: 'all 0.3s', borderRadius: '3px' }} />
                    </div>
                  </div>
                </div>

                <div className="d-flex gap-2">
                  <button type="button" className="btn btn-glass-secondary py-3 flex-grow-1" onClick={handleBackStep}
                    style={{ height: '48px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.08)', fontWeight: 600 }}>
                    Back
                  </button>
                  <button type="submit" className="btn py-3 flex-grow-1"
                    style={{ height: '48px', borderRadius: '12px', background: 'linear-gradient(135deg, #6366f1, #a855f7)', color: 'white', border: 'none', fontWeight: 600 }}>
                    Continue
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Preview & Preference Option */}
            {step === 3 && (
              <div className="fade-in-el">
                <div className="mb-4 text-center">
                  <h5 className="text-white fw-bold">Platform Perks & Perks</h5>
                  <p className="text-secondary small">Review benefits of your digital citizenship account</p>
                </div>

                <div className="glass-panel p-3 mb-4 text-start" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px' }}>
                  <div className="d-flex align-items-start gap-2 mb-2">
                    <i className="bi bi-shield-fill-check text-success fs-5"></i>
                    <div>
                      <h6 className="text-white fw-bold mb-0" style={{ fontSize: '0.88rem' }}>256-bit Encrypted Security</h6>
                      <p className="text-secondary small mb-0">Legal drafts and uploads are locked safely inside your private workspace.</p>
                    </div>
                  </div>
                  <div className="d-flex align-items-start gap-2">
                    <i className="bi bi-robot text-primary fs-5"></i>
                    <div>
                      <h6 className="text-white fw-bold mb-0" style={{ fontSize: '0.88rem' }}>AI Legal Intelligence</h6>
                      <p className="text-secondary small mb-0">Chat, scan legal documents, translate files, and look up public welfare schemes.</p>
                    </div>
                  </div>
                </div>

                {/* Notification preferences checkbox opt-in */}
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
                  <label className="form-check-label text-white small fw-semibold" htmlFor="smsNotifyToggle" style={{ cursor: 'pointer' }}>
                    Opt-in to SMS alerts & reminder notifications
                  </label>
                  <div className="text-secondary small mt-1">Receive verification OTPs, reminders, and notifications instantly on your mobile device.</div>
                </div>

                <div className="d-flex gap-2">
                  <button type="button" className="btn btn-glass-secondary py-3 flex-grow-1" onClick={handleBackStep}
                    style={{ height: '48px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.08)', fontWeight: 600 }}>
                    Back
                  </button>
                  <button type="submit" className="btn py-3 flex-grow-1" disabled={loading}
                    style={{ height: '48px', borderRadius: '12px', background: 'linear-gradient(135deg, #6366f1, #a855f7)', color: 'white', border: 'none', fontWeight: 600 }}>
                    {loading ? 'Submitting...' : 'Agree & Finish'}
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: Success & Confetti Finished screen */}
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
                  animation: 'pulse 1.8s infinite'
                }}>
                  <i className="bi bi-patch-check-fill text-success" style={{ fontSize: '2.5rem' }}></i>
                </div>
                <h4 className="text-white fw-extrabold mb-2">Account Created Successfully!</h4>
                <p className="text-secondary small px-3">
                  Welcome to CitizenLex, <strong>{firstName}</strong>. We've set up your secure AI legal workspace.
                </p>
                <div className="mt-4 p-3 bg-glass text-secondary small" style={{ borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" style={{ width: '0.85rem', height: '0.85rem' }}></span>
                  Redirecting to sign-in page in a few seconds...
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
  );
}
