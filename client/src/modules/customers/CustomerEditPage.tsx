import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import type { Customer, CustomerContact } from './CustomersListPage';

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

const CustomerEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<Customer | null>(null);
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
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    const cid = id ? parseInt(id, 10) : NaN;
    if (Number.isNaN(cid)) {
      setLoadError('Ungültige ID.');
      return;
    }
    let cancelled = false;
    apiClient
      .get<Customer>(`/customers/${cid}`)
      .then((res) => {
        if (!cancelled) {
          const c = res.data;
          setCustomer(c);
          setName(c.name);
          setType(c.type || 'Gewerblich');
          setStreet(c.street ?? '');
          setPostalCode(c.postalCode ?? '');
          setCity(c.city ?? '');
          setCountry(c.country ?? 'Deutschland');
          setPhone(c.phone ?? '');
          setEmail(c.email ?? '');
          setNotes(c.notes ?? '');
          setContacts(
            c.contacts && c.contacts.length > 0
              ? c.contacts.map((x) => ({
                  ...x,
                  firstName: x.firstName ?? '',
                  lastName: x.lastName ?? '',
                  role: x.role ?? '',
                  phone: x.phone ?? '',
                  mobile: x.mobile ?? '',
                  email: x.email ?? '',
                  isPrimary: x.isPrimary ?? false,
                  order: x.order ?? 0,
                }))
              : [emptyContact()]
          );
        }
      })
      .catch((err) => {
        if (!cancelled) setLoadError(err.response?.data?.message || 'Kunde nicht gefunden.');
      });
    return () => { cancelled = true; };
  }, [id]);

  const updateContact = (index: number, field: keyof CustomerContact, value: string | boolean) => {
    setContacts((prev) =>
      prev.map((c, i) => (i === index ? { ...c, [field]: value } : { ...c, isPrimary: field === 'isPrimary' && value ? false : c.isPrimary }))
    );
  };
  const addContact = () => setContacts((prev) => [...prev, { ...emptyContact(), order: prev.length }]);
  const removeContact = (index: number) => setContacts((prev) => prev.filter((_, i) => i !== index));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer) return;
    setSubmitError(null);
    setLoading(true);
    try {
      await apiClient.patch(`/customers/${customer.id}`, {
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
      });
      navigate('/kunden', { replace: true });
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
        <button type="button" className="btn-secondary-inline" onClick={() => navigate('/kunden')}>
          Zurück zur Liste
        </button>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="module-page">
        <p className="module-muted">Lade…</p>
      </div>
    );
  }

  return (
    <div className="module-page">
      <div className="module-header">
        <h1 className="module-title">Kunde bearbeiten</h1>
        <p className="module-subtitle">{customer.name}</p>
      </div>
      <form onSubmit={handleSubmit} className="form-card wide">
        {submitError && <div className="alert-error">{submitError}</div>}
        <div className="form-field">
          <label className="form-label">Name / Firma *</label>
          <input type="text" className="form-input" value={name} onChange={(e) => setName(e.target.value)} required />
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
          <input type="text" className="form-input" value={street} onChange={(e) => setStreet(e.target.value)} />
        </div>
        <div className="form-field">
          <label className="form-label">PLZ / Ort</label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input type="text" className="form-input" style={{ maxWidth: '120px' }} value={postalCode} onChange={(e) => setPostalCode(e.target.value)} />
            <input type="text" className="form-input" value={city} onChange={(e) => setCity(e.target.value)} />
          </div>
        </div>
        <div className="form-field">
          <label className="form-label">Land</label>
          <input type="text" className="form-input" value={country} onChange={(e) => setCountry(e.target.value)} />
        </div>
        <div className="form-field">
          <label className="form-label">Telefon</label>
          <input type="text" className="form-input" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <div className="form-field">
          <label className="form-label">E-Mail</label>
          <input type="email" className="form-input" value={email} onChange={(e) => setEmail(e.target.value)} />
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
          <textarea className="form-input" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
        <div className="form-actions">
          <button type="submit" className="btn-primary-inline" disabled={loading}>
            {loading ? 'Speichern…' : 'Speichern'}
          </button>
          <button type="button" className="btn-secondary-inline" onClick={() => navigate('/kunden')}>
            Abbrechen
          </button>
        </div>
      </form>
    </div>
  );
};

export default CustomerEditPage;
