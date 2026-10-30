import React from 'react'
import ReactDOM from 'react-dom/client'
import axios from 'axios'
import App from './App.jsx'
import './index.css'
import { isNativeApp } from './utils/nativeBridge.js'

// Automatically configure backend URL for mobile app vs web browser
// When running inside Android APK, route to your network backend IP (192.168.1.3:5000)
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || (isNativeApp() ? 'http://192.168.1.3:5000' : '');
if (BACKEND_URL) {
  axios.defaults.baseURL = BACKEND_URL;
  console.log('[CityConnectAI Mobile] Configured Axios BaseURL:', BACKEND_URL);
}

// Simple Error Boundary to catch any render errors and prevent blank screen
class RootErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error('App render crash:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '24px', fontFamily: 'sans-serif', backgroundColor: '#FAF7F2', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
          <h2 style={{ color: '#A34B24', marginBottom: '8px', fontSize: '20px', fontWeight: 'bold' }}>CityConnectAI</h2>
          <p style={{ color: '#555', fontSize: '14px', maxWidth: '320px', marginBottom: '16px' }}>
            We encountered a startup issue loading the view.
          </p>
          <pre style={{ backgroundColor: '#fff', border: '1px solid #ddd', padding: '12px', borderRadius: '8px', fontSize: '11px', textAlign: 'left', overflowX: 'auto', maxWidth: '90%' }}>
            {this.state.error?.toString()}
          </pre>
          <button 
            onClick={() => window.location.reload()} 
            style={{ marginTop: '16px', padding: '10px 20px', backgroundColor: '#A34B24', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '13px' }}
          >
            Reload Application
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <RootErrorBoundary>
    <App />
  </RootErrorBoundary>,
)
