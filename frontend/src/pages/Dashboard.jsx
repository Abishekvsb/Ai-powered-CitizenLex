import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  return (
    <div style={{ position: 'relative' }}>
          {/* Background ambient mesh overlays */}
          <div className="glow-orb" style={{
            top: '10%',
            left: '20%',
            width: '320px',
            height: '320px',
            background: 'radial-gradient(circle, rgba(99, 102, 241, 0.08) 0%, transparent 70%)',
          }} />
          <div className="glow-orb" style={{
            bottom: '30%',
            right: '15%',
            width: '350px',
            height: '350px',
            background: 'radial-gradient(circle, rgba(168, 85, 247, 0.06) 0%, transparent 70%)',
          }} />

          {/* Command Center Hero Banner */}
          <div className="row mb-5 fade-in-el">
        <div className="col-12">
          <div className="glass-panel p-4 p-md-5 position-relative overflow-hidden" style={{
            borderRadius: '24px',
            background: 'linear-gradient(135deg, rgba(8, 10, 24, 0.6) 0%, rgba(30, 27, 75, 0.3) 100%)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.45)'
          }}>
            <div className="position-absolute" style={{
              top: '-60px',
              right: '-60px',
              width: '240px',
              height: '240px',
              background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)',
              filter: 'blur(35px)',
              pointerEvents: 'none'
            }} />
            
            <div className="d-flex align-items-center justify-content-between flex-wrap gap-4 position-relative z-index-1">
              <div>
                <span className="badge px-3 py-1.5 mb-3 fw-bold rounded-pill" style={{
                  background: 'rgba(99, 102, 241, 0.15)',
                  color: '#818cf8',
                  border: '1px solid rgba(99, 102, 241, 0.25)',
                  fontSize: '0.78rem'
                }}>
                  ⚖️ AI COMMAND CENTRE CONSOLE
                </span>
                <p className="text-secondary mb-1 small fw-semibold text-uppercase tracking-wide">{greeting()}</p>
                <h1 className="fw-extrabold text-white mb-2" style={{ letterSpacing: '-1px', fontSize: '2.4rem' }}>
                  Hello, {user?.firstName} {user?.lastName} 👋
                </h1>
                <p className="text-secondary mb-0" style={{ maxWidth: '580px', lineHeight: '1.6' }}>
                  Your secure AI Legal Intelligence workspace is fully synchronized. Command copilot procedures, analyze documents files, or manage parameters.
                </p>
              </div>
              <Link to="/profile" className="btn btn-glass-secondary d-flex align-items-center gap-2.5 py-2.5 px-4 shadow-sm animate-hover" style={{
                borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.08)',
                background: 'rgba(255, 255, 255, 0.03)'
              }}>
                {user?.profileImageUrl ? (
                  <img
                    src={user.profileImageUrl}
                    alt="Profile"
                    style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(99,102,241,0.4)' }}
                  />
                ) : (
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.65rem', fontWeight: 700, color: 'white',
                  }}>
                    {initials || '?'}
                  </div>
                )}
                <span className="fw-semibold text-white">Manage Profile</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Floating stats metrics grid */}
      <div className="row g-4 mb-5">
        {stats.map((s, i) => (
          <div className="col-sm-6 col-lg-3 fade-in-el" key={i} style={{ animationDelay: `${i * 0.08}s` }}>
            <div className="glass-panel p-4 h-100 animate-hover" style={{
              borderRadius: '20px',
              background: 'rgba(8, 10, 24, 0.4)',
              border: `1.5px solid rgba(255, 255, 255, 0.06)`,
              boxShadow: '0 12px 30px rgba(0,0,0,0.2)'
            }}>
              <div className="d-flex align-items-center justify-content-between mb-3">
                <div
                  className="d-flex align-items-center justify-content-center rounded-3"
                  style={{ width: 48, height: 48, background: s.bg, color: s.color, fontSize: '1.3rem', border: `1px solid ${s.color}22` }}
                >
                  <i className={`bi ${s.icon}`}></i>
                </div>
              </div>
              <div className="fs-1 fw-extrabold mb-1" style={{ color: s.color, letterSpacing: '-1.5px', lineHeight: 1 }}>
                <AnimatedCounter value={s.value} />
              </div>
              <div className="fw-bold mb-1 text-white" style={{ fontSize: '0.92rem' }}>{s.label}</div>
              <div className="text-secondary small">{s.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Hub control & Dialogue feeds */}
      <div className="row g-4 mb-5">
        {/* Quick Actions Panel */}
        <div className="col-lg-5 fade-in-el-delay-1">
          <div className="glass-panel p-4 h-100" style={{ borderRadius: '22px', background: 'rgba(8, 10, 24, 0.4)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <h5 className="fw-bold mb-4 text-white d-flex align-items-center gap-2">
              <i className="bi bi-grid-fill text-primary"></i>
              Command Console Hub
            </h5>

            <div className="row g-2">
              {quickActions.map((a, i) => (
                <div className="col-6 col-sm-3 col-lg-3" key={i}>
                  <Link
                    to={a.to}
                    className="text-decoration-none d-flex flex-column align-items-center justify-content-center p-3 rounded-3 animate-hover text-center position-relative h-100"
                    style={{ background: a.bg, border: `1px solid ${a.color}18`, minHeight: 90, borderRadius: '14px' }}
                  >
                    {a.isNew && (
                      <span style={{ position: 'absolute', top: 5, right: 5, background: '#f59e0b', color: '#030712', fontSize: '0.52rem', fontWeight: 800, borderRadius: 4, padding: '1px 4px' }}>NEW</span>
                    )}
                    <i className={`bi ${a.icon} mb-1.5`} style={{ fontSize: '1.45rem', color: a.color }}></i>
                    <span className="fw-bold" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{a.label}</span>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Conversations */}
        <div className="col-lg-7 fade-in-el-delay-2">
          <div className="glass-panel p-4 h-100" style={{ borderRadius: '22px', background: 'rgba(8, 10, 24, 0.4)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h5 className="fw-bold mb-0 text-white d-flex align-items-center gap-2">
                <i className="bi bi-clock-history text-primary"></i>
                Recent Active Dialogues
              </h5>
              <Link to="/chat" className="btn btn-sm text-white fw-bold" style={{ fontSize: '0.8rem', padding: '6px 14px', background: 'linear-gradient(135deg, #6366f1, #a855f7)', border: 'none', borderRadius: '8px' }}>
                <i className="bi bi-plus-lg me-1"></i>New Chat
              </Link>
            </div>

            {chats.length === 0 ? (
              <div className="text-center py-5 text-secondary">
                <i className="bi bi-chat-square-dots fs-1 d-block mb-3 opacity-25"></i>
                <p className="mb-2 fw-semibold text-white">No active conversations</p>
                <p className="small mb-3">Ask CitizenLex a legal question to generate dialogue logs.</p>
                <Link to="/chat" className="btn btn-glass btn-sm">Start Dialogue</Link>
              </div>
            ) : (
              <div className="d-flex flex-column gap-2" style={{ maxHeight: 310, overflowY: 'auto' }}>
                {(Array.isArray(chats) ? chats : []).slice(0, 5).map((chat) => (
                  <Link
                    key={chat.id}
                    to="/chat"
                    className="text-decoration-none p-3 rounded-3 d-flex align-items-start gap-3 animate-hover"
                    style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255, 255, 255, 0.06)' }}
                  >
                    <div
                      className="d-flex align-items-center justify-content-center rounded-2 flex-shrink-0 mt-1"
                      style={{ width: 32, height: 32, background: 'rgba(99,102,241,0.1)', color: 'var(--primary)' }}
                    >
                      <i className="bi bi-chat-left-text-fill small"></i>
                    </div>
                    <div className="flex-grow-1 min-w-0">
                      <div className="fw-bold text-truncate small mb-1 text-white">
                        {chat.message}
                      </div>
                      <div className="text-truncate small text-secondary">
                        {chat.response?.slice(0, 80)}...
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

      {/* Booked Consultations */}
      <div className="row g-4 mb-5 fade-in-el-delay-2">
        <div className="col-12">
          <div className="glass-panel p-4" style={{ borderRadius: '22px', background: 'rgba(8, 10, 24, 0.4)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h5 className="fw-bold mb-0 text-white d-flex align-items-center gap-2">
                <i className="bi bi-calendar-check-fill text-primary"></i>
                Booked Consultations History
              </h5>
              <Link to="/lawyers" className="btn btn-sm btn-glass text-white border border-light-subtle" style={{ fontSize: '0.8rem', padding: '6px 14px', borderRadius: '8px' }}>
                Book New Consultation
              </Link>
            </div>

            {appointments.length === 0 ? (
              <div className="text-center py-5 text-secondary">
                <i className="bi bi-calendar-x fs-1 d-block mb-3 opacity-25"></i>
                <p className="mb-2 fw-semibold text-white">No consultations booked yet</p>
                <p className="small mb-3 text-secondary">Browse our verified advocates list to schedule a slot.</p>
              </div>
            ) : (
              <div className="row g-3">
                {appointments.map((appt) => (
                  <div className="col-md-6 col-lg-4" key={appt.id}>
                    <div className="p-3 rounded-4 h-100" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div className="d-flex align-items-center gap-2.5 mb-2.5">
                        <img
                          src={appt.lawyer?.user?.profileImageUrl || 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=50'}
                          alt="Lawyer"
                          style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover' }}
                        />
                        <div className="text-start">
                          <h6 className="fw-bold text-white mb-0" style={{ fontSize: '0.88rem' }}>Advocate {appt.lawyer?.user?.firstName} {appt.lawyer?.user?.lastName}</h6>
                          <span className="text-secondary" style={{ fontSize: '0.72rem' }}>{appt.lawyer?.specialization?.name}</span>
                        </div>
                      </div>
                      <div className="text-secondary small mb-3 text-start" style={{ fontSize: '0.78rem' }}>
                        <div><i className="bi bi-calendar-event me-1.5 text-primary"></i>Date: {appt.appointmentDate}</div>
                        <div><i className="bi bi-clock me-1.5 text-primary"></i>Time: {appt.timeSlot}</div>
                        <div><i className="bi bi-currency-rupee me-1.5 text-primary"></i>Fee: ₹{appt.consultationFee} ({appt.isPaid ? 'Paid' : 'Unpaid'})</div>
                        <div className="mt-1 text-truncate">Notes: {appt.notes || 'None'}</div>
                      </div>
                      <div className="d-flex align-items-center justify-content-between mt-auto">
                        <span className={`badge ${appt.status === 'APPROVED' ? 'bg-success' : appt.status === 'PENDING' ? 'bg-warning text-dark' : 'bg-danger'} small`} style={{ fontSize: '0.68rem' }}>
                          {appt.status}
                        </span>
                        {appt.status === 'APPROVED' && appt.meetingUrl && (
                          <a href={appt.meetingUrl} target="_blank" rel="noopener noreferrer" className="btn btn-sm text-dark fw-bold" style={{ background: 'linear-gradient(135deg, #00d2ff, #00fa9a)', border: 'none', borderRadius: '6px', fontSize: '0.75rem' }}>
                            Join Consultation <i className="bi bi-camera-video-fill ms-1"></i>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Flagship Copilot widget showcases */}
      <div className="row g-4 mb-5 fade-in-el-delay-2">
        {/* AI Legal Copilot Showcase */}
        <div className="col-lg-6">
          <div className="glass-panel p-4 h-100 d-flex flex-column justify-content-between position-relative overflow-hidden" 
               style={{ border: '1.5px solid rgba(245, 158, 11, 0.3)', background: 'linear-gradient(135deg, rgba(8, 10, 24, 0.5) 0%, rgba(245, 158, 11, 0.03) 100%)', borderRadius: '20px' }}>
            <div className="position-absolute" style={{ top: -50, right: -50, width: 140, height: 140, background: 'radial-gradient(circle, rgba(245,158,11,0.08) 0%, transparent 70%)', pointerEvents: 'none' }}></div>
            
            <div>
              <div className="d-flex align-items-center justify-content-between mb-3">
                <span className="badge rounded-pill px-3 py-2 fw-bold text-uppercase d-flex align-items-center gap-1" 
                      style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.25)', fontSize: '0.68rem', letterSpacing: '0.5px' }}>
                  <i className="bi bi-star-fill text-warning"></i> Flagship Intelligence
                </span>
                <div className="d-flex align-items-center justify-content-center rounded-3" 
                     style={{ width: 42, height: 42, background: 'rgba(245, 158, 11, 0.08)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.15)' }}>
                  <i className="bi bi-shield-shaded fs-5"></i>
                </div>
              </div>
              
              <h4 className="fw-bold mb-2 text-white">AI Legal Copilot</h4>
              <p className="text-secondary small mb-4" style={{ lineHeight: '1.65' }}>
                Resolve and command complex legal problems with structured process stages, court timeline maps, evidence requirements checklists, and local authorities guidelines.
              </p>
              
              <div className="row g-2 mb-4">
                <div className="col-6">
                  <div className="p-3 rounded-3 text-start h-100" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="fw-bold mb-1 text-white animate-hover" style={{ fontSize: '0.78rem' }}><i className="bi bi-file-earmark-check text-warning me-1.5"></i> Action Procedures</div>
                    <div className="text-secondary" style={{ fontSize: '0.7rem' }}>Structured action points maps</div>
                  </div>
                </div>
                <div className="col-6">
                  <div className="p-3 rounded-3 text-start h-100" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="fw-bold mb-1 text-white animate-hover" style={{ fontSize: '0.78rem' }}><i className="bi bi-calendar2-range text-warning me-1.5"></i> Authority Directives</div>
                    <div className="text-secondary" style={{ fontSize: '0.7rem' }}>Local government office guide</div>
                  </div>
                </div>
              </div>
            </div>
            
            <Link to="/copilot" className="btn w-100 py-3 mt-auto d-flex align-items-center justify-content-center gap-2 fw-bold text-dark animate-hover" style={{
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
          <div className="glass-panel p-4 h-100 d-flex flex-column justify-content-between" style={{ borderRadius: '20px', background: 'rgba(8, 10, 24, 0.4)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="mb-4 text-start">
              <h5 className="fw-bold mb-3 text-white d-flex align-items-center gap-2">
                <i className="bi bi-file-earmark-zip-fill text-primary"></i>
                Saved AI Drafts
              </h5>
              
              {savedDrafts.length === 0 ? (
                <div className="p-4 rounded-3 text-center text-secondary mb-2" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <i className="bi bi-file-earmark-plus fs-3 mb-2 d-block opacity-25"></i>
                  <span className="small d-block text-secondary">No saved drafts found locally.</span>
                </div>
              ) : (
                <div className="d-flex flex-column gap-2" style={{ maxHeight: 180, overflowY: 'auto' }}>
                  {(Array.isArray(savedDrafts) ? savedDrafts : []).slice(0, 3).map((draft) => (
                    <div key={draft.id} className="p-3 rounded-3 d-flex align-items-center justify-content-between gap-3 text-start animate-hover" 
                         style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div className="min-w-0 flex-grow-1">
                        <h6 className="fw-bold text-truncate mb-1 text-white" style={{ fontSize: '0.86rem' }}>{draft.title}</h6>
                        <div className="text-secondary" style={{ fontSize: '0.72rem' }}>
                          <i className="bi bi-calendar3 me-1.5"></i>
                          {new Date(draft.createdAt || draft.id).toLocaleDateString()}
                          <span className="mx-2">|</span>
                          <span className="badge" style={{ background: draft.language === 'ta' ? 'rgba(139,92,246,0.12)' : 'rgba(37,99,235,0.1)', color: '#818cf8', fontSize: '0.65rem' }}>
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
                        }} className="btn btn-sm btn-link p-0 text-decoration-none border-0 text-danger opacity-75">
                          <i className="bi bi-trash3-fill fs-6"></i>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Recent Searches */}
            <div className="text-start">
              <h5 className="fw-bold mb-3 text-white d-flex align-items-center gap-2">
                <i className="bi bi-search text-primary"></i>
                Recent Search Queries
              </h5>
              {recentSearches.length === 0 ? (
                <div className="p-3 rounded-3 text-center text-secondary" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <span className="small d-block text-secondary">Queries will appear here automatically.</span>
                </div>
              ) : (
                <div className="d-flex flex-wrap gap-2 align-items-center">
                  {(Array.isArray(recentSearches) ? recentSearches : []).slice(0, 5).map((q, i) => (
                    <Link key={i} to="/chat" state={{ prefillText: q }} className="btn btn-sm btn-glass-secondary rounded-pill px-3 py-1.5 text-truncate" 
                          style={{ fontSize: '0.75rem', maxWidth: 170, border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
                      <i className="bi bi-arrow-right-short text-primary me-1"></i>
                      {q}
                    </Link>
                  ))}
                  <button onClick={() => {
                    setRecentSearches([]);
                    localStorage.removeItem('recent_searches');
                    showToast('Search queries history cleared!', 'success');
                  }} className="btn btn-sm btn-link text-decoration-none text-secondary small p-1 ms-2">
                    Clear
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Documents archive list */}
      <div className="row g-4 mt-2 mb-5 fade-in-el-delay-3">
        <div className="col-12">
          <div className="glass-panel p-4" style={{ borderRadius: '20px', background: 'rgba(8, 10, 24, 0.4)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h5 className="fw-bold mb-0 text-white d-flex align-items-center gap-2">
                <i className="bi bi-folder2-open text-primary"></i>
                Analyzed Documents Archive
              </h5>
              <Link to="/analyzer" className="btn btn-sm btn-glass-secondary animate-hover" style={{ fontSize: '0.8rem', padding: '6px 16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <i className="bi bi-upload me-1.5"></i>Upload File
              </Link>
            </div>

            {docs.length === 0 ? (
              <div className="text-center py-5 text-secondary">
                <i className="bi bi-file-earmark-plus fs-1 d-block mb-3 opacity-25"></i>
                <p className="mb-2 fw-semibold text-white">No document logs found</p>
                <p className="small mb-3 text-secondary">Upload legal petitions or contracts for scanner processing.</p>
                <Link to="/analyzer" className="btn btn-glass btn-sm">Upload Document</Link>
              </div>
            ) : (
              <div className="row g-3 text-start">
                {(Array.isArray(docs) ? docs : []).slice(0, 4).map((doc) => (
                  <div key={doc.id} className="col-md-4 col-lg-3">
                    <div
                      className="p-3 rounded-3 h-100 d-flex flex-column animate-hover"
                      style={{ background: 'rgba(6,182,212,0.02)', border: '1.5px solid rgba(6,182,212,0.12)', borderRadius: '14px' }}
                    >
                      <div className="d-flex align-items-center gap-2 mb-2">
                        <i className="bi bi-file-earmark-text-fill text-info fs-4"></i>
                        <span className="fw-bold small text-truncate text-white" style={{ maxWidth: '82%' }}>{doc.fileName}</span>
                      </div>
                      <div className="text-secondary small mt-auto" style={{ fontSize: '0.72rem' }}>
                        Processed: {new Date(doc.uploadedAt).toLocaleDateString()}
                      </div>
                      <Link to="/analyzer" className="btn btn-sm btn-glass mt-2.5 w-100" style={{ fontSize: '0.78rem', background: 'rgba(6,182,212,0.12)', border: '1px solid rgba(6,182,212,0.2)', borderRadius: '6px' }}>
                        View Diagnostics
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Library searches */}
      <div className="row g-4 mt-2 mb-5 fade-in-el-delay-3">
        <div className="col-12">
          <div className="glass-panel p-4" style={{ borderRadius: '20px', background: 'rgba(8, 10, 24, 0.4)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
              <h5 className="fw-bold mb-0 text-white d-flex align-items-center gap-2">
                <i className="bi bi-bookmarks-fill text-primary"></i>
                Saved Library Index
              </h5>
              
              <div className="position-relative" style={{ maxWidth: 300, width: '100%' }}>
                <i className="bi bi-search position-absolute" style={{ left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}></i>
                <input
                  type="text"
                  className="form-control form-glass-control ps-5 py-2"
                  placeholder="Filter bookmarks..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{ fontSize: '0.85rem', height: 38, borderRadius: '10px' }}
                />
              </div>
            </div>

            <div className="row g-4">
              {/* Saved Rights */}
              <div className="col-lg-6 text-start">
                <div className="p-3 rounded-3 h-100" style={{ background: 'rgba(99,102,241,0.01)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px' }}>
                  <h6 className="fw-bold mb-3 d-flex align-items-center justify-content-between text-white">
                    <span className="d-flex align-items-center gap-2">
                      <i className="bi bi-shield-check text-primary"></i>
                      Rights Articles
                    </span>
                    <span className="badge rounded-pill bg-primary bg-opacity-10 text-primary small">{filteredRights.length}</span>
                  </h6>

                  {filteredRights.length === 0 ? (
                    <div className="text-center py-5 text-secondary">
                      <i className="bi bi-bookmark-plus fs-2 d-block mb-2 opacity-25"></i>
                      <p className="small mb-0 text-secondary">{searchQuery ? 'No matching bookmarks' : 'No articles bookmarked'}</p>
                    </div>
                  ) : (
                    <div className="d-flex flex-column gap-2" style={{ maxHeight: 280, overflowY: 'auto' }}>
                      {filteredRights.map(right => (
                        <div
                          key={right.id}
                          className="p-3 rounded-3 d-flex align-items-center justify-content-between gap-3 text-start animate-hover"
                          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px' }}
                        >
                          <div className="min-w-0 flex-grow-1" style={{ cursor: 'pointer' }} onClick={() => setActiveRight(right)} data-bs-toggle="modal" data-bs-target="#dashboardRightModal">
                            <span className="badge bg-primary bg-opacity-10 text-primary mb-1" style={{ fontSize: '0.68rem' }}>
                              {right.category?.name}
                            </span>
                            <h6 className="fw-bold text-truncate mb-1 text-white" style={{ fontSize: '0.85rem' }}>{right.title}</h6>
                            <p className="text-secondary small text-truncate mb-0" style={{ fontSize: '0.78rem' }}>{right.content}</p>
                          </div>
                          <button
                            className="btn btn-sm btn-link p-0 text-decoration-none border-0 flex-shrink-0"
                            onClick={() => removeRightBookmark(right.id)}
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
              <div className="col-lg-6 text-start">
                <div className="p-3 rounded-3 h-100" style={{ background: 'rgba(16,185,129,0.01)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px' }}>
                  <h6 className="fw-bold mb-3 d-flex align-items-center justify-content-between text-white">
                    <span className="d-flex align-items-center gap-2">
                      <i className="bi bi-gift text-success"></i>
                      Government Schemes
                    </span>
                    <span className="badge rounded-pill bg-success bg-opacity-10 text-success small">{filteredSchemes.length}</span>
                  </h6>

                  {filteredSchemes.length === 0 ? (
                    <div className="text-center py-5 text-secondary">
                      <i className="bi bi-bookmark-plus fs-2 d-block mb-2 opacity-25"></i>
                      <p className="small mb-0 text-secondary">{searchQuery ? 'No matching bookmarks' : 'No schemes bookmarked'}</p>
                    </div>
                  ) : (
                    <div className="d-flex flex-column gap-2" style={{ maxHeight: 280, overflowY: 'auto' }}>
                      {filteredSchemes.map(sch => (
                        <div
                          key={sch.id}
                          className="p-3 rounded-3 d-flex align-items-center justify-content-between gap-3 text-start animate-hover"
                          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px' }}
                        >
                          <div className="min-w-0 flex-grow-1" style={{ cursor: 'pointer' }} onClick={() => setActiveScheme(sch)} data-bs-toggle="modal" data-bs-target="#dashboardSchemeModal">
                            <span className="badge bg-success bg-opacity-10 text-success mb-1" style={{ fontSize: '0.68rem' }}>
                              {sch.category}
                            </span>
                            <h6 className="fw-bold text-truncate mb-1 text-white" style={{ fontSize: '0.85rem' }}>{sch.title}</h6>
                            <p className="text-secondary small text-truncate mb-0" style={{ fontSize: '0.78rem' }}>Eligibility: {sch.eligibility}</p>
                          </div>
                          <button
                            className="btn btn-sm btn-link p-0 text-decoration-none border-0 flex-shrink-0"
                            onClick={() => removeSchemeBookmark(sch.id)}
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
              background: 'rgba(8, 10, 24, 0.95)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '20px',
              backdropFilter: 'blur(30px)'
            }}>
              <div className="modal-header border-bottom border-light-subtle p-4 d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center min-w-0">
                  <span className="badge bg-primary bg-opacity-10 text-primary py-2 px-3 me-2 flex-shrink-0">
                    {activeRight.category?.name}
                  </span>
                  <h5 className="modal-title fw-bold mb-0 text-truncate text-white">{activeRight.title}</h5>
                </div>
                <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
              </div>

              <div className="modal-body p-4 text-white-50">
                <ul className="nav nav-tabs mb-4 border-secondary" id="rightLangTabs" role="tablist">
                  <li className="nav-item">
                    <button className="nav-link active fw-bold text-white border-0 bg-transparent" id="dashboard-english-tab" data-bs-toggle="tab" data-bs-target="#dashboard-english" type="button" role="tab">
                      English Text
                    </button>
                  </li>
                  {activeRight.tamilTitle && (
                    <li className="nav-item">
                      <button className="nav-link fw-bold text-white border-0 bg-transparent" id="dashboard-tamil-tab" data-bs-toggle="tab" data-bs-target="#dashboard-tamil" type="button" role="tab">
                        தமிழ் உரை
                      </button>
                    </li>
                  )}
                </ul>

                <div className="tab-content" id="rightLangTabsContent">
                  <div className="tab-pane fade show active text-secondary" id="dashboard-english" role="tabpanel">
                    <h5 className="fw-bold mb-3 text-white">{activeRight.title}</h5>
                    <p style={{ whiteSpace: 'pre-wrap', lineHeight: '1.75', fontSize: '0.92rem' }}>{activeRight.content}</p>
                  </div>
                  {activeRight.tamilTitle && (
                    <div className="tab-pane fade text-secondary" id="dashboard-tamil" role="tabpanel">
                      <h5 className="fw-bold mb-3 text-white">{activeRight.tamilTitle}</h5>
                      <p style={{ whiteSpace: 'pre-wrap', lineHeight: '1.75', fontSize: '0.92rem' }}>{activeRight.tamilContent}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="modal-footer border-top border-light-subtle p-3">
                <button type="button" className="btn btn-glass-secondary" data-bs-dismiss="modal" style={{ borderRadius: '10px', color: 'white' }}>Close</button>
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
              background: 'rgba(8, 10, 24, 0.95)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '20px',
              backdropFilter: 'blur(30px)'
            }}>
              <div className="modal-header border-bottom border-light-subtle p-4 d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center min-w-0">
                  <span className="badge bg-success bg-opacity-10 text-success py-2 px-3 me-3 flex-shrink-0">{activeScheme.category}</span>
                  <h5 className="modal-title fw-bold mb-0 text-truncate text-white">{activeScheme.title}</h5>
                </div>
                <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
              </div>

              <div className="modal-body p-4 text-white-50">
                <div className="mb-4">
                  <h6 className="fw-bold text-success"><i className="bi bi-person-check-fill me-2"></i>Eligibility Criteria</h6>
                  <p className="ps-4 text-secondary" style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>{activeScheme.eligibility}</p>
                </div>
                <div className="mb-4">
                  <h6 className="fw-bold text-success"><i className="bi bi-file-earmark-medical-fill me-2"></i>Required Documents</h6>
                  <p className="ps-4 text-secondary" style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>{activeScheme.requiredDocuments}</p>
                </div>
                <div className="mb-4">
                  <h6 className="fw-bold text-success"><i className="bi bi-send-check-fill me-2"></i>Application Process</h6>
                  <p className="ps-4 text-secondary" style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>{activeScheme.applicationProcess}</p>
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
                <button type="button" className="btn btn-glass-secondary" data-bs-dismiss="modal" style={{ borderRadius: '10px', color: 'white' }}>Close</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Toast Notification */}
      {toast.show && (
        <div className="custom-toast-container">
          <div className={`custom-toast ${toast.type === 'success' ? 'toast-success' : 'toast-warning'}`} style={{
            background: 'rgba(8, 10, 24, 0.9)',
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
