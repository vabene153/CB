import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../services/apiClient';

const TenantFormPage: React.FC = () => {
  const navigate = useNavigate();
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
  const [error, setError] = useState<string | null>(null);

  const deriveSlug = (value: string) =>
    value
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-äöüß]/g, (c) => {
        const map: Record<string, string> = { ä: 'ae', ö: 'oe', ü: 'ue', ß: 'ss' };
        return map[c] ?? '';
      });

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setName(v);
    if (!slug || slug === deriveSlug(name)) setSlug(deriveSlug(v));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await apiClient.post('/tenants', {
        name: name.trim(),
        slug: slug.trim() || undefined,
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
      setError(err.response?.data?.message || 'Fehler beim Anlegen.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="module-page">
      <div className="module-header">
        <h1 className="module-title">Mandant anlegen</h1>
        <p className="module-subtitle">Neue Baufirma / Mandant hinzufügen.</p>
      </div>
      <form onSubmit={handleSubmit} className="form-card">
        {error && <div className="alert-error">{error}</div>}
        <div className="form-field">
          <label className="form-label">Name *</label>
          <input
            type="text"
            className="form-input"
            value={name}
            onChange={handleNameChange}
            placeholder="z. B. Musterbau GmbH"
            required
          />
        </div>
        <div className="form-field">
          <label className="form-label">Slug (URL-Kürzel)</label>
          <input
            type="text"
            className="form-input"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="z. B. musterbau"
          />
          <span className="form-hint">Leer lassen = wird aus dem Namen erzeugt.</span>
        </div>
        <div className="form-field">
          <label className="form-label">Straße / Nr.</label>
          <input
            type="text"
            className="form-input"
            value={street}
            onChange={(e) => setStreet(e.target.value)}
            placeholder="z. B. Bauweg 10"
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
              placeholder="z. B. 10115"
            />
            <input
              type="text"
              className="form-input"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Berlin"
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
            placeholder="+49 …"
          />
        </div>
        <div className="form-field">
          <label className="form-label">E-Mail</label>
          <input
            type="email"
            className="form-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="info@firma.de"
          />
        </div>
        <div className="form-field">
          <label className="form-label">Ansprechpartner</label>
          <input
            type="text"
            className="form-input"
            value={contactPerson}
            onChange={(e) => setContactPerson(e.target.value)}
            placeholder="z. B. Anna Baumann"
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
            placeholder="optional, falls abweichend"
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
            placeholder="Interne Hinweise zum Mandanten…"
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
            {loading ? 'Wird angelegt…' : 'Anlegen'}
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

export default TenantFormPage;
