import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import { useAuth } from '../../hooks/useAuth';

interface Role {
  id: number;
  name: string;
  label: string;
}

const MitarbeiterFormPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tenantIdParam = searchParams.get('tenantId');
  const tenantId = tenantIdParam ? parseInt(tenantIdParam, 10) : (user?.tenantId ?? 0);
  const [roles, setRoles] = useState<Role[]>([]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [position, setPosition] = useState('');
  const [roleIds, setRoleIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiClient.get<Role[]>('/roles').then((res) => setRoles(res.data)).catch(() => {});
  }, []);

  const toggleRole = (id: number) => {
    setRoleIds((prev) => (prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.isSuperAdmin && !user?.isTenantAdmin) return;
    const pwd = password.trim();
    if (pwd.length < 6) {
      setError('Das Passwort muss mindestens 6 Zeichen haben.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await apiClient.post(`/tenants/${tenantId}/users`, {
        email: email.trim(),
        password: pwd,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        position: position.trim() || undefined,
        roleIds,
      });
      navigate(`/mitarbeiter?tenantId=${tenantId}`, { replace: true });
    } catch (err: any) {
      const msg = err.response?.data?.message;
      setError(msg || (err.response?.status === 403 ? 'Nur Oberadministratoren dürfen Mitarbeiter anlegen.' : 'Mitarbeiter konnte nicht angelegt werden.'));
    } finally {
      setLoading(false);
    }
  };

  if (!user?.isSuperAdmin && !user?.isTenantAdmin) {
    return (
      <div className="module-page">
        <div className="alert-error">Nur Administratoren können neue Mitarbeiter anlegen.</div>
        <Link to={tenantId ? `/mitarbeiter?tenantId=${tenantId}` : '/mitarbeiter'} className="link-action">← Zurück zur Liste</Link>
      </div>
    );
  }
  if (!tenantId) {
    return (
      <div className="module-page">
        <div className="alert-error">Bitte wählen Sie zuerst einen Mandanten aus der Mitarbeiter-Liste.</div>
        <Link to="/mitarbeiter" className="link-action">← Zurück zur Liste</Link>
      </div>
    );
  }

  return (
    <div className="module-page">
      <div className="module-header">
        <h1 className="module-title">Mitarbeiter anlegen</h1>
        <p className="module-subtitle">Neuen Benutzer für die Firma anlegen und Rechte zuweisen.</p>
      </div>
      <form onSubmit={handleSubmit} className="form-card">
        {error && <div className="alert-error" role="alert">{error}</div>}
        <div className="form-field">
          <label className="form-label">E-Mail *</label>
          <input
            type="email"
            className="form-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@firma.de"
            required
          />
        </div>
        <div className="form-field">
          <label className="form-label">Passwort *</label>
          <input
            type="password"
            className="form-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mindestens 6 Zeichen"
            required
            minLength={6}
            title="Mindestens 6 Zeichen"
          />
        </div>
        <div className="form-field">
          <label className="form-label">Vorname *</label>
          <input
            type="text"
            className="form-input"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
          />
        </div>
        <div className="form-field">
          <label className="form-label">Nachname *</label>
          <input
            type="text"
            className="form-input"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
          />
        </div>
        <div className="form-field">
          <label className="form-label">Position</label>
          <input
            type="text"
            className="form-input"
            value={position}
            onChange={(e) => setPosition(e.target.value)}
            placeholder="z. B. Bauleiter"
          />
        </div>
        <div className="form-field">
          <label className="form-label">Rollen / Rechte</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem 1rem' }}>
            {roles.map((r) => (
              <label key={r.id} className="form-label-inline">
                <input
                  type="checkbox"
                  checked={roleIds.includes(r.id)}
                  onChange={() => toggleRole(r.id)}
                />
                <span>{r.label}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="form-actions">
          <button type="submit" className="btn-primary-inline" disabled={loading}>
            {loading ? 'Wird angelegt…' : 'Anlegen'}
          </button>
          <button
            type="button"
            className="btn-secondary-inline"
            onClick={() => navigate(`/mitarbeiter?tenantId=${tenantId}`)}
          >
            Abbrechen
          </button>
        </div>
      </form>
    </div>
  );
};

export default MitarbeiterFormPage;
