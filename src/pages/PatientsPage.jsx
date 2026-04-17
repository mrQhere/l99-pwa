import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { getPatients, createPatient, deletePatient, searchPatients } from '../services/patientService';
import { showSuccess, showError } from '../services/toastService';
import { exportToCSV, PATIENT_COLUMNS } from '../services/csvExport';
import { Users, Plus, Search, Download, Trash2, X } from 'lucide-react';

export default function PatientsPage() {
  const { operator } = useAuth();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({
    name: '', age: '', gender: 'Male', contact: '', address: '', medical_history: '', assigned_doctor: ''
  });

  useEffect(() => { loadPatients(); }, []);

  async function loadPatients() {
    setLoading(true);
    try {
      const data = await getPatients();
      setPatients(data);
    } catch (e) { showError('Failed to load patients'); }
    setLoading(false);
  }

  async function handleSearch(q) {
    setSearch(q);
    if (!q.trim()) return loadPatients();
    try {
      const results = await searchPatients(q);
      setPatients(results);
    } catch { /* ignore */ }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const { assigned_doctor, ...patientData } = form;
      await createPatient({
        ...patientData,
        age: form.age ? parseInt(form.age) : null,
        operator_id: operator.id,
        medical_history: assigned_doctor ? `Assigned Doctor: Dr. ${assigned_doctor}\n${form.medical_history}` : form.medical_history,
      });
      showSuccess('Patient registered successfully');
      setShowForm(false);
      setForm({ name: '', age: '', gender: 'Male', contact: '', address: '', medical_history: '', assigned_doctor: '' });
      loadPatients();
    } catch (err) {
      showError('Failed to register patient: ' + err.message);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this patient and all their scan records?')) return;
    try {
      await deletePatient(id);
      showSuccess('Patient deleted');
      loadPatients();
    } catch (err) { showError('Failed to delete: ' + err.message); }
  }

  return (
    <div className="fade-in">
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title">Patients</h1>
          <p className="page-subtitle">{patients.length} registered patients</p>
        </div>
        <div className="flex gap-8">
          <button className="btn btn-secondary btn-sm" onClick={() => exportToCSV(patients, 'l99_patients.csv', PATIENT_COLUMNS)}>
            <Download size={16} /> Export CSV
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => setShowForm(!showForm)}>
            {showForm ? <><X size={16} /> Cancel</> : <><Plus size={16} /> Add Patient</>}
          </button>
        </div>
      </div>

      {/* Registration form */}
      {showForm && (
        <div className="glass-card mb-24 slide-up">
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, color: 'var(--cyan)' }}>
            REGISTER NEW PATIENT
          </h3>
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="input-group">
                <label className="input-label">Full Name *</label>
                <input className="input-field" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Patient full name" />
              </div>
              <div className="input-group">
                <label className="input-label">Age</label>
                <input className="input-field" type="number" min="0" max="150" value={form.age} onChange={e => setForm({...form, age: e.target.value})} placeholder="Age in years" />
              </div>
              <div className="input-group">
                <label className="input-label">Gender</label>
                <select className="input-field" value={form.gender} onChange={e => setForm({...form, gender: e.target.value})}>
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </select>
              </div>
              <div className="input-group">
                <label className="input-label">Contact Number</label>
                <input className="input-field" value={form.contact} onChange={e => setForm({...form, contact: e.target.value})} placeholder="+91 ..." />
              </div>
              <div className="input-group full-width">
                <label className="input-label">Assigned Doctor</label>
                <input className="input-field" value={form.assigned_doctor} onChange={e => setForm({...form, assigned_doctor: e.target.value})} placeholder="Dr. Name (Optional)" />
              </div>
              <div className="input-group full-width">
                <label className="input-label">Address</label>
                <input className="input-field" value={form.address} onChange={e => setForm({...form, address: e.target.value})} placeholder="Full address" />
              </div>
              <div className="input-group full-width">
                <label className="input-label">Medical History</label>
                <textarea className="input-field" value={form.medical_history} onChange={e => setForm({...form, medical_history: e.target.value})} placeholder="Any relevant medical history, diabetes duration, medications..." rows={3} />
              </div>
            </div>
            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary">Register Patient</button>
            </div>
          </form>
        </div>
      )}

      {/* Search */}
      <div className="search-box mb-24">
        <Search size={16} />
        <input className="input-field" placeholder="Search patients by name..." value={search} onChange={e => handleSearch(e.target.value)} />
      </div>

      {/* Patient list */}
      <div className="glass-card no-hover">
        {loading ? (
          <div className="dna-spinner"><div className="dna-dot"/><div className="dna-dot"/><div className="dna-dot"/><div className="dna-dot"/><div className="dna-dot"/></div>
        ) : patients.length === 0 ? (
          <div className="empty-state">
            <Users size={48} />
            <h3 className="empty-state-title">No patients registered</h3>
            <p className="empty-state-text">Click "Add Patient" to register your first patient.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Age</th>
                  <th>Gender</th>
                  <th>Contact</th>
                  <th>Doctor</th>
                  <th>Registered</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {patients.map(p => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 600 }}>{p.name}</td>
                    <td>{p.age || '—'}</td>
                    <td>{p.gender || '—'}</td>
                    <td className="font-mono text-sm">{p.contact || '—'}</td>
                    <td className="text-sm" style={{ color: 'var(--cyan)' }}>{p.medical_history?.includes('Assigned Doctor: ') ? p.medical_history.split('\n')[0].replace('Assigned Doctor: ', '') : '—'}</td>
                    <td className="text-sm text-dim">{new Date(p.created_at).toLocaleDateString()}</td>
                    <td>
                      <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(p.id)} title="Delete">
                        <Trash2 size={14} className="text-red" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
