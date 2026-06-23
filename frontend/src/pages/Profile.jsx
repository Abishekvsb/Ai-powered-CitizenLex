import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const AVATAR_COLORS = [
  ['#2563eb', '#06b6d4'],
  ['#8b5cf6', '#ec4899'],
  ['#10b981', '#06b6d4'],
  ['#f59e0b', '#ef4444'],
];

export default function Profile() {
  const { user, updateUserProfileState } = useAuth();
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

  const colorIndex = (user?.id || 0) % AVATAR_COLORS.length;
  const [gradFrom, gradTo] = AVATAR_COLORS[colorIndex];

  const initials = `${(user?.firstName || '?')[0]}${(user?.lastName || '')[0] || ''}`.toUpperCase();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess('');
    setError('');
    setLoading(true);

    try {
      const params = new URLSearchParams();
      params.append('firstName', firstName);
      params.append('lastName', lastName);
      if (password.trim()) params.append('password', password);

      const res = await axios.put('/api/auth/profile', params, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });

      updateUserProfileState(res.data);
      setSuccess('Profile updated successfully!');
      setPassword('');
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      console.error(err);
      if (err.response?.data) {
        setError(err.response.data.error || 'Failed to update profile.');
      } else {
        setError('Network error. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Edit Profile', icon: 'bi-person-gear' },
    { id: 'security', label: 'Security', icon: 'bi-shield-lock' },
    { id: 'info', label: 'Account Info', icon: 'bi-info-circle' },
  ];

  return (
    <div className="container py-5 text-start">

      {/* Header */}
      <div className="row mb-5 fade-in-el">
        <div className="col-12">
          <p className="text-secondary mb-1 small fw-semibold text-uppercase">Account Settings</p>
          <h1 className="fw-bold mb-1" style={{ fontSize: '2rem' }}>Your Profile</h1>
          <p className="text-secondary">Manage your account details and preferences.</p>
        </div>
      </div>

      <div className="row g-5">
        {/* Left: Avatar Card */}
        <div className="col-lg-4 fade-in-el">
          <div className="glass-panel p-5 text-center mb-4">
            {/* Gradient Avatar */}
            <div
              className="mx-auto mb-4 d-flex align-items-center justify-content-center rounded-circle fw-bold"
              style={{
                width: 100,
                height: 100,
                background: `linear-gradient(135deg, ${gradFrom} 0%, ${gradTo} 100%)`,
                fontSize: '2.2rem',
                color: 'white',
                boxShadow: `0 8px 30px ${gradFrom}55`,
              }}
            >
              {initials}
            </div>

            <h4 className="fw-bold mb-1">{user?.firstName} {user?.lastName}</h4>
            <div className="mb-3">
              <span
                className="badge rounded-pill fw-semibold"
                style={{
                  background: user?.role === 'ROLE_ADMIN' ? 'rgba(239,68,68,0.1)' : 'rgba(37,99,235,0.1)',
                  color: user?.role === 'ROLE_ADMIN' ? '#ef4444' : 'var(--primary)',
                  padding: '5px 14px',
                  fontSize: '0.8rem',
                }}
              >
                {user?.role === 'ROLE_ADMIN' ? '🛡️ Admin' : '👤 User'}
              </span>
            </div>

            <hr style={{ borderColor: 'var(--border)' }} />

            <div className="text-start mt-3">
              <div className="mb-3">
                <div className="text-secondary small fw-semibold mb-1">Email Address</div>
                <div className="d-flex align-items-center gap-2">
                  <i className="bi bi-envelope text-primary"></i>
                  <span style={{ fontSize: '0.9rem', wordBreak: 'break-all' }}>{user?.email}</span>
                </div>
              </div>
              <div className="mb-3">
                <div className="text-secondary small fw-semibold mb-1">Member Since</div>
                <div className="d-flex align-items-center gap-2">
                  <i className="bi bi-calendar-check text-primary"></i>
                  <span style={{ fontSize: '0.9rem' }}>
                    {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}
                  </span>
                </div>
              </div>
              <div>
                <div className="text-secondary small fw-semibold mb-1">Account Status</div>
                <div className="d-flex align-items-center gap-2">
                  <i className="bi bi-patch-check-fill text-success"></i>
                  <span className="text-success fw-semibold" style={{ fontSize: '0.9rem' }}>Verified & Active</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Tabbed Settings */}
        <div className="col-lg-8 fade-in-el-delay-1">

          {/* Tabs */}
          <div className="d-flex gap-2 mb-4 flex-wrap">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="btn d-flex align-items-center gap-2"
                style={{
                  fontSize: '0.85rem',
                  padding: '8px 18px',
                  borderRadius: 10,
                  background: activeTab === tab.id ? 'var(--primary)' : 'var(--surface)',
                  color: activeTab === tab.id ? 'white' : 'var(--text)',
                  border: activeTab === tab.id ? 'none' : '1px solid var(--border)',
                  fontWeight: activeTab === tab.id ? 600 : 500,
                  transition: 'all 0.2s',
                }}
              >
                <i className={`bi ${tab.icon}`}></i>
                {tab.label}
              </button>
            ))}
          </div>

          <div className="glass-panel p-4 p-md-5">
            {success && (
              <div className="d-flex align-items-center gap-2 p-3 rounded-3 mb-4" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)' }}>
                <i className="bi bi-check-circle-fill text-success"></i>
                <span className="text-success fw-semibold small">{success}</span>
              </div>
            )}
            {error && (
              <div className="d-flex align-items-center gap-2 p-3 rounded-3 mb-4" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
                <i className="bi bi-exclamation-triangle-fill text-danger"></i>
                <span className="text-danger fw-semibold small">{error}</span>
              </div>
            )}

            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <form onSubmit={handleSubmit}>
                <h5 className="fw-bold mb-4">Personal Information</h5>
                <div className="row g-3 mb-3">
                  <div className="col-md-6">
                    <label className="form-label fw-semibold small text-secondary">First Name</label>
                    <input
                      type="text"
                      className="form-control form-glass-control"
                      value={firstName}
                      onChange={e => setFirstName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold small text-secondary">Last Name</label>
                    <input
                      type="text"
                      className="form-control form-glass-control"
                      value={lastName}
                      onChange={e => setLastName(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="mb-4">
                  <label className="form-label fw-semibold small text-secondary">Email Address</label>
                  <div className="d-flex align-items-center gap-2">
                    <input
                      type="email"
                      className="form-control form-glass-control"
                      value={user?.email || ''}
                      disabled
                      style={{ opacity: 0.6 }}
                    />
                    <span className="badge bg-success bg-opacity-10 text-success rounded-pill px-3" style={{ whiteSpace: 'nowrap', fontSize: '0.78rem' }}>
                      <i className="bi bi-lock-fill me-1"></i>Read-only
                    </span>
                  </div>
                </div>
                <button type="submit" className="btn btn-glass px-5 py-2" disabled={loading}>
                  {loading ? (
                    <><span className="spinner-border spinner-border-sm me-2"></span>Saving...</>
                  ) : (
                    <><i className="bi bi-check-lg me-2"></i>Save Changes</>
                  )}
                </button>
              </form>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <form onSubmit={handleSubmit}>
                <h5 className="fw-bold mb-2">Change Password</h5>
                <p className="text-secondary small mb-4">Leave blank to keep your current password.</p>
                <div className="mb-4">
                  <label className="form-label fw-semibold small text-secondary">New Password</label>
                  <div className="position-relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="form-control form-glass-control pe-5"
                      placeholder="Minimum 6 characters"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      minLength={6}
                    />
                    <button
                      type="button"
                      className="btn border-0 position-absolute top-50 end-0 translate-middle-y pe-3"
                      style={{ background: 'none', color: 'var(--text-secondary)' }}
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1}
                    >
                      <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                    </button>
                  </div>
                </div>

                <div className="p-3 rounded-3 mb-4" style={{ background: 'rgba(37,99,235,0.06)', border: '1px solid rgba(37,99,235,0.15)' }}>
                  <h6 className="fw-semibold mb-2 small text-primary">
                    <i className="bi bi-shield-check me-2"></i>Password Tips
                  </h6>
                  <ul className="small text-secondary mb-0 ps-3">
                    <li>At least 6 characters long</li>
                    <li>Mix uppercase and lowercase letters</li>
                    <li>Include numbers and special characters</li>
                  </ul>
                </div>

                <button type="submit" className="btn btn-glass px-5 py-2" disabled={loading}>
                  {loading ? (
                    <><span className="spinner-border spinner-border-sm me-2"></span>Updating...</>
                  ) : (
                    <><i className="bi bi-lock-fill me-2"></i>Update Password</>
                  )}
                </button>
              </form>
            )}

            {/* Account Info Tab */}
            {activeTab === 'info' && (
              <div>
                <h5 className="fw-bold mb-4">Account Information</h5>
                <div className="d-flex flex-column gap-3">
                  {[
                    { label: 'User ID', value: `#${user?.id}`, icon: 'bi-hash' },
                    { label: 'Full Name', value: `${user?.firstName} ${user?.lastName}`, icon: 'bi-person' },
                    { label: 'Email', value: user?.email, icon: 'bi-envelope' },
                    { label: 'Role', value: user?.role === 'ROLE_ADMIN' ? 'Administrator' : 'Standard User', icon: 'bi-shield' },
                    { label: 'Registered', value: user?.createdAt ? new Date(user.createdAt).toLocaleString('en-IN') : 'N/A', icon: 'bi-calendar' },
                    { label: 'Status', value: 'Active & Verified', icon: 'bi-patch-check' },
                  ].map((item, i) => (
                    <div
                      key={i}
                      className="d-flex align-items-center gap-3 p-3 rounded-3"
                      style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
                    >
                      <div
                        className="d-flex align-items-center justify-content-center rounded-2 flex-shrink-0"
                        style={{ width: 36, height: 36, background: 'rgba(37,99,235,0.1)', color: 'var(--primary)' }}
                      >
                        <i className={`bi ${item.icon}`}></i>
                      </div>
                      <div>
                        <div className="text-secondary" style={{ fontSize: '0.75rem', fontWeight: 600 }}>{item.label}</div>
                        <div className="fw-semibold" style={{ fontSize: '0.9rem' }}>{item.value}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
