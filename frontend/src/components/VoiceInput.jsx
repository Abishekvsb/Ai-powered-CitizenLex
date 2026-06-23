import React, { useState, useEffect, useRef, useCallback } from 'react';

/**
 * VoiceInput — captures microphone speech and returns transcript via onResult callback.
 * Uses Web Speech API (SpeechRecognition). Degrades gracefully on unsupported browsers.
 *
 * Props:
 *   language: 'en' | 'ta' — maps to BCP-47 locale for recognition
 *   onResult(text): called with the final transcript string
 *   disabled: boolean
 */
export default function VoiceInput({ language = 'en', onResult, disabled = false }) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [error, setError] = useState(null);
  const recognitionRef = useRef(null);

  const langCode = language === 'ta' ? 'ta-IN' : 'en-IN';

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    setIsSupported(!!SR);
  }, []);

  const startListening = useCallback(() => {
    if (!isSupported || disabled || isListening) return;
    setError(null);

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SR();

    recognition.lang = langCode;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.continuous = false;

    recognition.onstart = () => setIsListening(true);

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      if (onResult) onResult(transcript);
    };

    recognition.onerror = (event) => {
      setIsListening(false);
      if (event.error === 'not-allowed') {
        setError('Microphone permission denied. Please allow microphone access.');
      } else if (event.error === 'no-speech') {
        setError('No speech detected. Please try again.');
      } else {
        setError(`Voice error: ${event.error}`);
      }
      setTimeout(() => setError(null), 4000);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [isSupported, disabled, isListening, langCode, onResult]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  // Not supported — hide completely
  if (!isSupported) {
    return null;
  }

  return (
    <div className="d-flex flex-column align-items-center" style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={isListening ? stopListening : startListening}
        disabled={disabled}
        title={isListening ? 'Stop recording' : `Speak in ${language === 'ta' ? 'Tamil' : 'English'}`}
        className="voice-mic-btn"
        style={{
          width: 48,
          height: 48,
          borderRadius: 12,
          border: isListening
            ? '2px solid rgba(239,68,68,0.8)'
            : '1px solid var(--border)',
          background: isListening
            ? 'rgba(239,68,68,0.12)'
            : 'var(--surface)',
          color: isListening ? '#ef4444' : 'var(--text-secondary)',
          cursor: disabled ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.1rem',
          transition: 'all 0.2s ease',
          flexShrink: 0,
          position: 'relative',
          opacity: disabled ? 0.5 : 1,
        }}
        aria-label={isListening ? 'Stop voice input' : 'Start voice input'}
        aria-pressed={isListening}
      >
        {isListening ? (
          <>
            {/* Pulse rings */}
            <span className="voice-pulse-ring" />
            <span className="voice-pulse-ring" style={{ animationDelay: '0.3s' }} />
            <i className="bi bi-mic-fill" style={{ position: 'relative', zIndex: 1 }}></i>
          </>
        ) : (
          <i className="bi bi-mic"></i>
        )}
      </button>

      {/* Error tooltip */}
      {error && (
        <div
          className="voice-error-tip"
          style={{
            position: 'absolute',
            bottom: '110%',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(239,68,68,0.95)',
            color: 'white',
            fontSize: '0.72rem',
            padding: '5px 10px',
            borderRadius: 8,
            maxWidth: 220,
            whiteSpace: 'normal',
            textAlign: 'center',
            zIndex: 100,
            lineHeight: 1.4,
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
}
