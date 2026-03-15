import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import type { Tenant } from './TenantsListPage';

const TenantEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [street, setStreet] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('Deutschland');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [billingName, setBillingName] = useState('');
  const [billingStreet, setBillingStreet] = useState('');
  const [billingPostalCode, setBillingPostalCode] = useState('');
  const [billingCity, setBillingCity] = useState('');
  const [billingCountry, setBillingCountry] = useState('Deutschland');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    const tid = id ? parseInt(id, 10) : NaN;
    if (Number.isNaN(tid)) {
      setLoadError('Ungültige ID.');
      return;
    }
    let cancelled = false;
    apiClient
      .get<Tenant>(`/tenants/${tid}`)
      .then((res) => {
        if (!cancelled) {
          setTenant(res.data);
          setName(res.data.name);
          setSlug(res.data.slug);
          setIsActive(res.data.isActive);
          setStreet(res.data.street ?? '');
          setPostalCode(res.data.postalCode ?? '');
          setCity(res.data.city ?? '');
          setCountry(res.data.country ?? 'Deutschland');
          setPhone(res.data.phone ?? '');
          setEmail(res.data.email ?? '');
          setContactPerson(res.data.contactPerson ?? '');
          setBillingName(res.data.billingName ?? '');
          setBillingStreet(res.data.billingStreet ?? '');
          setBillingPostalCode(res.data.billingPostalCode ?? '');
          setBillingCity(res.data.billingCity ?? '');
          setBillingCountry(res.data.billingCountry ?? 'Deutschland');
          setNotes(res.data.notes ?? '');
        }
      })
      .catch((err) => {
        if (!cancelled) setLoadError(err.response?.data?.message || 'Mandant nicht gefunden.');
      });
    return () => { cancelled = true; };
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenant) return;
    setSubmitError(null);
    setLoading(true);
    try {
      await apiClient.patch(`/tenants/${tenant.id}`, {
        name: name.trim(),
        slug: slug.trim(),
        isActive,
        street: street.trim() || undefined,
        postalCode: postalCode.trim() || undefined,
        city: city.trim() || undefined,
        country: country.trim() || undefined,
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        contactPerson: contactPerson.trim() || undefined,
        billingName: billingName.trim() || undefined,
        billingStreet: billingStreet.trim() || undefined,
        billingPostalCode: billingPostalCode.trim() || undefined,
        billingCity: billingCity.trim() || undefined,
        billingCountry: billingCountry.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      navigate('/mandanten', { replace: true });
    } catch (err: any) {
      setSubmitError(err.response?.data?.message || 'Fehler beim Speichern.');
    } finally {
      setLoading(false);
    }
  };

  if (loadError) {
    return (
      <div className="module-page">
        <div className="alert-error">{loadError}</div>
        <button type="button" className="btn-secondary-inline" onClick={() => navigate('/mandanten')}>
          Zurück zur Liste
        </button>
      </div>
    );
  }

  if (!tenant) {
    return <div className="module-page"><p className="module-muted">Lade…</p></div>;
  }

  return (
    <div className="module-page">
      <div className="module-header">
        <h1 className="module-title">Mandant bearbeiten</h1>
        <p className="module-subtitle">{tenant.name}</p>
      </div>
      <form onSubmit={handleSubmit} className="form-card">
        {submitError && <div className="alert-error">{submitError}</div>}
        <div className="form-field">
          <label className="form-label">Name *</label>
          <input
            type="text"
            className="form-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="form-field">
          <label className="form-label">Slug</label>
          <input
            type="text"
            className="form-input"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
          />
        </div>
        <div className="form-field">
          <label className="form-label">Straße / Nr.</label>
          <input
            type="text"
            className="form-input"
            value={street}
            onChange={(e) => setStreet(e.target.value)}
          />
        </div>
        <div className="form-field">
          <label className="form-label">PLZ / Ort</label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="text"
              className="form-input"
              style={{ maxWidth: '120px' }}
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
            />
            <input
              type="text"
              className="form-input"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
          </div>
        </div>
        <div className="form-field">
          <label className="form-label">Land</label>
          <input
            type="text"
            className="form-input"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
          />
        </div>
        <div className="form-field">
          <label className="form-label">Telefon</label>
          <input
            type="text"
            className="form-input"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>
        <div className="form-field">
          <label className="form-label">E-Mail</label>
          <input
            type="email"
            className="form-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="form-field">
          <label className="form-label">Ansprechpartner</label>
          <input
            type="text"
            className="form-input"
            value={contactPerson}
            onChange={(e) => setContactPerson(e.target.value)}
          />
        </div>
        <hr style={{ borderColor: 'rgba(30,64,175,0.5)' }} />
        <div className="form-field">
          <label className="form-label">Rechnungsname</label>
          <input
            type="text"
            className="form-input"
            value={billingName}
            onChange={(e) => setBillingName(e.target.value)}
          />
        </div>
        <div className="form-field">
          <label className="form-label">Rechnungsstraße / Nr.</label>
          <input
            type="text"
            className="form-input"
            value={billingStreet}
            onChange={(e) => setBillingStreet(e.target.value)}
          />
        </div>
        <div className="form-field">
          <label className="form-label">Rechnungs-PLZ / Ort</label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="text"
              className="form-input"
              style={{ maxWidth: '120px' }}
              value={billingPostalCode}
              onChange={(e) => setBillingPostalCode(e.target.value)}
            />
            <input
              type="text"
              className="form-input"
              value={billingCity}
              onChange={(e) => setBillingCity(e.target.value)}
            />
          </div>
        </div>
        <div className="form-field">
          <label className="form-label">Rechnungsland</label>
          <input
            type="text"
            className="form-input"
            value={billingCountry}
            onChange={(e) => setBillingCountry(e.target.value)}
          />
        </div>
        <div className="form-field">
          <label className="form-label">Notizen</label>
          <textarea
            className="form-input"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
        <div className="form-field form-field-check">
          <label className="form-label-inline">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />
            <span>Mandant ist aktiv</span>
          </label>
        </div>
        <div className="form-actions">
          <button type="submit" className="btn-primary-inline" disabled={loading}>
            {loading ? 'Speichern…' : 'Speichern'}
          </button>
          <button
            type="button"
            className="btn-secondary-inline"
            onClick={() => navigate('/mandanten')}
          >
            Abbrechen
          </button>
        </div>
      </form>
    </div>
  );
};

export default TenantEditPage;
