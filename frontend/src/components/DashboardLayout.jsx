import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { usePWA } from '../context/PWAContext';
import axios from 'axios';

export default function DashboardLayout({ children }) {
  const { user, logout, isAdmin } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { isInstallable, installApp } = usePWA();
  const navigate = useNavigate();
  const location = useLocation();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }
    const fetchCount = async () => {
      try {
        const res = await axios.get('/api/notifications/count');
        setUnreadCount(res.data.unreadCount || 0);
      } catch {}
    };
    fetchCount();
    const interval = setInterval(fetchCount, 60000);
    return () => clearInterval(interval);
  }, [user, location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;
  const isLawyer = () => user && (user.role === 'ROLE_LAWYER' || user.role === 'LAWYER');
  const initials = `${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`.toUpperCase() || 'U';

  const menuGroups = [
    {
      title: '',
      items: [
        { path: '/dashboard', label: 'Dashboard', icon: 'bi-grid-1x2-fill' }
      ]
    },
    {
      title: 'AI Services',
      items: [
        { path: '/chat', label: 'AI Assistant', icon: 'bi-chat-left-dots-fill' },
        { path: '/copilot', label: 'AI Legal Copilot', icon: 'bi-robot', isNew: true },
        { path: '/ocr', label: 'OCR Scanner', icon: 'bi-upc-scan' },
        { path: '/drafts', label: 'AI Draft Generator', icon: 'bi-file-earmark-diff-fill' }
      ]
    },
    {
      title: 'Legal Services',
      items: [
        { path: '/rights', label: 'Rights Explorer', icon: 'bi-shield-shaded' },
        { path: '/schemes', label: 'Scheme Finder', icon: 'bi-search-heart-fill' },
        { path: '/consultations', label: 'Consultations', icon: 'bi-camera-video-fill' },
        { path: '/lawyers', label: 'Lawyer Marketplace', icon: 'bi-people-fill' }
      ]
    },
    {
      title: 'User',
      items: [
        { path: '/notifications', label: 'Notifications', icon: 'bi-bell-fill', badge: unreadCount },
        { path: '/profile', label: 'Profile', icon: 'bi-person-fill' },
        { path: '/profile#settings', label: 'Settings', icon: 'bi-gear-fill' }
      ]
    }
  ];

  return (
    <div className="dashboard-container" style={{ display: 'flex', minHeight: '100vh', background: '#02030a', color: '#fff', position: 'relative' }}>
      {/* CSS overrides for global consistency */}
      <style>{`
        .sidebar-container {
          transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          background: #04050f;
          border-right: 1px solid rgba(255, 255, 255, 0.08);
          z-index: 1040;
          overflow-y: auto;
          overflow-x: hidden;
          display: flex;
          flex-direction: column;
          position: fixed;
          top: 0;
          bottom: 0;
          left: 0;
          height: 100vh;
        }
        .sidebar-expanded-width {
          width: 260px;
        }
        .sidebar-collapsed-width {
          width: 80px;
        }
        .sidebar-link {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 14px;
          color: rgba(255,255,255,0.65);
          text-decoration: none;
          border-radius: 10px;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          font-weight: 600;
          font-size: 0.88rem;
          margin-bottom: 4px;
          position: relative;
        }
        .sidebar-link:hover {
          color: #fff;
          background: rgba(255, 255, 255, 0.04);
          transform: translateX(3px);
        }
        .sidebar-link.active {
          color: #d4af37;
          background: rgba(212, 175, 55, 0.08);
        }
        .sidebar-link.active::before {
          content: '';
          position: absolute;
          left: 0;
          top: 15%;
          height: 70%;
          width: 3.5px;
          background: #d4af37;
          border-radius: 0 4px 4px 0;
          box-shadow: 0 0 10px rgba(212, 175, 55, 0.6);
        }
        .main-workspace {
          flex-grow: 1;
          display: flex;
          flex-direction: column;
          min-height: 100vh;
          transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          overflow: hidden;
          background: #02030a;
        }
        .margin-expanded {
          margin-left: 260px;
        }
        .margin-collapsed {
          margin-left: 80px;
        }
        .sidebar-group-title {
          font-size: 0.72rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: rgba(255, 255, 255, 0.3);
          font-weight: 700;
          padding: 12px 14px 6px;
        }
        @media (max-width: 991px) {
          .sidebar-container {
            width: 260px;
            transform: translateX(-100%);
          }
          .sidebar-container.mobile-open {
            transform: translateX(0);
          }
          .main-workspace {
            margin-left: 0 !important;
          }
        }
        .topbar-container {
          height: 70px;
          background: rgba(2, 3, 10, 0.8);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 24px;
          position: sticky;
          top: 0;
          z-index: 1000;
        }
        .sidebar-backdrop {
          position: fixed;
          top: 0;
          bottom: 0;
          left: 0;
          right: 0;
          background: rgba(0, 0, 0, 0.65);
          backdrop-filter: blur(5px);
          z-index: 1030;
        }
        .menu-divider {
          border-top: 1px solid rgba(255, 255, 255, 0.06);
          margin: 12px 14px;
        }
      `}</style>

      {/* Backdrop overlay for mobile drawer */}
      {mobileOpen && (
        <div className="sidebar-backdrop d-lg-none" onClick={() => setMobileOpen(false)} />
      )}

      {/* Left Sidebar Frame */}
      <div className={`sidebar-container py-4 px-3 ${collapsed ? 'sidebar-collapsed-width' : 'sidebar-expanded-width'} ${mobileOpen ? 'mobile-open' : ''}`}>
        
        {/* Brand Logo & Collapse Trigger */}
        <div className="d-flex align-items-center justify-content-between mb-4 px-2">
          {!collapsed && (
            <Link className="navbar-brand d-flex align-items-center fw-bold text-decoration-none" to="/" style={{ fontSize: '1.25rem' }}>
              <i className="bi bi-balance2 me-2" style={{ color: '#d4af37' }}></i>
              <span style={{
                background: 'linear-gradient(135deg, #ffffff 0%, #d4af37 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                fontWeight: 800
              }}>CitizenLex</span>
            </Link>
          )}
          {collapsed && (
            <div className="mx-auto" style={{ fontSize: '1.4rem' }}>
              <i className="bi bi-balance2" style={{ color: '#d4af37' }}></i>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="btn btn-sm btn-outline-secondary border-0 p-1 text-white d-none d-lg-block"
            style={{ fontSize: '1.1rem' }}
            title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            <i className={`bi ${collapsed ? 'bi-chevron-right' : 'bi-chevron-left'}`}></i>
          </button>
        </div>

        {/* User Mini Profile Banner */}
        <div className={`p-3 rounded-4 mb-4 d-flex align-items-center gap-3 ${collapsed ? 'justify-content-center' : ''}`} style={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.06)'
        }}>
          {user?.profileImageUrl ? (
            <img
              src={user.profileImageUrl}
              alt="Profile"
              style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover', border: '1.5px solid rgba(212,175,55,0.4)' }}
            />
          ) : (
            <div style={{
              width: 34, height: 34, borderRadius: '50%',
              background: 'linear-gradient(135deg, #00d2ff, #d4af37)',
              display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              fontSize: '0.75rem', fontWeight: 700, color: 'black', flexShrink: 0
            }}>
              {initials}
            </div>
          )}
          {!collapsed && (
            <div className="text-start min-w-0" style={{ overflow: 'hidden' }}>
              <div className="fw-bold text-white small text-truncate">{user?.firstName} {user?.lastName}</div>
              <div className="text-secondary" style={{ fontSize: '0.68rem' }}>Client Console</div>
            </div>
          )}
        </div>

        {/* Sidebar Links Grouped */}
        <div className="d-flex flex-column gap-1">
          {menuGroups.map((group, groupIdx) => (
            <div key={groupIdx}>
              {group.title && !collapsed && (
                <div className="sidebar-group-title">{group.title}</div>
              )}
              {group.items.map((item, itemIdx) => {
                const targetPath = item.dynamicPath && isActive(item.dynamicPath) ? item.dynamicPath : item.path;
                const active = isActive(item.path) || (item.dynamicPath && isActive(item.dynamicPath));

                return (
                  <Link
                    key={itemIdx}
                    to={targetPath}
                    className={`sidebar-link ${active ? 'active' : ''}`}
                    onClick={() => setMobileOpen(false)}
                    title={collapsed ? item.label : ''}
                  >
                    <i className={`bi ${item.icon}`} style={{ fontSize: '1.1rem', color: active ? '#d4af37' : 'rgba(255,255,255,0.65)' }}></i>
                    {!collapsed && (
                      <span className="flex-grow-1 text-start">{item.label}</span>
                    )}
                    {!collapsed && item.isNew && (
                      <span className="badge" style={{ background: '#00d2ff', color: '#02030a', fontSize: '0.55rem', borderRadius: 4, padding: '2px 4px' }}>NEW</span>
                    )}
                    {!collapsed && item.badge !== undefined && item.badge > 0 && (
                      <span className="badge rounded-pill bg-danger" style={{ fontSize: '0.65rem' }}>{item.badge}</span>
                    )}
                  </Link>
                );
              })}
              {groupIdx < menuGroups.length - 1 && collapsed && (
                <div className="menu-divider" />
              )}
            </div>
          ))}

          {/* Admin panel link */}
          {user && isAdmin() && (
            <div>
              {!collapsed && <div className="sidebar-group-title">Admin</div>}
              <Link
                to="/admin"
                className={`sidebar-link ${isActive('/admin') ? 'active' : ''}`}
                onClick={() => setMobileOpen(false)}
                title={collapsed ? 'Admin Control' : ''}
              >
                <i className="bi bi-shield-lock-fill" style={{ fontSize: '1.1rem', color: isActive('/admin') ? '#d4af37' : '#ef4444' }}></i>
                {!collapsed && <span className="text-danger fw-bold">Admin Console</span>}
              </Link>
            </div>
          )}

          {/* Advocate Panel link */}
          {isLawyer() && (
            <div>
              {!collapsed && <div className="sidebar-group-title">Advocate</div>}
              <Link
                to="/lawyer/dashboard"
                className={`sidebar-link ${isActive('/lawyer/dashboard') ? 'active' : ''}`}
                onClick={() => setMobileOpen(false)}
                title={collapsed ? 'Advocate Panel' : ''}
              >
                <i className="bi bi-award-fill" style={{ fontSize: '1.1rem', color: '#d4af37' }}></i>
                {!collapsed && <span className="fw-bold" style={{ color: '#d4af37' }}>Advocate Panel</span>}
              </Link>
            </div>
          )}
        </div>

        {/* Bottom Section - Logout */}
        <div className="mt-auto pt-4">
          <button
            onClick={handleLogout}
            className={`btn sidebar-link text-danger border-0 w-100 text-start shadow-none ${collapsed ? 'justify-content-center' : ''}`}
            style={{ background: 'transparent' }}
          >
            <i className="bi bi-box-arrow-right text-danger" style={{ fontSize: '1.1rem' }}></i>
            {!collapsed && <span>Logout Account</span>}
          </button>
        </div>

      </div>

      {/* Right Side Workspace Frame */}
      <div className={`main-workspace ${collapsed ? 'margin-collapsed' : 'margin-expanded'}`}>
        
        {/* Sleek Top Bar */}
        <header className="topbar-container">
          
          {/* Mobile hamburger menu toggle */}
          <div className="d-flex align-items-center gap-3">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="btn text-white p-1 d-lg-none border-0 shadow-none"
              style={{ fontSize: '1.5rem' }}
            >
              <i className="bi bi-list"></i>
            </button>

            {/* Visual Search bar */}
            <div className="d-none d-sm-flex align-items-center gap-2 px-3 py-1.5 rounded-3" style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              width: '280px'
            }}>
              <i className="bi bi-search text-secondary" style={{ fontSize: '0.85rem' }}></i>
              <input
                type="text"
                placeholder="Search procedures or acts..."
                className="border-0 bg-transparent text-white w-100"
                style={{ outline: 'none', fontSize: '0.8rem' }}
              />
            </div>
          </div>

          {/* Action Tools (PWA, Notif, Theme, User Profile) */}
          <div className="d-flex align-items-center gap-2.5">
            {/* PWA Install Button */}
            {isInstallable && (
              <button
                className="btn btn-sm d-flex align-items-center gap-1.5"
                onClick={installApp}
                title="Install CitizenLex App"
                style={{
                  background: 'linear-gradient(135deg, #00d2ff, #d4af37)',
                  color: '#000',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  padding: '6px 12px',
                  boxShadow: '0 4px 15px rgba(0, 210, 255, 0.25)',
                  transition: 'all 0.3s'
                }}
              >
                <i className="bi bi-download"></i>
                <span className="d-none d-md-inline">Install App</span>
              </button>
            )}

            {/* Notification bell */}
            <Link
              to="/notifications"
              title="Notifications"
              style={{
                position: 'relative',
                width: 36,
                height: 36,
                borderRadius: 10,
                background: isActive('/notifications') ? '#d4af37' : 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: isActive('/notifications') ? 'black' : 'white',
                textDecoration: 'none',
                transition: 'all 0.2s',
                flexShrink: 0
              }}
            >
              <i className="bi bi-bell-fill" style={{ fontSize: '0.9rem' }}></i>
              {unreadCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: -2,
                  right: -2,
                  background: '#dc2626',
                  color: 'white',
                  borderRadius: '50%',
                  width: 16,
                  height: 16,
                  fontSize: '0.6rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid #02030a'
                }}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              title="Toggle theme"
              aria-label="Toggle dark/light mode"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '10px',
                width: 36,
                height: 36,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white'
              }}
            >
              {theme === 'light' ? <i className="bi bi-moon-stars-fill" style={{ fontSize: '0.9rem' }}></i> : <i className="bi bi-sun-fill" style={{ fontSize: '0.9rem' }}></i>}
            </button>

            {/* User Dropdown */}
            <div className="dropdown">
              <button
                className="btn d-flex align-items-center gap-2 fw-semibold"
                type="button"
                id="userTopbarMenuBtn"
                data-bs-toggle="dropdown"
                aria-expanded="false"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '10px',
                  color: 'white',
                  fontSize: '0.8rem',
                  padding: '6px 12px',
                  transition: 'all 0.2s'
                }}
              >
                {user?.profileImageUrl ? (
                  <img
                    src={user.profileImageUrl}
                    alt="Profile"
                    style={{ width: 22, height: 22, borderRadius: '50%', objectFit: 'cover' }}
                  />
                ) : (
                  <div style={{
                    width: 22, height: 22, borderRadius: '50%',
                    background: 'linear-gradient(135deg, #00d2ff, #d4af37)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.6rem', fontWeight: 700, color: 'black', flexShrink: 0,
                  }}>
                    {initials}
                  </div>
                )}
                <span className="d-none d-sm-inline">{user?.firstName}</span>
                <i className="bi bi-chevron-down small text-secondary"></i>
              </button>
              <ul className="dropdown-menu dropdown-menu-end mt-1 glass-panel" aria-labelledby="userTopbarMenuBtn" style={{
                border: '1px solid rgba(255,255,255,0.08)',
                background: '#04050f',
                boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
                borderRadius: '10px',
                padding: '6px',
                zIndex: 1100
              }}>
                <li>
                  <Link className="dropdown-item d-flex align-items-center gap-2 text-white" to="/profile" style={{ borderRadius: '8px', padding: '8px 12px', fontSize: '0.85rem' }}>
                    <i className="bi bi-person text-info"></i>Profile Settings
                  </Link>
                </li>
                <li>
                  <Link className="dropdown-item d-flex align-items-center gap-2 text-white" to="/notifications" style={{ borderRadius: '8px', padding: '8px 12px', fontSize: '0.85rem' }}>
                    <i className="bi bi-bell text-warning"></i>
                    Notifications
                    {unreadCount > 0 && (
                      <span className="badge ms-auto" style={{ background: '#dc2626', color: 'white', borderRadius: 6, fontSize: '0.65rem' }}>{unreadCount}</span>
                    )}
                  </Link>
                </li>
                <li><hr className="dropdown-divider my-1" style={{ borderColor: 'rgba(255,255,255,0.08)' }} /></li>
                <li>
                  <button className="dropdown-item text-danger d-flex align-items-center gap-2 w-100 text-start" onClick={handleLogout} style={{ borderRadius: '8px', padding: '8px 12px', fontSize: '0.85rem', background: 'transparent', border: '0' }}>
                    <i className="bi bi-box-arrow-right"></i>Logout Account
                  </button>
                </li>
              </ul>
            </div>

          </div>

        </header>

        {/* Content Area Rendering Children Views */}
        <main className="flex-grow-1" style={{ overflowY: 'auto', padding: '24px' }}>
          {children}
        </main>

      </div>

    </div>
  );
}
