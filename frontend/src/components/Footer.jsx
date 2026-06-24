import React from 'react';

export default function Footer() {
  return (
    <footer className="mt-auto py-4 border-0 border-top rounded-0" style={{ backgroundColor: 'var(--footer-bg)', borderTopColor: 'rgba(255,255,255,0.08)' }}>
      <div className="container text-center">
        <p className="mb-1 fw-bold" style={{ color: 'var(--accent)' }}>⚖️ CitizenLex – Legal Tech for Everyone</p>
        <p className="small mb-2" style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.78rem', lineHeight: '1.5' }}>
          Disclaimer: CitizenLex is an AI-powered educational platform. The responses, summaries, and legal materials provided are for informational purposes only and do not constitute formal legal advice.
        </p>
        <p className="small mb-0" style={{ color: 'rgba(255, 255, 255, 0.45)', fontSize: '0.72rem' }}>
          &copy; {new Date().getFullYear()} CitizenLex Inc. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
