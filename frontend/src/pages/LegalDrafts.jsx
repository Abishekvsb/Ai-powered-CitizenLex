import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';

const DRAFT_TYPES = [
  { id: 'Consumer Complaint', label: 'Consumer Complaint / நுகர்வோர் புகார் மனு' },
  { id: 'RTI Application', label: 'RTI Application / தகவல் அறியும் உரிமை விண்ணப்பம்' },
  { id: 'Grievance Petition', label: 'Grievance Petition / பொது மக்கள் குறைதீர் மனு' },
  { id: 'Legal Notice', label: 'Legal Notice / சட்ட அறிவிப்பு கடிதம்' },
  { id: 'Police Complaint Draft', label: 'Police Complaint / காவல் நிலைய புகார் மனு' },
  { id: 'FIR Draft', label: 'FIR Draft / முதல் தகவல் அறிக்கை வரைவு' },
  { id: 'Affidavit', label: 'Affidavit / பிரமாண பத்திரம்' },
  { id: 'Rental Agreement', label: 'Rental Agreement / வாடகை ஒப்பந்தம்' },
  { id: 'Court Petition', label: 'Court Petition / நீதிமன்ற மனு' },
  { id: 'Employment Complaint', label: 'Employment Complaint / வேலை குறை கோரிக்கை மனு' }
];

const PREFILL_TEMPLATES = {
  'Consumer Complaint': {
    en: "Defective smart TV purchased from Electronic Mart on May 15, 2026 for Rs. 32,000. Within 2 weeks, display stopped working. Company customer service refused repair/replacement, citing physical damage which did not happen.",
    ta: "மே 15, 2026 அன்று எலக்ட்ரானிக் மார்ட் நிறுவனத்திடம் இருந்து ரூ. 32,000-க்கு வாங்கிய ஸ்மார்ட் டிவி பழுதானது. 2 வாரங்களில் டிஸ்ப்ளே வேலை செய்வதை நிறுத்தியது. நிறுவனம் மாற்றித் தர மறுத்துவிட்டது."
  },
  'RTI Application': {
    en: "Requesting details of budgetary allocation and total expenditure for the repair of the Main Road in Ward 12, Municipality Area, between January 2025 and March 2026. Seek copies of work orders and completion certificate.",
    ta: "ஜனவரி 2025 மற்றும் மார்ச் 2026 இடைப்பட்ட காலத்தில் வார்டு 12-ல் உள்ள பிரதான சாலை பழுதுபார்ப்பதற்காக ஒதுக்கப்பட்ட நிதி மற்றும் செலவழிக்கப்பட்ட விவரங்கள், பணி ஆணை நகல் கோருதல்."
  },
  'Grievance Petition': {
    en: "Severe and drinking water shortage in Block C, Housing Board Colony, for the past 3 weeks. Despite repeated complaints to the local water supply board, no action has been taken. Resident families are suffering.",
    ta: "கடந்த 3 வாரங்களாக ஹவுசிங் போர்டு குடியிருப்புப் பகுதியில் கடும் குடிநீர் தட்டுப்பாடு நிலவுகிறது. குடிநீர் வாரியத்திடம் புகார் அளித்தும் நடவடிக்கை இல்லை."
  },
  'Legal Notice': {
    en: "Tenant [Name] residing in property at [Address] has failed to pay rent of Rs. 15,000 per month for the last 4 months (total Rs. 60,000 due). Despite verbal reminders, tenant refuse to clear dues or vacate the property.",
    ta: "வாடகைதாரர் கடந்த 4 மாதங்களாக வாடகை செலுத்தவில்லை. பலமுறை நினைவுபடுத்தியும் வாடகை பாக்கியைச் செலுத்தவோ அல்லது வீட்டை காலி செய்யவோ மறுத்து வருகிறார்."
  },
  'Police Complaint Draft': {
    en: "Online phishing scam on June 12, 2026. Received a fake SMS pretending to be HDFC Bank. Clicked link and entered details, resulting in an unauthorized withdrawal of Rs. 25,000 from account. Transaction ID: TXN987654321.",
    ta: "ஜூன் 12, 2026 அன்று ஆன்லைன் மோசடி மூலம் கணக்கில் இருந்து அனுமதி இல்லாமல் ரூ. 25,000 எடுக்கப்பட்டது. எச்டிஎஃப்சி வங்கி பெயரில் வந்த போலி குறுஞ்செய்தி இணைப்பை கிளிக் செய்ததால் நடந்தது."
  }
};

export default function LegalDrafts() {
  const location = useLocation();
  const [draftType, setDraftType] = useState('Consumer Complaint');
  const [language, setLanguage] = useState('en');
  const [details, setDetails] = useState('');
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [placeholderWarning, setPlaceholderWarning] = useState(false);
  const [pendingDownload, setPendingDownload] = useState(null); // 'docx' | 'pdf' | 'txt'

  const paperRef = useRef(null);

  // Prefill from OCR Scanner or Saved Draft
  useEffect(() => {
    if (location.state?.prefillText) {
      setDetails(location.state.prefillText);
      showToast('Text prefilled from OCR Scanner!', 'success');
      window.history.replaceState({}, '');
    } else if (location.state?.savedDraft) {
      const d = location.state.savedDraft;
      setDraftType(d.type || 'Consumer Complaint');
      setLanguage(d.language || 'en');
      setDraft(d.content || '');
      setDetails(d.details || '');
      showToast('Draft loaded successfully!', 'success');
      window.history.replaceState({}, '');
    }
  }, [location.state]);

  const handleSaveDraft = () => {
    if (!draft) return;
    try {
      const rawDrafts = JSON.parse(localStorage.getItem('saved_drafts') || '[]');
      const existing = Array.isArray(rawDrafts) ? rawDrafts : [];
      const newDraft = {
        id: Date.now(),
        type: draftType,
        language,
        title: `${draftType} (${language.toUpperCase()})`,
        details: details,
        content: draft,
        createdAt: new Date().toISOString()
      };
      // Prevent duplicates of identical content
      const filtered = existing.filter(d => d.content !== draft);
      const updated = [newDraft, ...filtered].slice(0, 10);
      localStorage.setItem('saved_drafts', JSON.stringify(updated));
      showToast('Draft saved to library!', 'success');
    } catch (e) {
      console.error(e);
      showToast('Failed to save draft', 'warning');
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const handleTemplateClick = () => {
    const template = PREFILL_TEMPLATES[draftType]?.[language] || '';
    setDetails(template);
    showToast('Loaded template / மாதிரி விவரம் ஏற்றப்பட்டது', 'success');
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!details.trim()) {
      setError('Please provide some details for the draft.');
      return;
    }

    setLoading(true);
    setError('');
    setDraft('');

    try {
      const res = await axios.post('/api/drafts/generate', {
        type: draftType,
        language,
        details
      });

      setDraft(res.data.draft || '');
      showToast('Document draft generated successfully!', 'success');
    } catch (err) {
      console.error(err);
      setError('Failed to generate draft. Please try again.');
      showToast('Generation failed', 'warning');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const validatePlaceholders = (text) => {
    const matches = text.match(/\[[^\]]+\]/g);
    return matches ? matches.filter(m => m.length > 2) : [];
  };

  const handleDownload = (format = 'txt') => {
    if (!draft) return;
    const placeholders = validatePlaceholders(draft);
    if (placeholders.length > 0) {
      setPlaceholderWarning(true);
      setPendingDownload(format);
      return;
    }
    executeDownload(format);
  };

  const executeDownload = async (format) => {
    if (format === 'txt') {
      const element = document.createElement('a');
      const file = new Blob([draft], { type: 'text/plain;charset=utf-8' });
      element.href = URL.createObjectURL(file);
      const fileNameSafe = draftType.toLowerCase().replace(/[^a-z0-9]+/g, '_');
      element.download = `${fileNameSafe}_draft_${language}.txt`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      showToast('Downloaded text file!', 'success');
    } else if (format === 'docx') {
      try {
        showToast('Preparing DOCX file...', 'success');
        const res = await axios.post('/api/drafts/download/docx',
          { type: draftType, content: draft },
          { responseType: 'blob' }
        );
        const url = window.URL.createObjectURL(new Blob([res.data]));
        const a = document.createElement('a');
        a.href = url;
        a.download = `${draftType.replace(/[^a-z0-9]/gi, '_')}_draft.docx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        showToast('DOCX downloaded successfully!', 'success');
      } catch (err) {
        console.error(err);
        showToast('DOCX download failed. Try again.', 'warning');
      }
    } else if (format === 'pdf') {
      try {
        showToast('Preparing PDF file...', 'success');
        const res = await axios.post('/api/drafts/download/pdf',
          { type: draftType, content: draft },
          { responseType: 'blob' }
        );
        const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
        const a = document.createElement('a');
        a.href = url;
        a.download = `${draftType.replace(/[^a-z0-9]/gi, '_')}_draft.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        showToast('PDF downloaded successfully!', 'success');
      } catch (err) {
        console.error(err);
        showToast('PDF download failed. Try again.', 'warning');
      }
    }
  };

  const handleCopyDraft = () => {
    if (!draft) return;
    navigator.clipboard.writeText(draft)
      .then(() => showToast('Draft copied to clipboard!', 'success'))
      .catch(() => showToast('Copy failed', 'warning'));
  };


  return (
    <div className="container py-5 text-start print-container-wrapper">
      
      {/* Header */}
      <div className="row mb-5 fade-in-el no-print">
        <div className="col-12">
          <span className="badge bg-light text-primary border border-primary-subtle px-3 py-2 mb-3 fw-bold rounded-pill">
            ⚖️ Document Center
          </span>
          <h1 className="fw-bold mb-1" style={{ fontSize: '2rem' }}>AI Legal Complaint Generator</h1>
          <p className="text-secondary">
            Draft RTI applications, police complaints, consumer court petitions, and legal notices instantly in Tamil or English.
          </p>
        </div>
      </div>

      <div className="row g-4 align-items-start">
        {/* Left: Input Form */}
        <div className="col-lg-5 no-print fade-in-el">
          <div className="glass-panel p-4">
            <h5 className="fw-bold mb-4 d-flex align-items-center gap-2">
              <i className="bi bi-pencil-square text-primary"></i>
              Draft Parameters
            </h5>

            <form onSubmit={handleGenerate}>
              {/* Draft Type */}
              <div className="mb-3">
                <label className="form-label fw-semibold small text-secondary">Document Type / ஆவண வகை</label>
                <select
                  className="form-select form-glass-control"
                  value={draftType}
                  onChange={e => setDraftType(e.target.value)}
                >
                  {DRAFT_TYPES.map(type => (
                    <option key={type.id} value={type.id} style={{ background: 'var(--bg-secondary)', color: 'var(--text)' }}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Language Selection */}
              <div className="mb-3">
                <label className="form-label fw-semibold small text-secondary">Language / மொழி</label>
                <div className="d-flex gap-2">
                  <button
                    type="button"
                    className={`btn flex-fill py-2 ${language === 'en' ? 'btn-primary' : 'btn-glass-secondary'}`}
                    onClick={() => setLanguage('en')}
                  >
                    🇬🇧 English
                  </button>
                  <button
                    type="button"
                    className={`btn flex-fill py-2 ${language === 'ta' ? 'btn-primary' : 'btn-glass-secondary'}`}
                    onClick={() => setLanguage('ta')}
                  >
                    🇮🇳 தமிழ்
                  </button>
                </div>
              </div>

              {/* Details Input */}
              <div className="mb-3">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <label className="form-label fw-semibold small text-secondary mb-0">Describe your case details / வழக்கு விவரங்கள்</label>
                  <button
                    type="button"
                    className="btn btn-link btn-sm p-0 text-decoration-none small"
                    onClick={handleTemplateClick}
                    style={{ fontSize: '0.78rem' }}
                  >
                    💡 Auto-Fill Sample / மாதிரி
                  </button>
                </div>
                <textarea
                  className="form-control form-glass-control"
                  rows={6}
                  placeholder={language === 'ta' ? "நிகழ்வின் தேதி, சம்பந்தப்பட்டவர்களின் பெயர்கள், தொகை மற்றும் பிற முக்கிய விவரங்களை உள்ளிடவும்..." : "Enter details such as dates of event, names of parties, disputed amounts, and a simple timeline of what happened..."}
                  value={details}
                  onChange={e => setDetails(e.target.value)}
                  required
                />
              </div>

              {error && (
                <div className="alert alert-danger p-2 small mb-3" role="alert">
                  <i className="bi bi-exclamation-triangle-fill me-2"></i>{error}
                </div>
              )}

              <button
                type="submit"
                className="btn btn-glass w-100 py-2 d-flex align-items-center justify-content-center gap-2"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm" role="status"></span>
                    <span>Generating Draft...</span>
                  </>
                ) : (
                  <>
                    <i className="bi bi-magic"></i>
                    <span>Generate Legal Document</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Right: Document Preview */}
        <div className="col-lg-7 fade-in-el-delay-1">
          {draft ? (
            <div className="d-flex flex-column gap-3">
              <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 no-print p-3 glass-panel">
                <span className="fw-semibold small text-secondary">
                  <i className="bi bi-check-circle-fill text-success me-1"></i>
                  Draft Ready <span className="text-muted">(Click to edit)</span>
                </span>
                
                <div className="d-flex gap-2 flex-wrap">
                  <button
                    className="btn btn-sm btn-glass d-flex align-items-center gap-1"
                    onClick={() => handleDownload('pdf')}
                    title="Download as PDF"
                  >
                    <i className="bi bi-file-pdf-fill text-danger"></i>
                    <span>PDF</span>
                  </button>
                  <button
                    className="btn btn-sm btn-glass d-flex align-items-center gap-1"
                    onClick={() => handleDownload('docx')}
                    title="Download as Word Document"
                  >
                    <i className="bi bi-file-word-fill text-primary"></i>
                    <span>DOCX</span>
                  </button>
                  <button
                    className="btn btn-sm btn-glass-secondary d-flex align-items-center gap-1"
                    onClick={() => handleDownload('txt')}
                    title="Download plain text"
                  >
                    <i className="bi bi-download"></i>
                    <span>TXT</span>
                  </button>
                  <button
                    className="btn btn-sm btn-glass-secondary d-flex align-items-center gap-1"
                    onClick={handleCopyDraft}
                    title="Copy to Clipboard"
                  >
                    <i className="bi bi-clipboard"></i>
                    <span>Copy</span>
                  </button>
                  <button
                    className="btn btn-sm btn-glass d-flex align-items-center gap-1"
                    onClick={handlePrint}
                    title="Print / Save to PDF"
                  >
                    <i className="bi bi-printer-fill"></i>
                    <span>Print</span>
                  </button>
                  <button
                    className="btn btn-sm btn-glass d-flex align-items-center gap-1"
                    onClick={handleSaveDraft}
                    title="Save Draft to Library"
                    style={{ border: '1px solid rgba(196,157,63,0.3)', color: '#c49d3f' }}
                  >
                    <i className="bi bi-bookmark-star-fill"></i>
                    <span>Save</span>
                  </button>
                  <button
                    className="btn btn-sm btn-outline-danger d-flex align-items-center gap-1"
                    onClick={() => { setDraft(''); setDetails(''); }}
                  >
                    <i className="bi bi-trash"></i>
                    <span>Clear</span>
                  </button>
                </div>
              </div>

              {/* Document Paper Sheets */}
              <div className="print-paper-content">
                <textarea
                  ref={paperRef}
                  className="legal-paper-preview w-100"
                  value={draft}
                  onChange={e => setDraft(e.target.value)}
                  rows={25}
                  style={{ resize: 'vertical' }}
                  title="Document editor"
                />
              </div>
              
              <p className="text-secondary small no-print text-center mt-1">
                <i className="bi bi-info-circle me-1"></i>
                Review and customize the text above before printing. This generator provides formatted drafts which should be vetted by legal experts.
              </p>
            </div>
          ) : (
            <div className="glass-panel p-5 text-center text-secondary h-100 d-flex flex-column align-items-center justify-content-center no-print" style={{ minHeight: 460 }}>
              <i className="bi bi-file-earmark-ruled fs-1 text-primary-subtle mb-3"></i>
              <h5 className="fw-bold mb-2">No Document Generated Yet</h5>
              <p className="small text-secondary mb-0" style={{ maxWidth: 360 }}>
                Configure the options on the left, click "Generate", and your printable professional document will appear here.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Placeholder Warning Modal */}
      {placeholderWarning && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 9998 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content glass-panel border-0">
              <div className="modal-header border-bottom border-light-subtle p-4">
                <h5 className="modal-title fw-bold d-flex align-items-center gap-2">
                  <i className="bi bi-exclamation-triangle-fill text-warning"></i>
                  Unfilled Placeholders Detected
                </h5>
              </div>
              <div className="modal-body p-4">
                <p className="text-secondary mb-3">
                  Your draft contains unfilled placeholders like <code>[Name]</code>, <code>[Date]</code>, or <code>[Address]</code>. 
                  Downloading without filling these will produce an incomplete document.
                </p>
                <p className="text-secondary small">
                  <strong>Recommendation:</strong> Click inside the draft editor and replace all <code>[brackets]</code> with real information before downloading.
                </p>
              </div>
              <div className="modal-footer border-top border-light-subtle p-3 d-flex gap-2">
                <button
                  className="btn btn-glass-secondary flex-fill"
                  onClick={() => { setPlaceholderWarning(false); setPendingDownload(null); }}
                >
                  <i className="bi bi-pencil me-2"></i>Go Back & Edit
                </button>
                <button
                  className="btn btn-glass flex-fill"
                  onClick={() => {
                    const fmt = pendingDownload;
                    setPlaceholderWarning(false);
                    setPendingDownload(null);
                    executeDownload(fmt);
                  }}
                >
                  <i className="bi bi-download me-2"></i>Download Anyway
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast.show && (
        <div className="custom-toast-container">
          <div className={`custom-toast ${toast.type === 'success' ? 'toast-success' : 'toast-warning'}`}>
            <i className={`bi ${toast.type === 'success' ? 'bi-check-circle-fill text-success' : 'bi-exclamation-circle-fill text-danger'}`}></i>
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}
