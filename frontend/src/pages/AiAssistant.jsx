import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import VoiceInput from '../components/VoiceInput';
import TextToSpeech from '../components/TextToSpeech';

const SUGGESTIONS_EN = [
  "What are my rights if arrested?",
  "How do I file a consumer complaint?",
  "What are the rules regarding overtime pay?",
  "Tell me about the Right to Education Act",
  "What is habeas corpus?",
  "How to report domestic violence in India?",
];

const SUGGESTIONS_TA = [
  "கைது செய்யப்படும்போது எனக்கான உரிமைகள் என்ன?",
  "நுகர்வோர் புகார் அளிப்பது எப்படி?",
  "கூடுதல் நேர வேலைக்கான சம்பள விதிகள் என்ன?",
  "இலவச கட்டாயக் கல்வி உரிமைச் சட்டம் பற்றி கூறுக",
];

export default function AiAssistant() {
  const location = useLocation();
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

  const scrollContainerRef = useRef(null);
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  const suggestions = language === 'en' ? SUGGESTIONS_EN : SUGGESTIONS_TA;

  // Handle visual viewport for mobile keyboard height adjustments
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

  // Handle prefill text from OCR Scanner or other sources
  useEffect(() => {
    if (location.state?.prefillText) {
      setInput(location.state.prefillText);
      setTimeout(() => inputRef.current?.focus(), 200);
      // Clear state so back navigation doesn't re-prefill
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
    // Scroll both ways to be extra robust on all browsers/devices
    setTimeout(scrollToBottom, 50);
  }, [messages, loading]);

  // Show voice notice if Speech API not available
  useEffect(() => {
    const supported = !!(window.SpeechRecognition || window.webkitSpeechRecognition);
    if (!supported) setVoiceNotice(true);
  }, []);

  const handleSend = async (text) => {
    const msg = (text || input).trim();
    if (!msg) return;

    // Save to recent searches
    try {
      const existing = JSON.parse(localStorage.getItem('recent_searches') || '[]');
      const updated = [msg, ...existing.filter(q => q !== msg)].slice(0, 10);
      localStorage.setItem('recent_searches', JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save recent search', e);
    }

    setMessages(prev => [...prev, { sender: 'user', text: msg }]);
    setInput('');
    setLoading(true);

    try {
      const res = await axios.post('/api/chat', { message: msg, language });
      setMessages(prev => [...prev, { sender: 'assistant', text: res.data.response }]);
      fetchHistory();
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, {
        sender: 'assistant',
        text: '⚠️ Could not retrieve legal advice. Please check your connection and try again.',
        isError: true,
      }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Voice input result handler
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

  const filteredChats = allChats.filter(c =>
    c.message.toLowerCase().includes(historySearch.toLowerCase()) ||
    c.response.toLowerCase().includes(historySearch.toLowerCase())
  );

  const HistorySidebar = () => (
    <div className="glass-panel p-3 d-flex flex-column h-100" style={{ maxHeight: '80vh' }}>
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h6 className="fw-bold mb-0 d-flex align-items-center gap-2">
          <i className="bi bi-clock-history text-primary"></i>
          Chat History
        </h6>
        <span className="badge rounded-pill bg-primary bg-opacity-10 text-primary small">
          {allChats.length}
        </span>
      </div>

      {/* Search */}
      <div className="mb-3 position-relative">
        <i className="bi bi-search position-absolute" style={{ left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}></i>
        <input
          type="text"
          className="form-control form-glass-control ps-5"
          placeholder="Search history..."
          value={historySearch}
          onChange={e => setHistorySearch(e.target.value)}
          style={{ fontSize: '0.85rem', height: 38 }}
        />
      </div>

      <button
        onClick={newChat}
        className="btn btn-glass w-100 mb-3 d-flex align-items-center justify-content-center gap-2"
        style={{ fontSize: '0.85rem', padding: '8px' }}
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
            <p className="small mb-0">{historySearch ? 'No results found' : 'No conversations yet'}</p>
          </div>
        ) : (
          <div className="d-flex flex-column gap-2">
            {filteredChats.map(chat => (
              <div
                key={chat.id}
                onClick={() => reopenChat(chat)}
                className="p-3 rounded-3 position-relative group"
                style={{
                  background: 'rgba(37,99,235,0.04)',
                  border: '1px solid var(--border)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(37,99,235,0.09)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(37,99,235,0.04)'}
              >
                <div className="d-flex justify-content-between align-items-start gap-1 mb-1">
                  <span
                    className="fw-semibold text-truncate"
                    style={{ fontSize: '0.8rem', color: 'var(--text)', maxWidth: '75%' }}
                  >
                    {chat.message}
                  </span>
                  <button
                    onClick={e => deleteChat(chat.id, e)}
                    className="btn btn-sm p-0 border-0 flex-shrink-0"
                    title="Delete"
                    style={{ color: 'var(--text-secondary)', width: 20, height: 20, lineHeight: 1, opacity: 0.6 }}
                  >
                    {deletingId === chat.id
                      ? <span className="spinner-border spinner-border-sm" style={{ width: 12, height: 12, borderWidth: 2 }}></span>
                      : <i className="bi bi-trash3" style={{ fontSize: '0.72rem' }}></i>}
                  </button>
                </div>
                <div className="text-truncate mb-1" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  {chat.response?.slice(0, 60)}...
                </div>
                <div className="d-flex align-items-center gap-2">
                  <span
                    className="badge rounded-pill"
                    style={{
                      fontSize: '0.65rem',
                      padding: '2px 7px',
                      background: chat.language === 'ta' ? 'rgba(139,92,246,0.15)' : 'rgba(37,99,235,0.12)',
                      color: chat.language === 'ta' ? '#8b5cf6' : 'var(--primary)',
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
    </div>
  );

  return (
    <div className="container-fluid px-3 px-md-4 py-4 text-start" style={{ maxWidth: 1400 }}>
      <div className="row g-4 align-items-start">

        {/* Sidebar — Desktop */}
        <div className="col-lg-3 d-none d-lg-block fade-in-el" style={{ position: 'sticky', top: 80 }}>
          <HistorySidebar />
        </div>

        {/* Chat Main Area */}
        <div className="col-lg-9 fade-in-el">
          <div className="glass-panel d-flex flex-column" style={{ height: `${viewportHeight - 120}px`, minHeight: '380px' }}>

            {/* Header */}
            <div className="d-flex justify-content-between align-items-center p-4 border-bottom" style={{ borderColor: 'var(--border)' }}>
              <div className="d-flex align-items-center gap-3">
                <div
                  className="d-flex align-items-center justify-content-center rounded-3"
                  style={{ width: 48, height: 48, background: 'rgba(37,99,235,0.1)', color: 'var(--primary)', fontSize: '1.4rem' }}
                >
                  <i className="bi bi-robot"></i>
                </div>
                <div>
                  <h5 className="mb-0 fw-bold">CitizenLex AI</h5>
                  <span className="text-secondary small">
                    <span className="me-1" style={{ color: '#10b981' }}>●</span>
                    Ready · Legal Intelligence Engine
                  </span>
                </div>
              </div>

              <div className="d-flex align-items-center gap-2">
                {/* Language Toggle */}
                <div className="btn-group btn-group-sm" role="group">
                  <button
                    type="button"
                    className={`btn ${language === 'en' ? 'btn-primary' : 'btn-outline-secondary'}`}
                    onClick={() => setLanguage('en')}
                    style={{ fontSize: '0.8rem', padding: '5px 12px' }}
                  >
                    🇬🇧 EN
                  </button>
                  <button
                    type="button"
                    className={`btn ${language === 'ta' ? 'btn-primary' : 'btn-outline-secondary'}`}
                    onClick={() => setLanguage('ta')}
                    style={{ fontSize: '0.8rem', padding: '5px 12px' }}
                  >
                    🇮🇳 தமிழ்
                  </button>
                </div>

                {/* Mobile: History toggle */}
                <button
                  className="btn btn-glass-secondary btn-sm d-lg-none"
                  onClick={() => setShowMobileHistory(!showMobileHistory)}
                  style={{ fontSize: '0.8rem' }}
                >
                  <i className="bi bi-clock-history"></i>
                </button>

                <button
                  className="btn btn-glass-secondary btn-sm d-flex align-items-center gap-1"
                  onClick={newChat}
                  style={{ fontSize: '0.8rem' }}
                >
                  <i className="bi bi-plus-lg"></i>
                  <span className="d-none d-md-inline">New</span>
                </button>
              </div>
            </div>

            {/* Voice Compatibility Notice */}
            {voiceNotice && (
              <div className="px-4 pt-3">
                <div className="d-flex align-items-center gap-2 p-2 rounded-3" style={{
                  background: 'rgba(245,158,11,0.08)',
                  border: '1px solid rgba(245,158,11,0.2)',
                  fontSize: '0.78rem',
                  color: 'var(--text-secondary)'
                }}>
                  <i className="bi bi-mic-mute text-warning"></i>
                  <span>Voice input is not supported in this browser. For voice features, use Chrome or Edge.</span>
                  <button onClick={() => setVoiceNotice(false)} className="btn btn-sm p-0 ms-auto border-0" style={{ color: 'var(--text-muted)' }}>
                    <i className="bi bi-x-lg" style={{ fontSize: '0.7rem' }}></i>
                  </button>
                </div>
              </div>
            )}

            {/* Mobile History Drawer */}
            {showMobileHistory && (
              <div className="d-lg-none p-3 border-bottom" style={{ borderColor: 'var(--border)', maxHeight: 300, overflowY: 'auto', background: 'var(--bg-secondary)' }}>
                <HistorySidebar />
              </div>
            )}

            {/* Messages Area */}
            <div className="flex-grow-1 overflow-auto p-4 d-flex flex-column gap-3" ref={scrollContainerRef}>
              {messages.length === 0 ? (
                <div className="m-auto text-center py-4" style={{ maxWidth: 460 }}>
                  <div
                    className="mx-auto mb-4 d-flex align-items-center justify-content-center rounded-4"
                    style={{ width: 80, height: 80, background: 'rgba(37,99,235,0.08)', fontSize: '2.2rem' }}
                  >
                    <i className="bi bi-balance2 text-primary"></i>
                  </div>
                  <h4 className="fw-bold mb-2">How can I help you today?</h4>
                  <p className="text-secondary small mb-4">
                    Ask any legal question in English or Tamil. I'll provide clear, simplified answers based on Indian law.
                  </p>
                  <div className="row g-2">
                    {suggestions.map((s, i) => (
                      <div className="col-12 col-sm-6" key={i}>
                        <button
                          className="btn w-100 text-start p-3 rounded-3"
                          style={{
                            background: 'rgba(37,99,235,0.05)',
                            border: '1px solid rgba(37,99,235,0.15)',
                            fontSize: '0.82rem',
                            color: 'var(--text)',
                            transition: 'all 0.2s',
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(37,99,235,0.1)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'rgba(37,99,235,0.05)'}
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
                          style={{ width: 30, height: 30, background: 'rgba(37,99,235,0.1)', color: 'var(--primary)', fontSize: '0.85rem' }}
                        >
                          <i className="bi bi-robot"></i>
                        </div>
                      )}
                      <div style={{ maxWidth: '78%' }}>
                        <div
                          className="chat-bubble"
                          style={{
                            background: msg.sender === 'user'
                              ? 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)'
                              : msg.isError
                              ? 'rgba(239,68,68,0.08)'
                              : 'var(--surface)',
                            color: msg.sender === 'user' ? 'white' : 'var(--text)',
                            border: msg.sender !== 'user' ? '1px solid var(--border)' : 'none',
                          }}
                        >
                          <div style={{ whiteSpace: 'pre-line', lineHeight: 1.65, fontSize: '0.9rem' }}>
                            {msg.text}
                          </div>
                        </div>
                        {/* TTS button for assistant messages */}
                        {msg.sender === 'assistant' && !msg.isError && (
                          <div className="mt-1 ms-1">
                            <TextToSpeech text={msg.text} language={language} />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {loading && (
                    <div className="d-flex justify-content-start align-items-end gap-2">
                      <div
                        className="d-flex align-items-center justify-content-center rounded-2"
                        style={{ width: 30, height: 30, background: 'rgba(37,99,235,0.1)', color: 'var(--primary)', fontSize: '0.85rem' }}
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
                        <span style={{ fontSize: '0.82rem' }}>Analyzing legal codes...</span>
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
                    placeholder={language === 'ta' ? 'இங்கே உங்கள் சட்டக் கேள்வியைக் கேளுங்கள்... (Enter to send)' : 'Ask your legal question here... (Enter to send, Shift+Enter for new line)'}
                    rows={1}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={loading}
                    style={{ resize: 'none', paddingRight: 16, minHeight: 48, maxHeight: 160, fontSize: '0.9rem' }}
                    onInput={e => {
                      e.target.style.height = 'auto';
                      e.target.style.height = Math.min(e.target.scrollHeight, 160) + 'px';
                    }}
                  />
                </div>

                {/* Voice Input Button */}
                <VoiceInput
                  language={language}
                  onResult={handleVoiceResult}
                  disabled={loading}
                />

                {/* Send Button */}
                <button
                  className="btn btn-glass d-flex align-items-center justify-content-center flex-shrink-0"
                  onClick={() => handleSend()}
                  disabled={loading || !input.trim()}
                  style={{ width: 48, height: 48, padding: 0, borderRadius: 12 }}
                  title="Send message"
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
