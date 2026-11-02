import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { BrowserRouter } from 'react-router-dom';
import './base.css';
import { api } from './utils/api';

// Kick off the home page's data requests now; the hooks reuse these in-flight promises once React mounts.
if (location.pathname === '/') ['/events', '/gallery', '/team', '/settings'].forEach(p => api(p));

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
)