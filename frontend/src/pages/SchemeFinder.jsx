import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function SchemeFinder() {
  // ——— DB mode state ———
  const [schemes, setSchemes] = useState([]);
  const [categories, setCategories] = useState(['All', 'Farmers', 'Women & Education', 'Healthcare', 'Social Security']);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeScheme, setActiveScheme] = useState(null);
  const [loading, setLoading] = useState(true);

  // ——— AI mode state ———
  const [mode, setMode] = useState('db'); // 'db' | 'ai'
  const [aiQuery, setAiQuery] = useState('');
  const [aiResults, setAiResults] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const [expandedAiCard, setExpandedAiCard] = useState(null);

  useEffect(() => {
    fetchSchemes();
  }, []);

  const fetchSchemes = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/schemes');
      setSchemes(res.data || []);
      if (res.data && res.data.length > 0) {
        const uniqueCats = ['All', ...new Set(res.data.map(s => s.category))];
        setCategories(uniqueCats);
      }
    } catch (err) {
      console.error("Failed to fetch government schemes", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.get(`/api/schemes/search?query=${encodeURIComponent(searchQuery)}`);
      setSchemes(res.data || []);
      setSelectedCategory('All');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryFilter = async (category) => {
    setLoading(true);
    setSelectedCategory(category);
    setSearchQuery('');
    try {
      const res = category === 'All'
        ? await axios.get('/api/schemes')
        : await axios.get(`/api/schemes/category?category=${encodeURIComponent(category)}`);
      setSchemes(res.data || []);
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
      const res = await axios.get(`/api/schemes/ai-search?query=${encodeURIComponent(aiQuery)}`);
      let data = res.data;
      if (typeof data === 'string') {
        data = JSON.parse(data);
      }
      if (!Array.isArray(data)) throw new Error('Unexpected response format');
      console.log("AI RESULTS:", data);
      setAiResults(data);
    } catch (err) {
      console.error(err);
      setAiError('AI search failed. Please try again with a different query.');
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="container py-5 text-start">
      {/* Header */}
      <div className="row mb-4 fade-in-el">
        <div className="col-lg-8 mx-auto text-center">
          <span className="badge bg-light text-success border border-success-subtle px-3 py-2 mb-3 fw-bold rounded-pill">
            🇮🇳 Government Benefits
          </span>
          <h1 className="fw-extrabold mb-3">Government Scheme Finder</h1>
          <p className="text-secondary lead">
            Discover welfare schemes launched by the central and state governments. Verify eligibility criteria and locate required documents immediately.
          </p>
        </div>
      </div>

      {/* Mode Toggle Tabs */}
      <div className="d-flex justify-content-center mb-4">
        <div className="btn-group" role="group">
          <button
            className={`btn px-4 ${mode === 'db' ? 'btn-success text-white' : 'btn-glass-secondary'}`}
            onClick={() => setMode('db')}
          >
            <i className="bi bi-database me-2"></i>Database Search
          </button>
          <button
            className={`btn px-4 ${mode === 'ai' ? 'btn-success text-white' : 'btn-glass-secondary'}`}
            onClick={() => setMode('ai')}
          >
            <i className="bi bi-stars me-2"></i>AI Smart Search
          </button>
        </div>
      </div>

      {/* ====== DB MODE ====== */}
      {mode === 'db' && (
        <>
          {/* DB Search Bar */}
          <div className="row mb-4 fade-in-el">
            <div className="col-lg-8 mx-auto">
              <form onSubmit={handleSearch} className="d-flex gap-2">
                <input
                  type="text"
                  className="form-control form-glass-control"
                  placeholder="Search schemes by name, category, or eligibility..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button type="submit" className="btn btn-glass bg-success border-0 px-4" style={{ boxShadow: '0 4px 14px 0 rgba(25, 135, 84, 0.3)' }}>
                  <i className="bi bi-search"></i>
                </button>
              </form>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="row mb-4 fade-in-el">
            <div className="col-12 d-flex flex-wrap gap-2 justify-content-center">
              {categories.map((cat) => (
                <button
                  key={cat}
                  className={`btn ${selectedCategory === cat ? 'btn-success text-white' : 'btn-glass-secondary'}`}
                  onClick={() => handleCategoryFilter(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* DB Schemes Grid */}
          {loading ? (
            <div className="d-flex justify-content-center py-5">
              <div className="spinner-border text-success" role="status">
                <span className="visually-hidden">Loading schemes...</span>
              </div>
            </div>
          ) : schemes.length === 0 ? (
            <div className="text-center py-5 text-secondary">
              <i className="bi bi-patch-exclamation-fill fs-1 text-secondary-50 d-block mb-3"></i>
              <h5>No schemes matched your search</h5>
              <p className="small">Try a different keyword or category.</p>
            </div>
          ) : (
            <div className="row g-4 fade-in-el">
              {schemes.map((sch) => (
                <div key={sch.id} className="col-md-6">
                  <div className="glass-panel glass-panel-hover p-4 h-100 d-flex flex-column justify-content-between">
                    <div>
                      <div className="d-flex justify-content-between mb-3">
                        <span className="badge bg-success-subtle text-success py-2 px-3">{sch.category}</span>
                      </div>
                      <h5 className="fw-bold mb-3">{sch.title}</h5>
                      <div className="mb-2">
                        <strong className="text-primary small d-block">Who is eligible:</strong>
                        <p className="text-secondary small mb-0 text-truncate-2">{sch.eligibility}</p>
                      </div>
                    </div>
                    <button
                      className="btn btn-outline-success btn-sm w-100 mt-4 py-2"
                      onClick={() => setActiveScheme(sch)}
                      data-bs-toggle="modal"
                      data-bs-target="#schemeDetailsModal"
                    >
                      View Eligibility &amp; Documents
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
          {/* AI Search Bar */}
          <div className="row mb-4">
            <div className="col-lg-8 mx-auto">
              <div className="glass-panel p-4">
                <div className="d-flex align-items-center gap-2 mb-3">
                  <i className="bi bi-stars text-success fs-4"></i>
                  <h5 className="mb-0 fw-bold">Ask AI for Relevant Schemes</h5>
                </div>
                <p className="text-secondary small mb-3">
                  Describe your situation or what you're looking for and the AI will find the best matching government schemes for you.
                </p>
                <form onSubmit={handleAiSearch} className="d-flex gap-2">
                  <input
                    type="text"
                    className="form-control form-glass-control"
                    placeholder="e.g. schemes for farmers with small land, education support for girls..."
                    value={aiQuery}
                    onChange={(e) => setAiQuery(e.target.value)}
                  />
                  <button
                    type="submit"
                    className="btn btn-success border-0 px-4 d-flex align-items-center gap-2"
                    disabled={aiLoading || !aiQuery.trim()}
                    style={{ boxShadow: '0 4px 14px rgba(25,135,84,0.35)', whiteSpace: 'nowrap' }}
                  >
                    {aiLoading ? <span className="spinner-border spinner-border-sm" role="status"></span> : <i className="bi bi-send-fill"></i>}
                    <span>{aiLoading ? 'Searching...' : 'Find Schemes'}</span>
                  </button>
                </form>

                {/* Suggestion chips */}
                {aiResults.length === 0 && !aiLoading && (
                  <div className="d-flex flex-wrap gap-2 mt-3">
                    {['Schemes for farmers', 'Women empowerment schemes', 'Healthcare schemes for poor', 'Education scholarship schemes'].map(q => (
                      <button
                        key={q}
                        className="btn btn-sm btn-glass-secondary"
                        onClick={() => { setAiQuery(q); }}
                      >
                        <i className="bi bi-lightning-fill text-success me-1"></i>{q}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* AI Error */}
          {aiError && (
            <div className="alert alert-danger d-flex align-items-center mb-4" role="alert">
              <i className="bi bi-exclamation-triangle-fill me-2"></i>
              <div className="small">{aiError}</div>
            </div>
          )}

          {/* AI Results */}
          {aiResults.length > 0 && (
            <div>
              <div className="d-flex align-items-center gap-2 mb-3">
                <i className="bi bi-check-circle-fill text-success"></i>
                <span className="text-success fw-bold small">{aiResults.length} schemes found by AI for "{aiQuery}"</span>
              </div>
              <div className="row g-4">
                {aiResults.map((scheme, i) => (
                  <div key={i} className="col-md-6">
                    <div className="glass-panel glass-panel-hover p-4 h-100 d-flex flex-column">
                      <div className="d-flex align-items-start justify-content-between mb-3">
                        <span className="badge bg-success-subtle text-success py-2 px-3">
                          <i className="bi bi-stars me-1"></i>AI Result
                        </span>
                        <span className="badge bg-secondary-subtle text-secondary small">#{i + 1}</span>
                      </div>
                      <h5 className="fw-bold mb-2">{scheme.name}</h5>
                      <p className="text-secondary small mb-3 flex-grow-1" style={{ lineHeight: '1.6' }}>
                        {expandedAiCard === i
                          ? scheme.description
                          : (scheme.description || '').length > 120
                            ? scheme.description.slice(0, 120) + '...'
                            : scheme.description}
                      </p>
                      {(scheme.description || '').length > 120 && (
                        <button
                          className="btn btn-link btn-sm p-0 text-success text-start mb-2"
                          onClick={() => setExpandedAiCard(expandedAiCard === i ? null : i)}
                        >
                          {expandedAiCard === i ? 'Show less' : 'Read more'}
                        </button>
                      )}
                      <div className="mt-auto pt-3 border-top">
                        <strong className="text-primary small d-block mb-1">Eligibility:</strong>
                        <p className="text-secondary small mb-0" style={{ lineHeight: '1.5' }}>{scheme.eligibility}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!aiLoading && aiResults.length === 0 && !aiError && (
            <div className="text-center py-5 text-secondary">
              <i className="bi bi-stars fs-1 text-success-subtle d-block mb-3"></i>
              <h5>AI Scheme Finder Ready</h5>
              <p className="small">Enter your query above to let our AI find the best government schemes for your situation.</p>
            </div>
          )}
        </div>
      )}

      {/* Bootstrap Modal for DB scheme details */}
      <div className="modal fade" id="schemeDetailsModal" tabIndex="-1" aria-hidden="true">
        <div className="modal-dialog modal-lg modal-dialog-centered">
          {activeScheme && (
            <div className="modal-content glass-panel border-0 text-start">
              <div className="modal-header border-bottom border-light-subtle p-4">
                <div className="d-flex align-items-center">
                  <span className="badge bg-success-subtle text-success py-2 px-3 me-3">{activeScheme.category}</span>
                  <h5 className="modal-title fw-bold mb-0">{activeScheme.title}</h5>
                </div>
                <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
              </div>

              <div className="modal-body p-4">
                <div className="mb-4">
                  <h6 className="fw-bold text-success"><i className="bi bi-person-check-fill me-2"></i>Eligibility Criteria</h6>
                  <p className="ps-4 text-secondary" style={{ whiteSpace: 'pre-wrap' }}>{activeScheme.eligibility}</p>
                </div>
                <div className="mb-4">
                  <h6 className="fw-bold text-success"><i className="bi bi-file-earmark-medical-fill me-2"></i>Required Documents</h6>
                  <p className="ps-4 text-secondary" style={{ whiteSpace: 'pre-wrap' }}>{activeScheme.requiredDocuments}</p>
                </div>
                <div className="mb-4">
                  <h6 className="fw-bold text-success"><i className="bi bi-send-check-fill me-2"></i>Application Process</h6>
                  <p className="ps-4 text-secondary" style={{ whiteSpace: 'pre-wrap' }}>{activeScheme.applicationProcess}</p>
                </div>
                {activeScheme.officialLink && (
                  <div className="p-3 bg-light rounded border d-flex justify-content-between align-items-center mt-4">
                    <div>
                      <h6 className="fw-bold mb-1">Official Website Link</h6>
                      <span className="text-secondary small">Apply directly on the secure governmental portal</span>
                    </div>
                    <a href={activeScheme.officialLink} target="_blank" rel="noopener noreferrer" className="btn btn-success text-white d-flex align-items-center gap-2">
                      <span>Visit Portal</span>
                      <i className="bi bi-box-arrow-up-right"></i>
                    </a>
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
