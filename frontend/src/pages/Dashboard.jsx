import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();
  const [chats, setChats] = useState([]);
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);

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
  }, []);

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
    </div>
  );
}
