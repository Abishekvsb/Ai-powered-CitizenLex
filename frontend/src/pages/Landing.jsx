import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Landing() {
  const { user } = useAuth();

  return (
    <div className="hero-section">
      <div className="hero-blob hero-blob-1"></div>
      <div className="hero-blob hero-blob-2"></div>
      
      <div className="container py-5">
        <div className="row align-items-center g-5">
          <div className="col-lg-6 fade-in-el text-start">
            <span className="badge bg-light text-primary border border-primary-subtle px-3 py-2 mb-3 fw-bold rounded-pill">
              ⚖️ AI Legal-Tech Revolution
            </span>
            <h1 className="display-4 fw-extrabold text-start mb-4" style={{ lineHeight: '1.2' }}>
              Empowering Every Citizen With <span className="text-primary bg-light px-2 rounded">AI-Powered</span> Legal Knowledge
            </h1>
            <p className="lead text-secondary mb-4 text-start">
              Democratizing access to law. Understand your civil protections, query the AI legal chat in English & Tamil, search government schemes, and parse complex documents in seconds.
            </p>
            
            <div className="d-flex flex-wrap gap-3 mt-4">
              <Link to={user ? "/dashboard" : "/register"} className="btn btn-glass btn-lg px-4 py-3 d-flex align-items-center">
                <span>Get Started</span>
                <i className="bi bi-arrow-right-short ms-2 fs-5"></i>
              </Link>
              <Link to="/chat" className="btn btn-glass-secondary btn-lg px-4 py-3 d-flex align-items-center">
                <i className="bi bi-chat-left-text me-2 fs-6"></i>
                <span>Try AI Assistant</span>
              </Link>
            </div>
          </div>
          
          <div className="col-lg-6 fade-in-el">
            <div className="glass-panel p-4 p-md-5 text-center position-relative">
              <div className="position-absolute top-0 start-50 translate-middle bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" style={{ width: '60px', height: '60px', boxShadow: '0 4px 15px rgba(37,99,235,0.4)' }}>
                <i className="bi bi-shield-fill-check fs-3"></i>
              </div>
              <h3 className="mt-4 mb-3">Instant Civil Assurances</h3>
              <p className="text-secondary small">Type a scenario or upload a document to examine your legal standing immediately.</p>
              
              <div className="glass-panel p-3 my-4 text-start d-flex align-items-center gap-3">
                <div className="rounded bg-primary-subtle text-primary p-2">
                  <i className="bi bi-chat-dots-fill fs-4"></i>
                </div>
                <div>
                  <h6 className="mb-0 fw-bold">Can my landlord evict me without notice?</h6>
                  <span className="text-secondary small">Ask in English or தமிழ்</span>
                </div>
              </div>

              <div className="glass-panel p-3 text-start d-flex align-items-center gap-3">
                <div className="rounded bg-success-subtle text-success p-2">
                  <i className="bi bi-file-earmark-pdf-fill fs-4"></i>
                </div>
                <div>
                  <h6 className="mb-0 fw-bold">LeaseAgreement.pdf</h6>
                  <span className="text-secondary small">Analyzing clauses & obligation limits...</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Cards Grid */}
        <div className="row g-4 mt-5 pt-5">
          <h2 className="text-center mb-5">Key Application Modules</h2>
          
          <div className="col-md-4">
            <div className="glass-panel glass-panel-hover p-4 h-100 text-start">
              <div className="bg-primary text-white rounded p-3 d-inline-block mb-3">
                <i className="bi bi-chat-square-text-fill fs-4"></i>
              </div>
              <h4>AI Legal Assistant</h4>
              <p className="text-secondary">A conversational legal expert simulating a ChatGPT interface. Supports Tamil and English translation queries.</p>
            </div>
          </div>

          <div className="col-md-4">
            <div className="glass-panel glass-panel-hover p-4 h-100 text-start">
              <div className="bg-info text-white rounded p-3 d-inline-block mb-3">
                <i className="bi bi-card-checklist fs-4"></i>
              </div>
              <h4>Rights Explorer</h4>
              <p className="text-secondary">Comprehensive search database across Fundamental, Consumer, Women, Child, and Labour Rights categories.</p>
            </div>
          </div>

          <div className="col-md-4">
            <div className="glass-panel glass-panel-hover p-4 h-100 text-start">
              <div className="bg-success text-white rounded p-3 d-inline-block mb-3">
                <i className="bi bi-search-heart-fill fs-4"></i>
              </div>
              <h4>Scheme Finder</h4>
              <p className="text-secondary">Locate welfare packages, check detailed eligibility thresholds, documents, and submit applications.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
