import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../../services/apiClient';

export interface TenantContact {
  id?: number;
  firstName: string;
  lastName: string;
  role?: string;
  phone?: string;
  mobile?: string;
  email?: string;
  isPrimary: boolean;
  notes?: string;
  order?: number;
}

export interface Tenant {
  id: number;
  name: string;
  slug: string;
  isActive: boolean;
  street?: string | null;
  postalCode?: string | null;
  city?: string | null;
  country?: string | null;
  phone?: string | null;
  email?: string | null;
  billingName?: string | null;
  billingStreet?: string | null;
  billingPostalCode?: string | null;
  billingCity?: string | null;
  billingCountry?: string | null;
  notes?: string | null;
  contacts?: TenantContact[];
  createdAt: string;
  updatedAt: string;
}

const TenantsListPage: React.FC = () => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstLoad = useRef(true);

  useEffect(() => {
    const fetchTenants = (q: string) => {
      setLoading(true);
      setError(null);
      const params = q ? { params: { q } } : {};
      apiClient
        .get<Tenant[]>('/tenants', params)
        .then((res) => setTenants(res.data))
        .catch((err) => setError(err.response?.data?.message || 'Mandanten konnten nicht geladen werden.'))
        .finally(() => setLoading(false));
    };

    if (isFirstLoad.current) {
      isFirstLoad.current = false;
      fetchTenants('');
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      debounceRef.current = null;
      fetchTenants(search.trim());
    }, 280);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search]);

  const primaryContact = (t: Tenant) =>
    t.contacts?.find((c) => c.isPrimary) ?? t.contacts?.[0];
  const contactLabel = (t: Tenant) => {
    const p = primaryContact(t);
    const count = t.contacts?.length ?? 0;
    if (count === 0) return '—';
    const name = p ? `${p.firstName} ${p.lastName}`.trim() || p.email || 'Kontakt' : '';
    return count > 1 ? `${count} Kontakte (${name})` : name;
  };

  const addressLine = (t: Tenant) => {
    const parts = [t.street, [t.postalCode, t.city].filter(Boolean).join(' ')].filter(Boolean);
    return parts.length ? parts.join(', ') : '—';
  };

  return (
    <div className="module-page">
      <div className="module-header">
        <h1 className="module-title">Mandanten / Baufirmen</h1>
        <p className="module-subtitle">Alle Baufirmen verwalten (Oberadmin).</p>
        <div className="module-header-actions">
          <input
            type="search"
            className="search-input"
            placeholder="Suchen (Name, Ort, Kontakt, E-Mail…)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Link to="/mandanten/neu" className="btn-primary-inline">
            + Mandant anlegen
          </Link>
        </div>
      </div>
      {error && <div className="alert-error">{error}</div>}
      {loading ? (
        <p className="module-muted">Lade Mandanten…</p>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Adresse</th>
                <th>Telefon</th>
                <th>E-Mail</th>
                <th>Kontakte</th>
                <th>Slug</th>
                <th>Status</th>
                <th>Aktion</th>
              </tr>
            </thead>
            <tbody>
              {tenants.length === 0 ? (
                <tr>
                  <td colSpan={8} className="table-empty">
                    {search ? 'Keine Mandanten passen zur Suche.' : 'Noch keine Mandanten angelegt.'}
                  </td>
                </tr>
              ) : (
                tenants.map((t) => (
                  <tr key={t.id}>
                    <td>
                      <Link to={`/mandanten/${t.id}`} className="link-action link-name">
                        {t.name}
                      </Link>
                    </td>
                    <td>{addressLine(t)}</td>
                    <td>{t.phone ?? '—'}</td>
                    <td>{t.email ?? '—'}</td>
                    <td>{contactLabel(t)}</td>
                    <td><code className="code-inline">{t.slug}</code></td>
                    <td>
                      <span className={t.isActive ? 'badge badge-success' : 'badge badge-inactive'}>
                        {t.isActive ? 'Aktiv' : 'Inaktiv'}
                      </span>
                    </td>
                    <td>
                      <Link to={`/mandanten/${t.id}/bearbeiten`} className="link-action">Bearbeiten</Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default TenantsListPage;
