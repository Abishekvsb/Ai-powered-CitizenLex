import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();
  const [chats, setChats] = useState([]);
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);

  // ——— Bookmarks & Toast state ———
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
    } catch (e) {
      console.error('Failed to load bookmarks from localStorage', e);
    }
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
    { to: '/chat', icon: 'bi-chat-square-text-fill', label: 'AI Assistant', color: '#2563eb', bg: 'rgba(37,99,235,0.1)' },
    { to: '/analyzer', icon: 'bi-file-earmark-pdf-fill', label: 'Doc Analyzer', color: '#06b6d4', bg: 'rgba(6,182,212,0.1)' },
    { to: '/rights', icon: 'bi-book-fill', label: 'Rights Explorer', color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
    { to: '/schemes', icon: 'bi-search-heart-fill', label: 'Scheme Finder', color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
  ];

  const stats = [
    {
      label: 'AI Conversations',
      value: chats.length,
      icon: 'bi-chat-dots-fill',
      color: '#2563eb',
      bg: 'rgba(37,99,235,0.1)',
      sub: chats.length === 0 ? 'Start your first chat' : `Last: ${new Date(chats[0]?.createdAt).toLocaleDateString()}`,
    },
    {
      label: 'Documents Analyzed',
      value: docs.length,
      icon: 'bi-file-earmark-bar-graph-fill',
      color: '#06b6d4',
      bg: 'rgba(6,182,212,0.1)',
      sub: docs.length === 0 ? 'Upload your first doc' : `Latest: ${docs[0]?.fileName?.slice(0, 20)}...`,
    },
    {
      label: 'Account Status',
      value: 'Active',
      icon: 'bi-patch-check-fill',
      color: '#10b981',
      bg: 'rgba(16,185,129,0.1)',
      sub: `Member since ${user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}`,
    },
  ];

  if (loading) {
    return (
      <div className="container py-5">
        <div className="row g-4 mb-5">
          {[1, 2, 3].map(i => (
            <div className="col-md-4" key={i}>
              <div className="glass-panel p-4" style={{ height: 120 }}>
                <div className="skeleton-loader mb-2" style={{ height: 16, width: '60%' }}></div>
                <div className="skeleton-loader mb-2" style={{ height: 36, width: '40%' }}></div>
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

      {/* Welcome Header */}
      <div className="row mb-5 fade-in-el">
        <div className="col-12 d-flex align-items-center justify-content-between flex-wrap gap-3">
          <div>
            <p className="text-secondary mb-1 small fw-semibold text-uppercase tracking-wide">
              {greeting()},
            </p>
            <h1 className="fw-bold mb-1" style={{ fontSize: '2rem' }}>
              {user?.firstName} {user?.lastName} 👋
            </h1>
            <p className="text-secondary mb-0">
              Your legal intelligence hub — AI-powered, always ready.
            </p>
          </div>
          <Link to="/profile" className="btn btn-glass-secondary d-flex align-items-center gap-2">
            <i className="bi bi-person-gear"></i>
            <span>My Profile</span>
          </Link>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="row g-4 mb-5">
        {stats.map((s, i) => (
          <div className="col-md-4 fade-in-el" key={i} style={{ animationDelay: `${i * 0.08}s` }}>
            <div className="glass-panel p-4 dashboard-stat-card h-100">
              <div className="d-flex align-items-start justify-content-between mb-3">
                <div
                  className="d-flex align-items-center justify-content-center rounded-3"
                  style={{ width: 52, height: 52, background: s.bg, color: s.color, fontSize: '1.4rem' }}
                >
                  <i className={`bi ${s.icon}`}></i>
                </div>
              </div>
              <div className="fs-1 fw-bold mb-1" style={{ color: s.color, lineHeight: 1 }}>{s.value}</div>
              <div className="fw-semibold mb-1">{s.label}</div>
              <div className="text-secondary small">{s.sub}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="row g-4 mb-5">
        {/* Quick Actions */}
        <div className="col-lg-5 fade-in-el-delay-1">
          <div className="glass-panel p-4 h-100">
            <h5 className="fw-bold mb-4 d-flex align-items-center gap-2">
              <i className="bi bi-grid-fill text-primary"></i>
              Quick Access
            </h5>
            <div className="row g-3">
              {quickActions.map((a, i) => (
                <div className="col-6" key={i}>
                  <Link
                    to={a.to}
                    className="text-decoration-none d-flex flex-column align-items-center justify-content-center p-3 rounded-3 glass-panel-hover text-center"
                    style={{ background: a.bg, border: `1px solid ${a.color}22`, minHeight: 90, transition: 'all 0.2s' }}
                  >
                    <i className={`bi ${a.icon} mb-2`} style={{ fontSize: '1.6rem', color: a.color }}></i>
                    <span className="fw-semibold small" style={{ color: 'var(--text)' }}>{a.label}</span>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Chat History */}
        <div className="col-lg-7 fade-in-el-delay-2">
          <div className="glass-panel p-4 h-100">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h5 className="fw-bold mb-0 d-flex align-items-center gap-2">
                <i className="bi bi-clock-history text-primary"></i>
                Recent Conversations
              </h5>
              <Link to="/chat" className="btn btn-sm btn-glass" style={{ fontSize: '0.8rem', padding: '5px 14px' }}>
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
              <div className="d-flex flex-column gap-2" style={{ maxHeight: 320, overflowY: 'auto' }}>
                {chats.slice(0, 6).map((chat) => (
                  <Link
                    key={chat.id}
                    to="/chat"
                    className="text-decoration-none p-3 rounded-3 d-flex align-items-start gap-3"
                    style={{ background: 'rgba(37,99,235,0.04)', border: '1px solid var(--border)', transition: 'background 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(37,99,235,0.08)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(37,99,235,0.04)'}
                  >
                    <div
                      className="d-flex align-items-center justify-content-center rounded-2 flex-shrink-0 mt-1"
                      style={{ width: 32, height: 32, background: 'rgba(37,99,235,0.1)', color: 'var(--primary)' }}
                    >
                      <i className="bi bi-chat-left-text-fill small"></i>
                    </div>
                    <div className="flex-grow-1 min-w-0">
                      <div className="fw-semibold text-truncate small mb-1" style={{ color: 'var(--text)' }}>
                        {chat.message}
                      </div>
                      <div className="text-truncate small" style={{ color: 'var(--text-secondary)' }}>
                        {chat.response?.slice(0, 80)}...
                      </div>
                    </div>
                    <div className="flex-shrink-0 text-end">
                      <span className="badge rounded-pill small" style={{ background: chat.language === 'ta' ? 'rgba(139,92,246,0.15)' : 'rgba(37,99,235,0.12)', color: chat.language === 'ta' ? '#8b5cf6' : 'var(--primary)', fontSize: '0.7rem' }}>
                        {chat.language === 'ta' ? '🇮🇳 Tamil' : '🇬🇧 EN'}
                      </span>
                      <div className="text-secondary mt-1" style={{ fontSize: '0.72rem' }}>
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

      {/* Documents Section */}
      <div className="row g-4 fade-in-el-delay-3">
        <div className="col-12">
          <div className="glass-panel p-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h5 className="fw-bold mb-0 d-flex align-items-center gap-2">
                <i className="bi bi-folder2-open text-primary"></i>
                Analyzed Documents
              </h5>
              <Link to="/analyzer" className="btn btn-sm btn-glass-secondary" style={{ fontSize: '0.8rem', padding: '5px 14px' }}>
                <i className="bi bi-upload me-1"></i>Upload New
              </Link>
            </div>

            {docs.length === 0 ? (
              <div className="text-center py-5 text-secondary">
                <i className="bi bi-file-earmark-plus fs-1 d-block mb-3 opacity-25"></i>
                <p className="mb-2 fw-semibold">No documents uploaded</p>
                <p className="small mb-3">Upload a legal document for instant AI-powered analysis.</p>
                <Link to="/analyzer" className="btn btn-glass btn-sm">Upload Document</Link>
              </div>
            ) : (
              <div className="row g-3">
                {docs.slice(0, 6).map((doc) => (
                  <div key={doc.id} className="col-md-4 col-lg-3">
                    <div
                      className="p-3 rounded-3 h-100 d-flex flex-column"
                      style={{ background: 'rgba(6,182,212,0.05)', border: '1px solid rgba(6,182,212,0.15)' }}
                    >
                      <div className="d-flex align-items-center gap-2 mb-2">
                        <i className="bi bi-file-earmark-text-fill text-info fs-4"></i>
                        <span className="fw-semibold small text-truncate">{doc.fileName}</span>
                      </div>
                      <div className="text-secondary small mt-auto">
                        {new Date(doc.uploadedAt).toLocaleDateString()}
                      </div>
                      <Link to="/analyzer" className="btn btn-sm btn-outline-info mt-2 w-100" style={{ fontSize: '0.78rem' }}>
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

      {/* Saved Library Section */}
      <div className="row g-4 mt-2 mb-5 fade-in-el-delay-3">
        <div className="col-12">
          <div className="glass-panel p-4">
            <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
              <h5 className="fw-bold mb-0 d-flex align-items-center gap-2">
                <i className="bi bi-bookmarks-fill text-primary"></i>
                Saved Library
              </h5>
              
              {/* Quick Search */}
              <div className="position-relative" style={{ maxWidth: 300, width: '100%' }}>
                <i className="bi bi-search position-absolute" style={{ left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}></i>
                <input
                  type="text"
                  className="form-control form-glass-control ps-5 py-2"
                  placeholder="Search saved items..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{ fontSize: '0.85rem', height: 38 }}
                />
              </div>
            </div>

            <div className="row g-4">
              {/* Saved Rights Column */}
              <div className="col-lg-6">
                <div className="p-3 rounded-3 h-100" style={{ background: 'rgba(37,99,235,0.02)', border: '1px solid var(--border)' }}>
                  <h6 className="fw-bold mb-3 d-flex align-items-center justify-content-between">
                    <span className="d-flex align-items-center gap-2">
                      <i className="bi bi-shield-check text-primary"></i>
                      Saved Rights
                    </span>
                    <span className="badge rounded-pill bg-primary bg-opacity-10 text-primary small">{filteredRights.length}</span>
                  </h6>

                  {filteredRights.length === 0 ? (
                    <div className="text-center py-5 text-secondary">
                      <i className="bi bi-bookmark-plus fs-2 d-block mb-2 opacity-25"></i>
                      <p className="small mb-0">{searchQuery ? 'No matching saved rights' : 'No saved rights yet'}</p>
                    </div>
                  ) : (
                    <div className="d-flex flex-column gap-2" style={{ maxHeight: 300, overflowY: 'auto' }}>
                      {filteredRights.map(right => (
                        <div
                          key={right.id}
                          className="p-3 rounded-3 d-flex align-items-center justify-content-between gap-3 text-start"
                          style={{ background: 'var(--surface)', border: '1px solid var(--border)', transition: 'background 0.2s' }}
                        >
                          <div className="min-w-0 flex-grow-1" style={{ cursor: 'pointer' }} onClick={() => setActiveRight(right)} data-bs-toggle="modal" data-bs-target="#dashboardRightModal">
                            <span className="badge bg-primary bg-opacity-10 text-primary mb-1" style={{ fontSize: '0.7rem' }}>
                              {right.category?.name}
                            </span>
                            <h6 className="fw-semibold text-truncate mb-1" style={{ fontSize: '0.88rem' }}>{right.title}</h6>
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

              {/* Saved Schemes Column */}
              <div className="col-lg-6">
                <div className="p-3 rounded-3 h-100" style={{ background: 'rgba(25,135,84,0.02)', border: '1px solid var(--border)' }}>
                  <h6 className="fw-bold mb-3 d-flex align-items-center justify-content-between">
                    <span className="d-flex align-items-center gap-2">
                      <i className="bi bi-gift text-success"></i>
                      Saved Schemes
                    </span>
                    <span className="badge rounded-pill bg-success bg-opacity-10 text-success small">{filteredSchemes.length}</span>
                  </h6>

                  {filteredSchemes.length === 0 ? (
                    <div className="text-center py-5 text-secondary">
                      <i className="bi bi-bookmark-plus fs-2 d-block mb-2 opacity-25"></i>
                      <p className="small mb-0">{searchQuery ? 'No matching saved schemes' : 'No saved schemes yet'}</p>
                    </div>
                  ) : (
                    <div className="d-flex flex-column gap-2" style={{ maxHeight: 300, overflowY: 'auto' }}>
                      {filteredSchemes.map(sch => (
                        <div
                          key={sch.id}
                          className="p-3 rounded-3 d-flex align-items-center justify-content-between gap-3 text-start"
                          style={{ background: 'var(--surface)', border: '1px solid var(--border)', transition: 'background 0.2s' }}
                        >
                          <div className="min-w-0 flex-grow-1" style={{ cursor: 'pointer' }} onClick={() => setActiveScheme(sch)} data-bs-toggle="modal" data-bs-target="#dashboardSchemeModal">
                            <span className="badge bg-success bg-opacity-10 text-success mb-1" style={{ fontSize: '0.7rem' }}>
                              {sch.category}
                            </span>
                            <h6 className="fw-semibold text-truncate mb-1" style={{ fontSize: '0.88rem' }}>{sch.title}</h6>
                            <p className="text-secondary small text-truncate mb-0" style={{ fontSize: '0.78rem' }}>Eligibility: {sch.eligibility}</p>
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
            <div className="modal-content glass-panel border-0 text-start">
              <div className="modal-header border-bottom border-light-subtle p-4 d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center gap-2 min-w-0">
                  <span className="badge bg-primary-subtle text-primary py-2 px-3 me-2 flex-shrink-0">
                    {activeRight.category?.name}
                  </span>
                  <h5 className="modal-title fw-bold mb-0 text-truncate">{activeRight.title}</h5>
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
                  <div className="tab-pane fade show active" id="dashboard-english" role="tabpanel">
                    <h5 className="fw-bold mb-3">{activeRight.title}</h5>
                    <p style={{ whiteSpace: 'pre-wrap', lineHeight: '1.7' }}>{activeRight.content}</p>
                  </div>
                  {activeRight.tamilTitle && (
                    <div className="tab-pane fade" id="dashboard-tamil" role="tabpanel">
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

      {/* Modal for Scheme details */}
      <div className="modal fade" id="dashboardSchemeModal" tabIndex="-1" aria-hidden="true">
        <div className="modal-dialog modal-lg modal-dialog-centered">
          {activeScheme && (
            <div className="modal-content glass-panel border-0 text-start">
              <div className="modal-header border-bottom border-light-subtle p-4 d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center min-w-0">
                  <span className="badge bg-success-subtle text-success py-2 px-3 me-3 flex-shrink-0">{activeScheme.category}</span>
                  <h5 className="modal-title fw-bold mb-0 text-truncate">{activeScheme.title}</h5>
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
