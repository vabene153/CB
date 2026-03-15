import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import { useAuth } from '../../hooks/useAuth';

interface Role {
  id: number;
  name: string;
  label: string;
}

interface UserDetail {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  status: string;
  position?: string | null;
  userRoles: { role: Role }[];
}

const MitarbeiterEditPage: React.FC = () => {
  const { user } = useAuth();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [roles, setRoles] = useState<Role[]>([]);
  const [userDetail, setUserDetail] = useState<UserDetail | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [position, setPosition] = useState('');
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');
  const [roleIds, setRoleIds] = useState<number[]>([]);
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    apiClient.get<Role[]>('/roles').then((res) => setRoles(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    const uid = id ? parseInt(id, 10) : NaN;
    if (Number.isNaN(uid)) {
      setLoadError('Ungültige ID.');
      return;
    }
    setLoadError(null);
    apiClient
      .get<UserDetail>(`/users/${uid}`)
      .then((res) => {
        const u = res.data;
        setUserDetail(u);
        setFirstName(u.firstName);
        setLastName(u.lastName);
        setPosition(u.position ?? '');
        setStatus(u.status as 'ACTIVE' | 'INACTIVE');
        setRoleIds(u.userRoles?.map((ur) => ur.role.id) ?? []);
      })
      .catch((err) => {
        const msg = err.response?.data?.message;
        const status = err.response?.status;
        setLoadError(
          msg ||
          (status === 403 ? 'Nur Oberadministratoren können Rechte bearbeiten.' : 'Mitarbeiter konnte nicht geladen werden.')
        );
      });
  }, [id]);

  const toggleRole = (roleId: number) => {
    setRoleIds((prev) => (prev.includes(roleId) ? prev.filter((r) => r !== roleId) : [...prev, roleId]));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userDetail) return;
    const pwd = newPassword.trim();
    if (pwd.length > 0 && pwd.length < 6) {
      setSubmitError('Das Passwort muss mindestens 6 Zeichen haben.');
      return;
    }
    setSubmitError(null);
    setLoading(true);
    try {
      await apiClient.patch(`/users/${userDetail.id}`, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        position: position.trim() || undefined,
        status,
        roleIds,
        ...(pwd.length >= 6 ? { password: pwd } : {}),
      });
      navigate('/mitarbeiter');
    } catch (err: any) {
      const msg = err.response?.data?.message;
      setSubmitError(
        msg ||
        (err.response?.status === 403 ? 'Nur Oberadministratoren können Rechte bearbeiten.' : 'Änderungen konnten nicht gespeichert werden.')
      );
    } finally {
      setLoading(false);
    }
  };

  if (loadError && !userDetail) {
    return (
      <div className="module-page">
        <div className="alert-error" role="alert">{loadError}</div>
        <Link to="/mitarbeiter" className="btn-secondary-inline" style={{ display: 'inline-block', marginTop: '0.5rem' }}>
          ← Zurück zur Liste
        </Link>
      </div>
    );
  }

  if (!userDetail) {
    return <div className="module-page"><p className="module-muted">Lade…</p></div>;
  }

  if (!user?.isSuperAdmin && !user?.isTenantAdmin) {
    return (
      <div className="module-page">
        <div className="alert-error">Nur Administratoren können Rechte bearbeiten.</div>
        <Link to="/mitarbeiter" className="link-action">← Zurück zur Liste</Link>
      </div>
    );
  }

  return (
    <div className="module-page">
      <div className="module-header">
        <h1 className="module-title">Rechte bearbeiten</h1>
        <p className="module-subtitle">{userDetail.firstName} {userDetail.lastName} ({userDetail.email})</p>
      </div>
      <form onSubmit={handleSubmit} className="form-card">
        {submitError && <div className="alert-error" role="alert">{submitError}</div>}
        <div className="form-field">
          <label className="form-label">Vorname *</label>
          <input type="text" className="form-input" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
        </div>
        <div className="form-field">
          <label className="form-label">Nachname *</label>
          <input type="text" className="form-input" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
        </div>
        <div className="form-field">
          <label className="form-label">Position</label>
          <input type="text" className="form-input" value={position} onChange={(e) => setPosition(e.target.value)} />
        </div>
        <div className="form-field">
          <label className="form-label">Status</label>
          <select className="form-input" value={status} onChange={(e) => setStatus(e.target.value as 'ACTIVE' | 'INACTIVE')}>
            <option value="ACTIVE">Aktiv</option>
            <option value="INACTIVE">Inaktiv</option>
          </select>
        </div>
        <div className="form-field">
          <label className="form-label">Neues Passwort</label>
          <input
            type="password"
            className="form-input"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Leer lassen, um das Passwort beizubehalten"
            minLength={6}
            title="Mindestens 6 Zeichen"
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
            {loading ? 'Speichern…' : 'Speichern'}
          </button>
          <button type="button" className="btn-secondary-inline" onClick={() => navigate(-1)}>
            Abbrechen
          </button>
        </div>
      </form>
    </div>
  );
};

export default MitarbeiterEditPage;
