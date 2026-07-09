import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import ImageCropModal from '../components/ImageCropModal';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

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
      <circle cx="65" cy="65" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="7" />
      <circle cx="65" cy="65" r={r} fill="none"
        stroke="url(#pg-gradient)" strokeWidth="8" strokeLinecap="round"
        strokeDasharray={`${dash} ${circ}`}
        style={{ transition: 'stroke-dasharray 1s ease-out' }} />
      <defs>
        <linearGradient id="pg-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
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
      className="animate-hover"
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '5px 12px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600,
        cursor: onClick ? 'pointer' : 'default',
        background: verified ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.1)',
        color: verified ? '#10b981' : '#f87171',
        border: `1px solid ${verified ? 'rgba(16,185,129,0.22)' : 'rgba(239,68,68,0.22)'}`,
        boxShadow: verified ? '0 0 10px rgba(16,185,129,0.1)' : 'none'
      }}
    >
      {loading ? (
        <span className="spinner-border spinner-border-sm" style={{ width: 10, height: 10 }} />
      ) : verified ? (
        <i className="bi bi-patch-check-fill text-success"></i>
      ) : (
        <i className="bi bi-exclamation-triangle-fill text-danger"></i>
      )}
      {label} {verified ? 'Verified' : 'Unverified'}
    </span>
  );
}

const TABS = [
  { id: 'personal', label: 'Profile Settings', icon: <i className="bi bi-person me-1"></i> },
  { id: 'security', label: 'Security Center', icon: <i className="bi bi-shield-lock me-1"></i> },
  { id: 'timeline', label: 'Activity Timeline', icon: <i className="bi bi-calendar3 me-1"></i> },
  { id: 'achievements', label: 'Badges & Summary', icon: <i className="bi bi-trophy me-1"></i> },
  { id: 'preferences', label: 'Preferences', icon: <i className="bi bi-sliders me-1"></i> },
  { id: 'privacy', label: 'Data & Privacy', icon: <i className="bi bi-eye-slash me-1"></i> },
  { id: 'advocate', label: 'Advocate Portal', icon: <i className="bi bi-balance2 me-1"></i> },
];

const STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat',
  'Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh',
  'Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab',
  'Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand',
  'West Bengal','Delhi','Jammu and Kashmir','Ladakh','Puducherry',
];

export default function Profile() {
  const { user, updateUserProfileState } = useAuth();
  const [activeTab, setActiveTab] = useState('personal');
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);
  const [cropSrc, setCropSrc] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileRef = useRef(null);

  // Security
  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });
  const [showPw, setShowPw] = useState({});
  const [pwSaving, setPwSaving] = useState(false);
  const [logoutAllLoading, setLogoutAllLoading] = useState(false);

  // Timeline
  const [timeline, setTimeline] = useState([]);
  const [timelineFilter, setTimelineFilter] = useState('all');
  const [timelineLoading, setTimelineLoading] = useState(false);

  // Achievements
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

  const saveProfile = async () => {
    setSaving(true);
    try {
      const res = await axios.put(`${API}/api/profile/update`, form);
      updateUserProfileState(res.data);
      showMsg('Profile details updated!');
    } catch (e) {
      showMsg(e.response?.data?.error || 'Failed to update details.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { showMsg('File size must be under 5 MB.', 'error'); return; }
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
      showMsg('Profile avatar updated successfully!');
    } catch (e) {
      showMsg(e.response?.data?.error || 'Upload failed. Check parameters.', 'error');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const removePhoto = async () => {
    if (!user?.profileImageUrl) return;
    try {
      const res = await axios.delete(`${API}/api/profile/remove-photo`);
      updateUserProfileState(res.data);
      showMsg('Custom avatar removed.');
    } catch (e) {
      showMsg('Failed to delete avatar.', 'error');
    }
  };

  const requestEmailVerification = async () => {
    setEmailVerifyLoading(true);
    try {
      const res = await axios.post(`${API}/api/verify/email/request`);
      showMsg(res.data.message || 'Verification email sent!');
    } catch (e) {
      showMsg(e.response?.data?.error || 'Failed to send mail.', 'error');
    } finally {
      setEmailVerifyLoading(false);
    }
  };

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
      showMsg(e.response?.data?.error || 'OTP request failed.', 'error');
    } finally {
      setMobileVerifyLoading(false);
    }
  };

  const confirmMobileOtp = async () => {
    try {
      const res = await axios.post(`${API}/api/verify/mobile/confirm`, { otp: otpInput });
      updateUserProfileState(res.data.user);
      showMsg('Mobile successfully verified!');
      setShowOtpInput(false);
      setOtpInput('');
    } catch (e) {
      showMsg(e.response?.data?.error || 'Verification failed.', 'error');
    }
  };

  const loadSessions = async () => {
    setSessionsLoading(true);
    try {
      const res = await axios.get(`${API}/api/security/sessions`);
      setSessions(Array.isArray(res.data) ? res.data : []);
    } catch (e) {}
    finally { setSessionsLoading(false); }
  };

  const revokeSession = async (id) => {
    try {
      await axios.delete(`${API}/api/security/sessions/${id}`);
      setSessions(prev => prev.filter(s => s.id !== id));
      showMsg('Session terminated.');
    } catch (e) {
      showMsg('Could not terminate session.', 'error');
    }
  };

  const logoutAll = async () => {
    setLogoutAllLoading(true);
    try {
      const res = await axios.post(`${API}/api/security/logout-all`);
      showMsg(res.data.message);
      setSessions([]);
    } catch (e) {
      showMsg('Logout all failed.', 'error');
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
      showMsg('Password changed successfully!');
      setPwForm({ current: '', next: '', confirm: '' });
    } catch (e) {
      showMsg(e.response?.data?.error || 'Failed to update credentials.', 'error');
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

  const loadTimeline = async (filter) => {
    setTimelineLoading(true);
    try {
      const res = await axios.get(`${API}/api/stats/timeline?filter=${filter}`);
      setTimeline(res.data.timeline || []);
    } catch (e) {}
    finally { setTimelineLoading(false); }
  };

  const loadAchievements = async () => {
    setStatsLoading(true);
    try {
      const [achRes, sumRes] = await Promise.all([
        axios.get(`${API}/api/stats/achievements`),
        axios.get(`${API}/api/stats/summary`),
      ]);
      setAchievements(achRes.data.achievements || []);
      setStats(sumRes.data || {});
    } catch (e) {}
    finally { setStatsLoading(false); }
  };

  const savePreferences = async () => {
    setPrefsSaving(true);
    try {
      const res = await axios.put(`${API}/api/stats/preferences`, prefs);
      updateUserProfileState(res.data);
      showMsg('Preferences saved!');
    } catch (e) {
      showMsg('Could not update preferences.', 'error');
    } finally { setPrefsSaving(false); }
  };

  const downloadData = () => { window.open(`${API}/api/stats/download-data`, '_blank'); };
  const exportCsv = () => { window.open(`${API}/api/stats/export-activity`, '_blank'); };
  const exportPdf = () => { window.print(); };

  const deleteAccount = async () => {
    setDeletingAccount(true);
    try {
      await axios.delete(`${API}/api/stats/delete-account`, { data: { password: deletePassword } });
      window.location.href = '/login';
    } catch (e) {
      showMsg(e.response?.data?.error || 'Password verification failed.', 'error');
    } finally {
      setDeletingAccount(false);
    }
  };

  const avatar = user?.profileImageUrl;
  const initials = `${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`.toUpperCase();

  return (
    <div className="profile-page-wrap text-start" style={{ minHeight: '100vh', padding: '40px 20px 60px', maxWidth: 1100, margin: '0 auto' }}>
      {/* Toast Alert */}
      {msg && (
        <div style={{
          position: 'fixed', top: 24, right: 24, zIndex: 9999,
          background: msg.type === 'error' ? 'rgba(239,68,68,0.95)' : 'rgba(16,185,129,0.95)',
          color: '#fff', padding: '14px 22px', borderRadius: 14,
          boxShadow: 'var(--shadow-lg)', fontWeight: 600, fontSize: '0.9rem',
          animation: 'slideIn 0.3s ease',
        }}>
          {msg.type === 'error' ? '❌ ' : '✅ '}{msg.text}
        </div>
      )}

      {/* Premium Profile Header Card */}
      <div className="glass-panel mb-4 print-hide" style={{
        background: 'linear-gradient(135deg, rgba(99,102,241,0.05) 0%, rgba(168,85,247,0.03) 100%)',
        border: '1px solid var(--border)', borderRadius: 24, padding: '36px',
      }}>
        <div className="d-flex align-items-center gap-4 flex-wrap">
          {/* Avatar Ring */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div style={{ position: 'relative', width: 130, height: 130 }}>
              <ProgressRing pct={completion} />
              <div
                onClick={() => fileRef.current.click()}
                style={{
                  position: 'absolute', top: '50%', left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: 96, height: 96, borderRadius: '50%',
                  overflow: 'hidden', cursor: 'pointer',
                  border: '3px solid rgba(99,102,241,0.5)',
                  background: 'var(--bg-secondary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.8rem', fontWeight: 700, color: '#6366f1',
                }}
              >
                {uploadingPhoto ? (
                  <div className="spinner-border spinner-border-sm text-primary" />
                ) : avatar ? (
                  <img src={avatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span>{initials || '?'}</span>
                )}
                <div style={{
                  position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)',
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
            }}>{completion}% Profile Score</div>
          </div>

          {/* User Meta */}
          <div style={{ flex: 1, minWidth: 200 }}>
            <h2 className="text-white fw-bold mb-1" style={{ fontSize: '1.8rem', letterSpacing: '-0.5px' }}>
              {user?.firstName} {user?.lastName}
            </h2>
            <p className="text-secondary small mb-3">{user?.email}</p>
            <div className="d-flex flex-wrap gap-2">
              <Badge label="Email" verified={user?.emailVerified}
                onClick={!user?.emailVerified ? requestEmailVerification : null}
                loading={emailVerifyLoading} />
              <Badge label="Mobile" verified={user?.mobileVerified}
                onClick={!user?.mobileVerified ? requestMobileOtp : null}
                loading={mobileVerifyLoading} />
              {user?.occupation && (
                <span style={{ background: 'rgba(99,102,241,0.1)', color: '#818cf8', borderRadius: 20, padding: '4px 12px', fontSize: '0.72rem', fontWeight: 600 }}>
                  💼 {user.occupation}
                </span>
              )}
              {user?.state && (
                <span style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', borderRadius: 20, padding: '4px 12px', fontSize: '0.72rem', fontWeight: 600 }}>
                  📍 {user.state}
                </span>
              )}
            </div>
          </div>

          <div className="d-flex flex-column gap-2">
            <button className="btn btn-glass btn-sm" onClick={() => fileRef.current.click()}>📷 Upload Avatar</button>
            {avatar && <button className="btn btn-sm text-danger" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10 }} onClick={removePhoto}>Remove Photo</button>}
          </div>
        </div>
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFileSelect} style={{ display: 'none' }} />
      </div>

      {/* Mock OTP Display */}
      {showOtpInput && (
        <div className="glass-panel mb-4 p-4 print-hide" style={{ borderRadius: 18, border: '1px solid var(--border)' }}>
          <p className="mb-2 fw-semibold text-white">Enter validation OTP sent to your device:</p>
          {mockOtp && (
            <div className="alert alert-info mb-3 py-2 small" style={{ maxWidth: 420, background: 'rgba(99,102,241,0.1)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.2)' }}>
              💡 <strong>Mock Mode Sandbox:</strong> Use this mock OTP: <strong style={{ fontSize: '1.1rem', color: '#fff' }}>{mockOtp}</strong>
            </div>
          )}
          <div className="d-flex gap-2">
            <input className="form-control form-glass-control" placeholder="6-digit code" value={otpInput}
              onChange={e => setOtpInput(e.target.value)} maxLength={6} style={{ maxWidth: 180 }} />
            <button className="btn btn-glass" onClick={confirmMobileOtp}>Verify OTP</button>
            <button className="btn btn-glass-secondary btn-sm" onClick={() => setShowOtpInput(false)}>Cancel</button>
          </div>
        </div>
      )}

      {cropSrc && <ImageCropModal imageSrc={cropSrc} onConfirm={handleCropConfirm} onCancel={() => setCropSrc(null)} />}

      {/* Tabs Menu */}
      <div className="print-hide d-flex gap-2 mb-4 flex-wrap">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            style={{
              padding: '10px 18px', borderRadius: 12, fontWeight: 600, fontSize: '0.85rem',
              border: 'none', cursor: 'pointer', transition: 'all 0.25s',
              background: activeTab === t.id ? 'linear-gradient(135deg,#6366f1,#a855f7)' : 'rgba(255,255,255,0.03)',
              color: activeTab === t.id ? '#fff' : 'var(--text-secondary)',
              boxShadow: activeTab === t.id ? '0 4px 15px rgba(99,102,241,0.3)' : 'none',
            }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Tabs Render */}
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
        {activeTab === 'advocate' && <AdvocateTab />}
      </div>

      {/* Printable Report PDF */}
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

// Personal Info Tab
function PersonalTab({ form, setForm, saving, onSave, onExportPdf }) {
  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));
  const Field = ({ label, name, type = 'text', children }) => (
    <div className="mb-3">
      <label className="form-label small fw-semibold text-secondary mb-1">{label}</label>
      {children || (
        <input type={type} className="form-control form-glass-control" value={form[name] || ''}
          onChange={e => set(name, e.target.value)}
          style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 12 }} />
      )}
    </div>
  );

  return (
    <div className="glass-panel" style={{ borderRadius: 20, padding: 32, background: 'var(--surface)' }}>
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <h5 className="fw-bold mb-0 text-white">Personal Information</h5>
        <button className="btn btn-sm btn-glass-secondary animate-hover" onClick={onExportPdf}>📄 Export Profile Report (PDF)</button>
      </div>
      <div className="row g-3">
        <div className="col-md-6"><Field label="First Name" name="firstName" /></div>
        <div className="col-md-6"><Field label="Last Name" name="lastName" /></div>
        <div className="col-md-6"><Field label="Mobile Number" name="mobile" type="tel" /></div>
        <div className="col-md-6"><Field label="Date of Birth" name="dateOfBirth" type="date" /></div>
        <div className="col-md-6">
          <Field label="Gender" name="gender">
            <select className="form-select form-glass-control" value={form.gender || ''} onChange={e => set('gender', e.target.value)}
              style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 12 }}>
              <option value="">Select Gender</option>
              {['Male', 'Female', 'Non-binary', 'Prefer not to say'].map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </Field>
        </div>
        <div className="col-md-6">
          <Field label="State" name="state">
            <select className="form-select form-glass-control" value={form.state || ''} onChange={e => set('state', e.target.value)}
              style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 12 }}>
              <option value="">Select State</option>
              {STATES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
        </div>
        <div className="col-md-6"><Field label="District" name="district" /></div>
        <div className="col-md-6"><Field label="Occupation" name="occupation" /></div>
        <div className="col-md-6">
          <Field label="Preferred Language" name="preferredLanguage">
            <select className="form-select form-glass-control" value={form.preferredLanguage || ''} onChange={e => set('preferredLanguage', e.target.value)}
              style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 12 }}>
              <option value="">Select Language</option>
              {['English','Hindi','Tamil','Telugu','Kannada','Malayalam','Bengali','Marathi','Gujarati','Punjabi','Odia','Urdu'].map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </Field>
        </div>
        <div className="col-12">
          <Field label="Address" name="address">
            <textarea className="form-control form-glass-control" rows={3} value={form.address || ''} onChange={e => set('address', e.target.value)}
              style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 12, resize: 'vertical' }} />
          </Field>
        </div>
      </div>
      <div className="mt-4 text-end">
        <button className="btn btn-glass px-5 py-2.5 fw-semibold" onClick={onSave} disabled={saving} style={{
          background: 'linear-gradient(135deg, #6366f1, #a855f7)',
          border: 'none',
          borderRadius: 12
        }}>
          {saving ? <><span className="spinner-border spinner-border-sm me-2" />Saving...</> : '💾 Save Changes'}
        </button>
      </div>
    </div>
  );
}

// Security Tab
function SecurityTab({ sessions, loading, onRevoke, onLogoutAll, logoutAllLoading, pwForm, setPwForm,
  showPw, setShowPw, pwSaving, onChangePw, pwStrength, lastLogin, lastDevice }) {
  const strength = pwStrength(pwForm.next);
  const strengthColors = ['#ef4444', '#f59e0b', '#eab308', '#10b981'];
  const strengthLabels = ['Weak', 'Fair', 'Good', 'Strong'];

  return (
    <div className="d-flex flex-column gap-4">
      {/* Change Password */}
      <div className="glass-panel" style={{ borderRadius: 20, padding: 28, background: 'var(--surface)' }}>
        <h6 className="fw-bold mb-4 text-white"><i className="bi bi-key-fill text-warning me-1.5"></i> Change Credentials Password</h6>
        {['current', 'next', 'confirm'].map((k, i) => (
          <div key={k} className="mb-3 position-relative text-start">
            <label className="form-label small fw-semibold text-secondary mb-1">
              {['Current Password', 'New Password', 'Confirm New Password'][i]}
            </label>
            <div className="d-flex">
              <input
                type={showPw[k] ? 'text' : 'password'} className="form-control form-glass-control"
                value={pwForm[k]} onChange={e => setPwForm(p => ({ ...p, [k]: e.target.value }))}
                style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '12px 0 0 12px' }} />
              <button onClick={() => setShowPw(p => ({ ...p, [k]: !p[k] }))}
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderLeft: 'none', borderRadius: '0 12px 12px 0', padding: '0 14px', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                {showPw[k] ? <i className="bi bi-eye-slash"></i> : <i className="bi bi-eye"></i>}
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
            <small style={{ color: strength > 0 ? strengthColors[strength - 1] : 'var(--text-secondary)', fontWeight: 600 }}>
              {strength > 0 ? strengthLabels[strength - 1] : ''}
            </small>
          </div>
        )}
        <button className="btn btn-glass mt-2" onClick={onChangePw} disabled={pwSaving} style={{
          background: 'linear-gradient(135deg, #6366f1, #a855f7)',
          border: 'none',
          borderRadius: 12,
          padding: '10px 24px'
        }}>
          {pwSaving ? <span className="spinner-border spinner-border-sm" /> : '🔐 Change Password'}
        </button>
      </div>

      {/* Last Login Info */}
      {lastLogin && (
        <div className="glass-panel p-4" style={{ borderRadius: 20, background: 'var(--surface)' }}>
          <h6 className="fw-bold mb-3 text-white"><i className="bi bi-clock-history text-primary me-1.5"></i> Last Login Session Info</h6>
          <p className="mb-1 text-white-50"><strong>Time:</strong> {new Date(lastLogin).toLocaleString()}</p>
          <p className="mb-0 text-white-50"><strong>Device:</strong> {lastDevice || 'Unknown'}</p>
        </div>
      )}

      {/* Active Sessions */}
      <div className="glass-panel" style={{ borderRadius: 20, padding: 28, background: 'var(--surface)' }}>
        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
          <h6 className="fw-bold mb-0 text-white"><i className="bi bi-phone text-primary me-1.5"></i> Active Access Sessions</h6>
          <button className="btn btn-sm animate-hover" style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '6px 14px' }}
            onClick={onLogoutAll} disabled={logoutAllLoading}>
            {logoutAllLoading ? '🚪 Revoking...' : '🚪 Terminate All Other Devices'}
          </button>
        </div>
        {loading ? (
          <div className="text-center py-3"><span className="spinner-border spinner-border-sm" /></div>
        ) : sessions.length === 0 ? (
          <p className="text-secondary text-center">No active sessions found.</p>
        ) : (
          sessions.map(s => (
            <div key={s.id} className="d-flex justify-content-between align-items-center py-3"
              style={{ borderBottom: '1px solid var(--border)' }}>
              <div>
                <p className="mb-0 fw-semibold text-white">{s.deviceInfo}</p>
                <small className="text-secondary">{s.ipAddress} · Connected: {s.loginTime}</small>
              </div>
              <button onClick={() => onRevoke(s.id)} className="btn btn-sm animate-hover"
                style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.22)', color: '#f87171', borderRadius: 8, padding: '5px 14px', fontSize: '0.8rem' }}>
                Revoke
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// Timeline Tab
function TimelineTab({ timeline, filter, setFilter, loading }) {
  const filters = [['today', 'Today'], ['week', 'This Week'], ['month', 'This Month'], ['all', 'All Time']];
  return (
    <div className="glass-panel" style={{ borderRadius: 20, padding: 28, background: 'var(--surface)' }}>
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <h5 className="fw-bold mb-0 text-white">📅 Account Activity Logs</h5>
        <div className="d-flex gap-2 flex-wrap">
          {filters.map(([val, label]) => (
            <button key={val} onClick={() => setFilter(val)}
              className="btn btn-sm animate-hover"
              style={{
                borderRadius: 20, fontSize: '0.78rem', border: 'none',
                background: filter === val ? 'linear-gradient(135deg,#6366f1,#a855f7)' : 'rgba(255,255,255,0.03)',
                color: '#fff', fontWeight: 600, padding: '6px 14px'
              }}>{label}</button>
          ))}
        </div>
      </div>
      {loading ? (
        <div className="text-center py-5"><span className="spinner-border" /></div>
      ) : timeline.length === 0 ? (
        <p className="text-center text-secondary py-4">No audit logs found for this timeframe.</p>
      ) : (
        <div style={{ position: 'relative', marginTop: '20px' }}>
          <div style={{ position: 'absolute', left: 22, top: 0, bottom: 0, width: 2, background: 'rgba(99,102,241,0.12)' }} />
          {timeline.map(item => (
            <div key={item.id} className="d-flex gap-3 mb-4" style={{ position: 'relative' }}>
              <div style={{
                width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                background: `rgba(99,102,241,0.08)`, border: `1px solid rgba(99,102,241,0.25)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.15rem', zIndex: 1,
              }}>
                📄
              </div>
              <div style={{ paddingTop: 6 }}>
                <p className="mb-0 fw-semibold text-white" style={{ fontSize: '0.92rem' }}>{item.details || item.action}</p>
                <small className="text-secondary">{item.timestamp}</small>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Achievements Tab
function AchievementsTab({ achievements, stats, loading }) {
  const statCards = [
    { label: 'AI Chats', value: stats.aiChats || 0, icon: '🤖', color: '#6366f1' },
    { label: 'Rights Viewed', value: stats.rightsViewed || 0, icon: '⚖️', color: '#10b981' },
    { label: 'Schemes Explored', value: stats.schemesViewed || 0, icon: '📋', color: '#a855f7' },
    { label: 'OCR Scans', value: stats.ocrScans || 0, icon: '📷', color: '#f59e0b' },
    { label: 'Drafts Created', value: stats.drafts || 0, icon: '📝', color: '#06b6d4' },
    { label: 'Bookmarks', value: stats.bookmarks || 0, icon: '🔖', color: '#ef4444' },
  ];

  const doughnutData = {
    labels: ['AI Assistant', 'OCR Scans', 'AI Drafts', 'Bookmarks', 'Rights/Schemes Explored'],
    datasets: [{
      label: 'ActivitiesCount',
      data: [
        stats.aiChats || 0,
        stats.ocrScans || 0,
        stats.drafts || 0,
        stats.bookmarks || 0,
        (stats.rightsViewed || 0) + (stats.schemesViewed || 0)
      ],
      backgroundColor: ['#6366f1', '#f59e0b', '#06b6d4', '#ef4444', '#a855f7'],
      borderWidth: 0,
      hoverOffset: 10
    }]
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          color: '#cbd5e1',
          font: { size: 11, weight: '500' },
          padding: 14
        }
      }
    },
    cutout: '70%'
  };

  return (
    <div className="d-flex flex-column gap-4 text-start">
      {loading ? (
        <div className="text-center py-5"><span className="spinner-border" /></div>
      ) : (
        <>
          <div className="row g-4">
            {/* Doughnut Chart */}
            <div className="col-md-6">
              <div className="glass-panel" style={{ borderRadius: 20, padding: 28, height: '100%', minHeight: 310, background: 'var(--surface)' }}>
                <h6 className="fw-bold mb-4 text-white">📈 Platform Usage Distribution</h6>
                <div style={{ position: 'relative', height: 210 }}>
                  <Doughnut data={doughnutData} options={doughnutOptions} />
                </div>
              </div>
            </div>

            {/* Usage summary cards */}
            <div className="col-md-6">
              <div className="glass-panel" style={{ borderRadius: 20, padding: 28, height: '100%', background: 'var(--surface)' }}>
                <h6 className="fw-bold mb-4 text-white">📊 Usage Statistics</h6>
                <div className="row g-3">
                  {statCards.map(({ label, value, icon, color }) => (
                    <div key={label} className="col-6 col-sm-4">
                      <div className="animate-hover" style={{
                        background: 'rgba(255,255,255,0.02)', border: `1px solid var(--border)`,
                        borderRadius: 14, padding: '16px 10px', textAlign: 'center'
                      }}>
                        <div style={{ fontSize: '1.4rem', marginBottom: 4 }}>{icon}</div>
                        <div style={{ fontSize: '1.35rem', fontWeight: 800, color }}>{value}</div>
                        <div className="text-secondary" style={{ fontSize: '0.72rem' }}>{label}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Badges */}
          <div className="glass-panel" style={{ borderRadius: 20, padding: 28, background: 'var(--surface)' }}>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h6 className="fw-bold mb-0 text-white">🏆 Unlocked Achievements</h6>
              <span className="badge rounded-pill bg-primary bg-opacity-10 text-primary px-3 py-1.5 fw-bold" style={{ fontSize: '0.75rem' }}>
                {achievements.filter(a => a.unlocked).length} / {achievements.length} Badges
              </span>
            </div>
            <div className="row g-3">
              {achievements.map(a => (
                <div key={a.name} className="col-12 col-sm-6 col-md-4">
                  <div className="animate-hover" style={{
                    padding: '16px', borderRadius: 16,
                    background: a.unlocked ? `${a.color}08` : 'rgba(255,255,255,0.01)',
                    border: `1px solid ${a.unlocked ? a.color + '33' : 'var(--border)'}`,
                    opacity: a.unlocked ? 1 : 0.45,
                    filter: a.unlocked ? 'none' : 'grayscale(0.8)'
                  }}>
                    <div style={{ fontSize: '2.2rem', marginBottom: 6 }}>{a.icon}</div>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem', color: a.unlocked ? 'white' : 'var(--text-secondary)' }}>{a.name}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 3 }}>{a.description}</div>
                    {a.unlocked && <div style={{ fontSize: '0.65rem', color: a.color, marginTop: 8, fontWeight: 700 }}>✓ Completed</div>}
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

// Preferences Tab
function PreferencesTab({ prefs, setPrefs, saving, onSave }) {
  const Toggle = ({ label, desc, k }) => (
    <div className="d-flex justify-content-between align-items-center py-3 text-start animate-hover" style={{ borderBottom: '1px solid var(--border)' }}>
      <div>
        <p className="mb-0 fw-semibold text-white" style={{ fontSize: '0.92rem' }}>{label}</p>
        <small className="text-secondary">{desc}</small>
      </div>
      <div className="form-check form-switch mb-0">
        <input className="form-check-input" type="checkbox" checked={!!prefs[k]}
          onChange={e => setPrefs(p => ({ ...p, [k]: e.target.checked }))}
          style={{ width: 44, height: 22, cursor: 'pointer' }} />
      </div>
    </div>
  );

  return (
    <div className="glass-panel" style={{ borderRadius: 20, padding: 32, background: 'var(--surface)' }}>
      <h5 className="fw-bold mb-4 text-white"><i className="bi bi-sliders text-primary me-1.5"></i> Notification Preference Controls</h5>
      <Toggle label="Email Notifications" desc="Get automatic summaries and updates directly in your inbox" k="emailNotifications" />
      <Toggle label="Push Notifications" desc="Browser pop-up reminders and warnings" k="pushNotifications" />
      <Toggle label="Reminder Notifications" desc="Deadline and event timeline indicators alerts" k="reminderNotifications" />
      <Toggle label="Marketing Materials" desc="Tips, new laws drafts, and platform announcements" k="marketingEmails" />
      <Toggle label="System Release Updates" desc="New features and upgrades details" k="productUpdates" />
      
      <div className="mt-4 text-end">
        <button className="btn btn-glass px-5 py-2.5 fw-semibold" onClick={onSave} disabled={saving} style={{
          background: 'linear-gradient(135deg, #6366f1, #a855f7)',
          border: 'none',
          borderRadius: 12
        }}>
          {saving ? <><span className="spinner-border spinner-border-sm me-2" />Saving...</> : '💾 Save Preferences'}
        </button>
      </div>
    </div>
  );
}

// Privacy Tab
function PrivacyTab({ onDownload, onExportCsv, onExportPdf, deletePassword, setDeletePassword, showDeleteConfirm, setShowDeleteConfirm, onDeleteAccount, deleting }) {
  return (
    <div className="d-flex flex-column gap-4 text-start">
      <div className="glass-panel" style={{ borderRadius: 20, padding: 32, background: 'var(--surface)' }}>
        <h5 className="fw-bold mb-2 text-white"><i className="bi bi-shield-check text-primary me-1.5"></i> Data Privacy & Exports</h5>
        <p className="text-secondary small mb-4">Under data guidelines, you have full ownership of your records.</p>
        
        <div className="d-flex flex-column gap-3">
          <button className="btn btn-glass text-start py-3 px-4 animate-hover" onClick={onDownload} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: '14px' }}>
            <strong className="text-white">📥 Download All Data (JSON)</strong>
            <p className="mb-0 small text-secondary">Export personal details, bookmarks, and verification records in clean JSON format.</p>
          </button>
          
          <button className="btn btn-glass text-start py-3 px-4 animate-hover" onClick={onExportCsv} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: '14px' }}>
            <strong className="text-white">📊 Export Activity Logs (CSV)</strong>
            <p className="mb-0 small text-secondary">Download complete activity logs for archiving and legal history tracking.</p>
          </button>
          
          <button className="btn btn-glass text-start py-3 px-4 animate-hover" onClick={onExportPdf} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: '14px' }}>
            <strong className="text-white">📄 Print Profile Summary (PDF)</strong>
            <p className="mb-0 small text-secondary">Print a certified printable summary of your account standing and logs.</p>
          </button>
        </div>
      </div>

      {/* Danger Zone */}
      <div style={{ borderRadius: 20, padding: 32, border: '1px solid rgba(239,68,68,0.25)', background: 'rgba(239,68,68,0.03)' }}>
        <h6 className="fw-bold mb-1 text-danger">⚠️ Danger Zone</h6>
        <p className="text-secondary small mb-4">This action is permanent and deletes all your files, drafts, and logs from our servers.</p>
        
        {!showDeleteConfirm ? (
          <button className="btn btn-sm animate-hover" style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '10px 22px', fontWeight: 600 }}
            onClick={() => setShowDeleteConfirm(true)}>
            🗑️ Delete Profile Account
          </button>
        ) : (
          <div>
            <p className="fw-semibold mb-2 text-danger">Please enter password to confirm permanent profile deletion:</p>
            <div className="d-flex gap-2">
              <input type="password" className="form-control form-glass-control" placeholder="Verify password" value={deletePassword}
                onChange={e => setDeletePassword(e.target.value)}
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(239,68,68,0.3)', color: 'white', borderRadius: 12, maxWidth: 260 }} />
              
              <button className="btn text-white" style={{ background: '#ef4444', borderRadius: 12, padding: '0 22px', border: 'none', fontWeight: 600 }}
                onClick={onDeleteAccount} disabled={deleting}>
                {deleting ? 'Terminating...' : 'Delete Permanently'}
              </button>
              
              <button className="btn btn-glass-secondary" onClick={() => setShowDeleteConfirm(false)} style={{ borderRadius: 12 }}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Advocate Verification Portal Tab
function AdvocateTab() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [specializations, setSpecializations] = useState([]);
  const [cities, setCities] = useState([]);

  // Form inputs
  const [advocateId, setAdvocateId] = useState('');
  const [specId, setSpecId] = useState('');
  const [cityId, setCityId] = useState('');
  const [experience, setExperience] = useState('');
  const [fee, setFee] = useState('');
  const [court, setCourt] = useState('');
  const [bio, setBio] = useState('');
  const [langs, setLangs] = useState('');
  const [quals, setQuals] = useState('');
  const [achievements, setAchievements] = useState('');

  // Upload URLs
  const [urls, setUrls] = useState({
    bar_council: '',
    license: '',
    gov_id: '',
    profile_photo: ''
  });

  const [uploadLoading, setUploadLoading] = useState({
    bar_council: false,
    license: false,
    gov_id: false,
    profile_photo: false
  });

  const [submitting, setSubmitting] = useState(false);

  const fetchStatus = async () => {
    try {
      const res = await axios.get('/api/lawyers/me');
      setProfile(res.data);
    } catch (err) {
      // Lawyer profile not found is normal for regular users
      if (err.response?.status !== 404) {
        console.error(err);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const loadSelects = async () => {
      try {
        const [sp, ct] = await Promise.all([
          axios.get('/api/lawyers/specializations'),
          axios.get('/api/lawyers/cities')
        ]);
        setSpecializations(sp.data || []);
        setCities(ct.data || []);
      } catch {}
    };
    loadSelects();
  }, []);

  const handleDocUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadLoading(prev => ({ ...prev, [type]: true }));
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    try {
      const res = await axios.post('/api/lawyers/upload-document', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setUrls(prev => ({ ...prev, [type]: res.data.url }));
    } catch (err) {
      alert(err.response?.data?.error || "Failed to upload document. Only JPG, PNG, and PDF up to 5MB allowed.");
    } finally {
      setUploadLoading(prev => ({ ...prev, [type]: false }));
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!urls.bar_council || !urls.license || !urls.gov_id) {
      alert("Please upload all verification documents.");
      return;
    }
    setSubmitting(true);

    try {
      const res = await axios.post('/api/lawyers/register', {
        advocateId,
        specializationId: specId,
        cityId,
        experienceYears: experience,
        consultationFee: fee,
        courtName: court,
        bio,
        languages: langs,
        qualifications: quals,
        achievements,
        barCouncilIdUrl: urls.bar_council,
        licenseCertificateUrl: urls.license,
        govIdUrl: urls.gov_id,
        profileImageUrl: urls.profile_photo || null
      });
      alert("Advocate verification application submitted successfully!");
      fetchStatus();
    } catch (err) {
      alert(err.response?.data?.error || "Registration failed.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="glass-panel p-4 text-center">
        <span className="spinner-border spinner-border-sm me-2 text-primary" />
        <span className="text-secondary small">Checking advocate verification status...</span>
      </div>
    );
  }

  if (profile) {
    return (
      <div className="glass-panel p-5 text-start" style={{ borderRadius: 20, background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <h4 className="fw-extrabold text-white mb-2"><i className="bi bi-balance2 text-primary me-2"></i>Advocate Verification Status</h4>
        <p className="text-secondary small mb-4">Check your legal advocate credentials review status below.</p>

        {profile.verificationStatus === 'APPROVED' && (
          <div className="p-4 rounded-4 mb-4" style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)' }}>
            <div className="d-flex align-items-center gap-3 text-success mb-2.5">
              <i className="bi bi-patch-check-fill fs-3"></i>
              <h5 className="fw-bold mb-0">Credentials Verified & Approved!</h5>
            </div>
            <p className="small text-secondary mb-3">Your credentials have passed verification. You are listed in our verified search directories.</p>
            <Link to="/lawyer/dashboard" className="btn btn-sm text-dark fw-bold" style={{ background: 'linear-gradient(135deg, #10b981, #34d399)', border: 'none', borderRadius: '8px', padding: '8px 20px' }}>
              Open Advocate Panel
            </Link>
          </div>
        )}

        {profile.verificationStatus === 'PENDING' && (
          <div className="p-4 rounded-4 mb-4" style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)' }}>
            <div className="d-flex align-items-center gap-3 text-warning mb-2.5">
              <i className="bi bi-hourglass-split fs-3"></i>
              <h5 className="fw-bold mb-0">Application Pending Review</h5>
            </div>
            <p className="small text-secondary mb-0">Our legal registry compliance team is checking your Bar Council ID and Advocate License. This usually takes 24-48 business hours.</p>
          </div>
        )}

        {profile.verificationStatus === 'REJECTED' && (
          <div className="p-4 rounded-4 mb-4" style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)' }}>
            <div className="d-flex align-items-center gap-3 text-danger mb-2.5">
              <i className="bi bi-exclamation-triangle-fill fs-3"></i>
              <h5 className="fw-bold mb-0">Application Rejected</h5>
            </div>
            <p className="small text-secondary mb-0">Your credentials check failed due to blur documents or incorrect enrollment number. Please contact superadmin support or re-register.</p>
          </div>
        )}

        {/* Profile metadata */}
        <div className="row g-3 small text-secondary">
          <div className="col-sm-6">
            <strong>Advocate Registration ID:</strong> {profile.advocateId}
          </div>
          <div className="col-sm-6">
            <strong>Practice Sector:</strong> {profile.specialization?.name}
          </div>
          <div className="col-sm-6">
            <strong>Practice City:</strong> {profile.city?.name}
          </div>
          <div className="col-sm-6">
            <strong>Experience:</strong> {profile.experienceYears} Years
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-panel p-4 p-md-5 text-start" style={{ borderRadius: 20, background: 'var(--surface)', border: '1px solid var(--border)' }}>
      <h4 className="fw-extrabold text-white mb-2"><i className="bi bi-shield-lock-fill text-primary me-2"></i>Apply for Verified Legal Advocate Status</h4>
      <p className="text-secondary small mb-4">Complete your professional registration to consult citizens on the CitizenLex marketplace.</p>

      <form onSubmit={handleRegister}>
        <div className="row g-3">
          {/* Enrollment ID */}
          <div className="col-md-6">
            <label className="form-label small text-secondary fw-semibold mb-1">Bar Enrollment Number</label>
            <input type="text" className="form-control form-glass-control" placeholder="e.g. AP-10294/2020" value={advocateId} onChange={e => setAdvocateId(e.target.value)} required />
          </div>

          {/* Specialization */}
          <div className="col-md-6">
            <label className="form-label small text-secondary fw-semibold mb-1">Practice Sector</label>
            <select className="form-select form-glass-control" value={specId} onChange={e => setSpecId(e.target.value)} required style={{ background: '#07061d', color: 'white' }}>
              <option value="">Select practice</option>
              {specializations.map(s => (
                <option key={s.id} value={s.id} style={{ background: '#07061d' }}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* City */}
          <div className="col-md-6">
            <label className="form-label small text-secondary fw-semibold mb-1">City</label>
            <select className="form-select form-glass-control" value={cityId} onChange={e => setCityId(e.target.value)} required style={{ background: '#07061d', color: 'white' }}>
              <option value="">Select city</option>
              {cities.map(c => (
                <option key={c.id} value={c.id} style={{ background: '#07061d' }}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Experience */}
          <div className="col-md-6">
            <label className="form-label small text-secondary fw-semibold mb-1">Experience (Years)</label>
            <input type="number" className="form-control form-glass-control" placeholder="e.g. 8" value={experience} onChange={e => setExperience(e.target.value)} required />
          </div>

          {/* Fee */}
          <div className="col-md-6">
            <label className="form-label small text-secondary fw-semibold mb-1">Standard Consultation Fee (₹)</label>
            <input type="number" className="form-control form-glass-control" placeholder="e.g. 1500" value={fee} onChange={e => setFee(e.target.value)} required />
          </div>

          {/* Court */}
          <div className="col-md-6">
            <label className="form-label small text-secondary fw-semibold mb-1">Practicing Court Name</label>
            <input type="text" className="form-control form-glass-control" placeholder="e.g. Madras High Court" value={court} onChange={e => setCourt(e.target.value)} required />
          </div>

          {/* Languages */}
          <div className="col-md-6">
            <label className="form-label small text-secondary fw-semibold mb-1">Languages Spoken</label>
            <input type="text" className="form-control form-glass-control" placeholder="e.g. English, Tamil" value={langs} onChange={e => setLangs(e.target.value)} required />
          </div>

          {/* Qualifications */}
          <div className="col-md-6">
            <label className="form-label small text-secondary fw-semibold mb-1">Academic Qualifications</label>
            <input type="text" className="form-control form-glass-control" placeholder="e.g. B.A. LL.B (Hons), LL.M" value={quals} onChange={e => setQuals(e.target.value)} required />
          </div>

          {/* Achievements */}
          <div className="col-12">
            <label className="form-label small text-secondary fw-semibold mb-1">Key Case Achievements</label>
            <input type="text" className="form-control form-glass-control" placeholder="List major case milestones..." value={achievements} onChange={e => setAchievements(e.target.value)} />
          </div>

          {/* Bio */}
          <div className="col-12">
            <label className="form-label small text-secondary fw-semibold mb-1">Professional Bio</label>
            <textarea className="form-control form-glass-control" rows="3" placeholder="Briefly describe your legal career details..." value={bio} onChange={e => setBio(e.target.value)} required />
          </div>

          <hr className="my-4" style={{ borderColor: 'var(--border)' }} />

          <h5 className="fw-bold text-white mb-3">Upload Credentials Documents (Cloudinary/S3 Integration)</h5>

          {/* Bar Council ID Upload */}
          <div className="col-md-6 text-start">
            <label className="form-label small text-secondary fw-semibold mb-1">Bar Council ID Card (PDF/JPG)</label>
            <input type="file" className="form-control form-glass-control mb-1" onChange={e => handleDocUpload(e, 'bar_council')} required />
            {uploadLoading.bar_council ? (
              <span className="small text-warning"><span className="spinner-border spinner-border-sm me-1.5" />Uploading to Cloudinary...</span>
            ) : urls.bar_council ? (
              <span className="small text-success"><i className="bi bi-check-circle-fill me-1" />Uploaded: <a href={urls.bar_council} target="_blank" rel="noreferrer" className="text-primary text-decoration-none">View doc</a></span>
            ) : (
              <span className="small text-secondary">Document pending upload</span>
            )}
          </div>

          {/* License Certificate Upload */}
          <div className="col-md-6 text-start">
            <label className="form-label small text-secondary fw-semibold mb-1">Advocate Practice License (PDF/JPG)</label>
            <input type="file" className="form-control form-glass-control mb-1" onChange={e => handleDocUpload(e, 'license')} required />
            {uploadLoading.license ? (
              <span className="small text-warning"><span className="spinner-border spinner-border-sm me-1.5" />Uploading to Cloudinary...</span>
            ) : urls.license ? (
              <span className="small text-success"><i className="bi bi-check-circle-fill me-1" />Uploaded: <a href={urls.license} target="_blank" rel="noreferrer" className="text-primary text-decoration-none">View doc</a></span>
            ) : (
              <span className="small text-secondary">Document pending upload</span>
            )}
          </div>

          {/* Gov ID Upload */}
          <div className="col-md-6 text-start">
            <label className="form-label small text-secondary fw-semibold mb-1">Government ID Passport/Aadhaar (PDF/JPG)</label>
            <input type="file" className="form-control form-glass-control mb-1" onChange={e => handleDocUpload(e, 'gov_id')} required />
            {uploadLoading.gov_id ? (
              <span className="small text-warning"><span className="spinner-border spinner-border-sm me-1.5" />Uploading to Cloudinary...</span>
            ) : urls.gov_id ? (
              <span className="small text-success"><i className="bi bi-check-circle-fill me-1" />Uploaded: <a href={urls.gov_id} target="_blank" rel="noreferrer" className="text-primary text-decoration-none">View doc</a></span>
            ) : (
              <span className="small text-secondary">Document pending upload</span>
            )}
          </div>

          {/* Avatar Photo Upload */}
          <div className="col-md-6 text-start">
            <label className="form-label small text-secondary fw-semibold mb-1">Professional Profile Photo (JPG/PNG)</label>
            <input type="file" className="form-control form-glass-control mb-1" onChange={e => handleDocUpload(e, 'profile_photo')} />
            {uploadLoading.profile_photo ? (
              <span className="small text-warning"><span className="spinner-border spinner-border-sm me-1.5" />Uploading to Cloudinary...</span>
            ) : urls.profile_photo ? (
              <span className="small text-success"><i className="bi bi-check-circle-fill me-1" />Uploaded: <a href={urls.profile_photo} target="_blank" rel="noreferrer" className="text-primary text-decoration-none">View photo</a></span>
            ) : (
              <span className="small text-secondary">Optional upload</span>
            )}
          </div>
        </div>

        <div className="mt-5 text-end">
          <button type="submit" className="btn px-5 py-3 text-dark fw-bold" disabled={submitting} style={{
            background: 'linear-gradient(135deg, #a855f7, #f59e0b)',
            border: 'none',
            borderRadius: 12
          }}>
            {submitting ? 'Submitting Application...' : 'Submit Verification Credentials'}
          </button>
        </div>
      </form>
    </div>
  );
}
