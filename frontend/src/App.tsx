import React from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { LayoutDashboard, ArrowLeftRight, PieChart } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import TransactionsPage from './pages/TransactionsPage';
import SummaryPage from './pages/SummaryPage';
import './index.css';

const NAV = [
  { to: '/', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
  { to: '/transactions', icon: <ArrowLeftRight size={18} />, label: 'Transactions' },
  { to: '/summary', icon: <PieChart size={18} />, label: 'Summary' },
];

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <aside className="sidebar">
          <div className="sidebar-brand">
            <span className="brand-dot" />
            <span className="brand-name">belvo<span className="brand-accent">.</span></span>
          </div>
          <nav className="sidebar-nav">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.to === '/'}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              >
                {n.icon}
                <span>{n.label}</span>
              </NavLink>
            ))}
          </nav>
          <div className="sidebar-footer">
            <span className="version-tag">v1.0.0</span>
          </div>
        </aside>

        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/transactions" element={<TransactionsPage />} />
            <Route path="/summary" element={<SummaryPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
