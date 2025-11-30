
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import ErrorBoundary from './ErrorBoundary';

console.log('🚀 Nexus Coder initializing...');

try {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    console.error('❌ Root element not found!');
    throw new Error("Could not find root element to mount to");
  }

  console.log('✅ Root element found, creating React root...');
  const root = ReactDOM.createRoot(rootElement);
  
  console.log('✅ Rendering app...');
  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>
  );
  
  console.log('✅ App rendered successfully!');
} catch (error) {
  console.error('❌ Fatal error during initialization:', error);
  // Show error on page
  document.body.innerHTML = `
    <div style="padding: 40px; font-family: system-ui; background: #1a1a1a; color: #fff; min-height: 100vh;">
      <h1 style="color: #ff6b6b;">⚠️ Failed to Initialize App</h1>
      <pre style="background: #2a2a2a; padding: 20px; border-radius: 8px; overflow: auto;">
${error instanceof Error ? error.message : String(error)}
      </pre>
      <p>Check the browser console (F12) for more details.</p>
    </div>
  `;
}
