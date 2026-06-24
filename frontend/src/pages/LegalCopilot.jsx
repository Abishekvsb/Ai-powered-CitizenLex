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

const TYPE_COLORS = {
  TIP: { bg: 'rgba(16,42,92,0.07)', border: '#102a5c', icon: 'bi-lightbulb-fill', color: '#102a5c' },
  WARNING: { bg: 'rgba(196,157,63,0.12)', border: '#c49d3f', icon: 'bi-exclamation-triangle-fill', color: '#b07d10' },
  INFO: { bg: 'rgba(6,182,212,0.08)', border: '#0891b2', icon: 'bi-info-circle-fill', color: '#0891b2' },
};

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
        // Parse JSON
        let parsed;
        try {
          // Remove markdown fences if any
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
    <div className="copilot-page" style={{ background: 'var(--bg)', minHeight: '100vh', paddingBottom: 60 }}>
      {/* Hero Header */}
      <div className="copilot-hero">
        <div className="container py-5">
          <div className="d-flex align-items-center gap-3 mb-2">
            <div className="copilot-hero-icon">
              <i className="bi bi-robot"></i>
            </div>
            <div>
              <h1 className="mb-0 fw-bold" style={{ fontSize: '2rem', color: 'white' }}>
                AI Legal Copilot
              </h1>
              <p className="mb-0" style={{ color: 'rgba(255,255,255,0.75)', fontSize: '1rem' }}>
                {isTamil ? 'உங்கள் சட்ட பிரச்சினைக்கு படிப்படியான செயல் திட்டம் பெறவும்' : 'Get a step-by-step action plan for your legal issue'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container" style={{ marginTop: -24 }}>
        {/* Input Card */}
        <div className="copilot-input-card card-surface mb-4" style={{ borderRadius: 'var(--radius-lg)', padding: 28, boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border)' }}>

          {/* Quick Templates */}
          <label className="form-label fw-semibold mb-2" style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            {isTamil ? 'விரைவு தேர்வுகள்' : 'Quick Templates'}
          </label>
          <div className="d-flex flex-wrap gap-2 mb-3">
            {TEMPLATES.map(t => (
              <button
                key={t.id}
                className="btn btn-sm"
                onClick={() => setProblem(t.text)}
                style={{
                  background: problem === t.text ? 'linear-gradient(135deg, var(--primary), var(--primary-light))' : 'var(--bg-secondary)',
                  color: problem === t.text ? 'white' : 'var(--text)',
                  border: `1px solid ${problem === t.text ? 'var(--primary)' : 'var(--border)'}`,
                  borderRadius: 8,
                  fontWeight: 500,
                  fontSize: '0.82rem',
                  padding: '6px 14px',
                  transition: 'all 0.2s'
                }}
              >
                <i className={`bi ${t.icon} me-1`}></i>
                {isTamil ? t.labelTa : t.label}
              </button>
            ))}
          </div>

          {/* Problem Input */}
          <label className="form-label fw-semibold mb-2" style={{ color: 'var(--text)', fontSize: '0.92rem' }}>
            <i className="bi bi-pencil-square me-2" style={{ color: 'var(--accent)' }}></i>
            {isTamil ? 'உங்கள் சட்ட பிரச்சினையை விவரிக்கவும்' : 'Describe Your Legal Issue'}
          </label>
          <textarea
            className="form-control"
            rows={4}
            value={problem}
            onChange={e => setProblem(e.target.value)}
            placeholder={isTamil ? 'உங்கள் பிரச்சினையை இங்கு விவரமாக எழுதவும்...' : 'Describe your legal problem in detail. Include what happened, who is involved, and what outcome you want...'}
            style={{
              background: 'var(--bg)',
              border: '1.5px solid var(--border)',
              borderRadius: 10,
              color: 'var(--text)',
              fontSize: '0.95rem',
              resize: 'vertical',
              minHeight: 100
            }}
          />

          {/* Language + Analyze Row */}
          <div className="d-flex align-items-center gap-3 mt-3 flex-wrap">
            <div className="d-flex align-items-center gap-2">
              <label className="form-label mb-0 fw-semibold" style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                <i className="bi bi-translate me-1"></i>
                {isTamil ? 'மொழி:' : 'Language:'}
              </label>
              <div className="btn-group btn-group-sm">
                <button
                  className={`btn ${language === 'en' ? 'btn-primary' : 'btn-outline-secondary'}`}
                  onClick={() => setLanguage('en')}
                  style={language === 'en' ? { background: 'var(--primary)', borderColor: 'var(--primary)' } : {}}
                >English</button>
                <button
                  className={`btn ${language === 'ta' ? 'btn-primary' : 'btn-outline-secondary'}`}
                  onClick={() => setLanguage('ta')}
                  style={language === 'ta' ? { background: 'var(--primary)', borderColor: 'var(--primary)' } : {}}
                >தமிழ்</button>
              </div>
            </div>

            <button
              className="btn ms-auto"
              onClick={analyze}
              disabled={loading || !problem.trim()}
              style={{
                background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%)',
                color: 'white',
                border: 'none',
                borderRadius: 10,
                fontWeight: 700,
                padding: '10px 28px',
                fontSize: '0.95rem',
                boxShadow: '0 4px 14px rgba(16,42,92,0.3)',
                opacity: loading || !problem.trim() ? 0.6 : 1,
                transition: 'all 0.2s'
              }}
            >
              {loading ? (
                <><span className="spinner-border spinner-border-sm me-2" />{isTamil ? 'பகுப்பாய்வு...' : 'Analyzing...'}</>
              ) : (
                <><i className="bi bi-robot me-2"></i>{isTamil ? 'பகுப்பாய்வு செய்' : 'Analyze My Issue'}</>
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
            <div className="copilot-loading-spinner mb-3">
              <div className="spinner-border" style={{ width: 48, height: 48, color: 'var(--primary)', borderWidth: 3 }}></div>
            </div>
            <h5 style={{ color: 'var(--primary)', fontWeight: 700 }}>
              {isTamil ? 'AI உங்கள் பிரச்சினையை பகுப்பாய்வு செய்கிறது...' : 'AI is analyzing your legal issue...'}
            </h5>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
              {isTamil ? 'இது சில நொடிகள் ஆகலாம்' : 'This may take a few seconds'}
            </p>
          </div>
        )}

        {/* Results */}
        {result && !loading && (
          <div ref={resultRef} className="copilot-results">
            {/* Actions Bar */}
            <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
              <div>
                <h2 className="mb-1 fw-bold" style={{ color: 'var(--text)', fontSize: '1.2rem' }}>
                  <i className="bi bi-check-circle-fill me-2" style={{ color: '#22c55e' }}></i>
                  {isTamil ? 'உங்கள் சட்ட செயல் திட்டம்' : 'Your Legal Action Plan'}
                </h2>
                <p className="mb-0" style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                  {isTamil ? 'AI மூலம் உருவாக்கப்பட்டது — சட்ட ஆலோசகரிடம் உறுதிப்படுத்திக்கொள்ளவும்' : 'AI-generated guidance — verify with a qualified advocate'}
                </p>
              </div>
              <div className="d-flex gap-2 flex-wrap">
                <button className="btn btn-sm" onClick={copyPlan} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontWeight: 600 }}>
                  <i className={`bi bi-${copied ? 'check2' : 'clipboard'} me-1`}></i>
                  {copied ? 'Copied!' : 'Copy'}
                </button>
                <button className="btn btn-sm" onClick={downloadTxt} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontWeight: 600 }}>
                  <i className="bi bi-download me-1"></i>Download TXT
                </button>
                <button className="btn btn-sm" onClick={printPlan} style={{ background: 'linear-gradient(135deg, var(--primary), var(--primary-light))', border: 'none', borderRadius: 8, color: 'white', fontWeight: 600 }}>
                  <i className="bi bi-printer me-1"></i>Print
                </button>
              </div>
            </div>

            <div className="row g-3">
              {/* Action Plan */}
              {result.actionPlan?.length > 0 && (
                <div className="col-lg-8">
                  <div className="copilot-card" style={{ background: 'var(--surface-solid)', border: '1px solid var(--border)', borderRadius: 14, padding: 24 }}>
                    <div className="d-flex align-items-center gap-2 mb-3">
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, var(--primary), var(--primary-light))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <i className="bi bi-list-check text-white" style={{ fontSize: '1.1rem' }}></i>
                      </div>
                      <h3 className="mb-0 fw-bold" style={{ fontSize: '1rem', color: 'var(--text)' }}>
                        {isTamil ? 'செயல் படிகள்' : 'Action Steps'}
                      </h3>
                    </div>
                    <div className="copilot-timeline">
                      {result.actionPlan.map((step, i) => (
                        <div key={i} className="copilot-timeline-item d-flex gap-3 mb-3">
                          <div className="copilot-step-badge flex-shrink-0" style={{
                            width: 32, height: 32, borderRadius: '50%',
                            background: 'linear-gradient(135deg, var(--primary), var(--primary-light))',
                            color: 'white', fontWeight: 700, fontSize: '0.85rem',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            marginTop: 2
                          }}>
                            {i + 1}
                          </div>
                          <div className="flex-grow-1" style={{ paddingTop: 4 }}>
                            <p className="mb-0" style={{ color: 'var(--text)', lineHeight: 1.6, fontSize: '0.92rem' }}>{step}</p>
                            {i < result.actionPlan.length - 1 && (
                              <div style={{ width: 2, height: 16, background: 'var(--border)', marginLeft: -24, marginTop: 6 }}></div>
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
                  <div className="copilot-card mb-3" style={{ background: 'linear-gradient(135deg, #102a5c08, #1f478a08)', border: '1.5px solid var(--primary)', borderRadius: 14, padding: 20 }}>
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <i className="bi bi-clock-history" style={{ color: 'var(--primary)', fontSize: '1.1rem' }}></i>
                      <span className="fw-bold" style={{ color: 'var(--primary)', fontSize: '0.9rem' }}>{isTamil ? 'எதிர்பார்க்கப்படும் காலம்' : 'Estimated Timeline'}</span>
                    </div>
                    <p className="mb-0" style={{ color: 'var(--text)', fontSize: '0.88rem', lineHeight: 1.7 }}>{result.estimatedTimeline}</p>
                  </div>
                )}

                {/* Government Office */}
                {result.governmentOffice && (
                  <div className="copilot-card mb-3" style={{ background: 'rgba(196,157,63,0.06)', border: '1.5px solid var(--accent)', borderRadius: 14, padding: 20 }}>
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <i className="bi bi-building" style={{ color: 'var(--accent)', fontSize: '1.1rem' }}></i>
                      <span className="fw-bold" style={{ color: 'var(--accent-dark, #9e7d2c)', fontSize: '0.9rem' }}>{isTamil ? 'அணுக வேண்டிய அலுவலகம்' : 'Where to Go'}</span>
                    </div>
                    <p className="mb-0" style={{ color: 'var(--text)', fontSize: '0.88rem', lineHeight: 1.7 }}>{result.governmentOffice}</p>
                  </div>
                )}
              </div>

              {/* Relevant Laws */}
              {result.relevantLaws?.length > 0 && (
                <div className="col-md-6">
                  <div className="copilot-card" style={{ background: 'var(--surface-solid)', border: '1px solid var(--border)', borderRadius: 14, padding: 24 }}>
                    <div className="d-flex align-items-center gap-2 mb-3">
                      <i className="bi bi-book-half" style={{ color: 'var(--primary)', fontSize: '1.2rem' }}></i>
                      <h3 className="mb-0 fw-bold" style={{ fontSize: '0.95rem', color: 'var(--text)' }}>
                        {isTamil ? 'சட்ட விதிகள்' : 'Relevant Laws'}
                      </h3>
                    </div>
                    <div className="d-flex flex-wrap gap-2">
                      {result.relevantLaws.map((law, i) => (
                        <span key={i} className="badge" style={{
                          background: 'rgba(16,42,92,0.08)', color: 'var(--primary)',
                          border: '1px solid rgba(16,42,92,0.2)', borderRadius: 8,
                          fontSize: '0.78rem', fontWeight: 600, padding: '5px 10px',
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
                  <div className="copilot-card" style={{ background: 'var(--surface-solid)', border: '1px solid var(--border)', borderRadius: 14, padding: 24 }}>
                    <div className="d-flex align-items-center gap-2 mb-3">
                      <i className="bi bi-folder2-open" style={{ color: '#16a34a', fontSize: '1.2rem' }}></i>
                      <h3 className="mb-0 fw-bold" style={{ fontSize: '0.95rem', color: 'var(--text)' }}>
                        {isTamil ? 'தேவையான ஆவணங்கள்' : 'Required Documents'}
                      </h3>
                    </div>
                    <ul className="list-unstyled mb-0">
                      {result.requiredDocuments.map((doc, i) => (
                        <li key={i} className="d-flex align-items-start gap-2 mb-2">
                          <i className="bi bi-check-square-fill flex-shrink-0" style={{ color: '#16a34a', marginTop: 3 }}></i>
                          <span style={{ color: 'var(--text)', fontSize: '0.88rem', lineHeight: 1.5 }}>{doc}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Risk Warnings */}
              {result.riskWarnings?.length > 0 && (
                <div className="col-12">
                  <div className="copilot-card" style={{ background: 'rgba(220,38,38,0.04)', border: '1.5px solid rgba(220,38,38,0.25)', borderRadius: 14, padding: 24 }}>
                    <div className="d-flex align-items-center gap-2 mb-3">
                      <i className="bi bi-exclamation-triangle-fill" style={{ color: '#dc2626', fontSize: '1.2rem' }}></i>
                      <h3 className="mb-0 fw-bold" style={{ fontSize: '0.95rem', color: '#dc2626' }}>
                        {isTamil ? 'எச்சரிக்கைகள்' : 'Risk Warnings'}
                      </h3>
                    </div>
                    <div className="row g-2">
                      {result.riskWarnings.map((warn, i) => (
                        <div key={i} className="col-md-6">
                          <div className="d-flex align-items-start gap-2 p-2 rounded" style={{ background: 'rgba(220,38,38,0.05)' }}>
                            <i className="bi bi-dot flex-shrink-0" style={{ color: '#dc2626', fontSize: '1.3rem', marginTop: -2 }}></i>
                            <span style={{ color: 'var(--text)', fontSize: '0.88rem', lineHeight: 1.5 }}>{warn}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Raw text fallback */}
              {result.rawText && (
                <div className="col-12">
                  <div className="copilot-card" style={{ background: 'var(--surface-solid)', border: '1px solid var(--border)', borderRadius: 14, padding: 24 }}>
                    <pre style={{ whiteSpace: 'pre-wrap', color: 'var(--text)', fontSize: '0.9rem', margin: 0 }}>{result.rawText}</pre>
                  </div>
                </div>
              )}

              {/* Disclaimer */}
              <div className="col-12">
                <div className="d-flex align-items-center gap-2 px-3 py-2 rounded" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                  <i className="bi bi-info-circle" style={{ color: 'var(--text-muted)' }}></i>
                  <small style={{ color: 'var(--text-muted)', lineHeight: 1.5 }}>
                    <strong>Disclaimer:</strong> This AI-generated plan is for guidance only. Laws may vary. Consult a qualified advocate before taking legal action.
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
