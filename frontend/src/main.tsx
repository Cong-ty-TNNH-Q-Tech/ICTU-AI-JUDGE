import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';

// MOCK AUTH STATE FOR UI TESTING
localStorage.setItem('ictu-auth', JSON.stringify({
  state: {
    user: { id: "test-admin", email: "admin@ictu.edu.vn", full_name: "Admin ICTU", role: "ADMIN" },
    isAuthenticated: true
  },
  version: 0
}));

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
