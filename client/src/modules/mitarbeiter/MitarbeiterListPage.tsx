import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import { useAuth } from '../../hooks/useAuth';
import type { Tenant } from '../tenants/TenantsListPage';

export interface TenantUser {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  status: string;
  position?: string | null;
  isSuperAdmin?: boolean;
  roles: { id: number; name: string; label: string }[];
}

const MitarbeiterListPage: React.FC = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const tenantIdParam = searchParams.get('tenantId');
  const [tenantId, setTenantId] = useState<number>(() => {
    const n = tenantIdParam ? parseInt(tenantIdParam, 10) : NaN;
    return !Number.isNaN(n) ? n : (user?.tenantId ?? 0);
  });
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [users, setUsers] = useState<TenantUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.isSuperAdmin) return;
    apiClient.get<Tenant[]>('/tenants').then((res) => setTenants(res.data)).catch(() => {});
  }, [user?.isSuperAdmin]);

  useEffect(() => {
    if (!user?.isSuperAdmin && user?.tenantId != null && !tenantIdParam) {
      setTenantId(user.tenantId);
    }
  }, [user?.tenantId, user?.isSuperAdmin, tenantIdParam]);

  useEffect(() => {
    const effectiveTenantId = user?.isSuperAdmin && tenantId ? tenantId : user?.tenantId;
    if (!effectiveTenantId) {
      setLoading(false);
      setUsers([]);
      return;
    }
    setLoading(true);
    setError(null);
    apiClient
      .get<TenantUser[]>(`/tenants/${effectiveTenantId}/users`)
      .then((res) => setUsers(res.data))
      .catch((err) => {
        const msg = err.response?.data?.message;
        const status = err.response?.status;
        setError(
          msg ||
          (status === 403 ? 'Sie haben keine Berechtigung, Mitarbeiter dieses Mandanten anzuzeigen.' : 'Mitarbeiter konnten nicht geladen werden.')
        );
      })
      .finally(() => setLoading(false));
  }, [tenantId, user?.tenantId, user?.isSuperAdmin]);

  const effectiveTenantId = user?.isSuperAdmin && tenantId ? tenantId : user?.tenantId;
  const canAdd = user?.isSuperAdmin || user?.isTenantAdmin;

  return (
    <div className="module-page">
      <div className="module-header">
        <h1 className="module-title">Mitarbeiter</h1>
        <p className="module-subtitle">Mitarbeiter und Rechte für die Firma.</p>
        <div className="module-header-actions">
          {user?.isSuperAdmin && tenants.length > 0 && (
            <select
              className="form-select search-input"
              style={{ minWidth: '200px' }}
              value={tenantId || ''}
              onChange={(e) => setTenantId(Number(e.target.value) || 0)}
            >
              <option value="">Mandant wählen…</option>
              {tenants.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          )}
          {canAdd && effectiveTenantId && (
            <Link to={`/mitarbeiter/neu?tenantId=${effectiveTenantId}`} className="btn-primary-inline">
              + Mitarbeiter anlegen
            </Link>
          )}
        </div>
      </div>
      {error && <div className="alert-error" role="alert">{error}</div>}
      {!effectiveTenantId && !error && (
        <p className="module-muted">Bitte Mandant auswählen (als Oberadministrator) oder Sie sehen automatisch die Mitarbeiter Ihrer Firma.</p>
      )}
      {effectiveTenantId && (
        <>
          {loading ? (
            <p className="module-muted">Lade Mitarbeiter…</p>
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>E-Mail</th>
                    <th>Position</th>
                    <th>Rollen</th>
                    <th>Status</th>
                    {(user?.isSuperAdmin || user?.isTenantAdmin) && <th>Aktion</th>}
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={(user?.isSuperAdmin || user?.isTenantAdmin) ? 6 : 5} className="table-empty">
                        Noch keine Mitarbeiter angelegt.
                      </td>
                    </tr>
                  ) : (
                    users.map((u) => (
                      <tr key={u.id}>
                        <td>{u.firstName} {u.lastName}</td>
                        <td>{u.email}</td>
                        <td>{u.position ?? '—'}</td>
                        <td>{u.roles?.map((r) => r.label).join(', ') || '—'}</td>
                        <td>
                          <span className={u.status === 'ACTIVE' ? 'badge badge-success' : 'badge badge-inactive'}>
                            {u.status === 'ACTIVE' ? 'Aktiv' : 'Inaktiv'}
                          </span>
                        </td>
                        {(user?.isSuperAdmin || user?.isTenantAdmin) && (
                          <td>
                            <Link to={`/mitarbeiter/${u.id}/bearbeiten`} className="link-action">
                              Rechte bearbeiten
                            </Link>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
      {effectiveTenantId && (
        <p className="module-muted" style={{ marginTop: '1rem' }}>
          {tenantIdParam && <Link to={`/mandanten/${tenantIdParam}`} className="link-action">← Zurück zum Mandanten-Dashboard</Link>}
          {!tenantIdParam && <Link to="/" className="link-action">Zum Dashboard</Link>}
        </p>
      )}
    </div>
  );
};

export default MitarbeiterListPage;
