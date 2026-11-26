import { useEffect, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { healthApi } from '../api/client.js';

const HEALTH_INTERVAL_MS = 15000;

const useServiceHealth = () => {
  const [health, setHealth] = useState({ state: 'checking' });

  useEffect(() => {
    let controller;

    const check = async () => {
      controller?.abort();
      controller = new AbortController();
      try {
        const result = await healthApi.check(controller.signal);
        setHealth({ state: 'ok', services: result.services });
      } catch (error) {
        if (error.name === 'AbortError') return;
        setHealth({ state: error.status === 503 ? 'degraded' : 'down' });
      }
    };

    check();
    const interval = setInterval(check, HEALTH_INTERVAL_MS);
    return () => {
      clearInterval(interval);
      controller?.abort();
    };
  }, []);

  return health;
};

const HEALTH_LABELS = {
  checking: 'Checking services...',
  ok: 'All services online',
  degraded: 'Speech service or database unavailable',
  down: 'Backend offline',
};

const Layout = () => {
  const health = useServiceHealth();

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-inner">
          <NavLink to="/" className="brand">
            <img src="/favicon.svg" alt="" width="28" height="28" />
            <span>Speech to Text</span>
          </NavLink>
          <nav className="nav">
            <NavLink to="/" end>
              Record
            </NavLink>
            <NavLink to="/dashboard">Dashboard</NavLink>
          </nav>
          <span className={`health health-${health.state}`} title={HEALTH_LABELS[health.state]}>
            <span className="health-dot" />
            <span className="health-label">{HEALTH_LABELS[health.state]}</span>
          </span>
        </div>
      </header>
      <main className="container">
        <Outlet />
      </main>
      <footer className="footer muted">Speech to Text using Whisper</footer>
    </div>
  );
};

export default Layout;
