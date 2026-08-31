import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(error => {
      console.warn('GriyaKas: service worker gagal didaftarkan.', error);
    });
  });
}

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Root element tidak ditemukan.');
createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
