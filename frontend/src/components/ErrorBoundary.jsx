import React, { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('CitizenLex ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary-container">
          <div className="error-boundary-icon">
            <i className="bi bi-exclamation-triangle-fill"></i>
          </div>
          <div>
            <h4 className="fw-bold mb-2">Something went wrong</h4>
            <p className="text-secondary small mb-4" style={{ maxWidth: 360 }}>
              A technical error occurred. This has been logged automatically.
              Please try refreshing the page.
            </p>
            <div className="d-flex gap-2 justify-content-center">
              <button
                className="btn btn-glass"
                onClick={() => window.location.reload()}
              >
                <i className="bi bi-arrow-clockwise me-2"></i>Refresh Page
              </button>
              <button
                className="btn btn-glass-secondary"
                onClick={() => this.setState({ hasError: false, error: null })}
              >
                <i className="bi bi-x-circle me-2"></i>Dismiss
              </button>
            </div>
          </div>
          {this.state.error && (
            <details className="mt-3 text-start" style={{ maxWidth: 480 }}>
              <summary className="text-muted small" style={{ cursor: 'pointer' }}>Technical Details</summary>
              <pre className="small text-danger mt-2 p-2 rounded" style={{ background: 'rgba(239,68,68,0.05)', fontSize: '0.75rem', overflow: 'auto', maxHeight: 200 }}>
                {this.state.error.toString()}
              </pre>
            </details>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}
