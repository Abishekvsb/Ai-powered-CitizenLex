import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import ImageCropModal from '../components/ImageCropModal';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';

// Register ChartJS elements
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

// ─── Helpers ──────────────────────────────────────────────────────────────────

const API = import.meta.env.VITE_API_URL || '';

function calcCompletion(user) {
  const fields = [
    user?.firstName, user?.lastName, user?.mobile, user?.dateOfBirth,
    user?.gender, user?.state, user?.district, user?.address,
    user?.occupation, user?.preferredLanguage, user?.profileImageUrl,
  ];
  const filled = fields.filter(Boolean).length;
  const base = Math.round((filled / fields.length) * 90);
  const emailBonus = user?.emailVerified ? 5 : 0;
  const mobileBonus = user?.mobileVerified ? 5 : 0;
  return Math.min(100, base + emailBonus + mobileBonus);
}

function ProgressRing({ pct }) {
  const r = 52, circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <svg width="130" height="130" style={{ transform: 'rotate(-90deg)' }}>
      <circle cx="65" cy="65" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
      <circle cx="65" cy="65" r={r} fill="none"
        stroke="url(#pg)" strokeWidth="8" strokeLinecap="round"
        strokeDasharray={`${dash} ${circ}`}
        style={{ transition: 'stroke-dasharray 1s ease' }} />
      <defs>
        <linearGradient id="pg" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#a855f7" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function Badge({ label, verified, onClick, loading }) {
  return (
    <span
      onClick={onClick}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        padding: '3px 10px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 600,
        cursor: onClick ? 'pointer' : 'default',
        background: verified ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.12)',
        color: verified ? '#10b981' : '#f87171',
        border: `1px solid ${verified ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
        transition: 'all 0.2s',
      }}
    >
      {loading ? '⏳' : verified ? '✓' : '!'} {label}
    </span>
  );
}

const TABS = [
  { id: 'personal', label: 'Profile', icon: '👤' },
  { id: 'security', label: 'Security', icon: '🔐' },
  { id: 'timeline', label: 'Timeline', icon: '📅' },
  { id: 'achievements', label: 'Achievements', icon: '🏆' },
  { id: 'preferences', label: 'Preferences', icon: '⚙️' },
  { id: 'privacy', label: 'Privacy', icon: '🛡️' },
];

const STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat',
  'Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh',
  'Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab',
  'Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand',
  'West Bengal','Delhi','Jammu and Kashmir','Ladakh','Puducherry',
];

// ─── Main Profile Component ────────────────────────────────────────────────────

export default function Profile() {
  const { user, updateUserProfileState } = useAuth();
  const [activeTab, setActiveTab] = useState('personal');
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);
  const [cropSrc, setCropSrc] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileRef = useRef(null);

  // Security tab state
  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });
  const [showPw, setShowPw] = useState({});
  const [pwSaving, setPwSaving] = useState(false);
  const [logoutAllLoading, setLogoutAllLoading] = useState(false);

  // Timeline state
  const [timeline, setTimeline] = useState([]);
  const [timelineFilter, setTimelineFilter] = useState('all');
  const [timelineLoading, setTimelineLoading] = useState(false);

  // Achievements state
  const [achievements, setAchievements] = useState([]);
  const [stats, setStats] = useState({});
  const [statsLoading, setStatsLoading] = useState(false);

  // Verification
  const [emailVerifyLoading, setEmailVerifyLoading] = useState(false);
  const [mobileVerifyLoading, setMobileVerifyLoading] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [mockOtp, setMockOtp] = useState('');

  // Privacy
  const [deletePassword, setDeletePassword] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  // Prefs
  const [prefs, setPrefs] = useState({});
  const [prefsSaving, setPrefsSaving] = useState(false);

  const completion = calcCompletion(user);

  useEffect(() => {
    if (user) {
      setForm({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        mobile: user.mobile || '',
        dateOfBirth: user.dateOfBirth || '',
        gender: user.gender || '',
        state: user.state || '',
        district: user.district || '',
        address: user.address || '',
        preferredLanguage: user.preferredLanguage || '',
        occupation: user.occupation || '',
      });
      setPrefs({
        emailNotifications: user.emailNotifications !== false,
        pushNotifications: user.pushNotifications !== false,
        reminderNotifications: user.reminderNotifications !== false,
        marketingEmails: user.marketingEmails === true,
        productUpdates: user.productUpdates !== false,
      });
    }
  }, [user]);

  // Load data on tab switch
  useEffect(() => {
    if (activeTab === 'security') loadSessions();
    if (activeTab === 'timeline') loadTimeline(timelineFilter);
    if (activeTab === 'achievements') loadAchievements();
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'timeline') loadTimeline(timelineFilter);
  }, [timelineFilter]);

  const showMsg = (text, type = 'success') => {
    setMsg({ text, type });
    setTimeout(() => setMsg(null), 4000);
  };

  // ─── Profile Save ──────────────────────────────────────────────────────
  const saveProfile = async () => {
    setSaving(true);
    try {
      const res = await axios.put(`${API}/api/profile/update`, form);
      updateUserProfileState(res.data);
      showMsg('Profile saved successfully!');
    } catch (e) {
      showMsg(e.response?.data?.error || 'Failed to save profile.', 'error');
    } finally {
      setSaving(false);
    }
  };

  // ─── Photo Upload ──────────────────────────────────────────────────────
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { showMsg('File must be under 5 MB.', 'error'); return; }
    const reader = new FileReader();
    reader.onload = ev => setCropSrc(ev.target.result);
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleCropConfirm = async (blob) => {
    setCropSrc(null);
    setUploadingPhoto(true);
    try {
      const fd = new FormData();
      fd.append('file', blob, 'profile.webp');
      const res = await axios.post(`${API}/api/profile/upload-photo`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      updateUserProfileState(res.data);
      showMsg('Profile photo updated!');
    } catch (e) {
      showMsg(e.response?.data?.error || 'Upload failed. Check Cloudinary configuration.', 'error');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const removePhoto = async () => {
    if (!user?.profileImageUrl) return;
    try {
      const res = await axios.delete(`${API}/api/profile/remove-photo`);
      updateUserProfileState(res.data);
      showMsg('Profile photo removed.');
    } catch (e) {
      showMsg('Failed to remove photo.', 'error');
    }
  };

  // ─── Email Verification ────────────────────────────────────────────────
  const requestEmailVerification = async () => {
    setEmailVerifyLoading(true);
    try {
      const res = await axios.post(`${API}/api/verify/email/request`);
      showMsg(res.data.message || 'Verification email sent!');
    } catch (e) {
      showMsg(e.response?.data?.error || 'Failed to send verification email.', 'error');
    } finally {
      setEmailVerifyLoading(false);
    }
  };

  // ─── Mobile OTP ────────────────────────────────────────────────────────
  const requestMobileOtp = async () => {
    setMobileVerifyLoading(true);
    setMockOtp('');
    try {
      const res = await axios.post(`${API}/api/verify/mobile/request`);
      showMsg(res.data.message);
      if (res.data.isMock && res.data.otp) {
        setMockOtp(res.data.otp);
      }
      setShowOtpInput(true);
    } catch (e) {
      showMsg(e.response?.data?.error || 'Failed to send OTP.', 'error');
    } finally {
      setMobileVerifyLoading(false);
    }
  };

  const confirmMobileOtp = async () => {
    try {
      const res = await axios.post(`${API}/api/verify/mobile/confirm`, { otp: otpInput });
      updateUserProfileState(res.data.user);
      showMsg('Mobile verified!');
      setShowOtpInput(false);
      setOtpInput('');
    } catch (e) {
      showMsg(e.response?.data?.error || 'Invalid OTP.', 'error');
    }
  };

  // ─── Security ──────────────────────────────────────────────────────────
  const loadSessions = async () => {
    setSessionsLoading(true);
    try {
      const res = await axios.get(`${API}/api/security/sessions`);
      setSessions(res.data);
    } catch (e) { /* ignore */ }
    finally { setSessionsLoading(false); }
  };

  const revokeSession = async (id) => {
    try {
      await axios.delete(`${API}/api/security/sessions/${id}`);
      setSessions(prev => prev.filter(s => s.id !== id));
      showMsg('Session revoked.');
    } catch (e) {
      showMsg('Failed to revoke session.', 'error');
    }
  };

  const logoutAll = async () => {
    setLogoutAllLoading(true);
    try {
      const res = await axios.post(`${API}/api/security/logout-all`);
      showMsg(res.data.message);
      setSessions([]);
    } catch (e) {
      showMsg('Failed.', 'error');
    } finally { setLogoutAllLoading(false); }
  };

  const changePassword = async () => {
    if (pwForm.next !== pwForm.confirm) { showMsg('Passwords do not match.', 'error'); return; }
    if (pwForm.next.length < 8) { showMsg('Password must be at least 8 characters.', 'error'); return; }
    setPwSaving(true);
    try {
      await axios.put(`${API}/api/security/change-password`, {
        currentPassword: pwForm.current,
        newPassword: pwForm.next,
      });
      showMsg('Password changed! Please log in again.');
      setPwForm({ current: '', next: '', confirm: '' });
    } catch (e) {
      showMsg(e.response?.data?.error || 'Failed to change password.', 'error');
    } finally { setPwSaving(false); }
  };

  const pwStrength = (pw) => {
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    return score;
  };

  // ─── Timeline ──────────────────────────────────────────────────────────
  const loadTimeline = async (filter) => {
    setTimelineLoading(true);
    try {
      const res = await axios.get(`${API}/api/stats/timeline?filter=${filter}`);
      setTimeline(res.data.timeline || []);
    } catch (e) { /* ignore */ }
    finally { setTimelineLoading(false); }
  };

  // ─── Achievements & Stats ──────────────────────────────────────────────
  const loadAchievements = async () => {
    setStatsLoading(true);
    try {
      const [achRes, sumRes] = await Promise.all([
        axios.get(`${API}/api/stats/achievements`),
        axios.get(`${API}/api/stats/summary`),
      ]);
      setAchievements(achRes.data.achievements || []);
      setStats(sumRes.data || {});
    } catch (e) { /* ignore */ }
    finally { setStatsLoading(false); }
  };

  // ─── Preferences ───────────────────────────────────────────────────────
  const savePreferences = async () => {
    setPrefsSaving(true);
    try {
      const res = await axios.put(`${API}/api/stats/preferences`, prefs);
      updateUserProfileState(res.data);
      showMsg('Preferences saved!');
    } catch (e) {
      showMsg('Failed to save preferences.', 'error');
    } finally { setPrefsSaving(false); }
  };

  // ─── Privacy ───────────────────────────────────────────────────────────
  const downloadData = () => { window.open(`${API}/api/stats/download-data`, '_blank'); };
  const exportCsv = () => { window.open(`${API}/api/stats/export-activity`, '_blank'); };
  const exportPdf = () => { window.print(); };

  const deleteAccount = async () => {
    setDeletingAccount(true);
    try {
      await axios.delete(`${API}/api/stats/delete-account`, { data: { password: deletePassword } });
      window.location.href = '/login';
    } catch (e) {
      showMsg(e.response?.data?.error || 'Failed to delete account.', 'error');
    } finally {
      setDeletingAccount(false);
    }
  };

  // ─── Render ────────────────────────────────────────────────────────────

  const avatar = user?.profileImageUrl;
  const initials = `${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`.toUpperCase();

  return (
    <div className="profile-page-wrap" style={{ minHeight: '100vh', padding: '30px 20px 60px', maxWidth: 1100, margin: '0 auto' }}>
      {/* Toast */}
      {msg && (
        <div style={{
          position: 'fixed', top: 24, right: 24, zIndex: 9999,
          background: msg.type === 'error' ? 'rgba(239,68,68,0.95)' : 'rgba(16,185,129,0.95)',
          color: '#fff', padding: '14px 22px', borderRadius: 14,
          boxShadow: '0 8px 24px rgba(0,0,0,0.3)', fontWeight: 600, fontSize: '0.9rem',
          animation: 'slideIn 0.3s ease',
        }}>
          {msg.type === 'error' ? '❌ ' : '✅ '}{msg.text}
        </div>
      )}

      {/* Hero Header */}
      <div className="glass-card mb-4 print-hide" style={{
        background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(168,85,247,0.1))',
        border: '1px solid rgba(99,102,241,0.25)', borderRadius: 24, padding: '32px 36px',
      }}>
        <div className="d-flex align-items-center gap-4 flex-wrap">
          {/* Avatar */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div style={{ position: 'relative', width: 130, height: 130 }}>
              <ProgressRing pct={completion} />
              <div
                onClick={() => fileRef.current.click()}
                style={{
                  position: 'absolute', top: '50%', left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: 92, height: 92, borderRadius: '50%',
                  overflow: 'hidden', cursor: 'pointer',
                  border: '3px solid rgba(99,102,241,0.5)',
                  background: 'var(--bg-secondary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.8rem', fontWeight: 700, color: '#6366f1',
                }}
              >
                {uploadingPhoto
                  ? <div className="spinner-border spinner-border-sm text-primary" />
                  : avatar
                    ? <img src={avatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <span>{initials || '?'}</span>
                }
                <div style={{
                  position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  opacity: 0, transition: 'opacity 0.2s',
                  borderRadius: '50%', color: '#fff', fontSize: '1.2rem',
                }}
                  onMouseEnter={e => e.currentTarget.style.opacity = 1}
                  onMouseLeave={e => e.currentTarget.style.opacity = 0}
                >📷</div>
              </div>
            </div>
            <div style={{
              position: 'absolute', bottom: 2, right: 2,
              background: completion >= 80 ? '#10b981' : '#f59e0b',
              color: '#fff', borderRadius: 12, fontSize: '0.65rem',
              padding: '2px 7px', fontWeight: 700,
            }}>{completion}%</div>
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: 200 }}>
            <h2 style={{ margin: 0, fontWeight: 800, fontSize: '1.7rem', color: 'var(--text)' }}>
              {user?.firstName} {user?.lastName}
            </h2>
            <p style={{ color: 'var(--text-secondary)', margin: '4px 0 12px', fontSize: '0.9rem' }}>{user?.email}</p>
            <div className="d-flex flex-wrap gap-2">
              <Badge label="Email" verified={user?.emailVerified}
                onClick={!user?.emailVerified ? requestEmailVerification : null}
                loading={emailVerifyLoading} />
              <Badge label="Mobile" verified={user?.mobileVerified}
                onClick={!user?.mobileVerified ? requestMobileOtp : null}
                loading={mobileVerifyLoading} />
              {user?.occupation && (
                <span style={{ background: 'rgba(99,102,241,0.1)', color: '#6366f1', borderRadius: 20, padding: '3px 10px', fontSize: '0.72rem', fontWeight: 600 }}>
                  💼 {user.occupation}
                </span>
              )}
              {user?.state && (
                <span style={{ background: 'rgba(14,165,233,0.1)', color: '#0ea5e9', borderRadius: 20, padding: '3px 10px', fontSize: '0.72rem', fontWeight: 600 }}>
                  📍 {user.state}
                </span>
              )}
            </div>
          </div>

          {/* Photo Controls */}
          <div className="d-flex flex-column gap-2">
            <button className="btn btn-glass btn-sm" onClick={() => fileRef.current.click()}>📷 Change Photo</button>
            {avatar && <button className="btn btn-sm" style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10 }} onClick={removePhoto}>🗑️ Remove</button>}
          </div>
        </div>
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFileSelect} style={{ display: 'none' }} />
      </div>

      {/* OTP Input */}
      {showOtpInput && (
        <div className="glass-card mb-4 print-hide" style={{ padding: 20, borderRadius: 16 }}>
          <p className="mb-2 fw-semibold">Enter the OTP sent to {user?.mobile}:</p>
          {mockOtp && (
            <div className="alert alert-info mb-3 py-2 small" style={{ maxWidth: 400, background: 'rgba(13,202,240,0.12)', color: '#0dcaf0', border: '1px solid rgba(13,202,240,0.3)', borderRadius: 12 }}>
              💡 <strong>Mock Mode:</strong> SMS is not configured. Use this OTP to verify: <strong style={{ fontSize: '1.1rem', color: '#fff' }}>{mockOtp}</strong>
            </div>
          )}
          <div className="d-flex gap-2">
            <input className="form-control" placeholder="6-digit OTP" value={otpInput}
              onChange={e => setOtpInput(e.target.value)} maxLength={6} style={{ maxWidth: 200 }} />
            <button className="btn btn-glass" onClick={confirmMobileOtp}>Verify</button>
            <button className="btn btn-sm" style={{ background: 'none', color: 'var(--text-secondary)' }}
              onClick={() => setShowOtpInput(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* Crop Modal */}
      {cropSrc && <ImageCropModal imageSrc={cropSrc} onConfirm={handleCropConfirm} onCancel={() => setCropSrc(null)} />}

      {/* Tabs */}
      <div className="print-hide" style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            style={{
              padding: '9px 18px', borderRadius: 12, fontWeight: 600, fontSize: '0.85rem',
              border: 'none', cursor: 'pointer', transition: 'all 0.2s',
              background: activeTab === t.id ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : 'var(--glass)',
              color: activeTab === t.id ? '#fff' : 'var(--text-secondary)',
              boxShadow: activeTab === t.id ? '0 4px 15px rgba(99,102,241,0.35)' : 'none',
            }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="print-hide">
        {activeTab === 'personal' && <PersonalTab form={form} setForm={setForm} saving={saving} onSave={saveProfile} onExportPdf={exportPdf} />}
        {activeTab === 'security' && (
          <SecurityTab sessions={sessions} loading={sessionsLoading} onRevoke={revokeSession}
            onLogoutAll={logoutAll} logoutAllLoading={logoutAllLoading}
            pwForm={pwForm} setPwForm={setPwForm} showPw={showPw} setShowPw={setShowPw}
            pwSaving={pwSaving} onChangePw={changePassword} pwStrength={pwStrength}
            lastLogin={user?.lastLogin} lastDevice={user?.lastLoginDevice} />
        )}
        {activeTab === 'timeline' && (
          <TimelineTab timeline={timeline} filter={timelineFilter} setFilter={setTimelineFilter} loading={timelineLoading} />
        )}
        {activeTab === 'achievements' && (
          <AchievementsTab achievements={achievements} stats={stats} loading={statsLoading} />
        )}
        {activeTab === 'preferences' && (
          <PreferencesTab prefs={prefs} setPrefs={setPrefs} saving={prefsSaving} onSave={savePreferences} />
        )}
        {activeTab === 'privacy' && (
          <PrivacyTab onDownload={downloadData} onExportCsv={exportCsv} onExportPdf={exportPdf}
            deletePassword={deletePassword} setDeletePassword={setDeletePassword}
            showDeleteConfirm={showDeleteConfirm} setShowDeleteConfirm={setShowDeleteConfirm}
            onDeleteAccount={deleteAccount} deleting={deletingAccount} />
        )}
      </div>

      {/* ─── Printable Profile PDF Report ───────────────────────────────────────── */}
      <div id="printable-profile-report">
        <div style={{ borderBottom: '3px solid #6366f1', paddingBottom: 15, marginBottom: 30, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '2rem', color: '#1a1a2e', fontWeight: 800 }}>⚖️ CitizenLex Profile Report</h1>
            <p style={{ margin: '4px 0 0', color: '#4a5568', fontSize: '0.85rem' }}>Generated on {new Date().toLocaleString()}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '1.2rem', fontWeight: 700, color: '#6366f1' }}>Official User Account</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 40, marginBottom: 30 }}>
          <div style={{ flex: 1 }}>
            <h3 style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: 8, color: '#2d3748', fontSize: '1.2rem' }}>Account Details</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 12 }}>
              <tbody>
                <tr>
                  <td style={{ padding: '8px 0', fontWeight: 600, width: 180 }}>Full Name:</td>
                  <td style={{ padding: '8px 0' }}>{user?.firstName} {user?.lastName}</td>
                </tr>
                <tr>
                  <td style={{ padding: '8px 0', fontWeight: 600 }}>Email Address:</td>
                  <td style={{ padding: '8px 0' }}>{user?.email}</td>
                </tr>
                <tr>
                  <td style={{ padding: '8px 0', fontWeight: 600 }}>Mobile Number:</td>
                  <td style={{ padding: '8px 0' }}>{user?.mobile || 'Not specified'}</td>
                </tr>
                <tr>
                  <td style={{ padding: '8px 0', fontWeight: 600 }}>Date of Birth:</td>
                  <td style={{ padding: '8px 0' }}>{user?.dateOfBirth || 'Not specified'}</td>
                </tr>
                <tr>
                  <td style={{ padding: '8px 0', fontWeight: 600 }}>Gender:</td>
                  <td style={{ padding: '8px 0' }}>{user?.gender || 'Not specified'}</td>
                </tr>
                <tr>
                  <td style={{ padding: '8px 0', fontWeight: 600 }}>Preferred Language:</td>
                  <td style={{ padding: '8px 0' }}>{user?.preferredLanguage || 'Not specified'}</td>
                </tr>
                <tr>
                  <td style={{ padding: '8px 0', fontWeight: 600 }}>Occupation:</td>
                  <td style={{ padding: '8px 0' }}>{user?.occupation || 'Not specified'}</td>
                </tr>
                <tr>
                  <td style={{ padding: '8px 0', fontWeight: 600 }}>Location:</td>
                  <td style={{ padding: '8px 0' }}>{[user?.district, user?.state].filter(Boolean).join(', ') || 'Not specified'}</td>
                </tr>
                <tr>
                  <td style={{ padding: '8px 0', fontWeight: 600 }}>Address:</td>
                  <td style={{ padding: '8px 0' }}>{user?.address || 'Not specified'}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div style={{ width: 220, textAlign: 'center' }}>
            <h3 style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: 8, color: '#2d3748', fontSize: '1.2rem' }}>Verifications</h3>
            <div style={{ marginTop: 20 }}>
              <div style={{ display: 'inline-block', border: `2px solid ${user?.emailVerified ? '#10b981' : '#ef4444'}`, borderRadius: 12, padding: '10px 20px', marginBottom: 15, width: '100%', background: '#fff' }}>
                <span style={{ fontSize: '1.5rem' }}>{user?.emailVerified ? '✅' : '❌'}</span>
                <div style={{ fontWeight: 700, marginTop: 4 }}>Email Verified</div>
              </div>
              <div style={{ display: 'inline-block', border: `2px solid ${user?.mobileVerified ? '#10b981' : '#ef4444'}`, borderRadius: 12, padding: '10px 20px', width: '100%', background: '#fff' }}>
                <span style={{ fontSize: '1.5rem' }}>{user?.mobileVerified ? '✅' : '❌'}</span>
                <div style={{ fontWeight: 700, marginTop: 4 }}>Mobile Verified</div>
              </div>
              <div style={{ marginTop: 24, fontSize: '0.8rem', color: '#718096' }}>
                Profile Completion Score: <strong>{completion}%</strong>
              </div>
            </div>
          </div>
        </div>

        <h3 style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: 8, color: '#2d3748', fontSize: '1.2rem', marginTop: 40 }}>System Activity Summary</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 15, marginTop: 15 }}>
          {[
            { label: 'AI Chats', value: stats.aiChats || 0 },
            { label: 'Rights Viewed', value: stats.rightsViewed || 0 },
            { label: 'Schemes Explored', value: stats.schemesViewed || 0 },
            { label: 'OCR Scans', value: stats.ocrScans || 0 },
            { label: 'Drafts Created', value: stats.drafts || 0 },
            { label: 'Bookmarks Saved', value: stats.bookmarks || 0 },
            { label: 'Total Logins', value: stats.totalLogins || 0 },
            { label: 'Active Sessions', value: stats.activeSessions || 0 },
          ].map(s => (
            <div key={s.label} style={{ background: '#f7fafc', border: '1px solid #edf2f7', padding: 15, borderRadius: 8, textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#6366f1' }}>{s.value}</div>
              <div style={{ fontSize: '0.75rem', color: '#718096', fontWeight: 600, marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>

        <h3 style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: 8, color: '#2d3748', fontSize: '1.2rem', marginTop: 40 }}>Unlocked Badges</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 15, marginTop: 15 }}>
          {achievements.filter(a => a.unlocked).map(a => (
            <div key={a.name} style={{ border: '1px solid #cbd5e0', borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10, background: '#fff' }}>
              <span style={{ fontSize: '1.5rem' }}>{a.icon}</span>
              <div>
                <strong style={{ fontSize: '0.85rem', color: '#2d3748' }}>{a.name}</strong>
                <div style={{ fontSize: '0.7rem', color: '#718096' }}>{a.description}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 80, borderTop: '1px dashed #cbd5e0', paddingTop: 20, display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#718096' }}>
          <span>© CitizenLex Digital Rights Platform. All rights reserved.</span>
          <span>Verified Secure Profile Audit Signature: _______________________</span>
        </div>
      </div>

      <style>{`
        @keyframes slideIn { from { opacity:0; transform:translateX(20px); } to { opacity:1; transform:translateX(0); } }
        .profile-page-wrap .glass-card {
          background: var(--glass, rgba(255,255,255,0.04));
          border: 1px solid var(--border, rgba(255,255,255,0.1));
          backdrop-filter: blur(12px);
        }
        #printable-profile-report {
          display: none;
        }
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-profile-report, #printable-profile-report * {
            visibility: visible;
          }
          #printable-profile-report {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            display: block !important;
            color: #000 !important;
            background: #fff !important;
          }
          .print-hide {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}

// ─── Personal Info Tab ─────────────────────────────────────────────────────────
function PersonalTab({ form, setForm, saving, onSave, onExportPdf }) {
  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));
  const Field = ({ label, name, type = 'text', children }) => (
    <div className="mb-3">
      <label className="form-label small fw-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>{label}</label>
      {children || (
        <input type={type} className="form-control" value={form[name] || ''}
          onChange={e => set(name, e.target.value)}
          style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 12 }} />
      )}
    </div>
  );

  return (
    <div className="glass-card" style={{ borderRadius: 20, padding: 32 }}>
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <h5 className="fw-bold mb-0">Personal Information</h5>
        <button className="btn btn-sm btn-glass" onClick={onExportPdf}>📄 Export Profile PDF</button>
      </div>
      <div className="row g-3">
        <div className="col-md-6"><Field label="First Name" name="firstName" /></div>
        <div className="col-md-6"><Field label="Last Name" name="lastName" /></div>
        <div className="col-md-6"><Field label="Mobile Number" name="mobile" type="tel" /></div>
        <div className="col-md-6"><Field label="Date of Birth" name="dateOfBirth" type="date" /></div>
        <div className="col-md-6">
          <Field label="Gender" name="gender">
            <select className="form-select" value={form.gender || ''} onChange={e => set('gender', e.target.value)}
              style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 12 }}>
              <option value="">Select Gender</option>
              {['Male', 'Female', 'Non-binary', 'Prefer not to say'].map(g => <option key={g}>{g}</option>)}
            </select>
          </Field>
        </div>
        <div className="col-md-6">
          <Field label="State" name="state">
            <select className="form-select" value={form.state || ''} onChange={e => set('state', e.target.value)}
              style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 12 }}>
              <option value="">Select State</option>
              {STATES.map(s => <option key={s}>{s}</option>)}
            </select>
          </Field>
        </div>
        <div className="col-md-6"><Field label="District" name="district" /></div>
        <div className="col-md-6"><Field label="Occupation" name="occupation" /></div>
        <div className="col-md-6">
          <Field label="Preferred Language" name="preferredLanguage">
            <select className="form-select" value={form.preferredLanguage || ''} onChange={e => set('preferredLanguage', e.target.value)}
              style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 12 }}>
              <option value="">Select Language</option>
              {['English','Hindi','Tamil','Telugu','Kannada','Malayalam','Bengali','Marathi','Gujarati','Punjabi','Odia','Urdu'].map(l => <option key={l}>{l}</option>)}
            </select>
          </Field>
        </div>
        <div className="col-12">
          <Field label="Address" name="address">
            <textarea className="form-control" rows={3} value={form.address || ''} onChange={e => set('address', e.target.value)}
              style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 12, resize: 'vertical' }} />
          </Field>
        </div>
      </div>
      <div className="mt-4 text-end">
        <button className="btn btn-glass px-5 py-2 fw-semibold" onClick={onSave} disabled={saving}>
          {saving ? <><span className="spinner-border spinner-border-sm me-2" />Saving...</> : '💾 Save Changes'}
        </button>
      </div>
    </div>
  );
}

// ─── Security Tab ──────────────────────────────────────────────────────────────
function SecurityTab({ sessions, loading, onRevoke, onLogoutAll, logoutAllLoading, pwForm, setPwForm,
  showPw, setShowPw, pwSaving, onChangePw, pwStrength, lastLogin, lastDevice }) {
  const strength = pwStrength(pwForm.next);
  const strengthColors = ['#ef4444', '#f59e0b', '#eab308', '#10b981'];
  const strengthLabels = ['Weak', 'Fair', 'Good', 'Strong'];

  return (
    <div className="d-flex flex-column gap-4">
      {/* Change Password */}
      <div className="glass-card" style={{ borderRadius: 20, padding: 28 }}>
        <h6 className="fw-bold mb-4">🔑 Change Password</h6>
        {['current', 'next', 'confirm'].map((k, i) => (
          <div key={k} className="mb-3 position-relative">
            <label className="form-label small fw-semibold" style={{ color: 'var(--text-secondary)' }}>
              {['Current Password', 'New Password', 'Confirm New Password'][i]}
            </label>
            <div className="d-flex">
              <input
                type={showPw[k] ? 'text' : 'password'} className="form-control"
                value={pwForm[k]} onChange={e => setPwForm(p => ({ ...p, [k]: e.target.value }))}
                style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: '12px 0 0 12px' }} />
              <button onClick={() => setShowPw(p => ({ ...p, [k]: !p[k] }))}
                style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderLeft: 'none', borderRadius: '0 12px 12px 0', padding: '0 14px', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                {showPw[k] ? '🙈' : '👁️'}
              </button>
            </div>
          </div>
        ))}
        {pwForm.next && (
          <div className="mb-3">
            <div className="d-flex gap-1 mb-1">
              {[0, 1, 2, 3].map(i => (
                <div key={i} style={{ height: 4, flex: 1, borderRadius: 4, background: i < strength ? strengthColors[strength - 1] : 'rgba(255,255,255,0.1)', transition: 'background 0.3s' }} />
              ))}
            </div>
            <small style={{ color: strength > 0 ? strengthColors[strength - 1] : 'var(--text-secondary)' }}>
              {strength > 0 ? strengthLabels[strength - 1] : ''}
            </small>
          </div>
        )}
        <button className="btn btn-glass" onClick={onChangePw} disabled={pwSaving}>
          {pwSaving ? <span className="spinner-border spinner-border-sm" /> : '🔐 Change Password'}
        </button>
      </div>

      {/* Last Login */}
      {lastLogin && (
        <div className="glass-card" style={{ borderRadius: 20, padding: 24 }}>
          <h6 className="fw-bold mb-3">🕐 Last Login</h6>
          <p className="mb-1"><strong>Time:</strong> {new Date(lastLogin).toLocaleString()}</p>
          <p className="mb-0"><strong>Device:</strong> {lastDevice || 'Unknown'}</p>
        </div>
      )}

      {/* Active Sessions */}
      <div className="glass-card" style={{ borderRadius: 20, padding: 28 }}>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h6 className="fw-bold mb-0">📱 Active Sessions</h6>
          <button className="btn btn-sm" style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10 }}
            onClick={onLogoutAll} disabled={logoutAllLoading}>
            {logoutAllLoading ? '...' : '🚪 Logout All Devices'}
          </button>
        </div>
        {loading ? <div className="text-center py-3"><span className="spinner-border spinner-border-sm" /></div>
          : sessions.length === 0 ? <p className="text-secondary text-center">No active sessions.</p>
          : sessions.map(s => (
            <div key={s.id} className="d-flex justify-content-between align-items-center py-3"
              style={{ borderBottom: '1px solid var(--border)' }}>
              <div>
                <p className="mb-0 fw-semibold">{s.deviceInfo}</p>
                <small className="text-secondary">{s.ipAddress} · Login: {s.loginTime}</small>
              </div>
              <button onClick={() => onRevoke(s.id)}
                style={{ background: 'none', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', borderRadius: 8, padding: '4px 12px', cursor: 'pointer', fontSize: '0.8rem' }}>
                Revoke
              </button>
            </div>
          ))
        }
      </div>
    </div>
  );
}

// ─── Timeline Tab ──────────────────────────────────────────────────────────────
function TimelineTab({ timeline, filter, setFilter, loading }) {
  const filters = [['today', 'Today'], ['week', 'This Week'], ['month', 'This Month'], ['all', 'All Time']];
  return (
    <div className="glass-card" style={{ borderRadius: 20, padding: 28 }}>
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <h5 className="fw-bold mb-0">📅 Activity Timeline</h5>
        <div className="d-flex gap-2 flex-wrap">
          {filters.map(([val, label]) => (
            <button key={val} onClick={() => setFilter(val)}
              style={{
                padding: '5px 14px', borderRadius: 20, fontSize: '0.8rem', border: 'none', cursor: 'pointer',
                background: filter === val ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : 'var(--bg-secondary)',
                color: filter === val ? '#fff' : 'var(--text-secondary)', fontWeight: 600,
              }}>{label}</button>
          ))}
        </div>
      </div>
      {loading ? <div className="text-center py-5"><span className="spinner-border" /></div>
        : timeline.length === 0 ? <p className="text-center text-secondary py-4">No activity recorded yet.</p>
        : (
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', left: 22, top: 0, bottom: 0, width: 2, background: 'rgba(99,102,241,0.2)' }} />
            {timeline.map(item => (
              <div key={item.id} className="d-flex gap-3 mb-3" style={{ position: 'relative' }}>
                <div style={{
                  width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                  background: `${item.color}22`, border: `2px solid ${item.color}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', zIndex: 1,
                }}>
                  {item.icon}
                </div>
                <div style={{ paddingTop: 6 }}>
                  <p className="mb-0 fw-semibold" style={{ fontSize: '0.9rem' }}>{item.details || item.action}</p>
                  <small style={{ color: 'var(--text-secondary)' }}>{item.timestamp}</small>
                </div>
              </div>
            ))}
          </div>
        )
      }
    </div>
  );
}

// ─── Achievements Tab ──────────────────────────────────────────────────────────
function AchievementsTab({ achievements, stats, loading }) {
  const statCards = [
    { label: 'AI Chats', value: stats.aiChats || 0, icon: '🤖', color: '#06b6d4' },
    { label: 'Rights Viewed', value: stats.rightsViewed || 0, icon: '⚖️', color: '#10b981' },
    { label: 'Schemes Explored', value: stats.schemesViewed || 0, icon: '📋', color: '#8b5cf6' },
    { label: 'OCR Scans', value: stats.ocrScans || 0, icon: '📷', color: '#f59e0b' },
    { label: 'Drafts Created', value: stats.drafts || 0, icon: '📝', color: '#3b82f6' },
    { label: 'Bookmarks', value: stats.bookmarks || 0, icon: '🔖', color: '#ef4444' },
    { label: 'Total Logins', value: stats.totalLogins || 0, icon: '🔐', color: '#6366f1' },
    { label: 'Active Sessions', value: stats.activeSessions || 0, icon: '📱', color: '#14b8a6' },
  ];

  // Doughnut Chart Data mapping activity breakdown
  const doughnutData = {
    labels: ['AI Copilot', 'OCR Scans', 'Legal Drafts', 'Bookmarks Saved', 'Rights/Schemes Viewed'],
    datasets: [{
      label: 'ActivitiesCount',
      data: [
        stats.aiChats || 0,
        stats.ocrScans || 0,
        stats.drafts || 0,
        stats.bookmarks || 0,
        (stats.rightsViewed || 0) + (stats.schemesViewed || 0)
      ],
      backgroundColor: [
        '#06b6d4',
        '#f59e0b',
        '#3b82f6',
        '#ef4444',
        '#8b5cf6'
      ],
      borderWidth: 0,
      hoverOffset: 12
    }]
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          color: '#e2e8f0',
          font: { family: 'Inter', size: 11, weight: '500' },
          padding: 16
        }
      },
      tooltip: {
        backgroundColor: 'rgba(15,14,23,0.95)',
        titleFont: { size: 13, family: 'Inter' },
        bodyFont: { size: 13, family: 'Inter' },
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8
      }
    },
    cutout: '65%'
  };

  return (
    <div className="d-flex flex-column gap-4">
      {loading ? <div className="text-center py-5"><span className="spinner-border" /></div> : (
        <>
          {/* Stats & Charts row */}
          <div className="row g-4">
            {/* Doughnut Chart Card */}
            <div className="col-md-6">
              <div className="glass-card" style={{ borderRadius: 20, padding: 28, height: '100%', minHeight: 320 }}>
                <h6 className="fw-bold mb-3">📈 Activity Distribution</h6>
                <div style={{ position: 'relative', height: 220 }}>
                  <Doughnut data={doughnutData} options={doughnutOptions} />
                </div>
              </div>
            </div>

            {/* General Stats Column */}
            <div className="col-md-6">
              <div className="glass-card" style={{ borderRadius: 20, padding: 28, height: '100%' }}>
                <h6 className="fw-bold mb-3">📊 Usage Summary</h6>
                <div className="row g-3">
                  {statCards.slice(0, 6).map(({ label, value, icon, color }) => (
                    <div key={label} className="col-6">
                      <div style={{
                        background: `${color}11`, border: `1px solid ${color}22`,
                        borderRadius: 14, padding: '14px 10px', textAlign: 'center'
                      }}>
                        <div style={{ fontSize: '1.4rem', marginBottom: 4 }}>{icon}</div>
                        <div style={{ fontSize: '1.4rem', fontWeight: 800, color }}>{value}</div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>{label}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Achievements list */}
          <div className="glass-card" style={{ borderRadius: 20, padding: 28 }}>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h6 className="fw-bold mb-0">🏆 Achievements & Badges</h6>
              <span style={{ background: 'rgba(99,102,241,0.15)', color: '#6366f1', borderRadius: 20, padding: '4px 12px', fontSize: '0.8rem', fontWeight: 700 }}>
                {achievements.filter(a => a.unlocked).length}/{achievements.length}
              </span>
            </div>
            <div className="row g-3">
              {achievements.map(a => (
                <div key={a.name} className="col-6 col-md-4">
                  <div style={{
                    padding: '16px 14px', borderRadius: 16, textAlign: 'center',
                    background: a.unlocked ? `${a.color}12` : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${a.unlocked ? a.color + '40' : 'rgba(255,255,255,0.06)'}`,
                    opacity: a.unlocked ? 1 : 0.45,
                    transition: 'all 0.2s',
                    filter: a.unlocked ? 'none' : 'grayscale(1)',
                  }}>
                    <div style={{ fontSize: '2rem', marginBottom: 6 }}>{a.icon}</div>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem', color: a.unlocked ? a.color : 'var(--text-secondary)' }}>{a.name}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: 3 }}>{a.description}</div>
                    {a.unlocked && <div style={{ fontSize: '0.68rem', color: a.color, marginTop: 6, fontWeight: 600 }}>✓ Unlocked</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Preferences Tab ───────────────────────────────────────────────────────────
function PreferencesTab({ prefs, setPrefs, saving, onSave }) {
  const Toggle = ({ label, desc, k }) => (
    <div className="d-flex justify-content-between align-items-center py-3" style={{ borderBottom: '1px solid var(--border)' }}>
      <div>
        <p className="mb-0 fw-semibold" style={{ fontSize: '0.9rem' }}>{label}</p>
        <small style={{ color: 'var(--text-secondary)' }}>{desc}</small>
      </div>
      <div className="form-check form-switch mb-0">
        <input className="form-check-input" type="checkbox" checked={!!prefs[k]}
          onChange={e => setPrefs(p => ({ ...p, [k]: e.target.checked }))}
          style={{ width: 44, height: 24, cursor: 'pointer' }} />
      </div>
    </div>
  );

  return (
    <div className="glass-card" style={{ borderRadius: 20, padding: 28 }}>
      <h5 className="fw-bold mb-4">⚙️ Notification Preferences</h5>
      <Toggle label="Email Notifications" desc="Receive updates via email" k="emailNotifications" />
      <Toggle label="Push Notifications" desc="Browser push notifications" k="pushNotifications" />
      <Toggle label="Reminder Notifications" desc="Deadline and activity reminders" k="reminderNotifications" />
      <Toggle label="Marketing Emails" desc="News, offers, and promotions" k="marketingEmails" />
      <Toggle label="Product Updates" desc="New features and improvements" k="productUpdates" />
      <div className="mt-4 text-end">
        <button className="btn btn-glass px-5 py-2 fw-semibold" onClick={onSave} disabled={saving}>
          {saving ? <><span className="spinner-border spinner-border-sm me-2" />Saving...</> : '💾 Save Preferences'}
        </button>
      </div>
    </div>
  );
}

// ─── Privacy Tab ───────────────────────────────────────────────────────────────
function PrivacyTab({ onDownload, onExportCsv, onExportPdf, deletePassword, setDeletePassword, showDeleteConfirm, setShowDeleteConfirm, onDeleteAccount, deleting }) {
  return (
    <div className="d-flex flex-column gap-4">
      <div className="glass-card" style={{ borderRadius: 20, padding: 28 }}>
        <h5 className="fw-bold mb-2">🛡️ Privacy & Data Center</h5>
        <p className="text-secondary small mb-4">Manage your data exports and credentials settings.</p>
        <div className="d-flex flex-column gap-3">
          <button className="btn btn-glass text-start py-3 px-4" onClick={onDownload}>
            <strong>📥 Download My Data (JSON)</strong>
            <p className="mb-0 small text-secondary">Export profile settings, verification statuses, and activity log in JSON format.</p>
          </button>
          <button className="btn btn-glass text-start py-3 px-4" onClick={onExportCsv}>
            <strong>📊 Export Activity Log (CSV)</strong>
            <p className="mb-0 small text-secondary">Download audit logs as a spreadsheet for legal record keeping.</p>
          </button>
          <button className="btn btn-glass text-start py-3 px-4" onClick={onExportPdf}>
            <strong>📄 Print Profile Summary Report (PDF)</strong>
            <p className="mb-0 small text-secondary">Generate and print a certified, professional audit report of your CitizenLex profile.</p>
          </button>
        </div>
      </div>

      {/* Danger Zone */}
      <div style={{ borderRadius: 20, padding: 28, border: '1px solid rgba(239,68,68,0.25)', background: 'rgba(239,68,68,0.04)' }}>
        <h6 className="fw-bold mb-1" style={{ color: '#f87171' }}>⚠️ Danger Zone</h6>
        <p className="text-secondary small mb-4">These actions are permanent and cannot be undone.</p>
        {!showDeleteConfirm ? (
          <button className="btn btn-sm" style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '8px 20px' }}
            onClick={() => setShowDeleteConfirm(true)}>
            🗑️ Delete My Account
          </button>
        ) : (
          <div>
            <p className="fw-semibold mb-2" style={{ color: '#f87171' }}>Enter your password to confirm deletion:</p>
            <div className="d-flex gap-2">
              <input type="password" className="form-control" placeholder="Your password" value={deletePassword}
                onChange={e => setDeletePassword(e.target.value)}
                style={{ background: 'var(--bg-secondary)', border: '1px solid rgba(239,68,68,0.3)', color: 'var(--text)', borderRadius: 12, maxWidth: 250 }} />
              <button className="btn btn-sm" style={{ background: '#ef4444', color: '#fff', borderRadius: 10, padding: '0 18px' }}
                onClick={onDeleteAccount} disabled={deleting}>
                {deleting ? '...' : 'Confirm Delete'}
              </button>
              <button className="btn btn-sm" style={{ background: 'none', color: 'var(--text-secondary)', border: '1px solid var(--border)', borderRadius: 10 }}
                onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
