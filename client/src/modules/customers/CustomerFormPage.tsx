import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import { useAuth } from '../../hooks/useAuth';
import type { Tenant } from '../tenants/TenantsListPage';
import type { CustomerContact } from './CustomersListPage';

const CUSTOMER_TYPES = ['Privat', 'Gewerblich', 'Öffentliche Hand', 'Sonstige'];

const emptyContact = (): CustomerContact => ({
  firstName: '',
  lastName: '',
  role: '',
  phone: '',
  mobile: '',
  email: '',
  isPrimary: false,
  order: 0,
});

const CustomerFormPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [tenantId, setTenantId] = useState<number>(() => user?.tenantId ?? 0);
  const [name, setName] = useState('');
  const [type, setType] = useState('Gewerblich');
  const [street, setStreet] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('Deutschland');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [contacts, setContacts] = useState<CustomerContact[]>([emptyContact()]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.isSuperAdmin) return;
    apiClient.get<Tenant[]>('/tenants').then((res) => setTenants(res.data)).catch(() => {});
  }, [user?.isSuperAdmin]);

  useEffect(() => {
    if (user?.tenantId && !user?.isSuperAdmin) setTenantId(user.tenantId);
  }, [user?.tenantId, user?.isSuperAdmin]);

  const updateContact = (index: number, field: keyof CustomerContact, value: string | boolean) => {
    setContacts((prev) =>
      prev.map((c, i) => (i === index ? { ...c, [field]: value } : { ...c, isPrimary: field === 'isPrimary' && value ? false : c.isPrimary }))
    );
  };
  const addContact = () => setContacts((prev) => [...prev, { ...emptyContact(), order: prev.length }]);
  const removeContact = (index: number) => setContacts((prev) => prev.filter((_, i) => i !== index));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const payload: Record<string, unknown> = {
      name: name.trim(),
      type: type.trim(),
      street: street.trim() || undefined,
      postalCode: postalCode.trim() || undefined,
      city: city.trim() || undefined,
      country: country.trim() || undefined,
      phone: phone.trim() || undefined,
      email: email.trim() || undefined,
      notes: notes.trim() || undefined,
      contacts: contacts.map((c, i) => ({
        firstName: c.firstName.trim(),
        lastName: c.lastName.trim(),
        role: c.role?.trim() || undefined,
        phone: c.phone?.trim() || undefined,
        mobile: c.mobile?.trim() || undefined,
        email: c.email?.trim() || undefined,
        isPrimary: c.isPrimary,
        order: i,
      })),
    };
    if (user?.isSuperAdmin && tenantId) payload.tenantId = tenantId;
    try {
      await apiClient.post('/customers', payload);
      navigate('/kunden', { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Fehler beim Anlegen.');
    } finally {
      setLoading(false);
    }
  };

  const effectiveTenantId = user?.isSuperAdmin ? tenantId : user?.tenantId;

  return (
    <div className="module-page">
      <div className="module-header">
        <h1 className="module-title">Kunde anlegen</h1>
        <p className="module-subtitle">Neuen Kunden für einen Mandanten anlegen.</p>
      </div>
      <form onSubmit={handleSubmit} className="form-card wide">
        {error && <div className="alert-error">{error}</div>}
        {user?.isSuperAdmin && tenants.length > 0 && (
          <div className="form-field">
            <label className="form-label">Mandant *</label>
            <select
              className="form-input"
              value={tenantId || ''}
              onChange={(e) => setTenantId(Number(e.target.value) || 0)}
              required
            >
              <option value="">Mandant wählen…</option>
              {tenants.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        )}
        <div className="form-field">
          <label className="form-label">Name / Firma *</label>
          <input
            type="text"
            className="form-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="z. B. Wohnbau Nord AG"
            required
          />
        </div>
        <div className="form-field">
          <label className="form-label">Kundentyp *</label>
          <select className="form-input" value={type} onChange={(e) => setType(e.target.value)}>
            {CUSTOMER_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div className="form-field">
          <label className="form-label">Straße / Nr.</label>
          <input type="text" className="form-input" value={street} onChange={(e) => setStreet(e.target.value)} placeholder="z. B. Hauptstraße 12" />
        </div>
        <div className="form-field">
          <label className="form-label">PLZ / Ort</label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input type="text" className="form-input" style={{ maxWidth: '120px' }} value={postalCode} onChange={(e) => setPostalCode(e.target.value)} placeholder="PLZ" />
            <input type="text" className="form-input" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Ort" />
          </div>
        </div>
        <div className="form-field">
          <label className="form-label">Land</label>
          <input type="text" className="form-input" value={country} onChange={(e) => setCountry(e.target.value)} />
        </div>
        <div className="form-field">
          <label className="form-label">Telefon</label>
          <input type="text" className="form-input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+49 …" />
        </div>
        <div className="form-field">
          <label className="form-label">E-Mail</label>
          <input type="email" className="form-input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="info@firma.de" />
        </div>

        <hr style={{ borderColor: 'rgba(30,64,175,0.5)' }} />
        <div className="form-field">
          <label className="form-label">Kundenkontakte / Ansprechpartner</label>
          {contacts.map((c, i) => (
            <div key={i} className="contact-block">
              <div className="contact-block-header">
                <span className="contact-block-title">Kontakt {i + 1}</span>
                {contacts.length > 1 && (
                  <button type="button" className="btn-remove" onClick={() => removeContact(i)}>
                    Entfernen
                  </button>
                )}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                <input type="text" className="form-input" style={{ width: '140px' }} placeholder="Vorname" value={c.firstName} onChange={(e) => updateContact(i, 'firstName', e.target.value)} />
                <input type="text" className="form-input" style={{ width: '140px' }} placeholder="Nachname" value={c.lastName} onChange={(e) => updateContact(i, 'lastName', e.target.value)} />
                <input type="text" className="form-input" style={{ width: '140px' }} placeholder="Rolle" value={c.role ?? ''} onChange={(e) => updateContact(i, 'role', e.target.value)} />
                <input type="text" className="form-input" style={{ width: '140px' }} placeholder="Telefon" value={c.phone ?? ''} onChange={(e) => updateContact(i, 'phone', e.target.value)} />
                <input type="text" className="form-input" style={{ width: '140px' }} placeholder="Mobil" value={c.mobile ?? ''} onChange={(e) => updateContact(i, 'mobile', e.target.value)} />
                <input type="email" className="form-input" style={{ minWidth: '180px' }} placeholder="E-Mail" value={c.email ?? ''} onChange={(e) => updateContact(i, 'email', e.target.value)} />
                <label className="form-label-inline" style={{ marginLeft: 'auto' }}>
                  <input type="checkbox" checked={c.isPrimary} onChange={(e) => updateContact(i, 'isPrimary', e.target.checked)} />
                  <span>Hauptansprechpartner</span>
                </label>
              </div>
            </div>
          ))}
          <button type="button" className="btn-add-contact" onClick={addContact}>
            + Weiterer Kontakt
          </button>
        </div>

        <hr style={{ borderColor: 'rgba(30,64,175,0.5)' }} />
        <div className="form-field">
          <label className="form-label">Notizen</label>
          <textarea className="form-input" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Interne Notizen…" />
        </div>
        <div className="form-actions">
          <button type="submit" className="btn-primary-inline" disabled={loading || !effectiveTenantId}>
            {loading ? 'Wird angelegt…' : 'Anlegen'}
          </button>
          <button type="button" className="btn-secondary-inline" onClick={() => navigate('/kunden')}>
            Abbrechen
          </button>
        </div>
      </form>
    </div>
  );
};

export default CustomerFormPage;
