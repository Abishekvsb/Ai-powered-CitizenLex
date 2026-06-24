import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const TYPE_CONFIG = {
  TIP:      { icon: 'bi-lightbulb-fill',           color: '#102a5c', bg: 'rgba(16,42,92,0.07)',    label: 'Legal Tip',  border: '#102a5c' },
  ALERT:    { icon: 'bi-exclamation-triangle-fill', color: '#dc2626', bg: 'rgba(220,38,38,0.06)',  label: 'Alert',      border: '#dc2626' },
  SCHEME:   { icon: 'bi-bank2',                     color: '#c49d3f', bg: 'rgba(196,157,63,0.08)', label: 'Scheme',     border: '#c49d3f' },
  RIGHT:    { icon: 'bi-person-check-fill',          color: '#16a34a', bg: 'rgba(22,163,74,0.06)',  label: 'Your Right', border: '#16a34a' },
  REMINDER: { icon: 'bi-calendar-check-fill',        color: '#7c3aed', bg: 'rgba(124,58,237,0.06)', label: 'Reminder',   border: '#7c3aed' },
};

const FILTERS = ['ALL', 'TIP', 'ALERT', 'SCHEME', 'RIGHT', 'REMINDER'];

export default function NotificationCenter() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [expanded, setExpanded] = useState(null);
  const [toast, setToast] = useState({ show: false, msg: '' });

  const showToast = (msg) => {
    setToast({ show: true, msg });
    setTimeout(() => setToast({ show: false, msg: '' }), 2500);
  };

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await axios.get('/api/notifications');
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unreadCount || 0);
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  const markRead = async (id) => {
    try {
      await axios.post(`/api/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {}
  };

  const markAllRead = async () => {
    try {
      await axios.post('/api/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
      showToast('All notifications marked as read');
    } catch {}
  };

  const toggleExpand = (id, isRead) => {
    setExpanded(prev => prev === id ? null : id);
    if (!isRead) markRead(id);
  };

  const filtered = filter === 'ALL' ? notifications : notifications.filter(n => n.type === filter);
  const unreadFiltered = filtered.filter(n => !n.isRead).length;

  const formatTime = (ts) => {
    const d = new Date(ts);
    const now = new Date();
    const diff = Math.floor((now - d) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', paddingBottom: 60 }}>
      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, #071530 0%, #102a5c 60%, #1f478a 100%)', padding: '40px 0 28px' }}>
        <div className="container">
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
            <div>
              <div className="d-flex align-items-center gap-3 mb-1">
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className="bi bi-bell-fill text-white" style={{ fontSize: '1.3rem' }}></i>
                </div>
                <div>
                  <h1 className="mb-0 fw-bold text-white" style={{ fontSize: '1.7rem' }}>Notification Center</h1>
                  <p className="mb-0" style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.88rem' }}>Legal tips, alerts, scheme updates & reminders</p>
                </div>
              </div>
            </div>
            {unreadCount > 0 && (
              <button
                className="btn btn-sm"
                onClick={markAllRead}
                style={{ background: 'rgba(255,255,255,0.12)', color: 'white', border: '1px solid rgba(255,255,255,0.25)', borderRadius: 8, fontWeight: 600, backdropFilter: 'blur(10px)' }}
              >
                <i className="bi bi-check2-all me-1"></i>Mark All Read
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="container" style={{ marginTop: -14 }}>
        {/* Stats Row */}
        <div className="row g-3 mb-4">
          {[
            { label: 'Total', value: notifications.length, icon: 'bi-bell', color: 'var(--primary)' },
            { label: 'Unread', value: unreadCount, icon: 'bi-bell-fill', color: '#dc2626' },
            { label: 'Alerts', value: notifications.filter(n => n.type === 'ALERT').length, icon: 'bi-exclamation-triangle-fill', color: '#dc2626' },
            { label: 'Tips', value: notifications.filter(n => n.type === 'TIP').length, icon: 'bi-lightbulb-fill', color: 'var(--primary)' },
          ].map((s, i) => (
            <div key={i} className="col-6 col-md-3">
              <div style={{ background: 'var(--surface-solid)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 18px', boxShadow: 'var(--shadow-sm)' }}>
                <div className="d-flex align-items-center justify-content-between">
                  <div>
                    <p className="mb-1" style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</p>
                    <p className="mb-0 fw-bold" style={{ fontSize: '1.5rem', color: s.color, lineHeight: 1 }}>{s.value}</p>
                  </div>
                  <i className={`bi ${s.icon}`} style={{ fontSize: '1.3rem', color: s.color, opacity: 0.4 }}></i>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Filter Tabs */}
        <div className="d-flex flex-wrap gap-2 mb-3">
          {FILTERS.map(f => {
            const cfg = TYPE_CONFIG[f];
            const count = f === 'ALL' ? notifications.length : notifications.filter(n => n.type === f).length;
            const isActive = filter === f;
            return (
              <button
                key={f}
                className="btn btn-sm"
                onClick={() => setFilter(f)}
                style={{
                  background: isActive ? (cfg?.color || 'var(--primary)') : 'var(--surface-solid)',
                  color: isActive ? 'white' : 'var(--text)',
                  border: `1px solid ${isActive ? (cfg?.color || 'var(--primary)') : 'var(--border)'}`,
                  borderRadius: 8,
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  padding: '5px 12px',
                  transition: 'all 0.2s'
                }}
              >
                {cfg && <i className={`bi ${cfg.icon} me-1`}></i>}
                {f === 'ALL' ? 'All' : cfg?.label}
                <span className="ms-1" style={{ opacity: 0.75 }}>({count})</span>
              </button>
            );
          })}
        </div>

        {/* Unread Banner */}
        {unreadFiltered > 0 && (
          <div className="mb-3 px-3 py-2 rounded" style={{ background: 'rgba(220,38,38,0.05)', border: '1px solid rgba(220,38,38,0.2)' }}>
            <small style={{ color: '#dc2626', fontWeight: 600 }}>
              <i className="bi bi-circle-fill me-1" style={{ fontSize: '0.5rem' }}></i>
              {unreadFiltered} unread notification{unreadFiltered !== 1 ? 's' : ''} in this view
            </small>
          </div>
        )}

        {/* List */}
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border" style={{ color: 'var(--primary)', width: 40, height: 40 }}></div>
            <p className="mt-3" style={{ color: 'var(--text-muted)' }}>Loading notifications...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-5">
            <i className="bi bi-bell-slash" style={{ fontSize: '3rem', color: 'var(--text-muted)', opacity: 0.5 }}></i>
            <p className="mt-3" style={{ color: 'var(--text-muted)' }}>No notifications in this category</p>
          </div>
        ) : (
          <div className="d-flex flex-column gap-2">
            {filtered.map(notif => {
              const cfg = TYPE_CONFIG[notif.type] || TYPE_CONFIG.TIP;
              const isExpanded = expanded === notif.id;
              const isUnread = !notif.isRead;

              return (
                <div
                  key={notif.id}
                  className="notification-item"
                  onClick={() => toggleExpand(notif.id, notif.isRead)}
                  style={{
                    background: isUnread ? cfg.bg : 'var(--surface-solid)',
                    border: `1px solid ${isUnread ? cfg.border : 'var(--border)'}`,
                    borderLeft: `4px solid ${cfg.border}`,
                    borderRadius: 12,
                    padding: '14px 18px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: isUnread ? `0 2px 12px ${cfg.border}18` : 'var(--shadow-sm)'
                  }}
                >
                  <div className="d-flex align-items-start gap-3">
                    {/* Icon */}
                    <div className="flex-shrink-0 mt-1" style={{ width: 36, height: 36, borderRadius: 10, background: cfg.bg, border: `1px solid ${cfg.border}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <i className={`bi ${cfg.icon}`} style={{ color: cfg.color, fontSize: '1rem' }}></i>
                    </div>

                    {/* Content */}
                    <div className="flex-grow-1 min-w-0">
                      <div className="d-flex align-items-center gap-2 flex-wrap mb-1">
                        <span className="badge" style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}30`, borderRadius: 6, fontSize: '0.7rem', fontWeight: 700 }}>
                          {cfg.label}
                        </span>
                        {isUnread && (
                          <span className="badge" style={{ background: '#dc2626', color: 'white', borderRadius: 6, fontSize: '0.65rem', fontWeight: 700 }}>NEW</span>
                        )}
                        <small style={{ color: 'var(--text-muted)', marginLeft: 'auto' }}>{formatTime(notif.createdAt)}</small>
                      </div>
                      <h4 className="mb-1 fw-bold" style={{ fontSize: '0.93rem', color: 'var(--text)', lineHeight: 1.4 }}>{notif.title}</h4>
                      <p className="mb-0" style={{
                        color: 'var(--text-secondary)',
                        fontSize: '0.85rem',
                        lineHeight: 1.6,
                        overflow: isExpanded ? 'visible' : 'hidden',
                        display: isExpanded ? 'block' : '-webkit-box',
                        WebkitLineClamp: isExpanded ? undefined : 2,
                        WebkitBoxOrient: 'vertical'
                      }}>
                        {notif.message}
                      </p>
                      <small style={{ color: cfg.color, fontWeight: 600, fontSize: '0.78rem' }}>
                        {isExpanded ? 'Show less ↑' : 'Read more ↓'}
                      </small>
                    </div>

                    {/* Read indicator */}
                    <div className="flex-shrink-0">
                      {isUnread ? (
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: cfg.color }}></div>
                      ) : (
                        <i className="bi bi-check2" style={{ color: 'var(--text-muted)', fontSize: '1rem' }}></i>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Toast */}
      {toast.show && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999 }}>
          <div className="custom-toast toast-success d-flex align-items-center gap-2">
            <i className="bi bi-check-circle-fill text-success"></i>
            <span>{toast.msg}</span>
          </div>
        </div>
      )}
    </div>
  );
}
