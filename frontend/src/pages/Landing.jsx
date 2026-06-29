import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePWA } from '../context/PWAContext';
import ThreeDBackground from '../components/ThreeDBackground';

export default function Landing() {
  const { user } = useAuth();
  const { isInstallable, installApp } = usePWA();

  return (
    <div className="hero-section" style={{
      position: 'relative',
      overflow: 'hidden',
      padding: '120px 0 100px',
      background: 'radial-gradient(circle at 50% 0%, rgba(99,102,241,0.06) 0%, transparent 60%)'
    }}>
      {/* 3D background constellations */}
      <ThreeDBackground />

      {/* Radial lighting blur blobs */}
      <div className="hero-blob hero-blob-1" style={{
        position: 'absolute',
        top: '-10%',
        right: '-10%',
        width: '500px',
        height: '500px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(168,85,247,0.08) 0%, transparent 65%)',
        filter: 'blur(100px)',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      <div className="container py-5" style={{ position: 'relative', zIndex: 10 }}>
        <div className="row align-items-center g-5">
          {/* Text content panel */}
          <div className="col-lg-6 text-start fade-in-el">
            <span className="badge px-3 py-2 mb-3 fw-bold rounded-pill" style={{
              background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(168,85,247,0.15))',
              color: 'var(--primary)',
              border: '1px solid rgba(99,102,241,0.2)',
              fontSize: '0.85rem'
            }}>
              ⚖️ AI Legal-Tech Workspace
            </span>
            <h1 className="display-4 fw-extrabold text-start mb-4" style={{
              lineHeight: '1.18',
              letterSpacing: '-1.8px',
              color: 'var(--text)'
            }}>
              Empowering Every Citizen With{' '}
              <span style={{
                background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                AI-Powered
              </span>{' '}
              Legal Intelligence
            </h1>
            <p className="lead text-secondary mb-4 text-start" style={{ fontSize: '1.15rem', lineHeight: '1.6' }}>
              Democratizing access to law. Understand your civil protections, query the AI assistant in English & Tamil, search government schemes, and parse complex documents in seconds.
            </p>
            
            <div className="d-flex flex-wrap gap-3 mt-4">
              <Link to={user ? "/dashboard" : "/register"} className="btn px-4 py-3 d-flex align-items-center" style={{
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                color: 'white',
                border: 'none',
                fontWeight: '600',
                fontSize: '1rem',
                boxShadow: '0 4px 20px rgba(99,102,241,0.25)',
                transition: 'all 0.3s'
              }}
              onMouseEnter={e => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 8px 24px rgba(99,102,241,0.35)';
              }}
              onMouseLeave={e => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 20px rgba(99,102,241,0.25)';
              }}
              >
                <span>Get Started Free</span>
                <i className="bi bi-arrow-right-short ms-2 fs-5"></i>
              </Link>
              <Link to="/chat" className="btn btn-glass-secondary btn-lg px-4 py-3 d-flex align-items-center" style={{
                borderRadius: '12px',
                border: '1px solid var(--border)',
                background: 'var(--surface)',
                color: 'var(--text)',
                fontWeight: '600',
                fontSize: '1rem',
                transition: 'all 0.3s'
              }}
              onMouseEnter={e => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.borderColor = 'var(--primary)';
              }}
              onMouseLeave={e => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.borderColor = 'var(--border)';
              }}
              >
                <i className="bi bi-chat-left-text me-2 fs-6"></i>
                <span>Try AI Assistant</span>
              </Link>
            </div>
          </div>
          
          {/* Card Mockup panel */}
          <div className="col-lg-6 fade-in-el-delay-1">
            <div className="glass-panel p-4 p-md-5 text-center position-relative shadow-lg" style={{
              borderRadius: '24px',
              background: 'var(--surface)',
              border: '1px solid var(--surface-border)',
              backdropFilter: 'blur(24px)'
            }}>
              <div className="position-absolute top-0 start-50 translate-middle text-white rounded-circle d-flex align-items-center justify-content-center" style={{
                width: '56px',
                height: '56px',
                background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                boxShadow: '0 8px 20px rgba(99,102,241,0.3)'
              }}>
                <i className="bi bi-shield-fill-check fs-4"></i>
              </div>
              <h3 className="mt-4 mb-3 fw-bold text-white">Instant Civil Assurances</h3>
              <p className="text-secondary small">Type a scenario or upload a document to examine your legal standing immediately.</p>
              
              <div className="glass-panel p-3 my-3 text-start d-flex align-items-center gap-3 animate-hover" style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '14px'
              }}>
                <div className="rounded p-2" style={{ background: 'rgba(99,102,241,0.12)', color: '#6366f1' }}>
                  <i className="bi bi-chat-dots-fill fs-4"></i>
                </div>
                <div>
                  <h6 className="mb-0 fw-bold text-white">Can my landlord evict me without notice?</h6>
                  <span className="text-secondary small">Supported in English or தமிழ்</span>
                </div>
              </div>

              <div className="glass-panel p-3 text-start d-flex align-items-center gap-3 animate-hover" style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '14px'
              }}>
                <div className="rounded p-2" style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981' }}>
                  <i className="bi bi-file-earmark-pdf-fill fs-4"></i>
                </div>
                <div>
                  <h6 className="mb-0 fw-bold text-white">LeaseAgreement.pdf</h6>
                  <span className="text-secondary small">Analyzing clauses & obligations...</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* PWA banner option */}
        {isInstallable && (
          <div className="row mt-5 justify-content-center fade-in-el">
            <div className="col-lg-12">
              <div className="glass-panel p-4 d-flex flex-wrap align-items-center justify-content-between gap-3 text-start" 
                   style={{ 
                     borderRadius: '20px',
                     borderLeft: '5px solid var(--primary)', 
                     background: 'linear-gradient(90deg, rgba(99,102,241,0.06), rgba(255,255,255,0.02))' 
                   }}>
                <div className="d-flex align-items-center gap-3">
                  <div className="rounded-3 text-white p-3 d-flex align-items-center justify-content-center" style={{
                    width: 52,
                    height: 52,
                    background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                    borderRadius: '12px'
                  }}>
                    <i className="bi bi-phone-vibrate-fill fs-4"></i>
                  </div>
                  <div>
                    <h5 className="fw-bold mb-1 text-white">Install CitizenLex PWA</h5>
                    <p className="text-secondary small mb-0">Access legal aid instantly from your home screen. Works offline, loads faster, and updates automatically.</p>
                  </div>
                </div>
                <button className="btn px-4 py-2 text-white" onClick={installApp} style={{
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                  border: 'none',
                  fontWeight: 600,
                  fontSize: '0.88rem'
                }}>
                  <i className="bi bi-download me-2"></i>Install App
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Dynamic Feature Grid */}
        <div className="row g-4 mt-5 pt-4 fade-in-el">
          <h2 className="text-center mb-5 text-white fw-bold">Key Application Modules</h2>
          
          <div className="col-md-4">
            <div className="glass-panel p-4 h-100 text-start animate-hover" style={{ borderRadius: '18px' }}>
              <div className="rounded p-3 d-inline-block mb-3" style={{ background: 'rgba(99,102,241,0.12)', color: '#6366f1' }}>
                <i className="bi bi-chat-square-text-fill fs-4"></i>
              </div>
              <h4 className="fw-bold text-white">AI Legal Assistant</h4>
              <p className="text-secondary">A conversational legal expert simulating a ChatGPT interface. Supports Tamil and English translation queries.</p>
            </div>
          </div>

          <div className="col-md-4">
            <div className="glass-panel p-4 h-100 text-start animate-hover" style={{ borderRadius: '18px' }}>
              <div className="rounded p-3 d-inline-block mb-3" style={{ background: 'rgba(168,85,247,0.12)', color: '#a855f7' }}>
                <i className="bi bi-card-checklist fs-4"></i>
              </div>
              <h4 className="fw-bold text-white">Rights Explorer</h4>
              <p className="text-secondary">Comprehensive search database across Fundamental, Consumer, Women, Child, and Labour Rights categories.</p>
            </div>
          </div>

          <div className="col-md-4">
            <div className="glass-panel p-4 h-100 text-start animate-hover" style={{ borderRadius: '18px' }}>
              <div className="rounded p-3 d-inline-block mb-3" style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981' }}>
                <i className="bi bi-search-heart-fill fs-4"></i>
              </div>
              <h4 className="fw-bold text-white">Scheme Finder</h4>
              <p className="text-secondary">Locate welfare packages, check detailed eligibility thresholds, documents, and submit applications.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
