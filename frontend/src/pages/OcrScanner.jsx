import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const SUPPORTED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'image/jpeg',
  'image/png',
  'image/jpg'
];

export default function OcrScanner() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0); // 0: Idle, 1: Uploading, 2: OCR, 3: AI Analysis, 4: Success
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState('');
  
  const [extractedText, setExtractedText] = useState('');
  const [analysisData, setAnalysisData] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [error, setError] = useState('');

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3500);
  };

  const processFile = useCallback(async (file) => {
    if (!file) return;
    setError('');
    setExtractedText('');
    setAnalysisData(null);
    setProcessing(true);
    setSelectedFile(file);

    if (!SUPPORTED_TYPES.includes(file.type) && !file.name.endsWith('.docx') && !file.name.endsWith('.pdf') && !file.name.endsWith('.txt')) {
      setError('Unsupported file type. Please upload a PDF, DOCX, TXT file, or a JPEG/PNG image.');
      setProcessing(false);
      return;
    }

    // Step 1: Uploading
    setCurrentStep(1);
    setProgress(10);
    setProgressLabel('Uploading document to secure server...');

    const formData = new FormData();
    formData.append('file', file);

    try {
      // Simulate progress up to 90% while uploading
      const uploadInterval = setInterval(() => {
        setProgress((prev) => (prev < 90 ? prev + 10 : prev));
      }, 200);

      const response = await axios.post('/api/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setProgress(Math.round(percentCompleted * 0.9)); // Keep under 90% until backend takes over
        }
      });

      clearInterval(uploadInterval);
      setProgress(100);
      setProgressLabel('Upload completed successfully!');

      // Step 2: OCR Parsing
      await new Promise(r => setTimeout(r, 600));
      setCurrentStep(2);
      setProgress(20);
      setProgressLabel('Extracting text and running OCR pipeline...');

      const ocrInterval = setInterval(() => {
        setProgress((prev) => (prev < 80 ? prev + 15 : prev));
      }, 300);

      await new Promise(r => setTimeout(r, 1200));
      clearInterval(ocrInterval);
      setProgress(100);
      setProgressLabel('Text extraction completed successfully.');

      // Step 3: AI Analysis
      await new Promise(r => setTimeout(r, 500));
      setCurrentStep(3);
      setProgress(10);
      setProgressLabel('AI Assistant is analyzing contract clauses and details...');

      const aiInterval = setInterval(() => {
        setProgress((prev) => (prev < 90 ? prev + 12 : prev));
      }, 400);

      await new Promise(r => setTimeout(r, 1800));
      clearInterval(aiInterval);

      const docData = response.data;
      setExtractedText(docData.extractedText || '');
      
      let parsedSummary = null;
      if (docData.summary) {
        try {
          parsedSummary = JSON.parse(docData.summary);
        } catch {
          parsedSummary = {
            summary: docData.summary,
            document_type: 'Legal Document',
            legal_points: [],
            key_names: [],
            dates: [],
            numbers: [],
            suggested_actions: []
          };
        }
      }

      setAnalysisData(parsedSummary);
      setProgress(100);
      setProgressLabel('AI Analysis Complete!');

      // Step 4: Success Animation
      await new Promise(r => setTimeout(r, 600));
      setCurrentStep(4);
      setProcessing(false);
      showToast('Document analyzed successfully!', 'success');

    } catch (err) {
      console.error(err);
      setError('OCR & Analysis processing failed. Ensure the file is valid and not password-protected.');
      setProcessing(false);
      setCurrentStep(0);
      setProgress(0);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) processFile(file);
  };

  const handleCopy = () => {
    if (!extractedText) return;
    navigator.clipboard.writeText(extractedText)
      .then(() => showToast('Raw text copied to clipboard!', 'success'))
      .catch(() => showToast('Copy failed', 'warning'));
  };

  const handleSendToChat = () => {
    if (!extractedText.trim()) return;
    navigate('/chat', { state: { prefillText: extractedText.trim() } });
  };

  const handleSendToDrafts = () => {
    if (!extractedText.trim()) return;
    navigate('/drafts', { state: { prefillText: extractedText.trim() } });
  };

  const handleReset = () => {
    setSelectedFile(null);
    setExtractedText('');
    setAnalysisData(null);
    setProgress(0);
    setProgressLabel('');
    setCurrentStep(0);
    setError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDownloadText = () => {
    if (!extractedText) return;
    const element = document.createElement("a");
    const file = new Blob([extractedText], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = `${selectedFile ? selectedFile.name.split('.')[0] : 'document'}_extracted.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    showToast('Raw text file downloaded!', 'success');
  };

  const handleDownloadSummaryPdf = () => {
    if (!analysisData) return;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>CitizenLex - AI Legal Document Summary</title>
          <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css">
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');
            body { font-family: 'Outfit', sans-serif; padding: 40px; color: #0f172a; background-color: #ffffff; }
            .report-card { border: 1px solid #e2e8f0; border-radius: 16px; padding: 40px; box-shadow: 0 4px 20px rgba(0,0,0,0.02); }
            .header-area { border-bottom: 2px solid #4f46e5; padding-bottom: 20px; margin-bottom: 30px; }
            .header-title { font-weight: 800; font-size: 2.2rem; color: #1e1b4b; }
            .section-title { font-weight: 700; color: #4f46e5; margin-top: 30px; margin-bottom: 12px; border-bottom: 1px solid #f1f5f9; padding-bottom: 6px; font-size: 1.15rem; }
            .badge-type { background-color: #4f46e5; color: white; padding: 6px 14px; border-radius: 20px; font-size: 0.8rem; font-weight: 600; text-uppercase: true; }
            .item-list li { margin-bottom: 8px; font-size: 0.95rem; line-height: 1.6; }
            p { font-size: 0.98rem; line-height: 1.7; color: #334155; }
          </style>
        </head>
        <body>
          <div class="report-card">
            <div class="d-flex justify-content-between align-items-center mb-3">
              <span class="badge-type">${analysisData.document_type || 'Legal Document'}</span>
              <small class="text-muted">Analyzed via CitizenLex AI Platform</small>
            </div>
            <div class="header-area">
              <h2 class="header-title">${selectedFile ? selectedFile.name : 'AI Document Analysis'}</h2>
              <span class="text-secondary small">Analysis Date: ${new Date().toLocaleDateString()}</span>
            </div>
            
            <div class="section-title">Executive Summary</div>
            <p>${analysisData.summary || 'No summary available.'}</p>
            
            <div class="section-title">Important Legal Points / Obligations</div>
            <ul class="item-list">
              ${(analysisData.legal_points || []).map(p => `<li>${p}</li>`).join('') || '<li>None identified</li>'}
            </ul>
            
            <div class="section-title">Key Names & Parties Mentioned</div>
            <p>${(analysisData.key_names || []).join(', ') || 'None identified'}</p>
            
            <div class="section-title">Important Dates</div>
            <p>${(analysisData.dates || []).join(', ') || 'None identified'}</p>
            
            <div class="section-title">Important Numbers / Financial Values</div>
            <p>${(analysisData.numbers || []).join(', ') || 'None identified'}</p>
            
            <div class="section-title">Suggested Legal Actions</div>
            <ol class="item-list">
              ${(analysisData.suggested_actions || []).map(a => `<li>${a}</li>`).join('') || '<li>None suggested</li>'}
            </ol>
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 800);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="container py-5 text-start">
      
      {/* Toast */}
      {toast.show && (
        <div className="custom-toast-container" style={{ zIndex: 9999 }}>
          <div className={`custom-toast ${toast.type === 'success' ? 'toast-success' : 'toast-warning'}`}>
            <i className={`bi ${toast.type === 'success' ? 'bi-check-circle-fill text-success' : 'bi-exclamation-circle-fill text-danger'}`}></i>
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="row mb-5 fade-in-el">
        <div className="col-12">
          <span className="badge bg-light text-primary border border-primary-subtle px-3 py-2 mb-3 fw-bold rounded-pill">
            🔍 AI OCR & Document Intelligence
          </span>
          <h1 className="fw-bold mb-1" style={{ fontSize: '2.2rem' }}>Document Text Extractor</h1>
          <p className="text-secondary">
            Upload PDF, Word (DOCX), plain text, or images (JPG, PNG, JPEG) of legal agreements, notices, or letters. 
            The pipeline parses printed, scanned, and mixed English/Tamil documents to extract content and build summaries.
          </p>
        </div>
      </div>

      <div className="row g-4">
        {/* Left: Upload card */}
        <div className="col-lg-5">
          <div className="glass-panel p-4 d-flex flex-column gap-4 h-100">
            <div>
              <p className="text-secondary small fw-semibold mb-2">Supported Document Types</p>
              <div className="d-flex flex-wrap gap-2">
                {['PDF & Scanned PDF', 'DOCX Word Files', 'TXT Plain Text', 'PNG, JPG, JPEG'].map(doc => (
                  <span key={doc} className="badge rounded-pill border d-flex align-items-center gap-1"
                    style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)', padding: '6px 12px', fontSize: '0.78rem', borderColor: 'var(--border)' }}>
                    <i className="bi bi-file-earmark-check text-primary"></i>
                    {doc}
                  </span>
                ))}
              </div>
            </div>

            {/* Drop Zone */}
            <div
              className={`ocr-drop-zone p-4 ${dragOver ? 'drag-over' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => !processing && fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              aria-label="Upload file for OCR"
              style={{ minHeight: '220px', cursor: processing ? 'not-allowed' : 'pointer' }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.txt,.jpg,.jpeg,.png"
                onChange={handleFileChange}
                style={{ display: 'none' }}
                disabled={processing}
              />
              {selectedFile ? (
                <div className="d-flex flex-column align-items-center gap-2">
                  <i className={`bi ${selectedFile.name.endsWith('.pdf') ? 'bi-file-pdf text-danger' : selectedFile.name.endsWith('.docx') ? 'bi-file-word text-primary' : 'bi-file-image text-success'} fs-1`}></i>
                  <div className="text-center">
                    <p className="fw-semibold mb-1 small text-truncate" style={{ maxWidth: '240px' }}>{selectedFile.name}</p>
                    <p className="text-muted small mb-0">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
              ) : (
                <>
                  <div style={{
                    width: 60, height: 60, borderRadius: 16,
                    background: 'rgba(79,70,229,0.08)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', color: 'var(--primary)'
                  }}>
                    <i className="bi bi-cloud-arrow-up"></i>
                  </div>
                  <div className="text-center">
                    <p className="fw-semibold mb-1" style={{ color: 'var(--text)', fontSize: '0.95rem' }}>
                      {dragOver ? 'Drop file to upload' : 'Drag & drop or click to upload'}
                    </p>
                    <p className="text-muted small mb-0">PDF, DOCX, TXT, Images accepted</p>
                  </div>
                </>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="alert d-flex align-items-center gap-2 p-3 rounded-3"
                style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', fontSize: '0.88rem' }}>
                <i className="bi bi-exclamation-triangle-fill"></i>
                <span>{error}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="d-flex gap-2 mt-auto">
              <button
                className="btn btn-glass flex-fill py-2 d-flex align-items-center justify-content-center gap-2"
                onClick={() => fileInputRef.current?.click()}
                disabled={processing}
              >
                <i className="bi bi-file-earmark-plus"></i> Select File
              </button>
              {(selectedFile || analysisData) && (
                <button
                  className="btn btn-glass-secondary"
                  onClick={handleReset}
                  disabled={processing}
                  title="Reset"
                >
                  <i className="bi bi-arrow-counterclockwise"></i> Reset
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right: Results Card */}
        <div className="col-lg-7">
          <div className="glass-panel p-4 d-flex flex-column justify-content-center h-100" style={{ minHeight: '450px' }}>
            
            {/* Steps & Progress bar */}
            {processing && (
              <div className="d-flex flex-column justify-content-center align-items-center py-5 w-100">
                <div className="d-flex align-items-center gap-3 mb-4 w-100 justify-content-center">
                  <div className="spinner-border text-primary" role="status" style={{ width: '2.5rem', height: '2.5rem' }}></div>
                  <div className="text-start">
                    <p className="fw-bold mb-0 text-dark-emphasis">
                      {currentStep === 1 && 'Step 1 of 3: Uploading...'}
                      {currentStep === 2 && 'Step 2 of 3: OCR Text Extraction...'}
                      {currentStep === 3 && 'Step 3 of 3: Running AI Legal Analysis...'}
                    </p>
                    <span className="text-secondary small">{progressLabel}</span>
                  </div>
                </div>
                
                {/* Custom Progress bar */}
                <div className="w-75 bg-light-subtle rounded-pill overflow-hidden border" style={{ height: '8px' }}>
                  <div className="h-100 bg-primary transition-all" style={{ width: `${progress}%`, transition: 'width 0.3s ease' }}></div>
                </div>
                <span className="mt-2 text-primary fw-bold">{progress}%</span>
              </div>
            )}

            {/* Success state check animation */}
            {currentStep === 4 && !analysisData && (
              <div className="d-flex flex-column align-items-center justify-content-center py-5">
                <div className="success-checkmark mb-3">
                  <div className="check-icon">
                    <span className="icon-line line-tip"></span>
                    <span className="icon-line line-long"></span>
                    <div className="icon-circle"></div>
                    <div className="icon-fix"></div>
                  </div>
                </div>
                <h5 className="fw-bold">Process Completed!</h5>
                <p className="text-muted small">Loading document summaries...</p>
              </div>
            )}

            {/* Displaying extracted texts & details */}
            {analysisData && !processing && (
              <div className="d-flex flex-column gap-3 text-start">
                <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 border-bottom pb-3 mb-2">
                  <div>
                    <span className="badge bg-primary-subtle text-primary py-2 px-3 fw-bold mb-1 rounded-pill">
                      {analysisData.document_type || 'LEGAL DOCUMENT'}
                    </span>
                    <h5 className="fw-bold mb-0 text-dark-emphasis">{selectedFile ? selectedFile.name : 'Analysis Results'}</h5>
                  </div>
                  <div className="d-flex gap-2">
                    <button className="btn btn-sm btn-glass d-flex align-items-center gap-1" onClick={handleDownloadSummaryPdf}>
                      <i className="bi bi-file-pdf-fill"></i> Download PDF
                    </button>
                    <button className="btn btn-sm btn-glass-secondary d-flex align-items-center gap-1" onClick={handleDownloadText}>
                      <i className="bi bi-filetype-txt"></i> Download Text
                    </button>
                  </div>
                </div>

                {/* Tabs */}
                <ul className="nav nav-tabs" id="ocrTabs" role="tablist">
                  <li className="nav-item" role="presentation">
                    <button className="nav-link active nav-link-custom fw-bold text-dark-emphasis" id="ocr-summary-tab" data-bs-toggle="tab" data-bs-target="#ocr-summary" type="button" role="tab">
                      Executive Summary
                    </button>
                  </li>
                  <li className="nav-item" role="presentation">
                    <button className="nav-link nav-link-custom fw-bold text-dark-emphasis" id="ocr-points-tab" data-bs-toggle="tab" data-bs-target="#ocr-points" type="button" role="tab">
                      Legal Points
                    </button>
                  </li>
                  <li className="nav-item" role="presentation">
                    <button className="nav-link nav-link-custom fw-bold text-dark-emphasis" id="ocr-entities-tab" data-bs-toggle="tab" data-bs-target="#ocr-entities" type="button" role="tab">
                      Names &amp; Dates
                    </button>
                  </li>
                  <li className="nav-item" role="presentation">
                    <button className="nav-link nav-link-custom fw-bold text-dark-emphasis" id="ocr-raw-tab" data-bs-toggle="tab" data-bs-target="#ocr-raw" type="button" role="tab">
                      Raw Extracted Text
                    </button>
                  </li>
                </ul>

                <div className="tab-content pt-3" id="ocrTabsContent">
                  {/* Summary Tab */}
                  <div className="tab-pane fade show active" id="ocr-summary" role="tabpanel">
                    <div className="p-3 bg-light-subtle rounded border">
                      <h6 className="fw-bold mb-2 text-primary">AI Summary</h6>
                      <p className="text-secondary" style={{ lineHeight: '1.7' }}>{analysisData.summary || 'No summary available.'}</p>
                      
                      <h6 className="fw-bold mt-4 mb-2 text-primary">Suggested Next Legal Actions</h6>
                      <ol className="mb-0 ps-3 font-medium">
                        {(analysisData.suggested_actions || []).map((action, i) => (
                          <li key={i} className="text-secondary small mb-2">{action}</li>
                        ))}
                        {(!analysisData.suggested_actions || analysisData.suggested_actions.length === 0) && (
                          <li className="text-secondary small">None identified</li>
                        )}
                      </ol>
                    </div>
                  </div>

                  {/* Legal Points Tab */}
                  <div className="tab-pane fade" id="ocr-points" role="tabpanel">
                    <div className="p-3 bg-light-subtle rounded border">
                      <h6 className="fw-bold mb-3 text-primary">Important Legal Points &amp; Obligations</h6>
                      <ul className="mb-0 ps-3">
                        {(analysisData.legal_points || []).map((pt, i) => (
                          <li key={i} className="text-secondary small mb-2" style={{ lineHeight: '1.6' }}>{pt}</li>
                        ))}
                        {(!analysisData.legal_points || analysisData.legal_points.length === 0) && (
                          <li className="text-secondary small">None identified</li>
                        )}
                      </ul>
                    </div>
                  </div>

                  {/* Entities Tab */}
                  <div className="tab-pane fade" id="ocr-entities" role="tabpanel">
                    <div className="d-flex flex-column gap-3 p-3 bg-light-subtle rounded border">
                      <div>
                        <strong className="text-primary small d-block mb-1">Key Names Mentioned:</strong>
                        <p className="text-secondary small mb-0">{(analysisData.key_names || []).join(', ') || 'None identified'}</p>
                      </div>
                      <div>
                        <strong className="text-primary small d-block mb-1">Important Dates:</strong>
                        <p className="text-secondary small mb-0">{(analysisData.dates || []).join(', ') || 'None identified'}</p>
                      </div>
                      <div>
                        <strong className="text-primary small d-block mb-1">Numbers &amp; Amounts:</strong>
                        <p className="text-secondary small mb-0">{(analysisData.numbers || []).join(', ') || 'None identified'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Raw Text Tab */}
                  <div className="tab-pane fade" id="ocr-raw" role="tabpanel">
                    <div className="d-flex flex-column gap-2">
                      <div className="d-flex justify-content-between align-items-center">
                        <span className="text-muted small">Editable extracted text</span>
                        <button className="btn btn-sm btn-link text-decoration-none text-primary p-0" onClick={handleCopy}>
                          <i className="bi bi-clipboard me-1"></i> Copy Text
                        </button>
                      </div>
                      <textarea
                        className="form-control form-glass-control font-monospace text-secondary small p-3"
                        rows={12}
                        value={extractedText}
                        onChange={e => setExtractedText(e.target.value)}
                        style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
                      />
                      <div className="d-flex gap-2 justify-content-end mt-2">
                        <button className="btn btn-sm btn-glass-secondary" onClick={handleSendToChat}>
                          <i className="bi bi-chat-dots-fill text-primary"></i> Send to AI Chat
                        </button>
                        <button className="btn btn-sm btn-glass-secondary" onClick={handleSendToDrafts}>
                          <i className="bi bi-file-earmark-diff-fill text-primary"></i> Use in Drafts
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Empty State */}
            {!analysisData && !processing && !error && (
              <div className="d-flex flex-column align-items-center justify-content-center text-center py-5 gap-3">
                <div style={{
                  width: 80, height: 80, borderRadius: 20,
                  background: 'rgba(79,70,229,0.06)', display: 'flex',
                  alignItems: 'center', justifycontent: 'center', fontSize: '2.2rem', color: 'var(--primary)'
                }}>
                  <i className="bi bi-file-earmark-richtext"></i>
                </div>
                <div>
                  <h5 className="fw-bold mb-1">No Document Uploaded</h5>
                  <p className="text-secondary small mb-0" style={{ maxWidth: 350 }}>
                    Upload an agreement or legal document file. 
                    The tool runs native extraction or fallback OCR to extract text and details.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
