import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { createWorker } from 'tesseract.js';

const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/bmp', 'image/tiff'];
const MAX_PDF_PAGES = 3;

const OCR_LANG_OPTIONS = [
  { value: 'eng', label: '🇬🇧 English' },
  { value: 'tam', label: '🇮🇳 Tamil' },
  { value: 'eng+tam', label: '🌐 English + Tamil' },
];

const SUPPORTED_DOCS = [
  { icon: 'bi-person-vcard', label: 'Aadhaar Card' },
  { icon: 'bi-file-earmark-text', label: 'Legal Notices' },
  { icon: 'bi-envelope-paper', label: 'Complaint Letters' },
  { icon: 'bi-building', label: 'Govt. Documents' },
  { icon: 'bi-file-pdf', label: 'PDF Files' },
];

export default function OcrScanner() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [ocrLang, setOcrLang] = useState('eng');
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState('');
  const [extractedText, setExtractedText] = useState('');
  const [pdfPageCount, setPdfPageCount] = useState(0);
  const [processAllPages, setProcessAllPages] = useState(false);
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
    setPreviewUrl(null);
    setPdfPageCount(0);

    const isPdf = file.type === 'application/pdf';
    const isImage = SUPPORTED_IMAGE_TYPES.includes(file.type);

    if (!isPdf && !isImage) {
      setError('Unsupported file type. Please upload an image (JPG, PNG, WEBP) or a PDF file.');
      return;
    }

    setSelectedFile(file);
    setProcessing(true);
    setProgress(5);
    setProgressLabel('Preparing file...');

    try {
      if (isImage) {
        await runOcrOnImage(file);
      } else if (isPdf) {
        await runOcrOnPdf(file);
      }
    } catch (err) {
      console.error('OCR error:', err);
      setError('OCR processing failed. Please try a clearer image or different file.');
      setProcessing(false);
      setProgress(0);
    }
  }, [ocrLang, processAllPages]);

  const runOcrOnImage = async (imageFile) => {
    // Create object URL for preview
    const url = URL.createObjectURL(imageFile);
    setPreviewUrl(url);

    setProgressLabel('Loading OCR engine...');
    setProgress(15);

    const worker = await createWorker(ocrLang, 1, {
      logger: (m) => {
        if (m.status === 'recognizing text') {
          setProgress(Math.round(15 + (m.progress * 75)));
          setProgressLabel(`Recognizing text... ${Math.round(m.progress * 100)}%`);
        } else if (m.status === 'loading language traineddata') {
          setProgressLabel(`Downloading ${ocrLang} language pack...`);
        }
      }
    });

    setProgressLabel('Extracting text...');
    const { data: { text } } = await worker.recognize(imageFile);
    await worker.terminate();

    setExtractedText(text.trim());
    setProgress(100);
    setProgressLabel('Complete!');
    setProcessing(false);
    showToast('Text extracted successfully!', 'success');
  };

  const runOcrOnPdf = async (pdfFile) => {
    setProgressLabel('Loading PDF...');
    setProgress(10);

    // Dynamic import of pdfjs-dist
    const pdfjsLib = await import('pdfjs-dist');
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

    const arrayBuffer = await pdfFile.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const totalPages = pdf.numPages;
    setPdfPageCount(totalPages);

    const pagesToProcess = processAllPages
      ? Array.from({ length: totalPages }, (_, i) => i + 1)
      : Array.from({ length: Math.min(MAX_PDF_PAGES, totalPages) }, (_, i) => i + 1);

    setProgressLabel(`Processing ${pagesToProcess.length} page(s) of ${totalPages}...`);
    setProgress(20);

    let allText = '';

    const worker = await createWorker(ocrLang, 1, {
      logger: (m) => {
        if (m.status === 'loading language traineddata') {
          setProgressLabel(`Downloading ${ocrLang} language pack...`);
        }
      }
    });

    for (let i = 0; i < pagesToProcess.length; i++) {
      const pageNum = pagesToProcess[i];
      setProgressLabel(`OCR page ${pageNum} of ${pagesToProcess.length}...`);
      setProgress(20 + Math.round((i / pagesToProcess.length) * 70));

      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: 2.0 }); // Higher scale = better OCR
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      await page.render({ canvasContext: ctx, viewport }).promise;

      // Use first page as preview
      if (i === 0) setPreviewUrl(canvas.toDataURL('image/png'));

      const { data: { text } } = await worker.recognize(canvas);
      if (text.trim()) {
        allText += `--- Page ${pageNum} ---\n${text.trim()}\n\n`;
      }
    }

    await worker.terminate();

    setExtractedText(allText.trim());
    setProgress(100);
    setProgressLabel('Complete!');
    setProcessing(false);
    showToast(`Extracted text from ${pagesToProcess.length} page(s)!`, 'success');
  };

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
      .then(() => showToast('Text copied to clipboard!', 'success'))
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
    setPreviewUrl(null);
    setExtractedText('');
    setProgress(0);
    setProgressLabel('');
    setError('');
    setPdfPageCount(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="container py-5 text-start">

      {/* Header */}
      <div className="row mb-5 fade-in-el">
        <div className="col-12">
          <span className="badge bg-light text-primary border border-primary-subtle px-3 py-2 mb-3 fw-bold rounded-pill">
            🔍 OCR Document Scanner
          </span>
          <h1 className="fw-bold mb-1" style={{ fontSize: '2rem' }}>Document Text Extractor</h1>
          <p className="text-secondary">
            Upload an image or PDF to extract text instantly using AI-powered OCR.
            Supports Aadhaar cards, legal notices, complaint letters, and government documents in English & Tamil.
          </p>
        </div>
      </div>

      <div className="row g-4">
        {/* Left Column — Upload & Settings */}
        <div className="col-lg-5 fade-in-el">
          <div className="glass-panel p-4 d-flex flex-column gap-4">

            {/* Supported Documents */}
            <div>
              <p className="text-secondary small fw-semibold mb-2">Supported Documents</p>
              <div className="d-flex flex-wrap gap-2">
                {SUPPORTED_DOCS.map(doc => (
                  <span key={doc.label} className="badge rounded-pill d-flex align-items-center gap-1"
                    style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)', padding: '5px 10px', fontSize: '0.75rem', border: '1px solid var(--border)' }}>
                    <i className={`bi ${doc.icon}`}></i>
                    {doc.label}
                  </span>
                ))}
              </div>
            </div>

            {/* Language Selector */}
            <div>
              <label className="form-label fw-semibold small text-secondary mb-2">OCR Language</label>
              <div className="d-flex gap-2 flex-wrap">
                {OCR_LANG_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    className={`btn btn-sm ${ocrLang === opt.value ? 'btn-primary' : 'btn-glass-secondary'}`}
                    onClick={() => setOcrLang(opt.value)}
                    disabled={processing}
                    style={{ fontSize: '0.82rem', padding: '6px 14px' }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <p className="text-muted small mt-1 mb-0">
                <i className="bi bi-info-circle me-1"></i>
                Tamil language pack downloads ~10MB on first use.
              </p>
            </div>

            {/* PDF Options */}
            <div className="d-flex align-items-center gap-2" style={{ fontSize: '0.85rem' }}>
              <input
                type="checkbox"
                id="processAllPages"
                checked={processAllPages}
                onChange={e => setProcessAllPages(e.target.checked)}
                disabled={processing}
                className="form-check-input"
                style={{ width: 16, height: 16, cursor: 'pointer' }}
              />
              <label htmlFor="processAllPages" className="text-secondary" style={{ cursor: 'pointer' }}>
                Process all PDF pages <span className="text-muted">(default: first 3 pages)</span>
              </label>
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
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
              {previewUrl && !processing ? (
                <img
                  src={previewUrl}
                  alt="Preview"
                  style={{ maxHeight: 160, maxWidth: '100%', objectFit: 'contain', borderRadius: 8, border: '1px solid var(--border)' }}
                />
              ) : (
                <>
                  <div style={{
                    width: 64, height: 64, borderRadius: 16,
                    background: 'rgba(37,99,235,0.08)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', color: 'var(--primary)'
                  }}>
                    <i className="bi bi-upc-scan"></i>
                  </div>
                  <div className="text-center">
                    <p className="fw-semibold mb-1" style={{ color: 'var(--text)', fontSize: '0.95rem' }}>
                      {dragOver ? 'Drop to scan' : 'Drag & drop or click to upload'}
                    </p>
                    <p className="text-muted small mb-0">JPG, PNG, WEBP, BMP, PDF accepted</p>
                  </div>
                </>
              )}
            </div>

            {/* Buttons */}
            <div className="d-flex gap-2">
              <button
                className="btn btn-glass flex-fill d-flex align-items-center justify-content-center gap-2"
                onClick={() => fileInputRef.current?.click()}
                disabled={processing}
                style={{ fontSize: '0.9rem' }}
              >
                <i className="bi bi-upload"></i> Upload File
              </button>
              {selectedFile && (
                <button
                  className="btn btn-glass-secondary"
                  onClick={handleReset}
                  disabled={processing}
                  title="Reset"
                >
                  <i className="bi bi-arrow-counterclockwise"></i>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Column — Results */}
        <div className="col-lg-7 fade-in-el-delay-1">
          <div className="glass-panel p-4 d-flex flex-column gap-4" style={{ minHeight: 500 }}>

            {/* Processing State */}
            {processing && (
              <div className="d-flex flex-column gap-3">
                <div className="d-flex align-items-center gap-3">
                  <div style={{
                    width: 44, height: 44, borderRadius: 12,
                    background: 'rgba(37,99,235,0.1)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    animation: 'pulse 1.5s ease-in-out infinite'
                  }}>
                    <i className="bi bi-cpu text-primary" style={{ fontSize: '1.2rem' }}></i>
                  </div>
                  <div>
                    <p className="fw-semibold mb-0" style={{ fontSize: '0.9rem' }}>Processing Document</p>
                    <p className="text-muted small mb-0">{progressLabel}</p>
                  </div>
                </div>
                <div className="ocr-progress-bar">
                  <div className="ocr-progress-fill" style={{ width: `${progress}%` }}></div>
                </div>
                <p className="text-center text-primary fw-bold mb-0" style={{ fontSize: '0.88rem' }}>{progress}%</p>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="alert d-flex align-items-center gap-2 p-3 rounded-3"
                style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', fontSize: '0.88rem' }}>
                <i className="bi bi-exclamation-triangle-fill"></i>
                {error}
              </div>
            )}

            {/* Results */}
            {extractedText && !processing && (
              <>
                {/* Action Buttons */}
                <div className="d-flex flex-wrap gap-2">
                  <button className="btn btn-glass ocr-action-btn" onClick={handleCopy} title="Copy text">
                    <i className="bi bi-clipboard"></i> Copy Text
                  </button>
                  <button className="btn btn-glass-secondary ocr-action-btn" onClick={handleSendToChat} title="Send to AI Assistant">
                    <i className="bi bi-chat-dots"></i> Send to AI Chat
                  </button>
                  <button className="btn btn-glass-secondary ocr-action-btn" onClick={handleSendToDrafts} title="Send to Draft Generator">
                    <i className="bi bi-file-earmark-diff"></i> Use in Drafts
                  </button>
                  <button className="btn btn-outline-secondary ocr-action-btn" onClick={handleReset}>
                    <i className="bi bi-arrow-counterclockwise"></i> Scan Another
                  </button>
                </div>

                {/* Stats */}
                <div className="d-flex gap-3 flex-wrap">
                  <span className="text-muted small">
                    <i className="bi bi-body-text me-1"></i>
                    {extractedText.split(/\s+/).filter(Boolean).length} words
                  </span>
                  <span className="text-muted small">
                    <i className="bi bi-fonts me-1"></i>
                    {extractedText.length} characters
                  </span>
                  {pdfPageCount > 0 && (
                    <span className="text-muted small">
                      <i className="bi bi-file-pdf me-1"></i>
                      {pdfPageCount} total page(s)
                    </span>
                  )}
                  <span className="badge rounded-pill text-bg-success" style={{ fontSize: '0.72rem' }}>
                    <i className="bi bi-check-circle me-1"></i>OCR Complete
                  </span>
                </div>

                {/* Extracted Text Area */}
                <div>
                  <label className="fw-semibold small text-secondary mb-2 d-block">
                    Extracted Text <span className="text-muted">(editable)</span>
                  </label>
                  <textarea
                    className="ocr-result-panel w-100"
                    value={extractedText}
                    onChange={e => setExtractedText(e.target.value)}
                    rows={16}
                    aria-label="Extracted text"
                  />
                </div>
              </>
            )}

            {/* Empty State */}
            {!extractedText && !processing && !error && (
              <div className="d-flex flex-column align-items-center justify-content-center text-center flex-grow-1 py-5 gap-3">
                <div style={{
                  width: 80, height: 80, borderRadius: 20,
                  background: 'rgba(37,99,235,0.06)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', fontSize: '2rem', color: 'var(--primary)'
                }}>
                  <i className="bi bi-file-earmark-richtext"></i>
                </div>
                <div>
                  <h5 className="fw-bold mb-1">No Document Uploaded</h5>
                  <p className="text-secondary small mb-0" style={{ maxWidth: 340 }}>
                    Upload an image or PDF on the left to extract text. Extracted text can be directly sent to the AI Assistant or Legal Draft Generator.
                  </p>
                </div>

                {/* Quick Tips */}
                <div className="mt-3 w-100 text-start" style={{ maxWidth: 380 }}>
                  <p className="text-muted small fw-semibold mb-2">💡 Tips for best results:</p>
                  <ul className="list-unstyled d-flex flex-column gap-1" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    <li><i className="bi bi-check2 text-success me-2"></i>Use high-resolution images (300 DPI or higher)</li>
                    <li><i className="bi bi-check2 text-success me-2"></i>Ensure good lighting and no shadows on documents</li>
                    <li><i className="bi bi-check2 text-success me-2"></i>Crop tightly to the text area for better accuracy</li>
                    <li><i className="bi bi-check2 text-success me-2"></i>Select the correct language before processing</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Toast */}
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
