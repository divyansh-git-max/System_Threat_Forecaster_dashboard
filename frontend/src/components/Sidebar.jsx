import { NavLink } from 'react-router-dom';
import './Sidebar.css';

const NAV = [
  { to: '/',           icon: '⊞',  label: 'Dashboard'   },
  { to: '/predict',    icon: '⚡',  label: 'Predict',    badge: 'Live'    },
  { to: '/batch',      icon: '⬆',  label: 'Batch Upload' },
  { to: '/models',     icon: '🧠',  label: 'Model Comparison' },
  { to: '/features',   icon: '📊',  label: 'Feature Importance' },
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar__logo">
        <div className="sidebar__logo-icon">🛡</div>
        <div className="sidebar__logo-text">
          <span className="sidebar__logo-title">ThreatForecaster</span>
          <span className="sidebar__logo-sub">ML v1.0</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="sidebar__nav">
        <span className="sidebar__section-label">Navigation</span>
        {NAV.map(({ to, icon, label, badge }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="nav-item__icon">{icon}</span>
            {label}
            {badge && <span className="nav-item__badge">{badge}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="sidebar__footer">
        <div className="sidebar__status">
          <span className="status-dot" />
          API Connected
        </div>
      </div>
    </aside>
  );
}
