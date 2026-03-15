import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import { useAuth } from '../../hooks/useAuth';
import type { Tenant } from './TenantsListPage';

const TenantDashboardPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const tid = id ? parseInt(id, 10) : NaN;
    if (Number.isNaN(tid)) {
      setError('Ungültiger Mandant.');
      return;
    }
    let cancelled = false;
    apiClient
      .get<Tenant>(`/tenants/${tid}`)
      .then((res) => { if (!cancelled) setTenant(res.data); })
      .catch((err) => { if (!cancelled) setError(err.response?.data?.message || 'Mandant nicht gefunden.'); });
    return () => { cancelled = true; };
  }, [id]);

  if (error) {
    return (
      <div className="module-page">
        <div className="alert-error">{error}</div>
        {user?.isSuperAdmin ? (
          <Link to="/mandanten" className="link-action">← Zurück zur Mandantenliste</Link>
        ) : (
          <Link to="/" className="link-action">← Zurück</Link>
        )}
      </div>
    );
  }

  if (!tenant) {
    return <div className="module-page"><p className="module-muted">Lade Mandant…</p></div>;
  }

  const tid = tenant.id;
  const cards = [
    { to: `/kunden?tenantId=${tid}`, label: 'Kunden', description: 'Kunden und Ansprechpartner verwalten' },
    { to: `/projekte?tenantId=${tid}`, label: 'Projekte', description: 'Baustellen und Projekte' },
    { to: `/mitarbeiter?tenantId=${tid}`, label: 'Mitarbeiter', description: 'Mitarbeiter und Zuordnungen' },
    { to: `/fuhrpark?tenantId=${tid}`, label: 'Fuhrpark', description: 'Geräte und Fahrzeuge' },
  ];

  return (
    <div className="module-page tenant-dashboard">
      <div className="tenant-dashboard-header">
        <h1 className="tenant-dashboard-title">{tenant.name}</h1>
        <p className="tenant-dashboard-subtitle">Übersicht für diesen Mandanten</p>
        <Link to={`/mandanten/${tid}/bearbeiten`} className="btn-secondary-inline">
          Mandant bearbeiten
        </Link>
      </div>
      <div className="tenant-dashboard-cards">
        {cards.map((card) => (
          <Link key={card.to} to={card.to} className="tenant-dashboard-card">
            <span className="tenant-dashboard-card-label">{card.label}</span>
            <span className="tenant-dashboard-card-desc">{card.description}</span>
          </Link>
        ))}
      </div>
      {user?.isSuperAdmin && (
        <p className="module-muted" style={{ marginTop: '1.5rem' }}>
          <Link to="/mandanten" className="link-action">← Zurück zur Mandantenliste</Link>
        </p>
      )}
    </div>
  );
};

export default TenantDashboardPage;
