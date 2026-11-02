import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { BrowserRouter } from 'react-router-dom';
import './base.css';
import { api } from './utils/api';

// Kick off the home page's data requests now; the hooks reuse these in-flight promises once React mounts.
if (location.pathname === '/') ['/events', '/gallery', '/team', '/settings'].forEach(p => api(p));

// Keep images, fonts and built files on the device (see public/sw.js). Production only.
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}))
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
)