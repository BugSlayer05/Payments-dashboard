import React, { useState } from 'react';
import { useApi } from '../hooks/useApi';
import { usersApi } from '../services/api';
import { UserPlus } from 'lucide-react';

export default function UsersPage() {
  const { data: users, loading, error, refetch } = useApi(() => usersApi.list());
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const [formError, setFormError] = useState('');

  const handleSubmit = async () => {
    if (!form.name || !form.email || !form.password) {
      setFormError('All fields are required');
      return;
    }
    setSubmitting(true);
    setFormError('');
    setSuccess('');
    try {
      const user = await usersApi.register(form);
      setSuccess(`Added ${user.name}`);
      setForm({ name: '', email: '', password: '' });
      refetch();
    } catch (e: any) {
      setFormError(e?.response?.data?.message || 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Users</h1>
        <p className="page-subtitle">Register and manage dashboard users</p>
      </div>

      <div className="two-col">
        {/* Register form */}
        <div className="card">
          <div className="card-title">Register New User</div>
          {formError && <div className="alert alert-error">{formError}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          <div className="form-group">
            <label className="form-label">Name</label>
            <input className="form-input" placeholder="Jane Doe" value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" type="email" placeholder="jane@email.com" value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="form-input" type="password" placeholder="Min. 8 characters" value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
          </div>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>
            <UserPlus size={14} />
            {submitting ? 'Registering…' : 'Register User'}
          </button>
        </div>

        {/* Users list */}
        <div className="card">
          <div className="card-title">{users ? `${users.length} Users` : 'Users'}</div>
          {error && <div className="alert alert-error">{error}</div>}
          {loading ? (
            <div className="loading"><div className="spinner" /></div>
          ) : !users?.length ? (
            <div className="empty">No users registered yet</div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id}>
                      <td>{u.name}</td>
                      <td className="mono" style={{ color: 'var(--text-muted)' }}>{u.email}</td>
                      <td className="mono" style={{ color: 'var(--text-muted)', fontSize: 11 }}>
                        {new Date(u.createdAt).toLocaleDateString('es-MX')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
