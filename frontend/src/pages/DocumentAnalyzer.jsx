import React, { useState, useEffect } from 'react';
import axios from 'axios';

function AISummaryView({ summary }) {
  let parsed = null;

  if (summary) {
    try {
      parsed = JSON.parse(summary);
    } catch {
      // Not JSON — display as plain text fallback
    }
  }

  if (!parsed) {
    return (
      <div
        className="p-3 bg-light-subtle rounded border overflow-y-auto"
        style={{ maxHeight: '550px', whiteSpace: 'pre-line', lineHeight: '1.7' }}
      >
        {summary || 'No summary available.'}
      </div>
    );
  }

  return (
    <div className="d-flex flex-column gap-4" style={{ maxHeight: '550px', overflowY: 'auto' }}>
      {/* Document Type Badge */}
      {parsed.document_type && (
        <div className="d-flex align-items-center gap-3 p-3 rounded border bg-primary-subtle">
          <i className="bi bi-file-earmark-text-fill text-primary fs-3"></i>
          <div>
            <div className="text-secondary small fw-bold text-uppercase" style={{ fontSize: '0.7rem', letterSpacing: '0.08em' }}>Document Type</div>
            <div className="fw-bold text-primary fs-6">{parsed.document_type}</div>
          </div>
        </div>
      )}

      {/* Summary */}
      {parsed.summary && (
        <div className="p-3 rounded border">
          <h6 className="fw-bold mb-2 d-flex align-items-center gap-2">
            <i className="bi bi-card-text text-info"></i>
            <span>Summary</span>
          </h6>
          <p className="text-secondary mb-0" style={{ lineHeight: '1.75' }}>{parsed.summary}</p>
        </div>
      )}

      {/* Key Points */}
      {Array.isArray(parsed.key_points) && parsed.key_points.length > 0 && (
        <div className="p-3 rounded border">
          <h6 className="fw-bold mb-3 d-flex align-items-center gap-2">
            <i className="bi bi-list-check text-success"></i>
            <span>Key Points</span>
          </h6>
          <ul className="list-unstyled mb-0 d-flex flex-column gap-2">
            {parsed.key_points.map((point, i) => (
              <li key={i} className="d-flex gap-2 align-items-start">
                <span className="badge bg-success-subtle text-success mt-1" style={{ minWidth: '1.4rem', fontSize: '0.65rem' }}>{i + 1}</span>
                <span className="text-secondary small" style={{ lineHeight: '1.6' }}>{point}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Risks */}
      {Array.isArray(parsed.risks) && parsed.risks.length > 0 && (
        <div className="p-3 rounded border border-danger-subtle bg-danger-subtle">
          <h6 className="fw-bold mb-3 d-flex align-items-center gap-2 text-danger">
            <i className="bi bi-exclamation-triangle-fill"></i>
            <span>Identified Risks</span>
          </h6>
          <ul className="list-unstyled mb-0 d-flex flex-column gap-2">
            {parsed.risks.map((risk, i) => (
              <li key={i} className="d-flex gap-2 align-items-start">
                <i className="bi bi-x-circle-fill text-danger mt-1" style={{ fontSize: '0.75rem' }}></i>
                <span className="text-danger-emphasis small" style={{ lineHeight: '1.6' }}>{risk}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Suggestions */}
      {Array.isArray(parsed.suggestions) && parsed.suggestions.length > 0 && (
        <div className="p-3 rounded border border-warning-subtle bg-warning-subtle">
          <h6 className="fw-bold mb-3 d-flex align-items-center gap-2 text-warning-emphasis">
            <i className="bi bi-lightbulb-fill"></i>
            <span>Suggestions</span>
          </h6>
          <ul className="list-unstyled mb-0 d-flex flex-column gap-2">
            {parsed.suggestions.map((sug, i) => (
              <li key={i} className="d-flex gap-2 align-items-start">
                <i className="bi bi-check-circle-fill text-warning mt-1" style={{ fontSize: '0.75rem' }}></i>
                <span className="text-warning-emphasis small" style={{ lineHeight: '1.6' }}>{sug}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function DocumentAnalyzer() {
  const [documents, setDocuments] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [activeDoc, setActiveDoc] = useState(null);
  const [error, setError] = useState('');
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const res = await axios.get('/api/documents');
      setDocuments(res.data || []);
      if (res.data && res.data.length > 0 && !activeDoc) {
        setActiveDoc(res.data[0]);
      }
    } catch (err) {
      console.error("Failed to load documents list", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError('File size exceeds 10MB limit.');
        setSelectedFile(null);
        return;
      }
      setError('');
      setSelectedFile(file);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;
    setUploading(true);
    setError('');
    const formData = new FormData();
    formData.append('file', selectedFile);
    try {
      const res = await axios.post('/api/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setSelectedFile(null);
      setActiveDoc(res.data);
      document.getElementById('fileUploadInput').value = '';
      fetchDocuments();
    } catch (err) {
      console.error(err);
      setError('Failed to analyze document. Ensure the file is not corrupted and is an approved type (PDF, DOCX, JPG, PNG).');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (docId) => {
    if (!window.confirm("Are you sure you want to delete this document analysis record?")) return;
    try {
      await axios.delete(`/api/documents/${docId}`);
      if (activeDoc && activeDoc.id === docId) setActiveDoc(null);
      fetchDocuments();
    } catch (err) {
      console.error(err);
    }
  };

  const downloadDocSummary = (docId, fileName) => {
    axios({
      url: `/api/documents/${docId}/download-summary`,
      method: 'GET',
      responseType: 'blob',
    }).then((response) => {
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${fileName.replace(/[^a-zA-Z0-9.-]/g, '_')}_summary.md`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }).catch(err => {
      console.error("Failed to download summary", err);
    });
  };

  return (
    <div className="container py-5 text-start">
      <div className="row mb-5 fade-in-el">
        <div className="col-12">
          <span className="badge bg-light text-info border border-info-subtle px-3 py-2 mb-3 fw-bold rounded-pill">
            📁 AI Contract Analyzer
          </span>
          <h1 className="fw-bold">Legal Document Analyzer</h1>
          <p className="text-secondary">
            Upload PDF, Word (DOCX), or image formats (JPG, PNG) of agreements, rental contracts, notices, or covenants. Our AI extracts text and summarizes key clauses.
          </p>
        </div>
      </div>

      <div className="row g-5">

        {/* Left Upload and History Column */}
        <div className="col-lg-5 fade-in-el">
          {/* Upload Form Box */}
          <div className="glass-panel p-4 mb-4">
            <h5 className="fw-bold mb-3">Upload Document</h5>

            {error && (
              <div className="alert alert-danger d-flex align-items-center mb-3" role="alert">
                <i className="bi bi-exclamation-triangle-fill me-2"></i>
                <div className="small">{error}</div>
              </div>
            )}

            <form onSubmit={handleUpload}>
              <div className="mb-3">
                <label className="form-label text-secondary small">Supported formats: PDF, DOCX, JPEG, PNG (Max 10MB)</label>
                <input
                  type="file"
                  id="fileUploadInput"
                  className="form-control form-glass-control"
                  onChange={handleFileChange}
                  accept=".pdf,.docx,.jpg,.jpeg,.png"
                  required
                />
              </div>
              <button
                type="submit"
                className="btn btn-glass w-100 py-2 d-flex justify-content-center align-items-center gap-2"
                disabled={uploading || !selectedFile}
              >
                {uploading ? (
                  <>
                    <span className="spinner-border spinner-border-sm" role="status"></span>
                    <span>Extracting &amp; Analyzing...</span>
                  </>
                ) : (
                  <>
                    <i className="bi bi-cloud-arrow-up-fill"></i>
                    <span>Analyze Document</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* History Documents List Box */}
          <div className="glass-panel p-4">
            <h5 className="fw-bold mb-3">Processed History</h5>
            {loadingHistory ? (
              <div className="d-flex justify-content-center py-4">
                <div className="spinner-border text-info spinner-border-sm" role="status"></div>
              </div>
            ) : documents.length === 0 ? (
              <p className="text-secondary small py-3 text-center">No documents analyzed yet.</p>
            ) : (
              <div className="list-group list-group-flush overflow-y-auto" style={{ maxHeight: '40vh' }}>
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className={`list-group-item bg-transparent border-0 border-bottom px-0 py-3 d-flex justify-content-between align-items-center ${activeDoc && activeDoc.id === doc.id ? 'active-item' : ''}`}
                    style={{ cursor: 'pointer' }}
                    onClick={() => setActiveDoc(doc)}
                  >
                    <div className="d-flex align-items-center gap-3 text-truncate" style={{ maxWidth: '75%' }}>
                      <i className={`bi ${doc.fileName.endsWith('.pdf') ? 'bi-file-earmark-pdf text-danger' : doc.fileName.endsWith('.docx') ? 'bi-file-earmark-word text-primary' : 'bi-file-earmark-image text-success'} fs-3`}></i>
                      <div className="text-truncate text-start">
                        <strong className="d-block text-truncate small text-dark-emphasis">{doc.fileName}</strong>
                        <span className="text-secondary small" style={{ fontSize: '0.75rem' }}>{new Date(doc.uploadedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <button
                      className="btn btn-sm btn-outline-danger border-0 p-1"
                      onClick={(e) => { e.stopPropagation(); handleDelete(doc.id); }}
                      title="Delete Analysis"
                    >
                      <i className="bi bi-trash3-fill"></i>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Analysis Dashboard Column */}
        <div className="col-lg-7 fade-in-el">
          {activeDoc ? (
            <div className="glass-panel p-4 p-md-5 h-100">
              <div className="d-flex justify-content-between align-items-start border-bottom pb-3 mb-4 flex-wrap gap-3">
                <div className="text-start">
                  <h4 className="fw-bold mb-1">{activeDoc.fileName}</h4>
                  <span className="text-secondary small">
                    Analyzed on: {new Date(activeDoc.uploadedAt).toLocaleString()}
                  </span>
                </div>
                <button
                  className="btn btn-glass-secondary d-flex align-items-center gap-2"
                  onClick={() => downloadDocSummary(activeDoc.id, activeDoc.fileName)}
                >
                  <i className="bi bi-download"></i>
                  <span>Download Summary (.md)</span>
                </button>
              </div>

              <ul className="nav nav-tabs mb-4" id="docAnalysisTabs" role="tablist">
                <li className="nav-item" role="presentation">
                  <button className="nav-link active fw-bold text-dark-emphasis" id="summary-tab" data-bs-toggle="tab" data-bs-target="#summary" type="button" role="tab">
                    AI Legal Summary
                  </button>
                </li>
                <li className="nav-item" role="presentation">
                  <button className="nav-link fw-bold text-dark-emphasis" id="text-tab" data-bs-toggle="tab" data-bs-target="#text" type="button" role="tab">
                    Parsed Raw Text
                  </button>
                </li>
              </ul>

              <div className="tab-content" id="docAnalysisTabsContent">
                <div className="tab-pane fade show active text-start" id="summary" role="tabpanel">
                  <AISummaryView summary={activeDoc.summary} />
                </div>
                <div className="tab-pane fade text-start" id="text" role="tabpanel">
                  <div
                    className="p-3 bg-light-subtle rounded border overflow-y-auto small"
                    style={{ maxHeight: '550px', whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}
                  >
                    {activeDoc.extractedText || "No text was extracted."}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-panel p-5 h-100 d-flex flex-column align-items-center justify-content-center text-secondary py-5">
              <i className="bi bi-file-earmark-richtext text-secondary-50" style={{ fontSize: '4rem' }}></i>
              <h5 className="mt-4 fw-bold">No Document Selected</h5>
              <p className="small text-center max-width-300">
                Please upload a document on the left or select a historical analysis item from your history list.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
