import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import { useAuth } from '../../hooks/useAuth';

const LoginPage: React.FC = () => {
  const { login, user } = useAuth();
  const navigate = useNavigate();

  if (user) {
    navigate('/', { replace: true });
    return null;
  }
  const [email, setEmail] = useState('admin@musterbau.de');
  const [password, setPassword] = useState('Passwort123!');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await apiClient.post('/auth/login', { email, password });
      login({ accessToken: res.data.accessToken, user: res.data.user });
      navigate('/', { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login fehlgeschlagen');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h1 className="login-title">Baustellen‑CRM Login</h1>
        <p className="login-subtitle">
          Melden Sie sich mit Ihren Zugangsdaten an, um Ihre Baustellen und Projekte zu verwalten.
        </p>
        {error && (
          <div className="alert-error">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-field">
            <label className="form-label">
              E-Mail-Adresse
            </label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="z.B. admin@musterbau.de"
              required
            />
          </div>
          <div className="form-field">
            <label className="form-label">
              Passwort
            </label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Ihr Passwort"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
          >
            {loading ? 'Anmeldung läuft...' : 'Anmelden'}
          </button>
        </form>
        <div className="login-hint">
          Demo-Login: admin@musterbau.de / Passwort123!
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

