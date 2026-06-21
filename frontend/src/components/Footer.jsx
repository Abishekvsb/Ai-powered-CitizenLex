import React from 'react';

export default function Footer() {
  return (
    <footer className="glass-panel mt-auto py-4 border-0 border-top rounded-0" style={{ backgroundColor: 'var(--nav-bg)' }}>
      <div className="container text-center">
        <p className="mb-1 fw-bold text-primary">⚖️ CitizenLex – Legal Tech for Everyone</p>
        <p className="text-secondary small mb-2">
          Disclaimer: CitizenLex is an AI-powered educational platform. The responses, summaries, and legal materials provided are for informational purposes only and do not constitute formal legal advice.
        </p>
        <p className="text-secondary small mb-0">
          &copy; {new Date().getFullYear()} CitizenLex Inc. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
