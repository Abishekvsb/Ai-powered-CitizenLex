import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

// Micro-Interaction: Smooth Count-Up Animation
function AnimatedCounter({ value, fallbackValue = '0', duration = 800 }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const end = parseInt(value);
    if (isNaN(end) || end <= 0) {
      setCount(value || fallbackValue);
      return;
    }
    let start = 0;
    const incrementTime = Math.max(Math.floor(duration / end), 12);
    
    const timer = setInterval(() => {
      start += 1;
      setCount(start);
      if (start >= end) {
        setCount(value);
        clearInterval(timer);
      }
    }, incrementTime);
    
    return () => clearInterval(timer);
  }, [value, fallbackValue, duration]);

  return <span>{count}</span>;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [chats, setChats] = useState([]);
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savedDrafts, setSavedDrafts] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [eligibilityProfile, setEligibilityProfile] = useState(null);

  // Bookmarks & Toast state
  const [bookmarkedRights, setBookmarkedRights] = useState([]);
  const [bookmarkedSchemes, setBookmarkedSchemes] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeRight, setActiveRight] = useState(null);
  const [activeScheme, setActiveScheme] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [chatsRes, docsRes] = await Promise.all([
          axios.get('/api/chat/history'),
          axios.get('/api/documents'),
        ]);
        setChats(chatsRes.data || []);
        setDocs(docsRes.data || []);
      } catch (err) {
        console.error('Failed to load dashboard data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();

    try {
      setBookmarkedRights(JSON.parse(localStorage.getItem('bookmarks_rights') || '[]'));
      setBookmarkedSchemes(JSON.parse(localStorage.getItem('bookmarks_schemes') || '[]'));
      setSavedDrafts(JSON.parse(localStorage.getItem('saved_drafts') || '[]'));
      setRecentSearches(JSON.parse(localStorage.getItem('recent_searches') || '[]'));
      setEligibilityProfile(JSON.parse(localStorage.getItem('eligibility_profile') || 'null'));
    } catch (e) {
      console.error('Failed to load from localStorage', e);
    }

    // Fetch notification unread count
    axios.get('/api/notifications/count').then(res => {
      setUnreadNotifCount(res.data.unreadCount || 0);
    }).catch(() => {});
  }, []);

  const removeRightBookmark = (id) => {
    const updated = bookmarkedRights.filter(r => r.id !== id);
    setBookmarkedRights(updated);
    localStorage.setItem('bookmarks_rights', JSON.stringify(updated));
    showToast('Removed from Saved Library', 'warning');
  };

  const removeSchemeBookmark = (id) => {
    const updated = bookmarkedSchemes.filter(s => s.id !== id);
    setBookmarkedSchemes(updated);
    localStorage.setItem('bookmarks_schemes', JSON.stringify(updated));
    showToast('Removed from Saved Library', 'warning');
  };

  const filteredRights = bookmarkedRights.filter(r => 
    r.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    r.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.category?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredSchemes = bookmarkedSchemes.filter(s => 
    s.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.eligibility?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const quickActions = [
    { to: '/chat', icon: 'bi-chat-square-text-fill', label: 'AI Assistant', color: '#6366f1', bg: 'rgba(99,102,241,0.06)' },
    { to: '/copilot', icon: 'bi-robot', label: 'Legal Copilot', color: '#f59e0b', bg: 'rgba(245,158,11,0.06)', isNew: true },
    { to: '/analyzer', icon: 'bi-file-earmark-pdf-fill', label: 'Doc Analyzer', color: '#06b6d4', bg: 'rgba(6,182,212,0.06)' },
    { to: '/ocr', icon: 'bi-upc-scan', label: 'OCR Scanner', color: '#8b5cf6', bg: 'rgba(139,92,246,0.06)' },
    { to: '/rights', icon: 'bi-book-fill', label: 'Rights Explorer', color: '#10b981', bg: 'rgba(16,185,129,0.06)' },
    { to: '/schemes', icon: 'bi-search-heart-fill', label: 'Scheme Finder', color: '#ec4899', bg: 'rgba(236,72,153,0.06)' },
    { to: '/drafts', icon: 'bi-file-earmark-diff-fill', label: 'AI Drafts', color: '#ef4444', bg: 'rgba(239,68,68,0.06)' },
    { to: '/notifications', icon: 'bi-bell-fill', label: `Alerts${unreadNotifCount > 0 ? ` (${unreadNotifCount})` : ''}`, color: '#dc2626', bg: 'rgba(220,38,38,0.05)' },
  ];

  const stats = [
    {
      label: 'AI Conversations',
      value: chats.length,
      icon: 'bi-chat-dots-fill',
      color: '#6366f1',
      bg: 'rgba(99,102,241,0.06)',
      sub: chats.length === 0 ? 'Start your first chat' : `Latest: ${new Date(chats[0]?.createdAt).toLocaleDateString()}`,
    },
    {
      label: 'Documents Analyzed',
      value: docs.length,
      icon: 'bi-file-earmark-bar-graph-fill',
      color: '#06b6d4',
      bg: 'rgba(6,182,212,0.06)',
      sub: docs.length === 0 ? 'Upload your first doc' : `Latest: ${docs[0]?.fileName?.slice(0, 16)}...`,
    },
    {
      label: 'System Notifications',
      value: unreadNotifCount,
      icon: 'bi-bell-fill',
      color: unreadNotifCount > 0 ? '#dc2626' : '#10b981',
      bg: unreadNotifCount > 0 ? 'rgba(220,38,38,0.06)' : 'rgba(16,185,129,0.06)',
      sub: unreadNotifCount > 0 ? `${unreadNotifCount} unread alerts` : 'All caught up!',
    },
    {
      label: 'Account Status',
      value: 'Active',
      icon: 'bi-patch-check-fill',
      color: '#10b981',
      bg: 'rgba(16,185,129,0.06)',
      sub: `Joined ${user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}`,
    },
  ];

  if (loading) {
    return (
      <div className="container py-5">
        <div className="row g-4 mb-5">
          {[1, 2, 3, 4].map(i => (
            <div className="col-md-3" key={i}>
              <div className="glass-panel p-4" style={{ height: 130 }}>
                <div className="skeleton-loader mb-2" style={{ height: 16, width: '60%' }}></div>
                <div className="skeleton-loader mb-2" style={{ height: 32, width: '40%' }}></div>
                <div className="skeleton-loader" style={{ height: 12, width: '80%' }}></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container py-5 text-start">
      {/* Welcome Premium Hero Banner */}
      <div className="row mb-5 fade-in-el">
        <div className="col-12">
          <div className="glass-panel p-4 p-md-5 position-relative overflow-hidden shadow-lg" style={{
            borderRadius: '24px',
            background: 'linear-gradient(135deg, rgba(99,102,241,0.05) 0%, rgba(168,85,247,0.03) 100%)',
            border: '1px solid var(--border)'
          }}>
            <div className="position-absolute" style={{
              top: '-80px',
              right: '-80px',
              width: '260px',
              height: '260px',
              background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 65%)',
              filter: 'blur(40px)',
              pointerEvents: 'none'
            }} />
            
            <div className="d-flex align-items-center justify-content-between flex-wrap gap-4 position-relative z-index-1">
              <div>
                <span className="badge px-3 py-1.5 mb-3 fw-bold rounded-pill" style={{
                  background: 'rgba(99,102,241,0.12)',
                  color: 'var(--primary)',
                  border: '1px solid rgba(99,102,241,0.2)',
                  fontSize: '0.78rem'
                }}>
                  ✨ Welcome dashboard console
                </span>
                <p className="text-secondary mb-1 small fw-semibold text-uppercase tracking-wide">{greeting()}</p>
                <h1 className="fw-extrabold text-white mb-2" style={{ letterSpacing: '-1px', fontSize: '2.3rem' }}>
                  Hello, {user?.firstName} {user?.lastName} 👋
                </h1>
                <p className="text-secondary mb-0" style={{ maxWidth: '500px', lineHeight: '1.5' }}>
                  Your secure, AI-powered legal advisor is fully synchronized. Generate drafts, run OCR translations, or launch your Copilot.
                </p>
              </div>
              <Link to="/profile" className="btn btn-glass-secondary d-flex align-items-center gap-2 py-2.5 px-4 shadow-sm" style={{
                borderRadius: '12px',
                border: '1px solid var(--border)',
                background: 'var(--surface)'
              }}>
                {user?.profileImageUrl ? (
                  <img
                    src={user.profileImageUrl}
                    alt="Profile"
                    style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(99,102,241,0.4)', flexShrink: 0 }}
                  />
                ) : (
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.65rem', fontWeight: 700, color: 'white', flexShrink: 0,
                  }}>
                    {`${(user?.firstName||'?')[0]}${(user?.lastName||'')[0]||''}`.toUpperCase()}
                  </div>
                )}
                <span className="fw-semibold text-white">Manage Profile</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Count Stats Grid */}
      <div className="row g-4 mb-5">
        {stats.map((s, i) => (
          <div className="col-sm-6 col-lg-3 fade-in-el" key={i} style={{ animationDelay: `${i * 0.08}s` }}>
            <div className="glass-panel p-4 h-100 animate-hover" style={{ borderRadius: '18px' }}>
              <div className="d-flex align-items-center justify-content-between mb-3">
                <div
                  className="d-flex align-items-center justify-content-center rounded-3"
                  style={{ width: 50, height: 50, background: s.bg, color: s.color, fontSize: '1.35rem' }}
                >
                  <i className={`bi ${s.icon}`}></i>
                </div>
              </div>
              <div className="fs-1 fw-bold mb-1" style={{ color: s.color, lineHeight: 1, letterSpacing: '-1.5px' }}>
                <AnimatedCounter value={s.value} />
              </div>
              <div className="fw-bold mb-1 text-white" style={{ fontSize: '0.92rem' }}>{s.label}</div>
              <div className="text-secondary small">{s.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Access & Recent Conversations Row */}
      <div className="row g-4 mb-5">
        {/* Quick Actions Panel */}
        <div className="col-lg-5 fade-in-el-delay-1">
          <div className="glass-panel p-4 h-100" style={{ borderRadius: '20px' }}>
            <h5 className="fw-bold mb-4 text-white d-flex align-items-center gap-2">
              <i className="bi bi-grid-fill text-primary"></i>
              Quick Access Hub
            </h5>

            <div className="row g-2">
              {quickActions.map((a, i) => (
                <div className="col-6 col-sm-3 col-lg-3" key={i}>
                  <Link
                    to={a.to}
                    className="text-decoration-none d-flex flex-column align-items-center justify-content-center p-3 rounded-3 animate-hover text-center position-relative h-100"
                    style={{ background: a.bg, border: `1px solid ${a.color}15`, minHeight: 88, borderRadius: '12px' }}
                  >
                    {a.isNew && (
                      <span style={{ position: 'absolute', top: 5, right: 5, background: '#f59e0b', color: '#030712', fontSize: '0.52rem', fontWeight: 800, borderRadius: 4, padding: '1px 4px' }}>NEW</span>
                    )}
                    <i className={`bi ${a.icon} mb-1.5`} style={{ fontSize: '1.45rem', color: a.color }}></i>
                    <span className="fw-semibold" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{a.label}</span>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Conversations Panel */}
        <div className="col-lg-7 fade-in-el-delay-2">
          <div className="glass-panel p-4 h-100" style={{ borderRadius: '20px' }}>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h5 className="fw-bold mb-0 text-white d-flex align-items-center gap-2">
                <i className="bi bi-clock-history text-primary"></i>
                Recent Dialogues
              </h5>
              <Link to="/chat" className="btn btn-sm text-white" style={{ fontSize: '0.8rem', padding: '6px 14px', background: 'linear-gradient(135deg, #6366f1, #a855f7)', border: 'none', borderRadius: '8px' }}>
                <i className="bi bi-plus-lg me-1"></i>New Chat
              </Link>
            </div>

            {chats.length === 0 ? (
              <div className="text-center py-5 text-secondary">
                <i className="bi bi-chat-square-dots fs-1 d-block mb-3 opacity-25"></i>
                <p className="mb-2 fw-semibold">No conversations yet</p>
                <p className="small mb-3">Ask CitizenLex a legal question to get started.</p>
                <Link to="/chat" className="btn btn-glass btn-sm">Start Chatting</Link>
              </div>
            ) : (
              <div className="d-flex flex-column gap-2" style={{ maxHeight: 310, overflowY: 'auto' }}>
                {chats.slice(0, 5).map((chat) => (
                  <Link
                    key={chat.id}
                    to="/chat"
                    className="text-decoration-none p-3 rounded-3 d-flex align-items-start gap-3 animate-hover"
                    style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)' }}
                  >
                    <div
                      className="d-flex align-items-center justify-content-center rounded-2 flex-shrink-0 mt-1"
                      style={{ width: 32, height: 32, background: 'rgba(99,102,241,0.1)', color: 'var(--primary)' }}
                    >
                      <i className="bi bi-chat-left-text-fill small"></i>
                    </div>
                    <div className="flex-grow-1 min-w-0">
                      <div className="fw-semibold text-truncate small mb-1" style={{ color: 'var(--text)' }}>
                        {chat.message}
                      </div>
                      <div className="text-truncate small" style={{ color: 'var(--text-secondary)' }}>
                        {chat.response?.slice(0, 75)}...
                      </div>
                    </div>
                    <div className="flex-shrink-0 text-end">
                      <span className="badge rounded-pill small" style={{ background: chat.language === 'ta' ? 'rgba(139,92,246,0.12)' : 'rgba(37,99,235,0.1)', color: chat.language === 'ta' ? '#a855f7' : 'var(--primary)', fontSize: '0.68rem' }}>
                        {chat.language === 'ta' ? 'தமிழ்' : 'English'}
                      </span>
                      <div className="text-secondary mt-1" style={{ fontSize: '0.7rem' }}>
                        {new Date(chat.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Flagship Features Row */}
      <div className="row g-4 mb-5 fade-in-el-delay-2">
        {/* AI Legal Copilot Showcase */}
        <div className="col-lg-6">
          <div className="glass-panel p-4 h-100 d-flex flex-column justify-content-between position-relative overflow-hidden" 
               style={{ border: '1px solid rgba(245, 158, 11, 0.3)', background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.02) 0%, rgba(99, 102, 241, 0.02) 100%)', borderRadius: '20px' }}>
            <div className="position-absolute" style={{ top: -50, right: -50, width: 140, height: 140, background: 'radial-gradient(circle, rgba(245,158,11,0.08) 0%, transparent 70%)', pointerEvents: 'none' }}></div>
            
            <div>
              <div className="d-flex align-items-center justify-content-between mb-3">
                <span className="badge rounded-pill px-3 py-2 fw-bold text-uppercase d-flex align-items-center gap-1" 
                      style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.2)', fontSize: '0.68rem', letterSpacing: '0.5px' }}>
                  <i className="bi bi-star-fill text-warning"></i> Flagship Feature
                </span>
                <div className="d-flex align-items-center justify-content-center rounded-3" 
                     style={{ width: 42, height: 42, background: 'rgba(245, 158, 11, 0.08)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.15)' }}>
                  <i className="bi bi-shield-shaded fs-5"></i>
                </div>
              </div>
              
              <h4 className="fw-bold mb-2 text-white">AI Legal Copilot</h4>
              <p className="text-secondary small mb-4" style={{ lineHeight: '1.65' }}>
                Navigate complex legal issues with structured action lists, court timeline procedures, risk assessments, and file check indicators.
              </p>
              
              <div className="row g-2 mb-4">
                <div className="col-6">
                  <div className="p-3 rounded-3 text-start h-100" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)' }}>
                    <div className="fw-semibold mb-1 text-white" style={{ fontSize: '0.78rem' }}><i className="bi bi-file-earmark-check text-warning me-1"></i> Interactive Checks</div>
                    <div className="text-secondary" style={{ fontSize: '0.7rem' }}>Evidence gathering checklist</div>
                  </div>
                </div>
                <div className="col-6">
                  <div className="p-3 rounded-3 text-start h-100" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)' }}>
                    <div className="fw-semibold mb-1 text-white" style={{ fontSize: '0.78rem' }}><i className="bi bi-calendar2-range text-warning me-1"></i> Structured Steps</div>
                    <div className="text-secondary" style={{ fontSize: '0.7rem' }}>Step-by-step procedure map</div>
                  </div>
                </div>
              </div>
            </div>
            
            <Link to="/copilot" className="btn w-100 py-3 mt-auto d-flex align-items-center justify-content-center gap-2 fw-bold text-dark" style={{
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              border: 'none',
              borderRadius: '12px'
            }}>
              <span>Launch Legal Copilot</span>
              <i className="bi bi-arrow-right"></i>
            </Link>
          </div>
        </div>

        {/* Saved Drafts Widget */}
        <div className="col-lg-6">
          <div className="glass-panel p-4 h-100 d-flex flex-column justify-content-between" style={{ borderRadius: '20px' }}>
            <div className="mb-4">
              <h5 className="fw-bold mb-3 text-white d-flex align-items-center gap-2">
                <i className="bi bi-file-earmark-zip-fill text-primary"></i>
                Saved AI Drafts
              </h5>
              
              {savedDrafts.length === 0 ? (
                <div className="p-4 rounded-3 text-center text-secondary mb-2" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)' }}>
                  <i className="bi bi-file-earmark-plus fs-3 mb-2 d-block opacity-25"></i>
                  <span className="small d-block">No drafts saved yet. Generate one to store locally.</span>
                </div>
              ) : (
                <div className="d-flex flex-column gap-2" style={{ maxHeight: 180, overflowY: 'auto' }}>
                  {savedDrafts.slice(0, 3).map((draft) => (
                    <div key={draft.id} className="p-3 rounded-3 d-flex align-items-center justify-content-between gap-3 text-start animate-hover" 
                         style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)' }}>
                      <div className="min-w-0 flex-grow-1">
                        <h6 className="fw-semibold text-truncate mb-1 text-white" style={{ fontSize: '0.86rem' }}>{draft.title}</h6>
                        <div className="text-secondary" style={{ fontSize: '0.72rem' }}>
                          <i className="bi bi-calendar3 me-1"></i>
                          {new Date(draft.createdAt || draft.id).toLocaleDateString()}
                          <span className="mx-2">|</span>
                          <span className="badge" style={{ background: draft.language === 'ta' ? 'rgba(139,92,246,0.12)' : 'rgba(37,99,235,0.1)', color: draft.language === 'ta' ? '#a855f7' : '#6366f1', fontSize: '0.65rem' }}>
                            {draft.language === 'ta' ? 'Tamil' : 'English'}
                          </span>
                        </div>
                      </div>
                      <div className="d-flex gap-2 align-items-center">
                        <Link to="/drafts" state={{ savedDraft: draft }} className="btn btn-sm btn-glass px-3 py-1" style={{ fontSize: '0.75rem', borderRadius: '6px' }}>
                          Open
                        </Link>
                        <button onClick={() => {
                          const updated = savedDrafts.filter(d => d.id !== draft.id);
                          setSavedDrafts(updated);
                          localStorage.setItem('saved_drafts', JSON.stringify(updated));
                          showToast('Draft deleted successfully!', 'warning');
                        }} className="btn btn-sm btn-link p-0 text-decoration-none border-0 text-danger opacity-75 hover-opacity-100">
                          <i className="bi bi-trash3-fill fs-6"></i>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Recent Searches */}
            <div>
              <h5 className="fw-bold mb-3 text-white d-flex align-items-center gap-2">
                <i className="bi bi-search text-primary"></i>
                Recent Searches
              </h5>
              {recentSearches.length === 0 ? (
                <div className="p-3 rounded-3 text-center text-secondary" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)' }}>
                  <span className="small d-block">Search queries will appear here.</span>
                </div>
              ) : (
                <div className="d-flex flex-wrap gap-2 align-items-center">
                  {recentSearches.slice(0, 5).map((q, i) => (
                    <Link key={i} to="/chat" state={{ prefillText: q }} className="btn btn-sm btn-glass-secondary rounded-pill px-3 py-1.5 text-truncate" 
                          style={{ fontSize: '0.75rem', maxWidth: 170, border: '1px solid var(--border)', background: 'var(--surface)' }}>
                      <i className="bi bi-arrow-right-short text-primary me-1"></i>
                      {q}
                    </Link>
                  ))}
                  <button onClick={() => {
                    setRecentSearches([]);
                    localStorage.removeItem('recent_searches');
                    showToast('Search history cleared!', 'success');
                  }} className="btn btn-sm btn-link text-decoration-none text-secondary small p-1 ms-2">
                    Clear
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Document Storage Summary & Saved Library */}
      <div className="row g-4 mt-2 mb-5 fade-in-el-delay-3">
        <div className="col-12">
          <div className="glass-panel p-4" style={{ borderRadius: '20px' }}>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h5 className="fw-bold mb-0 text-white d-flex align-items-center gap-2">
                <i className="bi bi-folder2-open text-primary"></i>
                Analyzed Documents Archive
              </h5>
              <Link to="/analyzer" className="btn btn-sm btn-glass-secondary" style={{ fontSize: '0.8rem', padding: '6px 16px', borderRadius: '8px' }}>
                <i className="bi bi-upload me-1"></i>Upload File
              </Link>
            </div>

            {docs.length === 0 ? (
              <div className="text-center py-5 text-secondary">
                <i className="bi bi-file-earmark-plus fs-1 d-block mb-3 opacity-25"></i>
                <p className="mb-2 fw-semibold">No documents uploaded</p>
                <p className="small mb-3">Upload a lease, contract, or petition for detailed analysis.</p>
                <Link to="/analyzer" className="btn btn-glass btn-sm">Upload Document</Link>
              </div>
            ) : (
              <div className="row g-3">
                {docs.slice(0, 4).map((doc) => (
                  <div key={doc.id} className="col-md-4 col-lg-3">
                    <div
                      className="p-3 rounded-3 h-100 d-flex flex-column animate-hover"
                      style={{ background: 'rgba(6,182,212,0.03)', border: '1px solid rgba(6,182,212,0.12)', borderRadius: '14px' }}
                    >
                      <div className="d-flex align-items-center gap-2 mb-2">
                        <i className="bi bi-file-earmark-text-fill text-info fs-4"></i>
                        <span className="fw-semibold small text-truncate text-white">{doc.fileName}</span>
                      </div>
                      <div className="text-secondary small mt-auto">
                        Uploaded: {new Date(doc.uploadedAt).toLocaleDateString()}
                      </div>
                      <Link to="/analyzer" className="btn btn-sm btn-glass mt-2 w-100" style={{ fontSize: '0.78rem', background: 'rgba(6,182,212,0.15)', border: '1px solid rgba(6,182,212,0.25)', borderRadius: '6px' }}>
                        View Analysis
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Saved Library */}
      <div className="row g-4 mt-2 mb-5 fade-in-el-delay-3">
        <div className="col-12">
          <div className="glass-panel p-4" style={{ borderRadius: '20px' }}>
            <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
              <h5 className="fw-bold mb-0 text-white d-flex align-items-center gap-2">
                <i className="bi bi-bookmarks-fill text-primary"></i>
                Saved Library
              </h5>
              
              <div className="position-relative" style={{ maxWidth: 300, width: '100%' }}>
                <i className="bi bi-search position-absolute" style={{ left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}></i>
                <input
                  type="text"
                  className="form-control form-glass-control ps-5 py-2"
                  placeholder="Search saved items..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{ fontSize: '0.85rem', height: 38, borderRadius: '10px' }}
                />
              </div>
            </div>

            <div className="row g-4">
              {/* Saved Rights */}
              <div className="col-lg-6">
                <div className="p-3 rounded-3 h-100" style={{ background: 'rgba(99,102,241,0.01)', border: '1px solid var(--border)', borderRadius: '14px' }}>
                  <h6 className="fw-bold mb-3 d-flex align-items-center justify-content-between text-white">
                    <span className="d-flex align-items-center gap-2">
                      <i className="bi bi-shield-check text-primary"></i>
                      Saved Rights Articles
                    </span>
                    <span className="badge rounded-pill bg-primary bg-opacity-10 text-primary small">{filteredRights.length}</span>
                  </h6>

                  {filteredRights.length === 0 ? (
                    <div className="text-center py-5 text-secondary">
                      <i className="bi bi-bookmark-plus fs-2 d-block mb-2 opacity-25"></i>
                      <p className="small mb-0">{searchQuery ? 'No matching saved articles' : 'No saved articles yet'}</p>
                    </div>
                  ) : (
                    <div className="d-flex flex-column gap-2" style={{ maxHeight: 280, overflowY: 'auto' }}>
                      {filteredRights.map(right => (
                        <div
                          key={right.id}
                          className="p-3 rounded-3 d-flex align-items-center justify-content-between gap-3 text-start animate-hover"
                          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: '10px' }}
                        >
                          <div className="min-w-0 flex-grow-1" style={{ cursor: 'pointer' }} onClick={() => setActiveRight(right)} data-bs-toggle="modal" data-bs-target="#dashboardRightModal">
                            <span className="badge bg-primary bg-opacity-10 text-primary mb-1" style={{ fontSize: '0.68rem' }}>
                              {right.category?.name}
                            </span>
                            <h6 className="fw-semibold text-truncate mb-1 text-white" style={{ fontSize: '0.85rem' }}>{right.title}</h6>
                            <p className="text-secondary small text-truncate mb-0" style={{ fontSize: '0.78rem' }}>{right.content}</p>
                          </div>
                          <button
                            className="btn btn-sm btn-link p-0 text-decoration-none border-0 bg-transparent flex-shrink-0"
                            onClick={() => removeRightBookmark(right.id)}
                            title="Remove Bookmark"
                          >
                            <i className="bi bi-bookmark-dash-fill text-warning fs-5"></i>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Saved Schemes */}
              <div className="col-lg-6">
                <div className="p-3 rounded-3 h-100" style={{ background: 'rgba(16,185,129,0.01)', border: '1px solid var(--border)', borderRadius: '14px' }}>
                  <h6 className="fw-bold mb-3 d-flex align-items-center justify-content-between text-white">
                    <span className="d-flex align-items-center gap-2">
                      <i className="bi bi-gift text-success"></i>
                      Saved Government Schemes
                    </span>
                    <span className="badge rounded-pill bg-success bg-opacity-10 text-success small">{filteredSchemes.length}</span>
                  </h6>

                  {filteredSchemes.length === 0 ? (
                    <div className="text-center py-5 text-secondary">
                      <i className="bi bi-bookmark-plus fs-2 d-block mb-2 opacity-25"></i>
                      <p className="small mb-0">{searchQuery ? 'No matching saved schemes' : 'No saved schemes yet'}</p>
                    </div>
                  ) : (
                    <div className="d-flex flex-column gap-2" style={{ maxHeight: 280, overflowY: 'auto' }}>
                      {filteredSchemes.map(sch => (
                        <div
                          key={sch.id}
                          className="p-3 rounded-3 d-flex align-items-center justify-content-between gap-3 text-start animate-hover"
                          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: '10px' }}
                        >
                          <div className="min-w-0 flex-grow-1" style={{ cursor: 'pointer' }} onClick={() => setActiveScheme(sch)} data-bs-toggle="modal" data-bs-target="#dashboardSchemeModal">
                            <span className="badge bg-success bg-opacity-10 text-success mb-1" style={{ fontSize: '0.68rem' }}>
                              {sch.category}
                            </span>
                            <h6 className="fw-semibold text-truncate mb-1 text-white" style={{ fontSize: '0.85rem' }}>{sch.title}</h6>
                            <p className="text-secondary small text-truncate mb-0" style={{ fontSize: '0.78rem' }}>Criteria: {sch.eligibility}</p>
                          </div>
                          <button
                            className="btn btn-sm btn-link p-0 text-decoration-none border-0 bg-transparent flex-shrink-0"
                            onClick={() => removeSchemeBookmark(sch.id)}
                            title="Remove Bookmark"
                          >
                            <i className="bi bi-bookmark-dash-fill text-warning fs-5"></i>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal for Right details */}
      <div className="modal fade" id="dashboardRightModal" tabIndex="-1" aria-hidden="true">
        <div className="modal-dialog modal-lg modal-dialog-centered">
          {activeRight && (
            <div className="modal-content glass-panel border-0 text-start" style={{
              background: 'var(--surface)',
              border: '1px solid var(--surface-border)',
              borderRadius: '20px',
              backdropFilter: 'blur(24px)'
            }}>
              <div className="modal-header border-bottom border-light-subtle p-4 d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center min-w-0">
                  <span className="badge bg-primary-subtle text-primary py-2 px-3 me-2 flex-shrink-0">
                    {activeRight.category?.name}
                  </span>
                  <h5 className="modal-title fw-bold mb-0 text-truncate text-white">{activeRight.title}</h5>
                </div>
                <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
              </div>

              <div className="modal-body p-4">
                <ul className="nav nav-tabs mb-4" id="rightLangTabs" role="tablist">
                  <li className="nav-item" role="presentation">
                    <button className="nav-link active fw-bold" id="dashboard-english-tab" data-bs-toggle="tab" data-bs-target="#dashboard-english" type="button" role="tab">
                      English Text
                    </button>
                  </li>
                  {activeRight.tamilTitle && (
                    <li className="nav-item" role="presentation">
                      <button className="nav-link fw-bold" id="dashboard-tamil-tab" data-bs-toggle="tab" data-bs-target="#dashboard-tamil" type="button" role="tab">
                        தமிழ் உரை
                      </button>
                    </li>
                  )}
                </ul>

                <div className="tab-content" id="rightLangTabsContent">
                  <div className="tab-pane fade show active text-white-50" id="dashboard-english" role="tabpanel">
                    <h5 className="fw-bold mb-3 text-white">{activeRight.title}</h5>
                    <p style={{ whiteSpace: 'pre-wrap', lineHeight: '1.75' }}>{activeRight.content}</p>
                  </div>
                  {activeRight.tamilTitle && (
                    <div className="tab-pane fade text-white-50" id="dashboard-tamil" role="tabpanel">
                      <h5 className="fw-bold mb-3 text-white">{activeRight.tamilTitle}</h5>
                      <p style={{ whiteSpace: 'pre-wrap', lineHeight: '1.75' }}>{activeRight.tamilContent}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="modal-footer border-top border-light-subtle p-3">
                <button type="button" className="btn btn-glass-secondary" data-bs-dismiss="modal" style={{ borderRadius: '10px' }}>Close</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal for Scheme details */}
      <div className="modal fade" id="dashboardSchemeModal" tabIndex="-1" aria-hidden="true">
        <div className="modal-dialog modal-lg modal-dialog-centered">
          {activeScheme && (
            <div className="modal-content glass-panel border-0 text-start" style={{
              background: 'var(--surface)',
              border: '1px solid var(--surface-border)',
              borderRadius: '20px',
              backdropFilter: 'blur(24px)'
            }}>
              <div className="modal-header border-bottom border-light-subtle p-4 d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center min-w-0">
                  <span className="badge bg-success bg-opacity-10 text-success py-2 px-3 me-3 flex-shrink-0">{activeScheme.category}</span>
                  <h5 className="modal-title fw-bold mb-0 text-truncate text-white">{activeScheme.title}</h5>
                </div>
                <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
              </div>

              <div className="modal-body p-4 text-white-50">
                <div className="mb-4">
                  <h6 className="fw-bold text-success"><i className="bi bi-person-check-fill me-2"></i>Eligibility Criteria</h6>
                  <p className="ps-4" style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>{activeScheme.eligibility}</p>
                </div>
                <div className="mb-4">
                  <h6 className="fw-bold text-success"><i className="bi bi-file-earmark-medical-fill me-2"></i>Required Documents</h6>
                  <p className="ps-4" style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>{activeScheme.requiredDocuments}</p>
                </div>
                <div className="mb-4">
                  <h6 className="fw-bold text-success"><i className="bi bi-send-check-fill me-2"></i>Application Process</h6>
                  <p className="ps-4" style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>{activeScheme.applicationProcess}</p>
                </div>
                {activeScheme.officialLink && (
                  <div className="p-3 bg-glass border border-light-subtle rounded-3 d-flex justify-content-between align-items-center mt-4">
                    <div>
                      <h6 className="fw-bold mb-1 text-white">Official Website Link</h6>
                      <span className="text-secondary small">Apply directly on the secure governmental portal</span>
                    </div>
                    <a href={activeScheme.officialLink} target="_blank" rel="noopener noreferrer" className="btn btn-success text-white d-flex align-items-center gap-2" style={{ borderRadius: '10px' }}>
                      <span>Visit Portal</span>
                      <i className="bi bi-box-arrow-up-right"></i>
                    </a>
                  </div>
                )}
              </div>

              <div className="modal-footer border-top border-light-subtle p-3">
                <button type="button" className="btn btn-glass-secondary" data-bs-dismiss="modal" style={{ borderRadius: '10px' }}>Close</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Toast Notification */}
      {toast.show && (
        <div className="custom-toast-container">
          <div className={`custom-toast ${toast.type === 'success' ? 'toast-success' : 'toast-warning'}`} style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            boxShadow: 'var(--shadow-lg)'
          }}>
            <i className={`bi ${toast.type === 'success' ? 'bi-check-circle-fill text-success' : 'bi-exclamation-circle-fill text-danger'}`}></i>
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}
