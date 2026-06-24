import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';

export default function SchemeFinder() {
  const location = useLocation();
  const [mode, setMode] = useState('db'); // 'db' | 'ai' | 'eligibility'

  useEffect(() => {
    if (location.state?.openChecker) {
      setMode('eligibility');
      window.history.replaceState({}, '');
    }
  }, [location.state]);
  // ——— DB mode state ———
  const [schemes, setSchemes] = useState([]);
  const [categories, setCategories] = useState(['All', 'Farmers', 'Women & Education', 'Healthcare', 'Social Security']);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeScheme, setActiveScheme] = useState(null);
  const [loading, setLoading] = useState(true);

  // ——— Eligibility Checker state ———
  const [checkerAge, setCheckerAge] = useState('');
  const [checkerGender, setCheckerGender] = useState('Female');
  const [checkerIncome, setCheckerIncome] = useState('');
  const [checkerOccupation, setCheckerOccupation] = useState('Farmer');
  const [checkerState, setCheckerState] = useState('Tamil Nadu');
  const [checkerCategory, setCheckerCategory] = useState('General');
  const [checkerStep, setCheckerStep] = useState(1);
  const [checkerResults, setCheckerResults] = useState([]);

  // ——— Bookmarks & Toast state ———
  const [bookmarkedIds, setBookmarkedIds] = useState([]);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('bookmarks_schemes') || '[]');
      setBookmarkedIds(saved.map(item => item.id));
      
      const savedProfile = JSON.parse(localStorage.getItem('eligibility_profile'));
      if (savedProfile) {
        if (savedProfile.age) setCheckerAge(savedProfile.age);
        if (savedProfile.gender) setCheckerGender(savedProfile.gender);
        if (savedProfile.income) setCheckerIncome(savedProfile.income);
        if (savedProfile.occupation) setCheckerOccupation(savedProfile.occupation);
        if (savedProfile.state) setCheckerState(savedProfile.state);
        if (savedProfile.category) setCheckerCategory(savedProfile.category);
      }
    } catch (e) {
      console.error('Failed to load bookmarks or eligibility profile', e);
    }
  }, []);

  const toggleBookmark = (scheme) => {
    let current = [];
    try {
      current = JSON.parse(localStorage.getItem('bookmarks_schemes') || '[]');
    } catch(e) {}
    const exists = current.some(item => item.id === scheme.id);
    let updated;
    if (exists) {
      updated = current.filter(item => item.id !== scheme.id);
      showToast('Removed from Saved Library', 'warning');
    } else {
      updated = [...current, scheme];
      showToast('Added to Saved Library', 'success');
    }
    localStorage.setItem('bookmarks_schemes', JSON.stringify(updated));
    setBookmarkedIds(updated.map(item => item.id));
  };

  // ——— AI mode state ———
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

  const checkEligibility = () => {
    const age = parseInt(checkerAge) || 25;
    const income = parseInt(checkerIncome) || 150000;
    
    const results = schemes.map(scheme => {
      let score = 50; // default base score
      let explanations = [];

      const titleLower = scheme.title.toLowerCase();
      const catLower = scheme.category.toLowerCase();
      const eligLower = scheme.eligibility.toLowerCase();

      // 1. PM Kisan Samman Nidhi Matching
      if (titleLower.includes('kisan') || eligLower.includes('farmer') || catLower.includes('farmer')) {
        if (checkerOccupation === 'Farmer') {
          score = 100;
          explanations.push('Matched: Your occupation is Farmer, which is the primary requirement.');
        } else {
          score = 10;
          explanations.push('Ineligible: This scheme is strictly for farmers.');
        }
        
        if (income > 300000) {
          score = Math.max(10, score - 30);
          explanations.push('Partial Match: Your income is above Rs 3 Lakhs, which may exceed local limits.');
        } else {
          explanations.push('Matched: Your annual income is within the targeted range.');
        }
      } 
      // 2. Beti Bachao Beti Padhao Matching
      else if (titleLower.includes('beti') || catLower.includes('women') || eligLower.includes('girl')) {
        if (checkerGender === 'Female') {
          score = 100;
          explanations.push('Matched: Scheme targets women and girl children.');
        } else {
          score = 40;
          explanations.push('Partially Eligible: Can apply as a parent of a girl child.');
        }
        
        if (age < 18) {
          score = Math.min(100, score + 10);
          explanations.push('Matched: Target age group (minor/student).');
        } else if (age > 40) {
          score = Math.max(20, score - 20);
          explanations.push('Notice: Older age brackets are less likely to qualify unless applying for dependent children.');
        }
      }
      // 3. Ayushman Bharat (PM-JAY) Matching
      else if (titleLower.includes('ayushman') || titleLower.includes('jay') || catLower.includes('health') || eligLower.includes('poor')) {
        if (income <= 250000) {
          score = 100;
          explanations.push('Matched: Your income is under Rs. 2.5 Lakhs (SECC poor/vulnerable category).');
        } else if (income <= 500000) {
          score = 70;
          explanations.push('Partially Eligible: Middle-low income. Empanelment depends on Ration Card status.');
        } else {
          score = 15;
          explanations.push('Ineligible: Your income exceeds the limit for free healthcare schemes.');
        }

        if (checkerCategory !== 'General') {
          score = Math.min(100, score + 10);
          explanations.push('Matched: Social category preference (OBC/SC/ST/EWS).');
        }
      }
      // 4. Atal Pension Yojana (APY) Matching
      else if (titleLower.includes('atal') || titleLower.includes('pension') || eligLower.includes('18 and 40')) {
        if (age >= 18 && age <= 40) {
          score = 90;
          explanations.push('Matched: Your age (' + age + ') is within the required 18 to 40 years range.');
        } else {
          score = 0;
          explanations.push('Ineligible: Your age must be between 18 and 40 years to enroll.');
        }

        if (checkerOccupation === 'Salaried') {
          score = Math.max(0, score - 15);
          explanations.push('Notice: Taxpayers and formal salaried workers are subject to pension limits/exclusions.');
        } else {
          explanations.push('Matched: Ideal for informal sector worker (' + checkerOccupation + ').');
        }
      }
      // 5. Generic Matching logic for other/added schemes
      else {
        if (eligLower.includes(checkerOccupation.toLowerCase())) {
          score += 20;
          explanations.push('Matched: Occupation matches scheme details.');
        }
        if (eligLower.includes('bpl') || eligLower.includes('poor') || eligLower.includes('low-income')) {
          if (income <= 250000) {
            score += 20;
            explanations.push('Matched: Low income is compatible with BPL/welfare target.');
          } else {
            score -= 20;
            explanations.push('Notice: Scheme targets BPL/poor households.');
          }
        }
        if (eligLower.includes('youth') || eligLower.includes('student')) {
          if (age <= 28) {
            score += 15;
            explanations.push('Matched: Age is within youth demographic.');
          }
        }
      }

      score = Math.max(0, Math.min(100, score));

      return {
        ...scheme,
        score,
        explanations
      };
    }).sort((a, b) => b.score - a.score);

    try {
      localStorage.setItem('eligibility_profile', JSON.stringify({
        age: checkerAge,
        gender: checkerGender,
        income: checkerIncome,
        occupation: checkerOccupation,
        state: checkerState,
        category: checkerCategory
      }));
    } catch (e) {
      console.error('Failed to save eligibility profile', e);
    }
    setCheckerResults(results);
    setCheckerStep(4);
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
      <div className="d-flex justify-content-center mb-4 flex-wrap gap-2">
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
          <button
            className={`btn px-4 ${mode === 'eligibility' ? 'btn-success text-white' : 'btn-glass-secondary'}`}
            onClick={() => setMode('eligibility')}
          >
            <i className="bi bi-person-check-fill me-2"></i>Eligibility Checker
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
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <span className="badge bg-success-subtle text-success py-2 px-3">{sch.category}</span>
                        <button
                          className="btn btn-sm btn-link p-0 text-decoration-none border-0 bg-transparent"
                          onClick={(e) => { e.preventDefault(); toggleBookmark(sch); }}
                          title={bookmarkedIds.includes(sch.id) ? "Remove Bookmark" : "Add Bookmark"}
                          style={{ color: 'var(--text-secondary)' }}
                        >
                          <i className={`bi ${bookmarkedIds.includes(sch.id) ? 'bi-bookmark-fill text-warning' : 'bi-bookmark'} fs-5`}></i>
                        </button>
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

      {/* ====== ELIGIBILITY MODE ====== */}
      {mode === 'eligibility' && (
        <div className="fade-in-el">
          <div className="row justify-content-center">
            <div className="col-lg-8">
              <div className="glass-panel p-4 mb-4">
                
                {/* Step Indicator */}
                {checkerStep < 4 && (
                  <div className="d-flex justify-content-between mb-4 position-relative px-2">
                    <div className="position-absolute top-50 start-0 end-0 translate-middle-y bg-secondary" style={{ height: 2, zIndex: 0 }}></div>
                    <div className="position-absolute top-50 start-0 bg-success" style={{ height: 2, width: `${((checkerStep - 1) / 2) * 100}%`, zIndex: 0, transition: 'width 0.3s' }}></div>
                    
                    {[1, 2, 3].map(step => (
                      <div
                        key={step}
                        className={`rounded-circle d-flex align-items-center justify-content-center fw-bold position-relative`}
                        style={{
                          width: 38,
                          height: 38,
                          background: checkerStep >= step ? 'var(--primary)' : 'var(--bg-secondary)',
                          color: checkerStep >= step ? 'white' : 'var(--text-secondary)',
                          border: `2px solid ${checkerStep >= step ? 'var(--primary)' : 'var(--border)'}`,
                          zIndex: 1
                        }}
                      >
                        {step}
                      </div>
                    ))}
                  </div>
                )}

                {/* Step 1: Basic Demographics */}
                {checkerStep === 1 && (
                  <div className="fade-in-el text-start">
                    <h5 className="fw-bold mb-3"><i className="bi bi-person-bounding-box text-primary me-2"></i>Step 1: Basic Demographics</h5>
                    
                    <div className="mb-3">
                      <label className="form-label fw-semibold small text-secondary">Your Age / வயது</label>
                      <input
                        type="number"
                        className="form-control form-glass-control"
                        placeholder="e.g. 25"
                        value={checkerAge}
                        onChange={e => setCheckerAge(e.target.value)}
                        min={1}
                        max={120}
                        required
                      />
                    </div>

                    <div className="mb-4">
                      <label className="form-label fw-semibold small text-secondary">Your Gender / பாலினம்</label>
                      <select
                        className="form-select form-glass-control"
                        value={checkerGender}
                        onChange={e => setCheckerGender(e.target.value)}
                      >
                        <option value="Male" style={{ background: 'var(--bg-secondary)', color: 'var(--text)' }}>Male / ஆண்</option>
                        <option value="Female" style={{ background: 'var(--bg-secondary)', color: 'var(--text)' }}>Female / பெண்</option>
                        <option value="Transgender" style={{ background: 'var(--bg-secondary)', color: 'var(--text)' }}>Transgender / திருநங்கை/திருநம்பி</option>
                      </select>
                    </div>

                    <div className="d-flex justify-content-end">
                      <button
                        className="btn btn-glass"
                        onClick={() => {
                          if (!checkerAge) {
                            alert('Please enter your age.');
                            return;
                          }
                          setCheckerStep(2);
                        }}
                      >
                        Next Step <i className="bi bi-arrow-right ms-1"></i>
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 2: Financials & Category */}
                {checkerStep === 2 && (
                  <div className="fade-in-el text-start">
                    <h5 className="fw-bold mb-3"><i className="bi bi-wallet2 text-primary me-2"></i>Step 2: Financial Information</h5>
                    
                    <div className="mb-3">
                      <label className="form-label fw-semibold small text-secondary">Annual Family Income / ஆண்டு வருமானம் (INR)</label>
                      <input
                        type="number"
                        className="form-control form-glass-control"
                        placeholder="e.g. 150000"
                        value={checkerIncome}
                        onChange={e => setCheckerIncome(e.target.value)}
                        min={0}
                        required
                      />
                    </div>

                    <div className="mb-4">
                      <label className="form-label fw-semibold small text-secondary">Social Category / சமூகப்பிரிவு</label>
                      <select
                        className="form-select form-glass-control"
                        value={checkerCategory}
                        onChange={e => setCheckerCategory(e.target.value)}
                      >
                        <option value="General" style={{ background: 'var(--bg-secondary)', color: 'var(--text)' }}>General / பொதுப் பிரிவு</option>
                        <option value="OBC" style={{ background: 'var(--bg-secondary)', color: 'var(--text)' }}>OBC / இதர பிற்படுத்தப்பட்ட வகுப்பு</option>
                        <option value="SC" style={{ background: 'var(--bg-secondary)', color: 'var(--text)' }}>SC / பட்டியல் சாதியினர்</option>
                        <option value="ST" style={{ background: 'var(--bg-secondary)', color: 'var(--text)' }}>ST / பழங்குடியினர்</option>
                        <option value="EWS" style={{ background: 'var(--bg-secondary)', color: 'var(--text)' }}>EWS / நலிவடைந்த பிரிவினர்</option>
                      </select>
                    </div>

                    <div className="d-flex justify-content-between">
                      <button className="btn btn-glass-secondary" onClick={() => setCheckerStep(1)}>
                        <i className="bi bi-arrow-left me-1"></i> Back
                      </button>
                      <button
                        className="btn btn-glass"
                        onClick={() => {
                          if (!checkerIncome) {
                            alert('Please enter your annual income.');
                            return;
                          }
                          setCheckerStep(3);
                        }}
                      >
                        Next Step <i className="bi bi-arrow-right ms-1"></i>
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 3: Work & Residency */}
                {checkerStep === 3 && (
                  <div className="fade-in-el text-start">
                    <h5 className="fw-bold mb-3"><i className="bi bi-briefcase text-primary me-2"></i>Step 3: Occupation & Residence</h5>
                    
                    <div className="mb-3">
                      <label className="form-label fw-semibold small text-secondary">Your Occupation / தொழில்</label>
                      <select
                        className="form-select form-glass-control"
                        value={checkerOccupation}
                        onChange={e => setCheckerOccupation(e.target.value)}
                      >
                        <option value="Farmer" style={{ background: 'var(--bg-secondary)', color: 'var(--text)' }}>Farmer / விவசாயி</option>
                        <option value="Student" style={{ background: 'var(--bg-secondary)', color: 'var(--text)' }}>Student / மாணவர்</option>
                        <option value="Unemployed" style={{ background: 'var(--bg-secondary)', color: 'var(--text)' }}>Unemployed / வேலையில்லாதவர்</option>
                        <option value="Salaried" style={{ background: 'var(--bg-secondary)', color: 'var(--text)' }}>Salaried Worker / ஊதியம் பெறுபவர்</option>
                        <option value="Business Owner" style={{ background: 'var(--bg-secondary)', color: 'var(--text)' }}>Business Owner / தொழில் அதிபர்</option>
                        <option value="Retired" style={{ background: 'var(--bg-secondary)', color: 'var(--text)' }}>Retired / ஓய்வு பெற்றவர்</option>
                      </select>
                    </div>

                    <div className="mb-4">
                      <label className="form-label fw-semibold small text-secondary">State of Residence / வசிக்கும் மாநிலம்</label>
                      <select
                        className="form-select form-glass-control"
                        value={checkerState}
                        onChange={e => setCheckerState(e.target.value)}
                      >
                        <option value="Tamil Nadu" style={{ background: 'var(--bg-secondary)', color: 'var(--text)' }}>Tamil Nadu / தமிழ்நாடு</option>
                        <option value="Maharashtra" style={{ background: 'var(--bg-secondary)', color: 'var(--text)' }}>Maharashtra / மகாராஷ்டிரா</option>
                        <option value="Karnataka" style={{ background: 'var(--bg-secondary)', color: 'var(--text)' }}>Karnataka / கர்நாடகா</option>
                        <option value="Delhi" style={{ background: 'var(--bg-secondary)', color: 'var(--text)' }}>Delhi / டெல்லி</option>
                        <option value="Others" style={{ background: 'var(--bg-secondary)', color: 'var(--text)' }}>Others / இதர மாநிலங்கள்</option>
                      </select>
                    </div>

                    <div className="d-flex justify-content-between">
                      <button className="btn btn-glass-secondary" onClick={() => setCheckerStep(2)}>
                        <i className="bi bi-arrow-left me-1"></i> Back
                      </button>
                      <button
                        className="btn btn-success text-white"
                        style={{ boxShadow: '0 4px 14px 0 rgba(25, 135, 84, 0.3)' }}
                        onClick={checkEligibility}
                      >
                        <i className="bi bi-search-heart me-1"></i> Calculate Eligibility
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 4: Results */}
                {checkerStep === 4 && (
                  <div className="fade-in-el text-start">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                      <h5 className="fw-bold mb-0"><i className="bi bi-check-circle-fill text-success me-2"></i>Matched Schemes</h5>
                      <button className="btn btn-sm btn-glass-secondary" onClick={() => setCheckerStep(1)}>
                        <i className="bi bi-arrow-counterclockwise"></i> Test Again
                      </button>
                    </div>

                    <div className="d-flex flex-column gap-3">
                      {checkerResults.map(result => {
                        let scoreColor = '#ef4444'; // red
                        let scoreLabel = 'Low Match';
                        if (result.score >= 70) {
                          scoreColor = '#10b981'; // green
                          scoreLabel = 'High Match';
                        } else if (result.score >= 40) {
                          scoreColor = '#f59e0b'; // amber
                          scoreLabel = 'Medium Match';
                        }

                        return (
                          <div
                            key={result.id}
                            className="p-4 rounded-3 text-start"
                            style={{
                              background: 'var(--surface)',
                              border: `1px solid ${result.score >= 70 ? 'rgba(16,185,129,0.2)' : 'var(--border)'}`,
                              boxShadow: 'var(--shadow-sm)'
                            }}
                          >
                            <div className="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-3">
                              <div>
                                <span className="badge bg-success-subtle text-success py-1 px-3 mb-2">{result.category}</span>
                                <h5 className="fw-bold mb-1" style={{ fontSize: '1.1rem' }}>{result.title}</h5>
                              </div>
                              
                              <div className="text-end">
                                <span className="badge px-3 py-2 fs-6 rounded-pill" style={{ background: `${scoreColor}15`, color: scoreColor, border: `1px solid ${scoreColor}40` }}>
                                  {result.score}% Match ({scoreLabel})
                                </span>
                              </div>
                            </div>

                            {/* Match Progress Bar */}
                            <div className="progress mb-3" style={{ height: 6, background: 'var(--bg-secondary)' }}>
                              <div
                                  className="progress-bar"
                                  role="progressbar"
                                  style={{ width: `${result.score}%`, backgroundColor: scoreColor }}
                                  aria-valuenow={result.score}
                                  aria-valuemin={0}
                                  aria-valuemax={100}
                              ></div>
                            </div>

                            {/* Eligibility explanations */}
                            <div className="mb-3 bg-light bg-opacity-10 p-3 rounded border" style={{ borderColor: 'var(--border)' }}>
                              <strong className="text-primary small d-block mb-2">Matching Explanations / தகுதி விளக்கம்:</strong>
                              <ul className="small text-secondary mb-0 ps-3">
                                {result.explanations.map((exp, i) => (
                                  <li key={i} className="mb-1">{exp}</li>
                                ))}
                              </ul>
                            </div>

                            <div className="d-flex gap-2">
                              <button
                                className="btn btn-sm btn-outline-success flex-fill"
                                onClick={() => setActiveScheme(result)}
                                data-bs-toggle="modal"
                                data-bs-target="#schemeDetailsModal"
                              >
                                View Details &amp; Application
                              </button>
                              
                              <button
                                className="btn btn-sm btn-link p-0 text-decoration-none border-0 bg-transparent px-2"
                                onClick={() => toggleBookmark(result)}
                                title={bookmarkedIds.includes(result.id) ? "Remove Bookmark" : "Add Bookmark"}
                              >
                                <i className={`bi ${bookmarkedIds.includes(result.id) ? 'bi-bookmark-fill text-warning' : 'bi-bookmark'} fs-5`}></i>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bootstrap Modal for DB scheme details */}
      <div className="modal fade" id="schemeDetailsModal" tabIndex="-1" aria-hidden="true">
        <div className="modal-dialog modal-lg modal-dialog-centered">
          {activeScheme && (
            <div className="modal-content glass-panel border-0 text-start">
              <div className="modal-header border-bottom border-light-subtle p-4 d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center min-w-0">
                  <span className="badge bg-success-subtle text-success py-2 px-3 me-3 flex-shrink-0">{activeScheme.category}</span>
                  <h5 className="modal-title fw-bold mb-0 text-truncate">{activeScheme.title}</h5>
                </div>
                <div className="d-flex align-items-center gap-3">
                  <button
                    className="btn btn-sm btn-link p-0 text-decoration-none border-0 bg-transparent"
                    onClick={() => toggleBookmark(activeScheme)}
                    title={bookmarkedIds.includes(activeScheme.id) ? "Remove Bookmark" : "Add Bookmark"}
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    <i className={`bi ${bookmarkedIds.includes(activeScheme.id) ? 'bi-bookmark-fill text-warning' : 'bi-bookmark'} fs-4`}></i>
                  </button>
                  <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
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
