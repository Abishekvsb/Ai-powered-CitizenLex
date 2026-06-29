import React, { useState, useRef } from 'react';
import axios from 'axios';

const TEMPLATES = [
  {
    id: 'land',
    icon: 'bi-geo-alt-fill',
    label: 'Land Problem',
    labelTa: 'நிலப் பிரச்சினை',
    text: 'I have a land dispute problem in Tamil Nadu. My neighbour has encroached on my property and refuses to vacate.',
  },
  {
    id: 'scam',
    icon: 'bi-shield-exclamation',
    label: 'Police / Scam Complaint',
    labelTa: 'மோசடி புகார்',
    text: 'I have been scammed online. The fraudster took money from me promising a job. I need to file a police complaint.',
  },
  {
    id: 'salary',
    icon: 'bi-cash-stack',
    label: 'Salary Not Paid',
    labelTa: 'சம்பளம் வழங்கப்படாமை',
    text: 'My employer has not paid my salary for 3 months despite repeated requests. What legal steps can I take?',
  },
  {
    id: 'consumer',
    icon: 'bi-bag-x',
    label: 'Consumer Complaint',
    labelTa: 'நுகர்வோர் புகார்',
    text: 'I bought a defective product and the company refuses to replace or refund it. I want to file a consumer complaint.',
  },
];

export default function LegalCopilot() {
  const [problem, setProblem] = useState('');
  const [language, setLanguage] = useState('en');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const resultRef = useRef(null);
  const isTamil = language === 'ta';

  const analyze = async () => {
    if (!problem.trim() || problem.trim().length < 10) {
      setError(isTamil ? 'தயவுசெய்து உங்கள் சட்ட பிரச்சினையை விரிவாக விவரிக்கவும்.' : 'Please describe your legal issue in more detail (minimum 10 characters).');
      return;
    }
    setError('');
    setLoading(true);
    setResult(null);
    try {
      const res = await axios.post('/api/copilot/analyze', { problem: problem.trim(), language });
      const analysis = res.data?.analysis;
      if (analysis) {
        let parsed;
        try {
          const cleaned = analysis.replace(/```json|```JSON|```/g, '').trim();
          parsed = JSON.parse(cleaned);
        } catch {
          parsed = null;
        }
        setResult(parsed || { rawText: analysis });
      } else {
        setError(isTamil ? 'பகுப்பாய்வு தோல்வியுற்றது. மீண்டும் முயற்சிக்கவும்.' : 'Analysis failed. Please try again.');
      }
    } catch (err) {
      setError(isTamil ? 'சேவை இப்போது கிடைக்கவில்லை. மீண்டும் முயற்சிக்கவும்.' : 'Service unavailable. Please try again shortly.');
    } finally {
      setLoading(false);
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    }
  };

  const copyPlan = () => {
    if (!result) return;
    const text = buildTextOutput();
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const downloadTxt = () => {
    if (!result) return;
    const text = buildTextOutput();
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'legal-action-plan.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const printPlan = () => window.print();

  const buildTextOutput = () => {
    if (!result) return '';
    return `CITIZENLEX — AI LEGAL ACTION PLAN
${isTamil ? 'சட்ட செயல் திட்டம்' : 'Legal Action Plan'}
Generated: ${new Date().toLocaleString()}
Problem: ${problem}

ACTION PLAN:
${(result.actionPlan || []).map((s, i) => `${i + 1}. ${s}`).join('\n')}

RELEVANT LAWS:
${(result.relevantLaws || []).map(l => `• ${l}`).join('\n')}

REQUIRED DOCUMENTS:
${(result.requiredDocuments || []).map(d => `☐ ${d}`).join('\n')}

GOVERNMENT OFFICE:
${result.governmentOffice || ''}

RISK WARNINGS:
${(result.riskWarnings || []).map(w => `⚠ ${w}`).join('\n')}

ESTIMATED TIMELINE:
${result.estimatedTimeline || ''}

---
Disclaimer: This is AI-generated information for guidance only. Consult a qualified lawyer for legal advice.`;
  };

  return (
    <div className="copilot-page text-start" style={{ background: 'var(--bg)', minHeight: '100vh', paddingBottom: 60 }}>
      {/* Hero Header */}
      <div className="copilot-hero" style={{
        background: 'linear-gradient(135deg, #030712 0%, #1e1b4b 100%)',
        borderBottom: '1px solid var(--border)',
        boxShadow: 'var(--shadow-md)',
        padding: '50px 0'
      }}>
        <div className="container">
          <div className="d-flex align-items-center gap-3">
            <div className="copilot-hero-icon" style={{
              background: 'linear-gradient(135deg, #6366f1, #a855f7)',
              width: '52px',
              height: '52px',
              borderRadius: '12px',
              boxShadow: '0 8px 24px rgba(99,102,241,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '1.5rem'
            }}>
              <i className="bi bi-robot"></i>
            </div>
            <div>
              <h1 className="mb-1 fw-extrabold text-white" style={{ fontSize: '2rem', letterSpacing: '-0.8px' }}>
                AI Legal Copilot
              </h1>
              <p className="mb-0 text-white-50" style={{ fontSize: '0.95rem' }}>
                {isTamil ? 'உங்கள் சட்ட பிரச்சினைக்கு படிப்படியான செயல் திட்டம் பெறவும்' : 'Get a step-by-step action plan for your legal issue'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container" style={{ marginTop: -20, position: 'relative', zIndex: 10 }}>
        {/* Input Card */}
        <div className="copilot-input-card card-surface mb-4" style={{ borderRadius: '20px', padding: '32px', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border)', background: 'var(--surface)' }}>
          {/* Quick Templates */}
          <label className="form-label fw-bold mb-2 text-white small text-uppercase" style={{ letterSpacing: '0.08em' }}>
            {isTamil ? 'விரைவு தேர்வுகள்' : 'Quick Templates'}
          </label>
          <div className="d-flex flex-wrap gap-2 mb-4">
            {TEMPLATES.map(t => (
              <button
                key={t.id}
                className="btn btn-sm animate-hover"
                onClick={() => setProblem(t.text)}
                style={{
                  background: problem === t.text ? 'linear-gradient(135deg, #6366f1, #a855f7)' : 'rgba(255,255,255,0.03)',
                  color: 'white',
                  border: `1px solid ${problem === t.text ? '#6366f1' : 'var(--border)'}`,
                  borderRadius: 10,
                  fontWeight: 600,
                  fontSize: '0.82rem',
                  padding: '8px 16px',
                  transition: 'all 0.25s'
                }}
              >
                <i className={`bi ${t.icon} me-1.5`}></i>
                {isTamil ? t.labelTa : t.label}
              </button>
            ))}
          </div>

          {/* Problem Input */}
          <label className="form-label fw-bold mb-2 text-white" style={{ fontSize: '0.95rem' }}>
            <i className="bi bi-pencil-square me-2 text-warning"></i>
            {isTamil ? 'உங்கள் சட்ட பிரச்சினையை விவரிக்கவும்' : 'Describe Your Legal Issue'}
          </label>
          <textarea
            className="form-control mb-3 form-glass-control"
            rows={4}
            value={problem}
            onChange={e => setProblem(e.target.value)}
            placeholder={isTamil ? 'உங்கள் பிரச்சினையை இங்கு விவரமாக எழுதவும்...' : 'Describe your legal problem in detail...'}
            style={{
              background: 'rgba(255,255,255,0.02)',
              borderRadius: 12,
              fontSize: '0.95rem',
              minHeight: 110
            }}
          />

          {/* Language + Analyze Row */}
          <div className="d-flex align-items-center gap-3 flex-wrap">
            <div className="d-flex align-items-center gap-2">
              <label className="form-label mb-0 fw-semibold text-secondary" style={{ fontSize: '0.85rem' }}>
                <i className="bi bi-translate me-1.5"></i>
                {isTamil ? 'மொழி:' : 'Language:'}
              </label>
              <div className="btn-group btn-group-sm">
                <button
                  className={`btn ${language === 'en' ? 'btn-primary' : 'btn-outline-secondary'}`}
                  onClick={() => setLanguage('en')}
                  style={language === 'en' ? { background: '#6366f1', borderColor: '#6366f1' } : {}}
                >English</button>
                <button
                  className={`btn ${language === 'ta' ? 'btn-primary' : 'btn-outline-secondary'}`}
                  onClick={() => setLanguage('ta')}
                  style={language === 'ta' ? { background: '#6366f1', borderColor: '#6366f1' } : {}}
                >தமிழ்</button>
              </div>
            </div>

            <button
              className="btn ms-auto text-white fw-bold d-flex align-items-center justify-content-center gap-2"
              onClick={analyze}
              disabled={loading || !problem.trim()}
              style={{
                background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                border: 'none',
                borderRadius: 12,
                padding: '11px 26px',
                fontSize: '0.92rem',
                boxShadow: '0 4px 15px rgba(99,102,241,0.25)',
                opacity: loading || !problem.trim() ? 0.6 : 1,
                transition: 'all 0.25s'
              }}
            >
              {loading ? (
                <><span className="spinner-border spinner-border-sm" />{isTamil ? 'பகுப்பாய்வு...' : 'Analyzing...'}</>
              ) : (
                <><i className="bi bi-cpu-fill"></i>{isTamil ? 'பகுப்பாய்வு செய்' : 'Analyze My Issue'}</>
              )}
            </button>
          </div>

          {error && (
            <div className="alert alert-danger mt-3 mb-0" style={{ borderRadius: 10, fontSize: '0.88rem' }}>
              <i className="bi bi-exclamation-circle me-2"></i>{error}
            </div>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-5">
            <div className="spinner-border mb-3" style={{ width: 44, height: 44, color: '#6366f1', borderWidth: 3 }}></div>
            <h5 className="text-white fw-bold">
              {isTamil ? 'AI உங்கள் பிரச்சினையை பகுப்பாய்வு செய்கிறது...' : 'AI is analyzing your legal issue...'}
            </h5>
            <p className="text-secondary small">
              {isTamil ? 'இது சில நொடிகள் ஆகலாம்' : 'Building action checklist and procedures'}
            </p>
          </div>
        )}

        {/* Results */}
        {result && !loading && (
          <div ref={resultRef} className="copilot-results fade-in-el">
            {/* Actions Bar */}
            <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
              <div>
                <h4 className="mb-1 fw-bold text-white">
                  <i className="bi bi-check-circle-fill me-2 text-success"></i>
                  {isTamil ? 'உங்களுக்கான செயல் திட்டம்' : 'Your Legal Action Plan'}
                </h4>
                <p className="mb-0 text-secondary small">
                  {isTamil ? 'வழிகாட்டல் மட்டுமே — வழக்கறிஞரிடம் உறுதிப்படுத்திக்கொள்ளவும்' : 'AI-generated plan — verify with a qualified advocate'}
                </p>
              </div>
              <div className="d-flex gap-2 flex-wrap">
                <button className="btn btn-sm btn-glass-secondary animate-hover" onClick={copyPlan} style={{ borderRadius: 8, color: 'white', fontWeight: 600 }}>
                  <i className={`bi bi-${copied ? 'check2 text-success' : 'clipboard'} me-1`}></i>
                  {copied ? 'Copied!' : 'Copy'}
                </button>
                <button className="btn btn-sm btn-glass-secondary animate-hover" onClick={downloadTxt} style={{ borderRadius: 8, color: 'white', fontWeight: 600 }}>
                  <i className="bi bi-download me-1"></i>Download TXT
                </button>
                <button className="btn btn-sm animate-hover text-white" onClick={printPlan} style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)', border: 'none', borderRadius: 8, fontWeight: 600 }}>
                  <i className="bi bi-printer me-1"></i>Print Plan
                </button>
              </div>
            </div>

            <div className="row g-3">
              {/* Action Plan */}
              {result.actionPlan?.length > 0 && (
                <div className="col-lg-8">
                  <div className="copilot-card glass-panel" style={{ borderRadius: 18, padding: 28, background: 'var(--surface)' }}>
                    <div className="d-flex align-items-center gap-2 mb-4">
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #6366f1, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <i className="bi bi-list-check text-white" style={{ fontSize: '1.1rem' }}></i>
                      </div>
                      <h5 className="mb-0 fw-bold text-white">
                        {isTamil ? 'செயல் படிகள்' : 'Action Steps'}
                      </h5>
                    </div>
                    
                    <div className="copilot-timeline">
                      {result.actionPlan.map((step, i) => (
                        <div key={i} className="copilot-timeline-item d-flex gap-3 mb-4 text-start">
                          <div className="flex-shrink-0" style={{
                            width: 30, height: 30, borderRadius: '50%',
                            background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                            color: 'white', fontWeight: 700, fontSize: '0.82rem',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            marginTop: 2
                          }}>
                            {i + 1}
                          </div>
                          <div className="flex-grow-1" style={{ paddingTop: 4 }}>
                            <p className="mb-0 text-white-50" style={{ lineHeight: 1.6, fontSize: '0.92rem' }}>{step}</p>
                            {i < result.actionPlan.length - 1 && (
                              <div style={{ width: 1, height: 18, background: 'var(--border)', marginLeft: -24, marginTop: 8 }}></div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Sidebar Cards */}
              <div className="col-lg-4">
                {/* Timeline */}
                {result.estimatedTimeline && (
                  <div className="copilot-card mb-3 animate-hover" style={{ background: 'rgba(99,102,241,0.03)', border: '1.5px solid #6366f1', borderRadius: 16, padding: 20 }}>
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <i className="bi bi-clock-history text-primary"></i>
                      <span className="fw-bold text-white" style={{ fontSize: '0.9rem' }}>{isTamil ? 'கால அளவு' : 'Timeline Estimate'}</span>
                    </div>
                    <p className="mb-0 text-white-50 small" style={{ lineHeight: 1.6 }}>{result.estimatedTimeline}</p>
                  </div>
                )}

                {/* Government Office */}
                {result.governmentOffice && (
                  <div className="copilot-card mb-3 animate-hover" style={{ background: 'rgba(245,158,11,0.03)', border: '1.5px solid #f59e0b', borderRadius: 16, padding: 20 }}>
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <i className="bi bi-building text-warning"></i>
                      <span className="fw-bold text-white" style={{ fontSize: '0.9rem' }}>{isTamil ? 'அணுக வேண்டிய இடம்' : 'Authority Office'}</span>
                    </div>
                    <p className="mb-0 text-white-50 small" style={{ lineHeight: 1.6 }}>{result.governmentOffice}</p>
                  </div>
                )}
              </div>

              {/* Relevant Laws */}
              {result.relevantLaws?.length > 0 && (
                <div className="col-md-6">
                  <div className="copilot-card glass-panel" style={{ borderRadius: 18, padding: 28, background: 'var(--surface)' }}>
                    <div className="d-flex align-items-center gap-2 mb-3">
                      <i className="bi bi-book-half text-primary fs-5"></i>
                      <h5 className="mb-0 fw-bold text-white">
                        {isTamil ? 'சட்டங்கள்' : 'Relevant Laws'}
                      </h5>
                    </div>
                    <div className="d-flex flex-wrap gap-2">
                      {result.relevantLaws.map((law, i) => (
                        <span key={i} className="badge" style={{
                          background: 'rgba(99,102,241,0.08)', color: 'white',
                          border: '1px solid rgba(99,102,241,0.2)', borderRadius: 8,
                          fontSize: '0.78rem', fontWeight: 500, padding: '5px 10px',
                          whiteSpace: 'normal', textAlign: 'left', lineHeight: 1.4
                        }}>
                          {law}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Required Documents */}
              {result.requiredDocuments?.length > 0 && (
                <div className="col-md-6">
                  <div className="copilot-card glass-panel" style={{ borderRadius: 18, padding: 28, background: 'var(--surface)' }}>
                    <div className="d-flex align-items-center gap-2 mb-3">
                      <i className="bi bi-folder-check text-success fs-5"></i>
                      <h5 className="mb-0 fw-bold text-white">
                        {isTamil ? 'தேவையான ஆவணங்கள்' : 'Required Documents'}
                      </h5>
                    </div>
                    <ul className="list-unstyled mb-0">
                      {result.requiredDocuments.map((doc, i) => (
                        <li key={i} className="d-flex align-items-start gap-2 mb-2 text-white-50">
                          <i className="bi bi-check-square-fill text-success flex-shrink-0 mt-1" style={{ fontSize: '0.9rem' }}></i>
                          <span style={{ fontSize: '0.88rem', lineHeight: 1.5 }}>{doc}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Risk Warnings */}
              {result.riskWarnings?.length > 0 && (
                <div className="col-12">
                  <div className="copilot-card" style={{ background: 'rgba(239,68,68,0.04)', border: '1.5px solid rgba(239,68,68,0.2)', borderRadius: 16, padding: 24 }}>
                    <div className="d-flex align-items-center gap-2 mb-3">
                      <i className="bi bi-exclamation-triangle-fill text-danger fs-5"></i>
                      <h5 className="mb-0 fw-bold text-danger">
                        {isTamil ? 'அபாய எச்சரிக்கைகள்' : 'Risk Warnings'}
                      </h5>
                    </div>
                    <div className="row g-2">
                      {result.riskWarnings.map((warn, i) => (
                        <div key={i} className="col-md-6">
                          <div className="d-flex align-items-start gap-2 p-2 rounded" style={{ background: 'rgba(239,68,68,0.03)' }}>
                            <i className="bi bi-shield-fill-exclamation text-danger flex-shrink-0 mt-1" style={{ fontSize: '0.9rem' }}></i>
                            <span className="text-white-50" style={{ fontSize: '0.88rem', lineHeight: 1.5 }}>{warn}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Disclaimer */}
              <div className="col-12">
                <div className="d-flex align-items-center gap-2 px-3 py-2.5 rounded-3 bg-glass border" style={{ borderColor: 'var(--border)' }}>
                  <i className="bi bi-info-circle text-secondary"></i>
                  <small className="text-secondary" style={{ lineHeight: 1.5 }}>
                    <strong>Disclaimer:</strong> This AI-generated plan is for general guidance only. Consult a qualified advocate before filing.
                  </small>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
