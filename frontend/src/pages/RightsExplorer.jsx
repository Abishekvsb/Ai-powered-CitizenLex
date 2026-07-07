import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function RightsExplorer() {
  // ——— DB mode state ———
  const [categories, setCategories] = useState([]);
  const [contents, setContents] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeRight, setActiveRight] = useState(null);
  const [loading, setLoading] = useState(true);

  // ——— Bookmarks & Toast state ———
  const [bookmarkedIds, setBookmarkedIds] = useState([]);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('bookmarks_rights') || '[]');
      setBookmarkedIds(saved.map(item => item.id));
    } catch (e) {
      console.error('Failed to load bookmarks', e);
    }
  }, []);

  const toggleBookmark = (right) => {
    let current = [];
    try {
      current = JSON.parse(localStorage.getItem('bookmarks_rights') || '[]');
    } catch(e) {}
    const exists = current.some(item => item.id === right.id);
    let updated;
    if (exists) {
      updated = current.filter(item => item.id !== right.id);
      showToast('Removed from Saved Library', 'warning');
    } else {
      updated = [...current, right];
      showToast('Added to Saved Library', 'success');
    }
    localStorage.setItem('bookmarks_rights', JSON.stringify(updated));
    setBookmarkedIds(updated.map(item => item.id));
  };

  // ——— AI mode state ———
  const [mode, setMode] = useState('db'); // 'db' | 'ai'
  const [aiQuery, setAiQuery] = useState('');
  const [aiResults, setAiResults] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const [expandedAiCard, setExpandedAiCard] = useState(null);

  useEffect(() => {
    const fetchRightsData = async () => {
      try {
        const catRes = await axios.get('/api/rights/categories');
        const contRes = await axios.get('/api/rights/contents');
        setCategories(catRes.data || []);
        setContents(contRes.data || []);
      } catch (err) {
        console.error("Failed to load rights explorer data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchRightsData();
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.get(`/api/rights/search?query=${encodeURIComponent(searchQuery)}`);
      setContents(res.data || []);
      setSelectedCategory(null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const selectCategoryFilter = async (categoryId) => {
    setLoading(true);
    setSelectedCategory(categoryId);
    setSearchQuery('');
    try {
      const res = categoryId === null
        ? await axios.get('/api/rights/contents')
        : await axios.get(`/api/rights/contents/category/${categoryId}`);
      setContents(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ——— AI Search ———
  const handleAiSearch = async (e) => {
    e.preventDefault();
    if (!aiQuery.trim()) return;
    setAiLoading(true);
    setAiError('');
    setAiResults([]);
    setExpandedAiCard(null);
    try {
      const res = await axios.get(`/api/rights/ai-search?query=${encodeURIComponent(aiQuery)}`);
      let data = res.data;
      if (typeof data === 'string') {
        data = JSON.parse(data);
      }
      if (!Array.isArray(data)) throw new Error('Unexpected response format');
      setAiResults(data);
    } catch (err) {
      console.error(err);
      setAiError('AI search failed. Please try a different query or check your connection.');
    } finally {
      setAiLoading(false);
    }
  };

  const downloadRightPdf = (right, index) => {
    const printWindow = window.open('', '_blank');
    const title = right.title || right.name || `Legal Right #${index + 1}`;
    printWindow.document.write(`
      <html>
        <head>
          <title>CitizenLex - ${title}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800&display=swap');
            body { font-family: 'Outfit', sans-serif; padding: 40px; color: #0f172a; }
            h1 { color: #1e1b4b; font-size: 1.8rem; border-bottom: 2px solid #4f46e5; padding-bottom: 12px; margin-bottom: 24px; }
            h3 { color: #4f46e5; margin-top: 20px; margin-bottom: 8px; font-size: 1rem; }
            p { color: #334155; line-height: 1.7; font-size: 0.95rem; }
            .badge { background: #4f46e5; color: white; padding: 4px 12px; border-radius: 20px; font-size: 0.8rem; display: inline-block; margin-bottom: 16px; }
            .row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
            .item { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px; }
          </style>
        </head>
        <body>
          <div class="badge">AI Legal Rights Analysis</div>
          <h1>${title}</h1>
          <p>${right.explanation || right.description || 'No description available.'}</p>
          <div class="row">
            <div class="item"><h3>Applicable Acts</h3><p>${right.applicable_acts || right.applicable_law || 'N/A'}</p></div>
            <div class="item"><h3>IPC / BNS Sections</h3><p>${right.ipc_bns_sections || 'N/A'}</p></div>
            <div class="item"><h3>Required Documents</h3><p>${right.required_documents || 'N/A'}</p></div>
            <div class="item"><h3>Nearby Authority</h3><p>${right.nearby_authority || 'N/A'}</p></div>
            <div class="item"><h3>Helpline</h3><p>${right.helpline || 'Not available'}</p></div>
            <div class="item"><h3>Government Portal</h3><p>${right.government_portal || 'N/A'}</p></div>
          </div>
          <h3>Next Steps</h3>
          <p>${right.next_steps || 'Consult a legal professional for further guidance.'}</p>
          <p style="margin-top:40px;color:#94a3b8;font-size:0.8rem;">Generated by CitizenLex AI Platform &bull; ${new Date().toLocaleDateString()}</p>
          <script>window.onload = function() { window.print(); setTimeout(() => window.close(), 800); }</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };


  return (
    <div className="container py-5 text-start">
      {/* Header */}
      <div className="row mb-4 fade-in-el">
        <div className="col-lg-8 mx-auto text-center">
          <span className="badge bg-light text-primary border border-primary-subtle px-3 py-2 mb-3 fw-bold rounded-pill">
            📖 Know Your Laws
          </span>
          <h1 className="fw-extrabold mb-3">Rights Explorer</h1>
          <p className="text-secondary lead">
            Research civil rights, consumer rights protections, employment laws, and other legal shields guaranteed under Indian legislation.
          </p>
        </div>
      </div>

      {/* Mode Toggle Tabs */}
      <div className="d-flex justify-content-center mb-4">
        <div className="btn-group" role="group">
          <button
            className={`btn px-4 ${mode === 'db' ? 'btn-primary text-white' : 'btn-glass-secondary'}`}
            onClick={() => setMode('db')}
          >
            <i className="bi bi-database me-2"></i>Browse Rights
          </button>
          <button
            className={`btn px-4 ${mode === 'ai' ? 'btn-primary text-white' : 'btn-glass-secondary'}`}
            onClick={() => setMode('ai')}
          >
            <i className="bi bi-stars me-2"></i>AI Rights Finder
          </button>
        </div>
      </div>

      {/* ====== DB MODE ====== */}
      {mode === 'db' && (
        <>
          {/* DB Search bar */}
          <div className="row mb-4 fade-in-el">
            <div className="col-lg-8 mx-auto">
              <form onSubmit={handleSearch} className="d-flex gap-2">
                <input
                  type="text"
                  className="form-control form-glass-control"
                  placeholder="Search rights by title, content, or Tamil keywords..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button type="submit" className="btn btn-glass px-4">
                  <i className="bi bi-search"></i>
                </button>
              </form>
            </div>
          </div>

          {/* Category Pills */}
          <div className="row mb-4 fade-in-el">
            <div className="col-12 d-flex flex-wrap gap-2 justify-content-center">
              <button
                className={`btn ${selectedCategory === null ? 'btn-primary' : 'btn-glass-secondary'}`}
                onClick={() => selectCategoryFilter(null)}
              >
                All Rights
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  className={`btn d-flex align-items-center gap-2 ${selectedCategory === cat.id ? 'btn-primary' : 'btn-glass-secondary'}`}
                  onClick={() => selectCategoryFilter(cat.id)}
                >
                  <i className={`bi bi-${cat.icon || 'shield'}`}></i>
                  <span>{cat.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* DB Content Grid */}
          {loading ? (
            <div className="d-flex justify-content-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading articles...</span>
              </div>
            </div>
          ) : contents.length === 0 ? (
            <div className="text-center py-5 text-secondary">
              <i className="bi bi-folder-x fs-1 text-secondary-50 d-block mb-3"></i>
              <h5>No articles found matching criteria</h5>
              <p className="small">Try refining your keyword search query.</p>
            </div>
          ) : (
            <div className="row g-4 fade-in-el">
              {contents.map((right) => (
                <div key={right.id} className="col-md-6 col-lg-4">
                  <div className="glass-panel glass-panel-hover p-4 h-100 d-flex flex-column justify-content-between">
                    <div>
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <span className="badge bg-primary-subtle text-primary py-2 px-3">
                          {right.category.name}
                        </span>
                        <button
                          className="btn btn-sm btn-link p-0 text-decoration-none border-0 bg-transparent"
                          onClick={(e) => { e.preventDefault(); toggleBookmark(right); }}
                          title={bookmarkedIds.includes(right.id) ? "Remove Bookmark" : "Add Bookmark"}
                          style={{ color: 'var(--text-secondary)' }}
                        >
                          <i className={`bi ${bookmarkedIds.includes(right.id) ? 'bi-bookmark-fill text-warning' : 'bi-bookmark'} fs-5`}></i>
                        </button>
                      </div>
                      <h5 className="fw-bold text-truncate-2 mb-2">{right.title}</h5>
                      <h6 className="text-secondary fw-normal mb-3">{right.tamilTitle}</h6>
                      <p className="text-secondary small text-truncate-3 mb-0">{right.content}</p>
                    </div>
                    <button
                      className="btn btn-outline-primary btn-sm w-100 mt-4 py-2"
                      onClick={() => setActiveRight(right)}
                      data-bs-toggle="modal"
                      data-bs-target="#rightDetailsModal"
                    >
                      Read Full Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ====== AI MODE ====== */}
      {mode === 'ai' && (
        <div className="fade-in-el">
          <div className="row mb-4">
            <div className="col-lg-8 mx-auto">
              <div className="glass-panel p-4">
                <div className="d-flex align-items-center gap-2 mb-3">
                  <i className="bi bi-stars text-primary fs-4"></i>
                  <h5 className="mb-0 fw-bold">Ask AI About Your Legal Rights</h5>
                </div>
                <p className="text-secondary small mb-3">
                  Enter any legal situation or topic and our AI will find the relevant Indian constitutional rights and laws that protect you.
                </p>
                <form onSubmit={handleAiSearch} className="d-flex gap-2">
                  <input
                    type="text"
                    className="form-control form-glass-control"
                    placeholder="e.g. right to education, consumer rights, freedom of speech..."
                    value={aiQuery}
                    onChange={(e) => setAiQuery(e.target.value)}
                  />
                  <button
                    type="submit"
                    className="btn btn-primary border-0 px-4 d-flex align-items-center gap-2"
                    disabled={aiLoading || !aiQuery.trim()}
                    style={{ boxShadow: '0 4px 14px rgba(13,110,253,0.35)', whiteSpace: 'nowrap' }}
                  >
                    {aiLoading ? <span className="spinner-border spinner-border-sm" role="status"></span> : <i className="bi bi-send-fill"></i>}
                    <span>{aiLoading ? 'Searching...' : 'Find Rights'}</span>
                  </button>
                </form>

                {aiResults.length === 0 && !aiLoading && (
                  <div className="d-flex flex-wrap gap-2 mt-3">
                    {['Right to equality', 'Consumer protection rights', 'Labour rights in India', 'Fundamental rights of citizens'].map(q => (
                      <button
                        key={q}
                        className="btn btn-sm btn-glass-secondary"
                        onClick={() => setAiQuery(q)}
                      >
                        <i className="bi bi-lightning-fill text-primary me-1"></i>{q}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {aiError && (
            <div className="alert alert-danger d-flex align-items-center mb-4" role="alert">
              <i className="bi bi-exclamation-triangle-fill me-2"></i>
              <div className="small">{aiError}</div>
            </div>
          )}

          {aiResults.length > 0 && (
            <div>
              <div className="d-flex align-items-center gap-2 mb-3">
                <i className="bi bi-check-circle-fill text-primary"></i>
                <span className="text-primary fw-bold small">{aiResults.length} rights found by AI for "{aiQuery}"</span>
              </div>
              <div className="row g-4">
                {aiResults.map((right, i) => (
                  <div key={i} className="col-md-6">
                    <div className="glass-panel glass-panel-hover p-4 h-100 d-flex flex-column gap-3">
                      <div className="d-flex align-items-start justify-content-between">
                        <span className="badge bg-primary-subtle text-primary py-2 px-3">
                          <i className="bi bi-stars me-1"></i>AI Result #{i + 1}
                        </span>
                        <button
                          className="btn btn-sm btn-glass-secondary d-flex align-items-center gap-1"
                          onClick={() => downloadRightPdf(right, i)}
                          title="Download as PDF"
                        >
                          <i className="bi bi-file-pdf-fill text-danger"></i> PDF
                        </button>
                      </div>

                      <div>
                        <h5 className="fw-bold mb-1">{right.title}</h5>
                        <p className="text-secondary small mb-0" style={{ lineHeight: '1.6' }}>
                          {right.explanation || right.description || ''}
                        </p>
                      </div>

                      <div className="row g-2">
                        {right.applicable_acts && (
                          <div className="col-12">
                            <div className="p-2 rounded" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                              <strong className="text-primary small d-block mb-1">📜 Applicable Acts</strong>
                              <p className="text-secondary small mb-0">{right.applicable_acts}</p>
                            </div>
                          </div>
                        )}
                        {right.ipc_bns_sections && (
                          <div className="col-12">
                            <div className="p-2 rounded" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                              <strong className="text-primary small d-block mb-1">⚖️ IPC / BNS Sections</strong>
                              <p className="text-secondary small mb-0">{right.ipc_bns_sections}</p>
                            </div>
                          </div>
                        )}
                        {right.required_documents && (
                          <div className="col-12">
                            <div className="p-2 rounded" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                              <strong className="text-primary small d-block mb-1">📄 Required Documents</strong>
                              <p className="text-secondary small mb-0">{right.required_documents}</p>
                            </div>
                          </div>
                        )}
                        {right.next_steps && (
                          <div className="col-12">
                            <div className="p-2 rounded" style={{ background: 'rgba(79,70,229,0.04)', border: '1px solid rgba(79,70,229,0.12)' }}>
                              <strong className="text-primary small d-block mb-1">🚀 Next Steps</strong>
                              <p className="text-secondary small mb-0" style={{ whiteSpace: 'pre-line' }}>{right.next_steps}</p>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="d-flex flex-wrap gap-2 pt-2 border-top mt-auto">
                        {right.nearby_authority && (
                          <span className="badge rounded-pill border" style={{ background: 'transparent', color: 'var(--text-secondary)', borderColor: 'var(--border)', fontSize: '0.75rem' }}>
                            <i className="bi bi-building me-1"></i>{right.nearby_authority}
                          </span>
                        )}
                        {right.helpline && (
                          <a href={`tel:${right.helpline.replace(/[^0-9]/g, '')}`}
                            className="badge rounded-pill border text-decoration-none"
                            style={{ background: 'transparent', color: '#16a34a', borderColor: '#bbf7d0', fontSize: '0.75rem' }}>
                            <i className="bi bi-telephone-fill me-1"></i>{right.helpline}
                          </a>
                        )}
                        {right.government_portal && (
                          <a href={right.government_portal} target="_blank" rel="noopener noreferrer"
                            className="badge rounded-pill border text-decoration-none"
                            style={{ background: 'transparent', color: '#4f46e5', borderColor: '#c7d2fe', fontSize: '0.75rem' }}>
                            <i className="bi bi-globe me-1"></i>Official Portal
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!aiLoading && aiResults.length === 0 && !aiError && (
            <div className="text-center py-5 text-secondary">
              <i className="bi bi-book fs-1 text-primary-subtle d-block mb-3"></i>
              <h5>AI Rights Finder Ready</h5>
              <p className="small">Enter your legal question above to discover the rights and laws protecting you in India.</p>
            </div>
          )}
        </div>
      )}

      {/* Modal for DB right details */}
      <div className="modal fade" id="rightDetailsModal" tabIndex="-1" aria-hidden="true">
        <div className="modal-dialog modal-lg modal-dialog-centered">
          {activeRight && (
            <div className="modal-content glass-panel border-0 text-start">
              <div className="modal-header border-bottom border-light-subtle p-4 d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center gap-2 min-w-0">
                  <span className="badge bg-primary-subtle text-primary py-2 px-3 me-2 flex-shrink-0">
                    {activeRight.category.name}
                  </span>
                  <h5 className="modal-title fw-bold mb-0 text-truncate">{activeRight.title}</h5>
                </div>
                <div className="d-flex align-items-center gap-3">
                  <button
                    className="btn btn-sm btn-link p-0 text-decoration-none border-0 bg-transparent"
                    onClick={() => toggleBookmark(activeRight)}
                    title={bookmarkedIds.includes(activeRight.id) ? "Remove Bookmark" : "Add Bookmark"}
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    <i className={`bi ${bookmarkedIds.includes(activeRight.id) ? 'bi-bookmark-fill text-warning' : 'bi-bookmark'} fs-4`}></i>
                  </button>
                  <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
              </div>

              <div className="modal-body p-4">
                <ul className="nav nav-tabs mb-4" id="rightLangTabs" role="tablist">
                  <li className="nav-item" role="presentation">
                    <button className="nav-link active fw-bold" id="english-tab" data-bs-toggle="tab" data-bs-target="#english" type="button" role="tab">
                      English Text
                    </button>
                  </li>
                  {activeRight.tamilTitle && (
                    <li className="nav-item" role="presentation">
                      <button className="nav-link fw-bold" id="tamil-tab" data-bs-toggle="tab" data-bs-target="#tamil" type="button" role="tab">
                        தமிழ் உரை
                      </button>
                    </li>
                  )}
                </ul>

                <div className="tab-content" id="rightLangTabsContent">
                  <div className="tab-pane fade show active" id="english" role="tabpanel">
                    <h5 className="fw-bold mb-3">{activeRight.title}</h5>
                    <p style={{ whiteSpace: 'pre-wrap', lineHeight: '1.7' }}>{activeRight.content}</p>
                  </div>
                  {activeRight.tamilTitle && (
                    <div className="tab-pane fade" id="tamil" role="tabpanel">
                      <h5 className="fw-bold mb-3">{activeRight.tamilTitle}</h5>
                      <p style={{ whiteSpace: 'pre-wrap', lineHeight: '1.7' }}>{activeRight.tamilContent}</p>
                    </div>
                  )}
                </div>

                {activeRight.resources && (
                  <div className="mt-5 p-3 rounded bg-light border">
                    <h6 className="fw-bold text-primary mb-2">
                      <i className="bi bi-link-45deg me-1"></i>Related Legal Resources
                    </h6>
                    <p className="small mb-0 text-secondary">{activeRight.resources}</p>
                  </div>
                )}
              </div>

              <div className="modal-footer border-top border-light-subtle p-3 d-flex gap-2">
                <button
                  className="btn btn-sm btn-glass d-flex align-items-center gap-1"
                  onClick={() => {
                    if (!activeRight) return;
                    const printWindow = window.open('', '_blank');
                    printWindow.document.write(`<html><head><title>${activeRight.title}</title><style>body{font-family:Arial,sans-serif;padding:40px;color:#0f172a;}h1{color:#1e1b4b;border-bottom:2px solid #4f46e5;padding-bottom:12px;}h3{color:#4f46e5;margin-top:24px;}p{line-height:1.7;color:#334155;}</style></head><body><h1>${activeRight.title}</h1><h3>English</h3><p style="white-space:pre-wrap">${activeRight.content || ''}</p>${activeRight.tamilContent ? `<h3>தமிழ்</h3><p style="white-space:pre-wrap">${activeRight.tamilContent}</p>` : ''}${activeRight.resources ? `<h3>Resources</h3><p>${activeRight.resources}</p>` : ''}<p style="margin-top:40px;color:#94a3b8;font-size:0.8rem;">CitizenLex &bull; ${new Date().toLocaleDateString()}</p><script>window.onload=function(){window.print();setTimeout(()=>window.close(),800)}</script></body></html>`);
                    printWindow.document.close();
                  }}
                >
                  <i className="bi bi-file-pdf-fill text-danger"></i> Download PDF
                </button>
                <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Close</button>
              </div>
            </div>
          )}
        </div>
      </div>

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
