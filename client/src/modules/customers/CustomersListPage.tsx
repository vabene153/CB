import React, { useEffect, useState, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import { useAuth } from '../../hooks/useAuth';
import type { Tenant } from '../tenants/TenantsListPage';

export interface CustomerContact {
  id?: number;
  firstName: string;
  lastName: string;
  role?: string | null;
  phone?: string | null;
  mobile?: string | null;
  email?: string | null;
  isPrimary?: boolean;
  notes?: string | null;
  order?: number;
}

export interface Customer {
  id: number;
  tenantId: number;
  name: string;
  type: string;
  street?: string | null;
  postalCode?: string | null;
  city?: string | null;
  country?: string | null;
  phone?: string | null;
  email?: string | null;
  notes?: string | null;
  contacts?: CustomerContact[];
  createdAt: string;
  updatedAt: string;
}

const CustomersListPage: React.FC = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const tenantIdFromUrl = searchParams.get('tenantId');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [tenantId, setTenantId] = useState<number>(() => {
    const n = tenantIdFromUrl ? parseInt(tenantIdFromUrl, 10) : NaN;
    return !Number.isNaN(n) ? n : 0;
  });
  const [loading, setLoading] = useState(true);
  const tenantIdSynced = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstLoad = useRef(true);

  useEffect(() => {
    if (!user?.isSuperAdmin) return;
    apiClient.get<Tenant[]>('/tenants').then((res) => setTenants(res.data)).catch(() => {});
  }, [user?.isSuperAdmin]);

  useEffect(() => {
    const fromUrl = tenantIdFromUrl ? parseInt(tenantIdFromUrl, 10) : NaN;
    if (!Number.isNaN(fromUrl) && user?.isSuperAdmin) {
      setTenantId(fromUrl);
      tenantIdSynced.current = true;
      return;
    }
    if (user?.tenantId != null && !tenantIdSynced.current) {
      tenantIdSynced.current = true;
      setTenantId(user.tenantId);
    }
  }, [user?.tenantId, user?.isSuperAdmin, tenantIdFromUrl]);

  useEffect(() => {
    const effectiveTenantId = user?.isSuperAdmin && tenantId ? tenantId : user?.tenantId;
    if (!effectiveTenantId) {
      setLoading(false);
      setCustomers([]);
      return;
    }

    const fetchCustomers = (q: string) => {
      setLoading(true);
      setError(null);
      const params: { tenantId: number; q?: string } = { tenantId: effectiveTenantId };
      if (q) params.q = q;
      apiClient
        .get<Customer[]>('/customers', { params })
        .then((res) => setCustomers(res.data))
        .catch((err) => setError(err.response?.data?.message || 'Kunden konnten nicht geladen werden.'))
        .finally(() => setLoading(false));
    };

    if (isFirstLoad.current) {
      isFirstLoad.current = false;
      fetchCustomers('');
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      debounceRef.current = null;
      fetchCustomers(search.trim());
    }, 280);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [tenantId, search, user?.tenantId, user?.isSuperAdmin]);

  const addressLine = (c: Customer) => {
    const parts = [c.street, [c.postalCode, c.city].filter(Boolean).join(' ')].filter(Boolean);
    return parts.length ? parts.join(', ') : '—';
  };

  const primaryContact = (c: Customer) =>
    c.contacts?.find((x) => x.isPrimary) ?? c.contacts?.[0];
  const contactLabel = (c: Customer) => {
    const count = c.contacts?.length ?? 0;
    if (count === 0) return '—';
    const p = primaryContact(c);
    const name = p ? `${p.firstName} ${p.lastName}`.trim() || p.email || 'Kontakt' : '';
    return count > 1 ? `${count} Kontakte (${name})` : name;
  };

  const currentTenantId = user?.isSuperAdmin && tenantId ? tenantId : user?.tenantId;

  return (
    <div className="module-page">
      <div className="module-header">
        <h1 className="module-title">Kunden</h1>
        <p className="module-subtitle">Kunden pro Mandant verwalten.</p>
        <div className="module-header-actions">
          {user?.isSuperAdmin && tenants.length > 0 && (
            <select
              className="form-select search-input"
              style={{ minWidth: '200px', maxWidth: '240px' }}
              value={tenantId || ''}
              onChange={(e) => {
                setTenantId(Number(e.target.value) || 0);
                isFirstLoad.current = true;
              }}
            >
              <option value="">Mandant wählen…</option>
              {tenants.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          )}
          <input
            type="search"
            className="search-input"
            placeholder="Suchen (Name, Typ, Ort, E-Mail, Telefon…)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Link to="/kunden/neu" className="btn-primary-inline">
            + Kunde anlegen
          </Link>
        </div>
      </div>
      {error && <div className="alert-error">{error}</div>}
      {!currentTenantId && user?.isSuperAdmin && (
        <p className="module-muted">Bitte einen Mandanten auswählen.</p>
      )}
      {currentTenantId && (
        <>
          {loading ? (
            <p className="module-muted">Lade Kunden…</p>
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Typ</th>
                    <th>Adresse</th>
                    <th>Telefon</th>
                    <th>E-Mail</th>
                    <th>Kontakte</th>
                    <th>Aktion</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="table-empty">
                        {search ? 'Keine Kunden passen zur Suche.' : 'Noch keine Kunden angelegt.'}
                      </td>
                    </tr>
                  ) : (
                    customers.map((c) => (
                      <tr key={c.id}>
                        <td>{c.name}</td>
                        <td>{c.type}</td>
                        <td>{addressLine(c)}</td>
                        <td>{c.phone ?? '—'}</td>
                        <td>{c.email ?? '—'}</td>
                        <td>{contactLabel(c)}</td>
                        <td>
                          <Link to={`/kunden/${c.id}`} className="link-action">
                            Bearbeiten
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CustomersListPage;
