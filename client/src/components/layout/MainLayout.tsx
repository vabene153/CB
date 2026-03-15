import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const MainLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="layout-shell">
      <aside className="layout-sidebar">
        <div className="sidebar-header">
          <span className="sidebar-logo">CB</span>
          <span className="sidebar-title">Baustellen‑CRM</span>
        </div>
        <nav className="sidebar-nav">
          <Link to="/" className="sidebar-link">
            Dashboard
          </Link>
          {user?.isSuperAdmin && (
            <Link to="/mandanten" className="sidebar-link">
              Mandanten
            </Link>
          )}
          <Link to="/kunden" className="sidebar-link">
            Kunden
          </Link>
          <Link to="/projekte" className="sidebar-link">
            Projekte
          </Link>
          <Link to="/fuhrpark" className="sidebar-link">
            Fuhrpark
          </Link>
        </nav>
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar">
              {user?.firstName?.[0]}
              {user?.lastName?.[0]}
            </div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">
                {user?.firstName} {user?.lastName}
              </div>
              <button onClick={handleLogout} className="sidebar-logout">
                Abmelden
              </button>
            </div>
          </div>
        </div>
      </aside>
      <main className="layout-main">
        <header className="main-header">
          <h1 className="main-header-title">Übersicht</h1>
        </header>
        <div className="main-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default MainLayout;

