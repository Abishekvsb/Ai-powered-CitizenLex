import React, { useState, useEffect, useRef, useCallback } from 'react';

/**
 * TextToSpeech — reads provided text aloud using Web Speech Synthesis API.
 * Supports Tamil (ta-IN) and English (en-IN).
 *
 * Props:
 *   text: string — the text to speak
 *   language: 'en' | 'ta'
 */
export default function TextToSpeech({ text, language = 'en' }) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const utteranceRef = useRef(null);

  const langCode = language === 'ta' ? 'ta-IN' : 'en-IN';

  useEffect(() => {
    setIsSupported('speechSynthesis' in window);
  }, []);

  // Stop speech if language or text changes
  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [text]);

  const handleSpeak = useCallback(() => {
    if (!isSupported || !text) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = langCode;
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    // Try to pick a voice for the language
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(v => v.lang === langCode) ||
                      voices.find(v => v.lang.startsWith(language === 'ta' ? 'ta' : 'en'));
    if (preferred) utterance.voice = preferred;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [isSupported, text, isSpeaking, langCode, language]);

  if (!isSupported || !text) return null;

  return (
    <button
      type="button"
      onClick={handleSpeak}
      title={isSpeaking ? 'Stop reading' : 'Read response aloud'}
      style={{
        background: 'none',
        border: 'none',
        color: isSpeaking ? 'var(--primary)' : 'var(--text-muted)',
        cursor: 'pointer',
        padding: '3px 5px',
        borderRadius: 6,
        fontSize: '0.85rem',
        transition: 'all 0.2s',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        flexShrink: 0,
      }}
      aria-label={isSpeaking ? 'Stop text to speech' : 'Play text to speech'}
      aria-pressed={isSpeaking}
    >
      {isSpeaking ? (
        <i className="bi bi-stop-circle-fill" style={{ color: '#ef4444', animation: 'pulse 1s infinite' }}></i>
      ) : (
        <i className="bi bi-volume-up"></i>
      )}
    </button>
  );
}
