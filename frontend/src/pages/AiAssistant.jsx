import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

export default function AiAssistant() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [language, setLanguage] = useState('en'); // 'en' or 'ta'
  const [loading, setLoading] = useState(false);
  const [sidebarChats, setSidebarChats] = useState([]);
  
  const chatEndRef = useRef(null);

  // Suggested questions
  const suggestionsEn = [
    "What are my rights if arrested?",
    "How do I file a consumer complaint?",
    "What are the rules regarding overtime pay?",
    "Tell me about the Right to Education Act"
  ];

  const suggestionsTa = [
    "கைது செய்யப்படும்போது எனக்கான உரிமைகள் என்ன?",
    "நுகர்வோர் புகார் அளிப்பது எப்படி?",
    "கூடுதல் நேர வேலைக்கான சம்பள விதிகள் என்ன?",
    "இலவச கட்டாயக் கல்வி உரிமைச் சட்டம் பற்றி கூறுக"
  ];

  const suggestions = language === 'en' ? suggestionsEn : suggestionsTa;

  const fetchChatHistory = async () => {
    try {
      const res = await axios.get('/api/chat/history');
      setSidebarChats(res.data || []);
      
      // If we don't have active chat dialogue, seed recent ones
      if (messages.length === 0 && res.data && res.data.length > 0) {
        // We reverse to show chronological order in the chat bubble window
        const historyBubbels = [];
        res.data.slice(0, 10).reverse().forEach(item => {
          historyBubbels.push({ sender: 'user', text: item.message });
          historyBubbels.push({ sender: 'assistant', text: item.response });
        });
        setMessages(historyBubbels);
      }
    } catch (err) {
      console.error("Failed to load chat history", err);
    }
  };

  useEffect(() => {
    fetchChatHistory();
  }, []);

  useEffect(() => {
    // Scroll to bottom on new message
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (messageText) => {
    if (!messageText || messageText.trim() === '') return;

    // Append User message
    const userMsg = { sender: 'user', text: messageText };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await axios.post('/api/chat', {
        message: messageText,
        language: language
      });
      // Append AI response
      const assistantMsg = { sender: 'assistant', text: res.data.response };
      setMessages(prev => [...prev, assistantMsg]);
      
      // Refresh sidebar list
      fetchChatHistory();
    } catch (err) {
      console.error(err);
      const errorMsg = { sender: 'assistant', text: "Error: Could not retrieve legal advice from the server. Check your connection." };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(input);
    }
  };

  return (
    <div className="container-fluid py-4 text-start">
      <div className="row g-4 justify-content-center">
        
        {/* Sidebar History Column */}
        <div className="col-lg-3 d-none d-lg-block fade-in-el">
          <div className="glass-panel p-4 h-100 d-flex flex-column" style={{ maxHeight: '75vh' }}>
            <h5 className="fw-bold mb-3 d-flex align-items-center gap-2">
              <i className="bi bi-clock-history text-primary"></i>
              <span>Recent Queries</span>
            </h5>
            <div className="overflow-y-auto flex-grow-1" style={{ maxHeight: '60vh' }}>
              {sidebarChats.length === 0 ? (
                <p className="text-secondary small">No past sessions recorded.</p>
              ) : (
                sidebarChats.map((chat) => (
                  <div key={chat.id} className="p-3 mb-2 glass-panel border border-light-subtle rounded text-start" style={{ cursor: 'default' }}>
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <span className="badge bg-secondary-subtle text-secondary small">
                        {chat.language === 'ta' ? 'Tamil' : 'English'}
                      </span>
                      <small className="text-secondary">{new Date(chat.createdAt).toLocaleDateString()}</small>
                    </div>
                    <p className="text-primary fw-bold text-truncate mb-1 small">{chat.message}</p>
                    <p className="text-secondary text-truncate mb-0 small">{chat.response}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Chat Main Window Column */}
        <div className="col-lg-8 fade-in-el">
          <div className="glass-panel p-4 d-flex flex-column chat-container" style={{ height: '75vh' }}>
            
            {/* Header / Language Controls */}
            <div className="d-flex justify-content-between align-items-center border-bottom pb-3 mb-3">
              <div className="d-flex align-items-center gap-2">
                <i className="bi bi-robot text-primary fs-3"></i>
                <div>
                  <h5 className="mb-0 fw-bold">CitizenLex AI Legal Assistant</h5>
                  <span className="text-secondary small">Instant simplified legal clarifications</span>
                </div>
              </div>
              
              <div className="d-flex align-items-center gap-2">
                <span className="text-secondary small fw-bold">Language:</span>
                <div className="btn-group btn-group-sm" role="group">
                  <button
                    type="button"
                    className={`btn ${language === 'en' ? 'btn-primary' : 'btn-outline-primary'}`}
                    onClick={() => setLanguage('en')}
                  >
                    English
                  </button>
                  <button
                    type="button"
                    className={`btn ${language === 'ta' ? 'btn-primary' : 'btn-outline-primary'}`}
                    onClick={() => setLanguage('ta')}
                  >
                    தமிழ்
                  </button>
                </div>
              </div>
            </div>

            {/* Bubble Messages Window */}
            <div className="chat-messages d-flex flex-column flex-grow-1 overflow-y-auto mb-3">
              {messages.length === 0 ? (
                <div className="m-auto text-center text-secondary py-5">
                  <i className="bi bi-balance2 text-primary fs-1 mb-3 d-block"></i>
                  <h4>Ask CitizenLex</h4>
                  <p className="small text-secondary max-width-400">
                    Query legal protections in India. Type your query or choose a suggested prompt below to start.
                  </p>
                </div>
              ) : (
                messages.map((msg, index) => (
                  <div key={index} className={`chat-bubble ${msg.sender}`}>
                    <div style={{ whiteSpace: 'pre-line' }}>{msg.text}</div>
                  </div>
                ))
              )}

              {loading && (
                <div className="chat-bubble assistant align-self-start d-flex align-items-center gap-2">
                  <div className="spinner-grow spinner-grow-sm text-primary" role="status"></div>
                  <span>CitizenLex is analyzing legal codes...</span>
                </div>
              )}
              
              <div ref={chatEndRef} />
            </div>

            {/* Suggestions buttons row */}
            {messages.length === 0 && (
              <div className="row g-2 mb-3">
                {suggestions.map((sug, i) => (
                  <div key={i} className="col-md-6">
                    <button
                      className="btn btn-sm btn-glass-secondary text-start w-100 text-truncate font-weight-normal py-2"
                      onClick={() => handleSend(sug)}
                    >
                      <i className="bi bi-question-circle text-primary me-2"></i>
                      {sug}
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Input Form Bar */}
            <div className="d-flex gap-2 border-top pt-3">
              <textarea
                className="form-control form-glass-control flex-grow-1"
                placeholder={language === 'ta' ? "இங்கே உங்கள் சட்டக் கேள்வியைக் கேளுங்கள்..." : "Ask your legal question here..."}
                rows="1"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                style={{ resize: 'none' }}
              />
              <button
                className="btn btn-glass px-4 d-flex align-items-center justify-content-center"
                onClick={() => handleSend(input)}
                disabled={loading || !input.trim()}
              >
                <i className="bi bi-send-fill fs-5"></i>
              </button>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
