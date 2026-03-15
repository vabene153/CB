import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../../services/apiClient';

export interface Tenant {
  id: number;
  name: string;
  slug: string;
  isActive: boolean;
  city?: string;
  contactPerson?: string;
  createdAt: string;
  updatedAt: string;
}

const TenantsListPage: React.FC = () => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiClient
      .get<Tenant[]>('/tenants')
      .then((res) => {
        if (!cancelled) setTenants(res.data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.response?.data?.message || 'Mandanten konnten nicht geladen werden.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return <div className="module-page"><p className="module-muted">Lade Mandanten…</p></div>;
  }

  if (error) {
    return (
      <div className="module-page">
        <div className="alert-error">{error}</div>
      </div>
    );
  }

  return (
    <div className="module-page">
      <div className="module-header">
        <h1 className="module-title">Mandanten / Baufirmen</h1>
        <p className="module-subtitle">Alle Baufirmen verwalten (Oberadmin).</p>
        <Link to="/mandanten/neu" className="btn-primary-inline">
          + Mandant anlegen
        </Link>
      </div>
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Ort</th>
              <th>Kontakt</th>
              <th>Slug</th>
              <th>Status</th>
              <th>Aktion</th>
            </tr>
          </thead>
          <tbody>
            {tenants.length === 0 ? (
              <tr>
                <td colSpan={4} className="table-empty">Noch keine Mandanten angelegt.</td>
              </tr>
            ) : (
              tenants.map((t) => (
                <tr key={t.id}>
                  <td>{t.name}</td>
                  <td>{t.city ?? '—'}</td>
                  <td>{t.contactPerson ?? '—'}</td>
                  <td><code className="code-inline">{t.slug}</code></td>
                  <td>
                    <span className={t.isActive ? 'badge badge-success' : 'badge badge-inactive'}>
                      {t.isActive ? 'Aktiv' : 'Inaktiv'}
                    </span>
                  </td>
                  <td>
                    <Link to={`/mandanten/${t.id}`} className="link-action">Bearbeiten</Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TenantsListPage;
