import React from 'react';
import App from './App';
import {createRoot} from 'react-dom/client';
import {Providers} from './redux/provider';
import '../output.css';

const container = document.getElementById('app');
if (container) {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <Providers>
        <App />
      </Providers>
    </React.StrictMode>,
  );
}
