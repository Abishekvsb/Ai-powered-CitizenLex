import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import VoiceInput from '../components/VoiceInput';
import TextToSpeech from '../components/TextToSpeech';
import { useAuth } from '../context/AuthContext';

const SUGGESTIONS_EN = [
  "What are my rights if arrested?",
  "How do I file a consumer complaint?",
  "What are the rules regarding overtime pay?",
  "Tell me about the Right to Education Act"
];

const SUGGESTIONS_TA = [
  "கைது செய்யப்படும்போது எனக்கான உரிமைகள் என்ன?",
  "நுகர்வோர் புகார் அளிப்பது எப்படி?",
  "கூடுதல் நேர வேலைக்கான சம்பள விதிகள் என்ன?",
  "இலவச கட்டாயக் கல்வி உரிமைச் சட்டம் பற்றி கூறுக"
];

// Helper: Custom Markdown & Bold tag formatter
function renderFormattedMessage(text) {
  if (!text) return null;
  const lines = text.split('\n');
  return lines.map((line, idx) => {
    let content = line;
    let isBullet = false;
    
    if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
      isBullet = true;
      content = line.trim().substring(2);
    }
    
    const parts = content.split('**');
    const renderedParts = parts.map((part, pIdx) => {
      if (pIdx % 2 === 1) {
        return <strong key={pIdx} className="text-white fw-bold">{part}</strong>;
      }
      return part;
    });

    if (isBullet) {
      return (
        <div key={idx} className="d-flex align-items-start gap-2 mb-1.5 ps-2 small text-white-50">
          <span className="text-primary-light" style={{ color: 'var(--primary-light)' }}>•</span>
          <span className="flex-grow-1">{renderedParts}</span>
        </div>
      );
    }
    return <div key={idx} className="mb-2 small text-white-50" style={{ lineHeight: '1.6' }}>{renderedParts}</div>;
  });
}

export default function AiAssistant() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [language, setLanguage] = useState('en');
  const [loading, setLoading] = useState(false);
  const [allChats, setAllChats] = useState([]);
  const [historySearch, setHistorySearch] = useState('');
  const [historyLoading, setHistoryLoading] = useState(true);
  const [showMobileHistory, setShowMobileHistory] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [voiceNotice, setVoiceNotice] = useState(false);
  const [viewportHeight, setViewportHeight] = useState(window.innerHeight);
  const [copiedId, setCopiedId] = useState(null);

  const scrollContainerRef = useRef(null);
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  const suggestions = language === 'en' ? SUGGESTIONS_EN : SUGGESTIONS_TA;

  useEffect(() => {
    if (!window.visualViewport) return;
    const handleResize = () => {
      setViewportHeight(window.visualViewport.height);
    };
    window.visualViewport.addEventListener('resize', handleResize);
    window.visualViewport.addEventListener('scroll', handleResize);
    return () => {
      window.visualViewport.removeEventListener('resize', handleResize);
      window.visualViewport.removeEventListener('scroll', handleResize);
    };
  }, []);

  useEffect(() => {
    if (location.state?.prefillText) {
      setInput(location.state.prefillText);
      setTimeout(() => inputRef.current?.focus(), 200);
      window.history.replaceState({}, '');
    }
  }, [location.state]);

  const fetchHistory = useCallback(async () => {
    try {
      const res = await axios.get('/api/chat/history');
      setAllChats(res.data || []);
    } catch (err) {
      console.error('Failed to load chat history', err);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const scrollToBottom = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    } else {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    setTimeout(scrollToBottom, 50);
  }, [messages, loading]);

  useEffect(() => {
    const supported = !!(window.SpeechRecognition || window.webkitSpeechRecognition);
    if (!supported) setVoiceNotice(true);
  }, []);

  const handleSend = async (text) => {
    const msg = (text || input).trim();
    if (!msg) return;

    try {
      const existing = (() => { try { const v = JSON.parse(localStorage.getItem('recent_searches') || '[]'); return Array.isArray(v) ? v : []; } catch(e) { return []; } })();
      const updated = [msg, ...existing.filter(q => q !== msg)].slice(0, 10);
      localStorage.setItem('recent_searches', JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save search query', e);
    }

    setMessages(prev => [...prev, { sender: 'user', text: msg }]);
    setInput('');
    setLoading(true);

    try {
      const res = await axios.post('/api/chat', { message: msg, language });
      const fullResponse = res.data.response;
      
      // Simulate word-by-word streaming effect
      setLoading(false);
      let currentText = "";
      const words = fullResponse.split(" ");
      let wordIdx = 0;
      
      setMessages(prev => [...prev, { sender: 'assistant', text: "" }]);
      
      const streamTimer = setInterval(() => {
        if (wordIdx < words.length) {
          currentText += (wordIdx === 0 ? "" : " ") + words[wordIdx];
          setMessages(prev => {
            const updated = [...prev];
            updated[updated.length - 1].text = currentText;
            return updated;
          });
          wordIdx++;
          scrollToBottom();
        } else {
          clearInterval(streamTimer);
          fetchHistory();
        }
      }, 30);
    } catch (err) {
      console.error(err);
      setLoading(false);
      setMessages(prev => [...prev, {
        sender: 'assistant',
        text: '⚠️ Could not retrieve legal advice. Please check your connection and try again.',
        isError: true,
      }]);
    } finally {
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleVoiceResult = (transcript) => {
    setInput(transcript);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const reopenChat = (chat) => {
    setMessages([
      { sender: 'user', text: chat.message },
      { sender: 'assistant', text: chat.response },
    ]);
    setLanguage(chat.language || 'en');
    setShowMobileHistory(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const deleteChat = async (id, e) => {
    e.stopPropagation();
    setDeletingId(id);
    try {
      await axios.delete(`/api/chat/${id}`);
      setAllChats(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      console.error('Delete failed', err);
    } finally {
      setDeletingId(null);
    }
  };

  const newChat = () => {
    setMessages([]);
    setInput('');
    inputRef.current?.focus();
  };

  const copyBubbleText = (text, index) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(index);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const filteredChats = allChats.filter(c =>
    c.message.toLowerCase().includes(historySearch.toLowerCase()) ||
    c.response.toLowerCase().includes(historySearch.toLowerCase())
  );

  const HistorySidebar = () => (
    <div className="glass-panel p-3 d-flex flex-column h-100" style={{ maxHeight: '82vh', borderRadius: '20px' }}>
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h6 className="fw-bold mb-0 text-white d-flex align-items-center gap-2">
          <i className="bi bi-clock-history text-primary"></i>
          Chat History
        </h6>
        <span className="badge rounded-pill bg-primary bg-opacity-10 text-primary small">
          {allChats.length}
        </span>
      </div>

      <div className="mb-3 position-relative">
        <i className="bi bi-search position-absolute" style={{ left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}></i>
        <input
          type="text"
          className="form-control form-glass-control ps-5"
          placeholder="Search history..."
          value={historySearch}
          onChange={e => setHistorySearch(e.target.value)}
          style={{ fontSize: '0.85rem', height: 38, borderRadius: '10px' }}
        />
      </div>

      <button
        onClick={newChat}
        className="btn btn-glass w-100 mb-3 d-flex align-items-center justify-content-center gap-2"
        style={{ fontSize: '0.85rem', padding: '10px', borderRadius: '10px', background: 'linear-gradient(135deg, var(--primary), var(--primary-light))', border: 'none' }}
      >
        <i className="bi bi-plus-circle"></i>
        New Conversation
      </button>

      <div className="flex-grow-1 overflow-auto" style={{ scrollbarWidth: 'thin' }}>
        {historyLoading ? (
          <div className="d-flex flex-column gap-2">
            {[1,2,3].map(i => (
              <div key={i} className="rounded-3 p-3" style={{ background: 'var(--bg-secondary)', height: 72 }}>
                <div className="skeleton-loader mb-2" style={{ height: 12, width: '80%' }}></div>
                <div className="skeleton-loader" style={{ height: 10, width: '60%' }}></div>
              </div>
            ))}
          </div>
        ) : filteredChats.length === 0 ? (
          <div className="text-center text-secondary py-4">
            <i className="bi bi-chat-square-dots d-block mb-2 fs-3 opacity-25"></i>
            <p className="small mb-0">{historySearch ? 'No results found' : 'No chats yet'}</p>
          </div>
        ) : (
          <div className="d-flex flex-column gap-2">
            {filteredChats.map(chat => (
              <div
                key={chat.id}
                onClick={() => reopenChat(chat)}
                className="p-3 rounded-3 position-relative animate-hover"
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid var(--border)',
                  cursor: 'pointer',
                  borderRadius: '12px'
                }}
              >
                <div className="d-flex justify-content-between align-items-start gap-1 mb-1">
                  <span
                    className="fw-bold text-truncate text-white"
                    style={{ fontSize: '0.82rem', maxWidth: '78%' }}
                  >
                    {chat.message}
                  </span>
                  <button
                    onClick={e => deleteChat(chat.id, e)}
                    className="btn btn-sm p-0 border-0 flex-shrink-0"
                    title="Delete Chat"
                    style={{ color: 'var(--text-secondary)', opacity: 0.6 }}
                  >
                    {deletingId === chat.id
                      ? <span className="spinner-border spinner-border-sm" style={{ width: 12, height: 12 }}></span>
                      : <i className="bi bi-trash3" style={{ fontSize: '0.75rem' }}></i>}
                  </button>
                </div>
                <div className="text-truncate mb-1 text-secondary" style={{ fontSize: '0.75rem' }}>
                  {chat.response}
                </div>
                <div className="d-flex align-items-center gap-2 mt-2">
                  <span
                    className="badge rounded-pill"
                    style={{
                      fontSize: '0.62rem',
                      padding: '2px 7px',
                      background: chat.language === 'ta' ? 'rgba(139,92,246,0.12)' : 'rgba(37,99,235,0.1)',
                      color: chat.language === 'ta' ? '#a855f7' : 'var(--primary)',
                    }}
                  >
                    {chat.language === 'ta' ? 'Tamil' : 'English'}
                  </span>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                    {new Date(chat.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Profile summary card */}
      {user && (
        <>
          <hr style={{ borderColor: 'var(--border)', margin: '12px 0' }} />
          <div
            className="d-flex align-items-center justify-content-between p-2 rounded-3"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: '12px' }}
          >
            <div className="d-flex align-items-center gap-2 overflow-hidden">
              {user.profileImageUrl ? (
                <img
                  src={user.profileImageUrl}
                  alt="Profile"
                  style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(99,102,241,0.4)', flexShrink: 0 }}
                />
              ) : (
                <div style={{
                  width: 34, height: 34, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.8rem', fontWeight: 700, color: 'white', flexShrink: 0,
                }}>
                  {`${(user.firstName||'?')[0]}${(user.lastName||'')[0]||''}`.toUpperCase()}
                </div>
              )}
              <div className="overflow-hidden" style={{ lineHeight: 1.2 }}>
                <div className="fw-bold text-truncate text-white" style={{ fontSize: '0.82rem' }}>
                  {user.firstName} {user.lastName}
                </div>
                <div className="text-secondary text-truncate" style={{ fontSize: '0.7rem' }}>
                  {user.email}
                </div>
              </div>
            </div>
            <button
              onClick={() => navigate('/profile')}
              className="btn btn-sm p-0 border-0 flex-shrink-0 d-flex align-items-center justify-content-center"
              title="Profile Settings"
              style={{ color: 'var(--text-secondary)', width: 28, height: 28, borderRadius: '50%', background: 'rgba(99,102,241,0.06)' }}
            >
              <i className="bi bi-gear-fill" style={{ fontSize: '0.85rem' }}></i>
            </button>
          </div>
        </>
      )}
    </div>
  );

  return (
    <div className="container-fluid px-3 px-md-4 py-4 text-start" style={{ maxWidth: 1400 }}>
      <div className="row g-4 align-items-start">
        {/* Sidebar */}
        <div className="col-lg-3 d-none d-lg-block fade-in-el" style={{ position: 'sticky', top: 85 }}>
          <HistorySidebar />
        </div>

        {/* Chat Main */}
        <div className="col-lg-9 fade-in-el">
          <div className="glass-panel d-flex flex-column" style={{ height: `${viewportHeight - 130}px`, minHeight: '400px', borderRadius: '24px' }}>
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center p-4 border-bottom" style={{ borderColor: 'var(--border)' }}>
              <div className="d-flex align-items-center gap-3">
                <div
                  className="d-flex align-items-center justify-content-center rounded-3"
                  style={{ width: 46, height: 46, background: 'rgba(99,102,241,0.1)', color: 'var(--primary)', fontSize: '1.35rem' }}
                >
                  <i className="bi bi-robot" style={{ color: 'var(--primary)' }}></i>
                </div>
                <div>
                  <h5 className="mb-0 fw-bold text-white">CitizenLex AI</h5>
                  <span className="text-secondary small">
                    <span className="me-1" style={{ color: '#10b981' }}>●</span>
                    Bilingual Legal Advisor
                  </span>
                </div>
              </div>

              <div className="d-flex align-items-center gap-2">
                {/* Language Select */}
                <div className="btn-group btn-group-sm" role="group">
                  <button
                    type="button"
                    className={`btn ${language === 'en' ? 'btn-primary' : 'btn-outline-secondary'}`}
                    onClick={() => setLanguage('en')}
                    style={language === 'en' ? { background: 'linear-gradient(135deg,#6366f1,#a855f7)', border: 'none' } : {}}
                  >
                    English
                  </button>
                  <button
                    type="button"
                    className={`btn ${language === 'ta' ? 'btn-primary' : 'btn-outline-secondary'}`}
                    onClick={() => setLanguage('ta')}
                    style={language === 'ta' ? { background: 'linear-gradient(135deg,#6366f1,#a855f7)', border: 'none' } : {}}
                  >
                    தமிழ்
                  </button>
                </div>

                <button
                  className="btn btn-glass-secondary btn-sm d-lg-none"
                  onClick={() => setShowMobileHistory(!showMobileHistory)}
                  style={{ borderRadius: '8px' }}
                >
                  <i className="bi bi-clock-history"></i>
                </button>

                <button
                  className="btn btn-glass-secondary btn-sm d-flex align-items-center gap-1"
                  onClick={newChat}
                  style={{ borderRadius: '8px' }}
                >
                  <i className="bi bi-plus-lg"></i>
                  <span className="d-none d-md-inline">New Chat</span>
                </button>
              </div>
            </div>

            {/* Mobile History Drawer */}
            {showMobileHistory && (
              <div className="d-lg-none p-3 border-bottom" style={{ borderColor: 'var(--border)', maxHeight: 280, overflowY: 'auto', background: 'var(--bg-secondary)' }}>
                <HistorySidebar />
              </div>
            )}

            {/* Messages Feed */}
            <div className="flex-grow-1 overflow-auto p-4 d-flex flex-column gap-3" ref={scrollContainerRef} style={{ background: 'rgba(3,7,18,0.25)' }}>
              {messages.length === 0 ? (
                <div className="m-auto text-center py-4" style={{ maxWidth: 480 }}>
                  <div
                    className="mx-auto mb-4 d-flex align-items-center justify-content-center rounded-4 animate-hover"
                    style={{ width: 72, height: 72, background: 'rgba(99,102,241,0.08)', fontSize: '2rem', border: '1px solid rgba(99,102,241,0.2)', boxShadow: '0 0 20px rgba(99,102,241,0.1)' }}
                  >
                    <i className="bi bi-balance2 text-primary" style={{ color: 'var(--primary)' }}></i>
                  </div>
                  <h4 className="fw-bold mb-2 text-white">How can I assist your query?</h4>
                  <p className="text-secondary small mb-4">
                    Ask a legal question in English or Tamil. I'll translate, analyze, and provide simplified guidance.
                  </p>
                  <div className="row g-2">
                    {suggestions.map((s, i) => (
                      <div className="col-12 col-sm-6" key={i}>
                        <button
                          className="btn w-100 text-start p-3 rounded-3 animate-hover text-white-50"
                          style={{
                            background: 'rgba(255,255,255,0.02)',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            fontSize: '0.82rem',
                            boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
                          }}
                          onClick={() => handleSend(s)}
                        >
                          <i className="bi bi-arrow-right-circle-fill text-primary me-2"></i>
                          {s}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  {messages.map((msg, i) => (
                    <div
                      key={i}
                      className={`d-flex ${msg.sender === 'user' ? 'justify-content-end' : 'justify-content-start'}`}
                    >
                      {msg.sender === 'assistant' && (
                        <div
                          className="d-flex align-items-center justify-content-center rounded-2 me-2 flex-shrink-0 align-self-end mb-1"
                          style={{ width: 30, height: 30, background: 'rgba(99,102,241,0.1)', color: 'var(--primary)', fontSize: '0.85rem' }}
                        >
                          <i className="bi bi-robot"></i>
                        </div>
                      )}
                      <div style={{ maxWidth: '80%', position: 'relative' }} className="group">
                        <div
                          className="chat-bubble"
                          style={{
                            background: msg.sender === 'user'
                              ? 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)'
                              : msg.isError
                              ? 'rgba(239,68,68,0.12)'
                              : 'rgba(8, 10, 24, 0.55)',
                            color: msg.sender === 'user' ? 'white' : 'var(--text)',
                            border: msg.sender !== 'user' ? '1px solid rgba(255, 255, 255, 0.08)' : 'none',
                            borderRadius: '16px',
                            backdropFilter: msg.sender !== 'user' ? 'blur(20px)' : 'none',
                            boxShadow: msg.sender === 'user' ? '0 4px 15px rgba(99, 102, 241, 0.25)' : '0 8px 30px rgba(0,0,0,0.2)'
                          }}
                        >
                          {/* Rich Formatted Message Layout */}
                          {msg.sender === 'user' ? (
                            <div style={{ whiteSpace: 'pre-line', lineHeight: 1.6, fontSize: '0.9rem' }}>
                              {msg.text}
                            </div>
                          ) : (
                            renderFormattedMessage(msg.text)
                          )}
                        </div>

                        {/* Speech + Copy helper panel */}
                        {msg.sender === 'assistant' && !msg.isError && msg.text && (
                          <div className="d-flex gap-2 align-items-center mt-1 ms-1">
                            <TextToSpeech text={msg.text} language={language} />
                            <button
                              onClick={() => copyBubbleText(msg.text, i)}
                              className="btn btn-sm btn-link p-0 text-decoration-none border-0 text-secondary"
                              style={{ fontSize: '0.78rem' }}
                              title="Copy Answer"
                            >
                              <i className={`bi bi-${copiedId === i ? 'check-lg text-success' : 'clipboard'} me-1`}></i>
                              {copiedId === i ? 'Copied' : 'Copy'}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {loading && (
                    <div className="d-flex justify-content-start align-items-end gap-2">
                      <div
                        className="d-flex align-items-center justify-content-center rounded-2"
                        style={{ width: 30, height: 30, background: 'rgba(99,102,241,0.1)', color: 'var(--primary)' }}
                      >
                        <i className="bi bi-robot"></i>
                      </div>
                      <div
                        className="chat-bubble d-flex align-items-center gap-2"
                        style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
                      >
                        <div className="d-flex gap-1 align-items-center">
                          <span className="typing-dot"></span>
                          <span className="typing-dot" style={{ animationDelay: '0.2s' }}></span>
                          <span className="typing-dot" style={{ animationDelay: '0.4s' }}></span>
                        </div>
                        <span style={{ fontSize: '0.82rem' }}>Synthesizing references...</span>
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </>
              )}
            </div>

            {/* Input Bar */}
            <div className="p-4 border-top" style={{ borderColor: 'var(--border)' }}>
              <div className="d-flex gap-2 align-items-end">
                <div className="flex-grow-1 position-relative">
                  <textarea
                    ref={inputRef}
                    className="form-control form-glass-control w-100"
                    placeholder={language === 'ta' ? 'இங்கே சட்டக் கேள்வியைக் கேட்கவும்... (Enter to send)' : 'Ask a legal question... (Enter to send)'}
                    rows={1}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={loading}
                    style={{ resize: 'none', paddingRight: 16, minHeight: 48, maxHeight: 150, fontSize: '0.9rem', borderRadius: '12px' }}
                    onInput={e => {
                      e.target.style.height = 'auto';
                      e.target.style.height = Math.min(e.target.scrollHeight, 150) + 'px';
                    }}
                  />
                </div>

                <VoiceInput
                  language={language}
                  onResult={handleVoiceResult}
                  disabled={loading}
                />

                <button
                  className="btn btn-glass d-flex align-items-center justify-content-center flex-shrink-0"
                  onClick={() => handleSend()}
                  disabled={loading || !input.trim()}
                  style={{ width: 48, height: 48, padding: 0, borderRadius: 12, background: 'linear-gradient(135deg, var(--primary), var(--primary-light))', border: 'none' }}
                >
                  {loading
                    ? <span className="spinner-border spinner-border-sm"></span>
                    : <i className="bi bi-send-fill"></i>}
                </button>
              </div>
              <div className="text-center mt-2">
                <span className="text-muted" style={{ fontSize: '0.72rem' }}>
                  CitizenLex AI provides general legal information. For formal legal advice, consult a licensed advocate.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
