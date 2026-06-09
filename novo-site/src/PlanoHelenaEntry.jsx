import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import ErrorBoundary from './components/ErrorBoundary';
import HeartRain from './components/HeartRain';
import PlanoHelena from './pages/PlanoHelena';

function HelenaApp() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-gradient-to-br from-emerald-50 via-white to-cyan-50 px-4 py-8 font-sans text-slate-700 antialiased">
      <HeartRain />
      <main className="relative z-10 mx-auto max-w-6xl">
        <PlanoHelena />
      </main>
    </div>
  );
}

createRoot(document.getElementById('helena-root')).render(
  <StrictMode>
    <ErrorBoundary>
      <HelenaApp />
    </ErrorBoundary>
  </StrictMode>,
);
