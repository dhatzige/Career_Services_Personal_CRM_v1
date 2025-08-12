import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { initSentry } from './utils/sentry';
import { initWebVitals } from './utils/webVitals';

// Initialize Sentry for error tracking
initSentry();

// Initialize Web Vitals performance monitoring
initWebVitals();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
