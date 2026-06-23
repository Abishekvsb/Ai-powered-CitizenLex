import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import ThreeDBackground from '../components/ThreeDBackground';

export default function Register() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await axios.post('/api/auth/register', { email, password, firstName, lastName });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2000);
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

  return (
    <div className="auth-page-wrapper">
      <ThreeDBackground />
      <div className="auth-content-wrapper">
        <div className="auth-card fade-in-el">

          {/* Logo / Brand */}
          <div className="text-center mb-4">
            <div className="auth-logo-icon mx-auto mb-3">
              <i className="bi bi-balance2"></i>
            </div>
            <h1 className="auth-brand-title">CitizenLex</h1>
            <p className="auth-brand-subtitle">Democratizing legal knowledge for everyone</p>
          </div>

          <h2 className="auth-heading mb-1">Create your account</h2>
          <p className="text-secondary mb-4 small">Join thousands accessing AI-powered legal assistance</p>

          {success && (
            <div className="alert alert-success d-flex align-items-center mb-4 border-0" role="alert"
              style={{ background: 'rgba(34,197,94,0.12)', color: '#22c55e', borderRadius: '10px' }}>
              <i className="bi bi-check-circle-fill me-2"></i>
              <div>Account created! Redirecting to login...</div>
            </div>
          )}

          {error && (
            <div className="alert alert-danger d-flex align-items-center mb-4 border-0" role="alert"
              style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444', borderRadius: '10px' }}>
              <i className="bi bi-exclamation-triangle-fill me-2"></i>
              <div>{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="row g-3 mb-3">
              <div className="col-6">
                <label className="form-label fw-semibold small text-secondary">First Name</label>
                <div className="input-group-auth">
                  <i className="bi bi-person input-icon"></i>
                  <input
                    id="reg-firstname"
                    type="text"
                    className="form-control form-glass-control ps-5"
                    placeholder="John"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="col-6">
                <label className="form-label fw-semibold small text-secondary">Last Name</label>
                <div className="input-group-auth">
                  <i className="bi bi-person input-icon"></i>
                  <input
                    id="reg-lastname"
                    type="text"
                    className="form-control form-glass-control ps-5"
                    placeholder="Doe"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label fw-semibold small text-secondary">Email Address</label>
              <div className="input-group-auth">
                <i className="bi bi-envelope input-icon"></i>
                <input
                  id="reg-email"
                  type="email"
                  className="form-control form-glass-control ps-5"
                  placeholder="john.doe@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="form-label fw-semibold small text-secondary">Password <span className="text-secondary fw-normal">(min. 6 characters)</span></label>
              <div className="input-group-auth">
                <i className="bi bi-lock input-icon"></i>
                <input
                  id="reg-password"
                  type={showPassword ? 'text' : 'password'}
                  className="form-control form-glass-control ps-5 pe-5"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={6}
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
              id="register-submit-btn"
              className="btn btn-glass w-100 py-3 d-flex justify-content-center align-items-center"
              disabled={loading || success}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Creating account...
                </>
              ) : (
                <>
                  <i className="bi bi-person-plus-fill me-2"></i>
                  Create Free Account
                </>
              )}
            </button>
          </form>

          <div className="text-center mt-4 text-secondary small">
            Already have an account?{' '}
            <Link to="/login" className="text-primary fw-bold text-decoration-none">
              Sign in here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
