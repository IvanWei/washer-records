import liff from '@line/liff';
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

liff
  .init({ liffId: import.meta.env.VITE_LIFF_ID || '' })
  .then(() => {
    const root = createRoot(document.getElementById('root'));
    root.render(
      // <React.StrictMode>
      <App />,
      // </React.StrictMode>,
    );
  })
  .catch((error) => {
    if (error instanceof Error) {
      alert(`LIFF error: ${error.message}`);
    }
  });
