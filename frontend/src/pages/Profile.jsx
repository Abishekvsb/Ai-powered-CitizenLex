import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import ImageCropModal from '../components/ImageCropModal';

const INDIA_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat','Haryana',
  'Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur',
  'Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu',
  'Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal',
  'Andaman & Nicobar Islands','Chandigarh','Dadra & Nagar Haveli and Daman & Diu',
  'Delhi','Jammu & Kashmir','Ladakh','Lakshadweep','Puducherry',
];

const LANGUAGES = [
  'English','Hindi','Bengali','Telugu','Marathi','Tamil','Urdu','Gujarati',
  'Kannada','Odia','Punjabi','Malayalam','Assamese','Maithili','Sanskrit',
];

const OCCUPATIONS = [
  'Student','Employee','Self-Employed','Business Owner','Farmer','Government Servant',
  'Lawyer','Doctor','Teacher','Engineer','Homemaker','Retired','Unemployed','Other',
];

const GENDERS = ['Male','Female','Non-Binary','Prefer not to say'];

function computeCompletion(user) {
  const fields = ['firstName','lastName','mobile','dateOfBirth','gender','state','district','address','preferredLanguage','occupation','profileImageUrl'];
  const filled = fields.filter(f => user?.[f] && String(user[f]).trim() !== '').length;
  return Math.round((filled / fields.length) * 100);
}

function AvatarDisplay({ user, size = 100, onClick, showUploadOverlay = false }) {
  const COLORS = [
    ['#2563eb','#06b6d4'],['#8b5cf6','#ec4899'],['#10b981','#06b6d4'],['#f59e0b','#ef4444'],
  ];
  const colorIndex = (user?.id || 0) % COLORS.length;
  const [gradFrom, gradTo] = COLORS[colorIndex];
  const initials = `${(user?.firstName || '?')[0]}${(user?.lastName || '')[0] || ''}`.toUpperCase();

  return (
    <div
      style={{ position: 'relative', width: size, height: size, display: 'inline-block', cursor: onClick ? 'pointer' : 'default' }}
      onClick={onClick}
    >
      {user?.profileImageUrl ? (
        <img
          src={user.profileImageUrl}
          alt="Profile"
          style={{
            width: size, height: size, borderRadius: '50%',
            objectFit: 'cover',
            border: '3px solid rgba(99,102,241,0.4)',
            boxShadow: '0 4px 20px rgba(99,102,241,0.25)',
            display: 'block',
          }}
          onError={e => { e.target.style.display = 'none'; }}
        />
      ) : (
        <div style={{
          width: size, height: size, borderRadius: '50%',
          background: `linear-gradient(135deg, ${gradFrom} 0%, ${gradTo} 100%)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: size * 0.32, fontWeight: 700, color: 'white',
          boxShadow: `0 4px 20px ${gradFrom}55`,
          border: '3px solid rgba(255,255,255,0.15)',
        }}>
          {initials}
        </div>
      )}
      {showUploadOverlay && (
        <div style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          background: 'rgba(0,0,0,0.45)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          opacity: 0, transition: 'opacity 0.2s',
          color: 'white', fontSize: 12, gap: 3,
        }}
          className="avatar-upload-overlay"
        >
          <i className="bi bi-camera-fill" style={{ fontSize: 18 }}></i>
          <span>Change</span>
        </div>
      )}
    </div>
  );
}

export default function Profile() {
  const { user, updateUserProfileState } = useAuth();

  // Photo upload state
  const fileInputRef = useRef(null);
  const [cropSrc, setCropSrc] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [removeLoading, setRemoveLoading] = useState(false);

  // Form state
  const [form, setForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    mobile: user?.mobile || '',
    dateOfBirth: user?.dateOfBirth || '',
    gender: user?.gender || '',
    state: user?.state || '',
    district: user?.district || '',
    address: user?.address || '',
    preferredLanguage: user?.preferredLanguage || '',
    occupation: user?.occupation || '',
  });
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const completion = computeCompletion({ ...user, ...form });

  // Sync form when user object changes
  useEffect(() => {
    if (user) {
      setForm(prev => ({
        firstName: user.firstName || prev.firstName,
        lastName: user.lastName || prev.lastName,
        mobile: user.mobile || prev.mobile,
        dateOfBirth: user.dateOfBirth || prev.dateOfBirth,
        gender: user.gender || prev.gender,
        state: user.state || prev.state,
        district: user.district || prev.district,
        address: user.address || prev.address,
        preferredLanguage: user.preferredLanguage || prev.preferredLanguage,
        occupation: user.occupation || prev.occupation,
      }));
    }
  }, [user]);

  const showSuccess = (msg) => {
    setSuccessMsg(msg); setErrorMsg('');
    setTimeout(() => setSuccessMsg(''), 4000);
  };
  const showError = (msg) => {
    setErrorMsg(msg); setSuccessMsg('');
    setTimeout(() => setErrorMsg(''), 5000);
  };

  // ── Photo handlers ────────────────────────────────────────────────────────
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { showError('File size must be under 5 MB.'); return; }
    if (!['image/jpeg','image/jpg','image/png','image/webp'].includes(file.type)) {
      showError('Only JPG, PNG, or WEBP images are allowed.'); return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => setCropSrc(ev.target.result);
    reader.readAsDataURL(file);
    e.target.value = ''; // reset input
  };

  const handleCropConfirm = async (croppedBlob) => {
    setCropSrc(null);
    setUploadLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', croppedBlob, 'profile.webp');
      const res = await axios.post('/api/profile/upload-photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      updateUserProfileState(res.data);
      showSuccess('Profile photo updated successfully!');
    } catch (err) {
      showError(err.response?.data?.error || 'Failed to upload photo. Please try again.');
    } finally {
      setUploadLoading(false);
    }
  };

  const handleRemovePhoto = async () => {
    if (!window.confirm('Remove your profile photo?')) return;
    setRemoveLoading(true);
    try {
      const res = await axios.delete('/api/profile/remove-photo');
      updateUserProfileState(res.data);
      showSuccess('Profile photo removed.');
    } catch (err) {
      showError(err.response?.data?.error || 'Failed to remove photo.');
    } finally {
      setRemoveLoading(false);
    }
  };

  // ── Profile update handlers ────────────────────────────────────────────────
  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSaveLoading(true);
    try {
      const res = await axios.put('/api/profile/update', form);
      updateUserProfileState(res.data);
      showSuccess('Profile saved successfully!');
    } catch (err) {
      showError(err.response?.data?.error || 'Failed to save profile.');
    } finally {
      setSaveLoading(false);
    }
  };

  const handlePasswordSave = async (e) => {
    e.preventDefault();
    if (!password.trim()) { showError('Please enter a new password.'); return; }
    if (password.length < 6) { showError('Password must be at least 6 characters.'); return; }
    setSaveLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('firstName', form.firstName || user?.firstName || '');
      params.append('lastName', form.lastName || user?.lastName || '');
      params.append('password', password);
      const res = await axios.put('/api/auth/profile', params, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });
      updateUserProfileState(res.data);
      setPassword('');
      showSuccess('Password updated successfully!');
    } catch (err) {
      showError(err.response?.data?.error || 'Failed to update password.');
    } finally {
      setSaveLoading(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Personal Info', icon: 'bi-person-gear' },
    { id: 'security', label: 'Security', icon: 'bi-shield-lock' },
    { id: 'info', label: 'Account Info', icon: 'bi-info-circle' },
  ];

  const completionColor = completion >= 80 ? '#10b981' : completion >= 50 ? '#f59e0b' : '#6366f1';

  return (
    <>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        style={{ display: 'none' }}
        onChange={handleFileSelect}
      />

      {/* Image crop modal */}
      {cropSrc && (
        <ImageCropModal
          imageSrc={cropSrc}
          onConfirm={handleCropConfirm}
          onCancel={() => setCropSrc(null)}
        />
      )}

      <style>{`
        .avatar-upload-overlay { display: flex; }
        .avatar-upload-wrapper:hover .avatar-upload-overlay { opacity: 1 !important; }
        .profile-tab-btn { transition: all 0.2s ease; }
        .profile-tab-btn:hover { transform: translateY(-1px); }
        .completion-bar { transition: width 0.8s cubic-bezier(0.4,0,0.2,1); }
        .field-row:not(:last-child) { padding-bottom: 1rem; border-bottom: 1px solid var(--border); }
      `}</style>

      <div className="container py-5 text-start">
        {/* Page header */}
        <div className="row mb-5 fade-in-el">
          <div className="col-12">
            <p className="text-secondary mb-1 small fw-semibold text-uppercase letter-spacing-1">Account Settings</p>
            <h1 className="fw-bold mb-1" style={{ fontSize: '2rem' }}>Your Profile</h1>
            <p className="text-secondary mb-0">Manage your account details, photo, and preferences.</p>
          </div>
        </div>

        <div className="row g-4 g-lg-5">
          {/* ── LEFT: Avatar Card ── */}
          <div className="col-lg-4 fade-in-el">

            {/* Profile Card */}
            <div className="glass-panel p-4 text-center mb-4">
              {/* Avatar with upload overlay */}
              <div
                className="avatar-upload-wrapper mx-auto mb-4 position-relative"
                style={{ width: 110, height: 110, display: 'inline-block' }}
                onClick={() => !uploadLoading && fileInputRef.current?.click()}
                title="Click to change photo"
              >
                <AvatarDisplay user={user} size={110} showUploadOverlay />
                {uploadLoading && (
                  <div style={{
                    position: 'absolute', inset: 0, borderRadius: '50%',
                    background: 'rgba(0,0,0,0.55)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <div className="spinner-border spinner-border-sm text-light"></div>
                  </div>
                )}
              </div>

              {/* Photo action buttons */}
              <div className="d-flex gap-2 justify-content-center mb-4 flex-wrap">
                <button
                  className="btn btn-sm"
                  style={{ background: 'rgba(99,102,241,0.1)', color: '#6366f1', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 8 }}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadLoading}
                >
                  <i className="bi bi-camera me-1"></i>
                  {uploadLoading ? 'Uploading...' : user?.profileImageUrl ? 'Replace' : 'Upload'}
                </button>
                {user?.profileImageUrl && (
                  <button
                    className="btn btn-sm"
                    style={{ background: 'rgba(239,68,68,0.08)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 8 }}
                    onClick={handleRemovePhoto}
                    disabled={removeLoading}
                  >
                    <i className={`bi ${removeLoading ? 'bi-arrow-clockwise' : 'bi-trash3'} me-1`}></i>
                    {removeLoading ? 'Removing...' : 'Remove'}
                  </button>
                )}
              </div>

              <h4 className="fw-bold mb-1">{user?.firstName} {user?.lastName}</h4>
              <p className="text-secondary small mb-3">{user?.email}</p>

              <div className="mb-4">
                <span
                  className="badge rounded-pill fw-semibold"
                  style={{
                    background: user?.role === 'ROLE_ADMIN' ? 'rgba(239,68,68,0.1)' : 'rgba(37,99,235,0.1)',
                    color: user?.role === 'ROLE_ADMIN' ? '#ef4444' : 'var(--primary)',
                    padding: '5px 14px',
                  }}
                >
                  {user?.role === 'ROLE_ADMIN' ? '🛡️ Administrator' : '👤 Standard User'}
                </span>
              </div>

              <hr style={{ borderColor: 'var(--border)' }} />

              {/* Profile Completion */}
              <div className="text-start mt-3 mb-1">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="small fw-semibold text-secondary">Profile Completion</span>
                  <span className="small fw-bold" style={{ color: completionColor }}>{completion}%</span>
                </div>
                <div style={{ height: 8, background: 'var(--bg-secondary)', borderRadius: 999, overflow: 'hidden' }}>
                  <div
                    className="completion-bar"
                    style={{ height: '100%', width: `${completion}%`, background: `linear-gradient(90deg, ${completionColor}aa, ${completionColor})`, borderRadius: 999 }}
                  />
                </div>
                {completion < 100 && (
                  <p className="text-secondary mt-2 mb-0" style={{ fontSize: '0.75rem' }}>
                    {100 - completion}% remaining — complete your profile for better assistance.
                  </p>
                )}
                {completion === 100 && (
                  <p className="text-success mt-2 mb-0" style={{ fontSize: '0.75rem' }}>
                    <i className="bi bi-patch-check-fill me-1"></i>Your profile is 100% complete!
                  </p>
                )}
              </div>
            </div>

            {/* Quick info */}
            <div className="glass-panel p-4">
              <h6 className="fw-bold mb-3 text-secondary text-uppercase small">Quick Info</h6>
              {[
                { icon: 'bi-calendar-check', label: 'Member Since', value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long' }) : 'N/A' },
                { icon: 'bi-geo-alt', label: 'Location', value: [user?.district, user?.state].filter(Boolean).join(', ') || 'Not set' },
                { icon: 'bi-translate', label: 'Language', value: user?.preferredLanguage || 'Not set' },
                { icon: 'bi-briefcase', label: 'Occupation', value: user?.occupation || 'Not set' },
              ].map((item, i) => (
                <div key={i} className="d-flex align-items-start gap-3 mb-3">
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(99,102,241,0.1)', color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <i className={`bi ${item.icon} small`}></i>
                  </div>
                  <div>
                    <div className="text-secondary" style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{item.label}</div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>{item.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── RIGHT: Tabbed Settings ── */}
          <div className="col-lg-8 fade-in-el-delay-1">
            {/* Alert messages */}
            {successMsg && (
              <div className="d-flex align-items-center gap-2 p-3 rounded-3 mb-4" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.3)' }}>
                <i className="bi bi-check-circle-fill text-success"></i>
                <span className="text-success fw-semibold small">{successMsg}</span>
              </div>
            )}
            {errorMsg && (
              <div className="d-flex align-items-center gap-2 p-3 rounded-3 mb-4" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)' }}>
                <i className="bi bi-exclamation-triangle-fill text-danger"></i>
                <span className="text-danger fw-semibold small">{errorMsg}</span>
              </div>
            )}

            {/* Tabs */}
            <div className="d-flex gap-2 mb-4 flex-wrap">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  className="btn profile-tab-btn d-flex align-items-center gap-2"
                  style={{
                    fontSize: '0.85rem',
                    padding: '8px 20px',
                    borderRadius: 10,
                    background: activeTab === tab.id ? 'var(--primary)' : 'var(--surface)',
                    color: activeTab === tab.id ? 'white' : 'var(--text)',
                    border: activeTab === tab.id ? 'none' : '1px solid var(--border)',
                    fontWeight: activeTab === tab.id ? 600 : 500,
                    boxShadow: activeTab === tab.id ? '0 4px 12px rgba(99,102,241,0.35)' : 'none',
                  }}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <i className={`bi ${tab.icon}`}></i>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* ── PROFILE TAB ── */}
            {activeTab === 'profile' && (
              <form onSubmit={handleProfileSave}>
                <div className="glass-panel p-4 p-md-5">
                  <h5 className="fw-bold mb-1">Personal Information</h5>
                  <p className="text-secondary small mb-4">Update your personal details below. Email is read-only.</p>

                  {/* Name row */}
                  <div className="row g-3 mb-3">
                    <div className="col-md-6">
                      <label className="form-label fw-semibold small text-secondary">First Name <span className="text-danger">*</span></label>
                      <input type="text" className="form-control form-glass-control" required
                        value={form.firstName} onChange={e => setForm(p => ({ ...p, firstName: e.target.value }))} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold small text-secondary">Last Name <span className="text-danger">*</span></label>
                      <input type="text" className="form-control form-glass-control" required
                        value={form.lastName} onChange={e => setForm(p => ({ ...p, lastName: e.target.value }))} />
                    </div>
                  </div>

                  {/* Email (read-only) */}
                  <div className="mb-3">
                    <label className="form-label fw-semibold small text-secondary">Email Address</label>
                    <div className="d-flex align-items-center gap-2">
                      <input type="email" className="form-control form-glass-control" value={user?.email || ''} disabled style={{ opacity: 0.6 }} />
                      <span className="badge bg-success bg-opacity-10 text-success rounded-pill px-3" style={{ whiteSpace: 'nowrap', fontSize: '0.78rem' }}>
                        <i className="bi bi-lock-fill me-1"></i>Read-only
                      </span>
                    </div>
                  </div>

                  {/* Mobile & DOB */}
                  <div className="row g-3 mb-3">
                    <div className="col-md-6">
                      <label className="form-label fw-semibold small text-secondary">Mobile Number</label>
                      <input type="tel" className="form-control form-glass-control" placeholder="+91 9XXXXXXXXX"
                        value={form.mobile} onChange={e => setForm(p => ({ ...p, mobile: e.target.value }))} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold small text-secondary">Date of Birth</label>
                      <input type="date" className="form-control form-glass-control"
                        value={form.dateOfBirth} onChange={e => setForm(p => ({ ...p, dateOfBirth: e.target.value }))} />
                    </div>
                  </div>

                  {/* Gender & Preferred Language */}
                  <div className="row g-3 mb-3">
                    <div className="col-md-6">
                      <label className="form-label fw-semibold small text-secondary">Gender</label>
                      <select className="form-select form-glass-control" value={form.gender} onChange={e => setForm(p => ({ ...p, gender: e.target.value }))}>
                        <option value="">Select gender</option>
                        {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold small text-secondary">Preferred Language</label>
                      <select className="form-select form-glass-control" value={form.preferredLanguage} onChange={e => setForm(p => ({ ...p, preferredLanguage: e.target.value }))}>
                        <option value="">Select language</option>
                        {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Occupation */}
                  <div className="mb-3">
                    <label className="form-label fw-semibold small text-secondary">Occupation</label>
                    <select className="form-select form-glass-control" value={form.occupation} onChange={e => setForm(p => ({ ...p, occupation: e.target.value }))}>
                      <option value="">Select occupation</option>
                      {OCCUPATIONS.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>

                  {/* State & District */}
                  <div className="row g-3 mb-3">
                    <div className="col-md-6">
                      <label className="form-label fw-semibold small text-secondary">State</label>
                      <select className="form-select form-glass-control" value={form.state} onChange={e => setForm(p => ({ ...p, state: e.target.value }))}>
                        <option value="">Select state</option>
                        {INDIA_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold small text-secondary">District</label>
                      <input type="text" className="form-control form-glass-control" placeholder="e.g. Mumbai Suburban"
                        value={form.district} onChange={e => setForm(p => ({ ...p, district: e.target.value }))} />
                    </div>
                  </div>

                  {/* Address */}
                  <div className="mb-4">
                    <label className="form-label fw-semibold small text-secondary">Address</label>
                    <textarea className="form-control form-glass-control" rows={3} placeholder="Street, Area, City, PIN"
                      value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))}></textarea>
                  </div>

                  <button type="submit" className="btn btn-glass px-5 py-2" disabled={saveLoading}>
                    {saveLoading ? <><span className="spinner-border spinner-border-sm me-2"></span>Saving...</> : <><i className="bi bi-check-lg me-2"></i>Save Profile</>}
                  </button>
                </div>
              </form>
            )}

            {/* ── SECURITY TAB ── */}
            {activeTab === 'security' && (
              <form onSubmit={handlePasswordSave}>
                <div className="glass-panel p-4 p-md-5">
                  <h5 className="fw-bold mb-2">Change Password</h5>
                  <p className="text-secondary small mb-4">Choose a strong password to protect your account.</p>

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
                      <button type="button" className="btn border-0 position-absolute top-50 end-0 translate-middle-y pe-3"
                        style={{ background: 'none', color: 'var(--text-secondary)' }}
                        onClick={() => setShowPassword(!showPassword)} tabIndex={-1}>
                        <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                      </button>
                    </div>
                  </div>

                  <div className="p-3 rounded-3 mb-4" style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)' }}>
                    <h6 className="fw-semibold mb-2 small" style={{ color: '#6366f1' }}><i className="bi bi-shield-check me-2"></i>Password Tips</h6>
                    <ul className="small text-secondary mb-0 ps-3">
                      <li>At least 6 characters long</li>
                      <li>Mix uppercase and lowercase letters</li>
                      <li>Include numbers and special characters</li>
                    </ul>
                  </div>

                  <button type="submit" className="btn btn-glass px-5 py-2" disabled={saveLoading}>
                    {saveLoading ? <><span className="spinner-border spinner-border-sm me-2"></span>Updating...</> : <><i className="bi bi-lock-fill me-2"></i>Update Password</>}
                  </button>
                </div>
              </form>
            )}

            {/* ── ACCOUNT INFO TAB ── */}
            {activeTab === 'info' && (
              <div className="glass-panel p-4 p-md-5">
                <h5 className="fw-bold mb-4">Account Information</h5>
                <div className="d-flex flex-column gap-3">
                  {[
                    { label: 'User ID', value: `#${user?.id}`, icon: 'bi-hash' },
                    { label: 'Full Name', value: `${user?.firstName} ${user?.lastName}`, icon: 'bi-person' },
                    { label: 'Email', value: user?.email, icon: 'bi-envelope' },
                    { label: 'Mobile', value: user?.mobile || 'Not set', icon: 'bi-phone' },
                    { label: 'Gender', value: user?.gender || 'Not set', icon: 'bi-gender-ambiguous' },
                    { label: 'Date of Birth', value: user?.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Not set', icon: 'bi-calendar-heart' },
                    { label: 'Occupation', value: user?.occupation || 'Not set', icon: 'bi-briefcase' },
                    { label: 'Preferred Language', value: user?.preferredLanguage || 'Not set', icon: 'bi-translate' },
                    { label: 'State', value: user?.state || 'Not set', icon: 'bi-geo-alt' },
                    { label: 'Role', value: user?.role === 'ROLE_ADMIN' ? 'Administrator' : 'Standard User', icon: 'bi-shield' },
                    { label: 'Registered', value: user?.createdAt ? new Date(user.createdAt).toLocaleString('en-IN') : 'N/A', icon: 'bi-calendar' },
                    { label: 'Status', value: 'Active & Verified', icon: 'bi-patch-check' },
                  ].map((item, i) => (
                    <div key={i} className="d-flex align-items-center gap-3 p-3 rounded-3" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                      <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(99,102,241,0.1)', color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <i className={`bi ${item.icon}`}></i>
                      </div>
                      <div>
                        <div className="text-secondary" style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{item.label}</div>
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
    </>
  );
}
