import React from 'react';
import { useAuth } from '../../hooks/useAuth';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div>
      <h1 className="dashboard-title">
        Dashboard
      </h1>
      <p className="dashboard-subtitle">
        Willkommen, {user?.firstName ?? user?.email}. Hier siehst du deine Übersicht.
      </p>
      <div className="dashboard-cards">
        <div className="dashboard-card">
          <div className="dashboard-card-title">Aktive Baustellen</div>
          <div className="dashboard-card-value">—</div>
          <p style={{ margin: '0.5rem 0 0', fontSize: '0.8rem', color: '#64748b' }}>
            Später: laufende Projekte
          </p>
        </div>
        <div className="dashboard-card">
          <div className="dashboard-card-title">Offene Tagesberichte</div>
          <div className="dashboard-card-value">—</div>
          <p style={{ margin: '0.5rem 0 0', fontSize: '0.8rem', color: '#64748b' }}>
            Später: ausstehende Berichte
          </p>
        </div>
        <div className="dashboard-card">
          <div className="dashboard-card-title">Anstehende Wartungen</div>
          <div className="dashboard-card-value">—</div>
          <p style={{ margin: '0.5rem 0 0', fontSize: '0.8rem', color: '#64748b' }}>
            Später: Fuhrpark
          </p>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;

