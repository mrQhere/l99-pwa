import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { getPeople, createPerson, deletePerson } from '../services/peopleService';
import { showSuccess, showError } from '../services/toastService';
import { UserCog, Plus, Trash2, X, Phone, Mail, Building } from 'lucide-react';

export default function PeoplePage() {
  const { operator } = useAuth();
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: '', role: 'Doctor', specialization: '', phone: '', email: '', hospital: '', notes: ''
  });

  useEffect(() => { loadPeople(); }, []);

  async function loadPeople() {
    setLoading(true);
    try { setPeople(await getPeople()); } catch { showError('Failed to load contacts'); }
    setLoading(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      await createPerson({ ...form, operator_id: operator.id });
      showSuccess('Contact added successfully');
      setShowForm(false);
      setForm({ name: '', role: 'Doctor', specialization: '', phone: '', email: '', hospital: '', notes: '' });
      loadPeople();
    } catch (err) { showError('Failed to add contact: ' + err.message); }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this contact?')) return;
    try {
      await deletePerson(id);
      showSuccess('Contact deleted');
      loadPeople();
    } catch (err) { showError('Failed: ' + err.message); }
  }

  const roleColors = {
    Doctor: 'cyan', Nurse: 'green', 'Health Worker': 'yellow',
    Referral: 'magenta', Specialist: 'cyan', Other: 'text-dim'
  };

  return (
    <div className="fade-in">
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title">People</h1>
          <p className="page-subtitle">Doctors, referral contacts, and health workers</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowForm(!showForm)}>
          {showForm ? <><X size={16}/> Cancel</> : <><Plus size={16}/> Add Contact</>}
        </button>
      </div>

      {showForm && (
        <div className="glass-card mb-24 slide-up">
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, color: 'var(--cyan)' }}>NEW CONTACT</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="input-group">
                <label className="input-label">Full Name *</label>
                <input className="input-field" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
              </div>
              <div className="input-group">
                <label className="input-label">Role</label>
                <select className="input-field" value={form.role} onChange={e => setForm({...form, role: e.target.value})}>
                  <option>Doctor</option><option>Nurse</option><option>Health Worker</option>
                  <option>Referral</option><option>Specialist</option><option>Other</option>
                </select>
              </div>
              <div className="input-group">
                <label className="input-label">Specialization</label>
                <input className="input-field" value={form.specialization} onChange={e => setForm({...form, specialization: e.target.value})} placeholder="e.g. Ophthalmologist" />
              </div>
              <div className="input-group">
                <label className="input-label">Phone</label>
                <input className="input-field" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="+91 ..." />
              </div>
              <div className="input-group">
                <label className="input-label">Email</label>
                <input className="input-field" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
              </div>
              <div className="input-group">
                <label className="input-label">Hospital / Institution</label>
                <input className="input-field" value={form.hospital} onChange={e => setForm({...form, hospital: e.target.value})} />
              </div>
              <div className="input-group full-width">
                <label className="input-label">Notes</label>
                <textarea className="input-field" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} rows={2} />
              </div>
            </div>
            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary">Add Contact</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="dna-spinner"><div className="dna-dot"/><div className="dna-dot"/><div className="dna-dot"/><div className="dna-dot"/><div className="dna-dot"/></div>
      ) : people.length === 0 ? (
        <div className="glass-card">
          <div className="empty-state">
            <UserCog size={48} />
            <h3 className="empty-state-title">No contacts yet</h3>
            <p className="empty-state-text">Add doctors, referral specialists, and health workers for quick access.</p>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {people.map(p => (
            <div key={p.id} className="glass-card">
              <div className="flex items-center justify-between mb-16">
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 700 }}>{p.name}</h3>
                  <span className={`severity-badge severity-${roleColors[p.role] === 'cyan' ? 1 : roleColors[p.role] === 'green' ? 0 : 2}`} style={{ marginTop: 4 }}>
                    {p.role}
                  </span>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(p.id)}>
                  <Trash2 size={14} className="text-red" />
                </button>
              </div>
              {p.specialization && <p className="text-sm text-cyan" style={{ marginBottom: 8 }}>{p.specialization}</p>}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {p.phone && <div className="flex items-center gap-8 text-sm"><Phone size={14} className="text-dim" /><span>{p.phone}</span></div>}
                {p.email && <div className="flex items-center gap-8 text-sm"><Mail size={14} className="text-dim" /><span>{p.email}</span></div>}
                {p.hospital && <div className="flex items-center gap-8 text-sm"><Building size={14} className="text-dim" /><span>{p.hospital}</span></div>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
