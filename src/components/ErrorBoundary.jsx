import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          padding: '40px', 
          maxWidth: '800px', 
          margin: '40px auto',
          background: '#fee',
          border: '2px solid #c00',
          borderRadius: '8px',
          fontFamily: 'monospace'
        }}>
          <h1 style={{ color: '#c00' }}>Something went wrong.</h1>
          <details style={{ whiteSpace: 'pre-wrap', marginTop: '20px' }}>
            <summary style={{ cursor: 'pointer', marginBottom: '10px' }}>Error Details</summary>
            <div style={{ background: '#fff', padding: '20px', borderRadius: '4px' }}>
              <h3>Error Message:</h3>
              <p style={{ color: '#c00' }}>{this.state.error && this.state.error.toString()}</p>
              <h3>Component Stack:</h3>
              <pre>{this.state.errorInfo && this.state.errorInfo.componentStack}</pre>
              <h3>Stack Trace:</h3>
              <pre>{this.state.error && this.state.error.stack}</pre>
            </div>
          </details>
          <button 
            onClick={() => window.location.href = '/dashboard'}
            style={{
              marginTop: '20px',
              padding: '12px 24px',
              background: '#c00',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            Go Back to Dashboard
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
