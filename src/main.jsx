// ─────────────────────────────────────────────────────────────────────────────
// main.jsx  —  App entry point
//
// LESSON: We wrap the entire app in two providers:
//   BrowserRouter — gives all child components access to React Router's
//                   navigation/URL features via hooks like useNavigate, useParams
//   AuthProvider  — gives all child components access to the current Firebase
//                   user via the useAuth() hook
// ─────────────────────────────────────────────────────────────────────────────

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import App from './App.jsx';
import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
