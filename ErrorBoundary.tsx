import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          padding: '40px', 
          fontFamily: 'system-ui', 
          backgroundColor: '#1a1a1a', 
          color: '#fff',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <h1 style={{ color: '#ff6b6b', marginBottom: '20px' }}>⚠️ Something went wrong</h1>
          <div style={{ 
            backgroundColor: '#2a2a2a', 
            padding: '20px', 
            borderRadius: '8px',
            maxWidth: '800px',
            width: '100%'
          }}>
            <h2 style={{ marginBottom: '10px' }}>Error Details:</h2>
            <pre style={{ 
              whiteSpace: 'pre-wrap', 
              wordBreak: 'break-word',
              color: '#ff8787',
              fontSize: '14px'
            }}>
              {this.state.error?.toString()}
            </pre>
            <div style={{ marginTop: '20px' }}>
              <h3>Common fixes:</h3>
              <ul style={{ lineHeight: '1.8' }}>
                <li>Check that environment variables are set (GEMINI_API_KEY)</li>
                <li>Clear browser cache and reload</li>
                <li>Check browser console for more details (F12)</li>
              </ul>
            </div>
            <button 
              onClick={() => window.location.reload()} 
              style={{
                marginTop: '20px',
                padding: '10px 20px',
                backgroundColor: '#4a9eff',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
