import React from 'react';

export default function Footer() {
  return (
    <footer className="mt-auto py-5 border-0" style={{ backgroundColor: '#02030a', position: 'relative' }}>
      
      {/* Premium Animated Gradient Divider */}
      <div style={{
        height: '2px',
        width: '100%',
        background: 'linear-gradient(90deg, transparent 0%, #00d2ff 25%, #d4af37 75%, transparent 100%)',
        opacity: 0.8,
        position: 'absolute',
        top: 0,
        left: 0
      }} />

      {/* AI Decorative Tech Grid Line */}
      <div style={{
        position: 'absolute',
        top: '6px',
        left: '50%',
        transform: 'translateX(-50%)',
        height: '1px',
        width: '180px',
        background: '#d4af37',
        boxShadow: '0 0 10px #d4af37',
        opacity: 0.5
      }} />

      <div className="container text-center pt-2">
        {/* Brand Name */}
        <p className="mb-2 fw-bold" style={{ color: '#d4af37', letterSpacing: '2px', fontSize: '1.05rem', textTransform: 'uppercase' }}>
          ⚖️ CitizenLex – Legal Tech for Everyone
        </p>
        
        {/* Social Links */}
        <div className="d-flex justify-content-center gap-4 my-3">
          <a href="#" className="social-icon" title="Twitter" style={{ color: 'rgba(255,255,255,0.45)', transition: 'all 0.3s' }}>
            <i className="bi bi-twitter fs-5"></i>
          </a>
          <a href="#" className="social-icon" title="LinkedIn" style={{ color: 'rgba(255,255,255,0.45)', transition: 'all 0.3s' }}>
            <i className="bi bi-linkedin fs-5"></i>
          </a>
          <a href="#" className="social-icon" title="GitHub" style={{ color: 'rgba(255,255,255,0.45)', transition: 'all 0.3s' }}>
            <i className="bi bi-github fs-5"></i>
          </a>
          <a href="#" className="social-icon" title="Discord" style={{ color: 'rgba(255,255,255,0.45)', transition: 'all 0.3s' }}>
            <i className="bi bi-discord fs-5"></i>
          </a>
        </div>

        {/* Disclaimer */}
        <p className="small mb-3 px-md-5" style={{ color: 'rgba(255, 255, 255, 0.55)', fontSize: '0.78rem', lineHeight: '1.6' }}>
          Disclaimer: CitizenLex is an AI-powered educational platform. The responses, summaries, and legal materials provided are for informational purposes only and do not constitute formal legal advice.
        </p>

        {/* Copyright */}
        <p className="small mb-0" style={{ color: 'rgba(255, 255, 255, 0.35)', fontSize: '0.72rem' }}>
          &copy; {new Date().getFullYear()} CitizenLex Inc. All rights reserved.
        </p>
      </div>

      <style>{`
        .social-icon:hover {
          color: #00d2ff !important;
          transform: translateY(-3px);
          filter: drop-shadow(0 0 4px rgba(0, 210, 255, 0.5));
        }
      `}</style>
    </footer>
  );
}
