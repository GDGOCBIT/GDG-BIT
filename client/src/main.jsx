import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { BrowserRouter } from 'react-router-dom';
import './base.css';
import { api, warmCrypto } from './utils/api';
import { prefetchStats } from './utils/adminPrefetch';

// Kick off the home page's data requests now; the hooks reuse these in-flight promises once React mounts.
if (location.pathname === '/') ['/events', '/gallery', '/team', '/settings'].forEach(p => api(p));

// Signed in: load the decryption code now so the sign-in check is not waiting on it. On /admin also fetch the
// Admin code and its numbers at the same time as the sign-in check, instead of one after the other.
if (localStorage.getItem('login_token')) {
  warmCrypto();
  if (location.pathname.startsWith('/admin')) { import('./pages/Admin/Admin'); prefetchStats(); }
}

// Keep images, fonts and built files on the device (see public/sw.js). Production only.
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}))
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
)