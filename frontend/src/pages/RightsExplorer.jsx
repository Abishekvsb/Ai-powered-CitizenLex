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
                      <div className="d-flex justify-content-between align-items-start mb-3">
                        <span className="badge bg-primary-subtle text-primary py-2 px-3">
                          {right.category.name}
                        </span>
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
                  <div key={i} className="col-md-6 col-lg-4">
                    <div className="glass-panel glass-panel-hover p-4 h-100 d-flex flex-column">
                      <div className="d-flex align-items-start justify-content-between mb-3">
                        <span className="badge bg-primary-subtle text-primary py-2 px-3">
                          <i className="bi bi-stars me-1"></i>AI Result
                        </span>
                        <span className="badge bg-secondary-subtle text-secondary small">#{i + 1}</span>
                      </div>
                      <h5 className="fw-bold mb-2">{right.title}</h5>
                      <p className="text-secondary small mb-3 flex-grow-1" style={{ lineHeight: '1.6' }}>
                        {expandedAiCard === i
                          ? right.description
                          : (right.description || '').length > 130
                            ? right.description.slice(0, 130) + '...'
                            : right.description}
                      </p>
                      {(right.description || '').length > 130 && (
                        <button
                          className="btn btn-link btn-sm p-0 text-primary text-start mb-2"
                          onClick={() => setExpandedAiCard(expandedAiCard === i ? null : i)}
                        >
                          {expandedAiCard === i ? 'Show less' : 'Read more'}
                        </button>
                      )}
                      {right.applicable_law && (
                        <div className="mt-auto pt-3 border-top">
                          <div className="d-flex align-items-start gap-2">
                            <i className="bi bi-journal-text text-primary mt-1" style={{ fontSize: '0.85rem' }}></i>
                            <div>
                              <strong className="text-primary small d-block mb-1">Applicable Law:</strong>
                              <p className="text-secondary small mb-0" style={{ lineHeight: '1.5' }}>{right.applicable_law}</p>
                            </div>
                          </div>
                        </div>
                      )}
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
              <div className="modal-header border-bottom border-light-subtle p-4">
                <div className="d-flex align-items-center gap-2">
                  <span className="badge bg-primary-subtle text-primary py-2 px-3 me-2">
                    {activeRight.category.name}
                  </span>
                  <h5 className="modal-title fw-bold mb-0">{activeRight.title}</h5>
                </div>
                <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
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

              <div className="modal-footer border-top border-light-subtle p-3">
                <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Close</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
