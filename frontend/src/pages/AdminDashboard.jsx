import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Filler,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Filler,
  Title,
  Tooltip,
  Legend
);

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('analytics');
  const [analytics, setAnalytics] = useState(null);
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [rights, setRights] = useState([]);
  const [categories, setCategories] = useState([]);
  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activityTrend, setActivityTrend] = useState([]);
  const [actionBreakdown, setActionBreakdown] = useState({});

  // Form states
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('shield');

  const [newRightTitle, setNewRightTitle] = useState('');
  const [newRightContent, setNewRightContent] = useState('');
  const [newRightTamilTitle, setNewRightTamilTitle] = useState('');
  const [newRightTamilContent, setNewRightTamilContent] = useState('');
  const [newRightCatId, setNewRightCatId] = useState('');
  const [newRightRes, setNewRightRes] = useState('');

  const [newSchemeTitle, setNewSchemeTitle] = useState('');
  const [newSchemeCategory, setNewSchemeCategory] = useState('');
  const [newSchemeEligibility, setNewSchemeEligibility] = useState('');
  const [newSchemeDocs, setNewSchemeDocs] = useState('');
  const [newSchemeProcess, setNewSchemeProcess] = useState('');
  const [newSchemeLink, setNewSchemeLink] = useState('');

  useEffect(() => {
    loadDashboardData();
  }, [activeTab]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'analytics') {
        const res = await axios.get('/api/admin/analytics');
        setAnalytics(res.data);
        try {
          const trendRes = await axios.get('/api/admin/activity-trend');
          setActivityTrend(trendRes.data || []);
        } catch (e) {
          console.error("Error loading activity trend", e);
        }
        try {
          const breakdownRes = await axios.get('/api/admin/action-breakdown');
          setActionBreakdown(breakdownRes.data || {});
        } catch (e) {
          console.error("Error loading action breakdown", e);
        }
        try {
          const logsRes = await axios.get('/api/admin/logs');
          setLogs(logsRes.data || []);
        } catch (e) {
          console.error("Error loading logs", e);
        }
      } else if (activeTab === 'users') {
        const res = await axios.get('/api/admin/users');
        setUsers(res.data || []);
      } else if (activeTab === 'rights') {
        const catRes = await axios.get('/api/rights/categories');
        const rightRes = await axios.get('/api/rights/contents');
        setCategories(catRes.data || []);
        setRights(rightRes.data || []);
        if (catRes.data.length > 0) {
          setNewRightCatId(catRes.data[0].id.toString());
        }
      } else if (activeTab === 'schemes') {
        const res = await axios.get('/api/schemes');
        setSchemes(res.data || []);
      } else if (activeTab === 'logs') {
        const res = await axios.get('/api/admin/logs');
        setLogs(res.data || []);
      }
    } catch (err) {
      console.error("Error fetching admin data", err);
    } finally {
      setLoading(false);
    }
  };

  // User Actions
  const toggleUserRole = async (userId, currentRole) => {
    const targetRole = currentRole === 'ROLE_ADMIN' ? 'ROLE_USER' : 'ROLE_ADMIN';
    try {
      await axios.put(`/api/admin/users/${userId}/role?role=${targetRole}`);
      loadDashboardData();
    } catch (err) {
      console.error(err);
    }
  };

  const deleteUser = async (userId) => {
    if (!window.confirm("Delete this user account permanently?")) return;
    try {
      await axios.delete(`/api/admin/users/${userId}`);
      loadDashboardData();
    } catch (err) {
      console.error(err);
    }
  };

  // Rights CRUD
  const handleCreateCategory = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/rights/categories', {
        name: newCatName,
        description: newCatDesc,
        icon: newCatIcon
      });
      setNewCatName('');
      setNewCatDesc('');
      loadDashboardData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteCategory = async (catId) => {
    if (!window.confirm("Deletions remove all rights articles nested inside. Proceed?")) return;
    try {
      await axios.delete(`/api/rights/categories/${catId}`);
      loadDashboardData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateRight = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`/api/rights/contents?categoryId=${newRightCatId}`, {
        title: newRightTitle,
        content: newRightContent,
        tamilTitle: newRightTamilTitle,
        tamilContent: newRightTamilContent,
        resources: newRightRes
      });
      setNewRightTitle('');
      setNewRightContent('');
      setNewRightTamilTitle('');
      setNewRightTamilContent('');
      setNewRightRes('');
      loadDashboardData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteRight = async (rightId) => {
    if (!window.confirm("Are you sure you want to delete this rights article?")) return;
    try {
      await axios.delete(`/api/rights/contents/${rightId}`);
      loadDashboardData();
    } catch (err) {
      console.error(err);
    }
  };

  // Schemes CRUD
  const handleCreateScheme = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/schemes', {
        title: newSchemeTitle,
        category: newSchemeCategory,
        eligibility: newSchemeEligibility,
        requiredDocuments: newSchemeDocs,
        applicationProcess: newSchemeProcess,
        officialLink: newSchemeLink
      });
      setNewSchemeTitle('');
      setNewSchemeCategory('');
      setNewSchemeEligibility('');
      setNewSchemeDocs('');
      setNewSchemeProcess('');
      setNewSchemeLink('');
      loadDashboardData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteScheme = async (schId) => {
    if (!window.confirm("Remove this government scheme?")) return;
    try {
      await axios.delete(`/api/schemes/${schId}`);
      loadDashboardData();
    } catch (err) {
      console.error(err);
    }
  };

  // Chart Setup
  const getChartData = () => {
    if (!analytics) return { labels: [], datasets: [] };
    return {
      labels: ['Users', 'Rights', 'Schemes', 'Analyzed Docs', 'AI Chats', 'Legal Drafts'],
      datasets: [
        {
          label: 'Total Counts',
          data: [
            analytics.totalUsers,
            analytics.totalRights,
            analytics.totalSchemes,
            analytics.totalDocuments,
            analytics.totalChats,
            analytics.totalDrafts || 0
          ],
          backgroundColor: 'rgba(37, 99, 235, 0.7)',
          borderRadius: 8
        }
      ]
    };
  };

  const getLineChartData = () => {
    if (!activityTrend || activityTrend.length === 0) return { labels: [], datasets: [] };
    const sortedTrend = [...activityTrend].sort((a, b) => new Date(a.date) - new Date(b.date));
    return {
      labels: sortedTrend.map(t => new Date(t.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })),
      datasets: [
        {
          label: 'Daily Activities',
          data: sortedTrend.map(t => t.count),
          fill: true,
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          borderColor: '#ef4444',
          tension: 0.4,
          pointBackgroundColor: '#ef4444',
          pointBorderColor: '#ffffff',
          pointHoverRadius: 6
        }
      ]
    };
  };

  const getDoughnutChartData = () => {
    if (!actionBreakdown || Object.keys(actionBreakdown).length === 0) return { labels: [], datasets: [] };
    const labels = Object.keys(actionBreakdown);
    const data = Object.values(actionBreakdown);
    const colors = [
      'rgba(59, 130, 246, 0.8)',
      'rgba(16, 185, 129, 0.8)',
      'rgba(245, 158, 11, 0.8)',
      'rgba(236, 72, 153, 0.8)',
      'rgba(139, 92, 246, 0.8)',
      'rgba(239, 68, 68, 0.8)',
      'rgba(107, 114, 128, 0.8)'
    ];
    return {
      labels: labels,
      datasets: [
        {
          data: data,
          backgroundColor: colors.slice(0, labels.length),
          borderWidth: 1,
          borderColor: 'var(--border)'
        }
      ]
    };
  };

  return (
    <div className="container py-5 text-start">
      <div className="row mb-5 fade-in-el">
        <div className="col-12">
          <h1 className="fw-bold text-danger">Admin Control Room</h1>
          <p className="text-secondary">Manage registered users, rights lists, welfare schemes database, and analyze activity logs.</p>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="glass-panel p-2 d-flex flex-wrap gap-2">
            <button className={`btn ${activeTab === 'analytics' ? 'btn-danger text-white' : 'btn-glass-secondary'}`} onClick={() => setActiveTab('analytics')}>
              <i className="bi bi-graph-up me-2"></i>Analytics
            </button>
            <button className={`btn ${activeTab === 'users' ? 'btn-danger text-white' : 'btn-glass-secondary'}`} onClick={() => setActiveTab('users')}>
              <i className="bi bi-people me-2"></i>Users
            </button>
            <button className={`btn ${activeTab === 'rights' ? 'btn-danger text-white' : 'btn-glass-secondary'}`} onClick={() => setActiveTab('rights')}>
              <i className="bi bi-journal-text me-2"></i>Rights Content
            </button>
            <button className={`btn ${activeTab === 'schemes' ? 'btn-danger text-white' : 'btn-glass-secondary'}`} onClick={() => setActiveTab('schemes')}>
              <i className="bi bi-card-checklist me-2"></i>Welfare Schemes
            </button>
            <button className={`btn ${activeTab === 'logs' ? 'btn-danger text-white' : 'btn-glass-secondary'}`} onClick={() => setActiveTab('logs')}>
              <i className="bi bi-journal-code me-2"></i>Audit Logs
            </button>
          </div>
        </div>
      </div>

      {/* Content Rendering */}
      <div className="row fade-in-el">
        <div className="col-12">
          {loading ? (
            <div className="d-flex justify-content-center py-5">
              <div className="spinner-border text-danger" role="status"></div>
            </div>
          ) : (
            <div className="glass-panel p-4 p-md-5">
              
              {/* Analytics Tab */}
              {activeTab === 'analytics' && analytics && (
                <div>
                  <h4 className="fw-bold mb-4 text-white">System Statistics</h4>
                  <div className="row g-4 mb-5">
                    {/* Card 1: Users */}
                    <div className="col-lg-4 col-md-6 col-sm-12">
                      <div className="card text-white overflow-hidden shadow-sm border-0 h-100 animate-hover" style={{
                        background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                        borderRadius: '16px'
                      }}>
                        <div className="card-body p-4 position-relative">
                          <div className="position-absolute top-50 end-0 translate-middle-y me-4 opacity-25">
                            <i className="bi bi-people-fill" style={{ fontSize: '4.5rem' }}></i>
                          </div>
                          <h6 className="text-white-50 text-uppercase fw-semibold mb-2" style={{ letterSpacing: '0.5px' }}>Total Registered Users</h6>
                          <h2 className="display-5 fw-bold mb-1">{analytics.totalUsers}</h2>
                          <p className="card-text text-white-50 small mb-0"><i className="bi bi-arrow-up-right me-1"></i>System user accounts</p>
                        </div>
                      </div>
                    </div>

                    {/* Card 2: Chats */}
                    <div className="col-lg-4 col-md-6 col-sm-12">
                      <div className="card text-white overflow-hidden shadow-sm border-0 h-100 animate-hover" style={{
                        background: 'linear-gradient(135deg, #10b981 0%, #047857 100%)',
                        borderRadius: '16px'
                      }}>
                        <div className="card-body p-4 position-relative">
                          <div className="position-absolute top-50 end-0 translate-middle-y me-4 opacity-25">
                            <i className="bi bi-chat-left-text-fill" style={{ fontSize: '4.5rem' }}></i>
                          </div>
                          <h6 className="text-white-50 text-uppercase fw-semibold mb-2" style={{ letterSpacing: '0.5px' }}>Saved Conversations</h6>
                          <h2 className="display-5 fw-bold mb-1">{analytics.totalChats}</h2>
                          <p className="card-text text-white-50 small mb-0"><i className="bi bi-arrow-up-right me-1"></i>AI Assistant chats</p>
                        </div>
                      </div>
                    </div>

                    {/* Card 3: Documents */}
                    <div className="col-lg-4 col-md-6 col-sm-12">
                      <div className="card text-white overflow-hidden shadow-sm border-0 h-100 animate-hover" style={{
                        background: 'linear-gradient(135deg, #f59e0b 0%, #b45309 100%)',
                        borderRadius: '16px'
                      }}>
                        <div className="card-body p-4 position-relative">
                          <div className="position-absolute top-50 end-0 translate-middle-y me-4 opacity-25">
                            <i className="bi bi-file-earmark-medical-fill" style={{ fontSize: '4.5rem' }}></i>
                          </div>
                          <h6 className="text-white-50 text-uppercase fw-semibold mb-2" style={{ letterSpacing: '0.5px' }}>Analyzed Documents</h6>
                          <h2 className="display-5 fw-bold mb-1">{analytics.totalDocuments}</h2>
                          <p className="card-text text-white-50 small mb-0"><i className="bi bi-arrow-up-right me-1"></i>Uploaded legal files</p>
                        </div>
                      </div>
                    </div>

                    {/* Card 4: Drafts */}
                    <div className="col-lg-4 col-md-6 col-sm-12">
                      <div className="card text-white overflow-hidden shadow-sm border-0 h-100 animate-hover" style={{
                        background: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)',
                        borderRadius: '16px'
                      }}>
                        <div className="card-body p-4 position-relative">
                          <div className="position-absolute top-50 end-0 translate-middle-y me-4 opacity-25">
                            <i className="bi bi-file-earmark-word-fill" style={{ fontSize: '4.5rem' }}></i>
                          </div>
                          <h6 className="text-white-50 text-uppercase fw-semibold mb-2" style={{ letterSpacing: '0.5px' }}>Legal Drafts Generated</h6>
                          <h2 className="display-5 fw-bold mb-1">{analytics.totalDrafts || 0}</h2>
                          <p className="card-text text-white-50 small mb-0"><i className="bi bi-arrow-up-right me-1"></i>Created drafts & petitions</p>
                        </div>
                      </div>
                    </div>

                    {/* Card 5: Rights */}
                    <div className="col-lg-4 col-md-6 col-sm-12">
                      <div className="card text-white overflow-hidden shadow-sm border-0 h-100 animate-hover" style={{
                        background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
                        borderRadius: '16px'
                      }}>
                        <div className="card-body p-4 position-relative">
                          <div className="position-absolute top-50 end-0 translate-middle-y me-4 opacity-25">
                            <i className="bi bi-journal-text" style={{ fontSize: '4.5rem' }}></i>
                          </div>
                          <h6 className="text-white-50 text-uppercase fw-semibold mb-2" style={{ letterSpacing: '0.5px' }}>Rights Articles</h6>
                          <h2 className="display-5 fw-bold mb-1">{analytics.totalRights}</h2>
                          <p className="card-text text-white-50 small mb-0"><i className="bi bi-arrow-up-right me-1"></i>Constitutional rights database</p>
                        </div>
                      </div>
                    </div>

                    {/* Card 6: Schemes */}
                    <div className="col-lg-4 col-md-6 col-sm-12">
                      <div className="card text-white overflow-hidden shadow-sm border-0 h-100 animate-hover" style={{
                        background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
                        borderRadius: '16px'
                      }}>
                        <div className="card-body p-4 position-relative">
                          <div className="position-absolute top-50 end-0 translate-middle-y me-4 opacity-25">
                            <i className="bi bi-card-checklist" style={{ fontSize: '4.5rem' }}></i>
                          </div>
                          <h6 className="text-white-50 text-uppercase fw-semibold mb-2" style={{ letterSpacing: '0.5px' }}>Welfare Schemes</h6>
                          <h2 className="display-5 fw-bold mb-1">{analytics.totalSchemes}</h2>
                          <p className="card-text text-white-50 small mb-0"><i className="bi bi-arrow-up-right me-1"></i>Registered schemes</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Charts section */}
                  <div className="row g-4 mb-5">
                    <div className="col-lg-8">
                      <div className="card bg-glass border border-light-subtle shadow-sm p-4 h-100" style={{ borderRadius: '16px', backdropFilter: 'blur(10px)', background: 'var(--surface)' }}>
                        <h5 className="fw-bold mb-4 text-white"><i className="bi bi-graph-up text-danger me-2"></i>Daily Activity Trend (Last 30 Days)</h5>
                        <div style={{ height: '300px', position: 'relative' }}>
                          {activityTrend.length > 0 ? (
                            <Line data={getLineChartData()} options={{
                              responsive: true,
                              maintainAspectRatio: false,
                              plugins: {
                                legend: { display: false }
                              },
                              scales: {
                                y: {
                                  grid: { color: 'rgba(255,255,255,0.05)' },
                                  ticks: { color: 'var(--text-secondary)' }
                                },
                                x: {
                                  grid: { display: false },
                                  ticks: { color: 'var(--text-secondary)' }
                                }
                              }
                            }} />
                          ) : (
                            <div className="d-flex h-100 justify-content-center align-items-center text-secondary">
                              No activity logs recorded in the last 30 days
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="col-lg-4">
                      <div className="card bg-glass border border-light-subtle shadow-sm p-4 h-100" style={{ borderRadius: '16px', backdropFilter: 'blur(10px)', background: 'var(--surface)' }}>
                        <h5 className="fw-bold mb-4 text-white"><i className="bi bi-pie-chart text-danger me-2"></i>Action Distribution</h5>
                        <div style={{ height: '300px', position: 'relative' }} className="d-flex justify-content-center align-items-center">
                          {Object.keys(actionBreakdown).length > 0 ? (
                            <Doughnut data={getDoughnutChartData()} options={{
                              responsive: true,
                              maintainAspectRatio: false,
                              plugins: {
                                legend: {
                                  position: 'bottom',
                                  labels: { color: 'var(--text-primary)', boxWidth: 12, font: { size: 11 } }
                                }
                              }
                            }} />
                          ) : (
                            <div className="text-secondary">No actions recorded</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="row g-4">
                    <div className="col-lg-6">
                      <div className="card bg-glass border border-light-subtle shadow-sm p-4 h-100" style={{ borderRadius: '16px', backdropFilter: 'blur(10px)', background: 'var(--surface)' }}>
                        <h5 className="fw-bold mb-4 text-white"><i className="bi bi-bar-chart text-danger me-2"></i>Platform Overview</h5>
                        <div style={{ height: '300px', position: 'relative' }}>
                          <Bar data={getChartData()} options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                              legend: { display: false }
                            },
                            scales: {
                              y: {
                                grid: { color: 'rgba(255,255,255,0.05)' },
                                ticks: { color: 'var(--text-secondary)' }
                              },
                              x: {
                                grid: { display: false },
                                ticks: { color: 'var(--text-secondary)' }
                              }
                            }
                          }} />
                        </div>
                      </div>
                    </div>

                    <div className="col-lg-6">
                      <div className="card bg-glass border border-light-subtle shadow-sm p-4 h-100" style={{ borderRadius: '16px', backdropFilter: 'blur(10px)', background: 'var(--surface)' }}>
                        <h5 className="fw-bold mb-4 text-white"><i className="bi bi-clock-history text-danger me-2"></i>Recent Activity Feed</h5>
                        <div className="overflow-auto" style={{ maxHeight: '300px' }}>
                          {logs.length > 0 ? (
                            <ul className="list-group list-group-flush bg-transparent">
                              {logs.slice(0, 10).map((log) => (
                                <li key={log.id} className="list-group-item bg-transparent text-start border-light-subtle px-0 py-3 d-flex justify-content-between align-items-start gap-3">
                                  <div className="ms-2 me-auto">
                                    <div className="fw-bold text-primary small">{log.user ? log.user.email : 'SYSTEM'}</div>
                                    <span className="text-secondary small">{log.details}</span>
                                  </div>
                                  <div className="text-end">
                                    <span className={`badge ${
                                      log.action === 'CHAT' ? 'bg-info' : 
                                      log.action === 'LOGIN' ? 'bg-success' : 
                                      log.action === 'REGISTER' ? 'bg-primary' : 
                                      log.action === 'DRAFT' ? 'bg-danger' : 
                                      'bg-warning'
                                    } me-2`}>
                                      {log.action}
                                    </span>
                                    <div className="text-muted" style={{ fontSize: '10px' }}>
                                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                  </div>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <div className="d-flex h-100 justify-content-center align-items-center text-secondary py-5">
                              No recent activity logs
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Users Tab */}
              {activeTab === 'users' && (
                <div>
                  <h4 className="fw-bold mb-4">Registered Accounts</h4>
                  <div className="table-responsive">
                    <table className="table table-hover table-glass">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Role</th>
                          <th>Registered</th>
                          <th className="text-end">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((u) => (
                          <tr key={u.id}>
                            <td>{u.id}</td>
                            <td>{u.firstName} {u.lastName}</td>
                            <td>{u.email}</td>
                            <td>
                              <span className={`badge ${u.role === 'ROLE_ADMIN' ? 'bg-danger' : 'bg-primary'}`}>
                                {u.role}
                              </span>
                            </td>
                            <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                            <td className="text-end">
                              <button
                                className="btn btn-sm btn-outline-warning me-2"
                                onClick={() => toggleUserRole(u.id, u.role)}
                                disabled={u.email === 'admin@citizenlex.com'}
                              >
                                Toggle Role
                              </button>
                              <button
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => deleteUser(u.id)}
                                disabled={u.email === 'admin@citizenlex.com'}
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Rights Tab */}
              {activeTab === 'rights' && (
                <div>
                  <h4 className="fw-bold mb-4">Rights Category Management</h4>
                  <form onSubmit={handleCreateCategory} className="row g-3 mb-5 border-bottom pb-4">
                    <h5>Add Category</h5>
                    <div className="col-md-4">
                      <input type="text" className="form-control form-glass-control" placeholder="Category Name" value={newCatName} onChange={(e) => setNewCatName(e.target.value)} required />
                    </div>
                    <div className="col-md-5">
                      <input type="text" className="form-control form-glass-control" placeholder="Category Description" value={newCatDesc} onChange={(e) => setNewCatDesc(e.target.value)} required />
                    </div>
                    <div className="col-md-2">
                      <select className="form-select form-glass-control" value={newCatIcon} onChange={(e) => setNewCatIcon(e.target.value)}>
                        <option value="shield">Shield</option>
                        <option value="cart">Cart</option>
                        <option value="gender-female">Gender Female</option>
                        <option value="people">People</option>
                        <option value="briefcase">Briefcase</option>
                      </select>
                    </div>
                    <div className="col-md-1">
                      <button type="submit" className="btn btn-danger w-100">Add</button>
                    </div>
                  </form>

                  <h5 className="mb-3">Categories List</h5>
                  <div className="row g-3 mb-5">
                    {categories.map((c) => (
                      <div key={c.id} className="col-md-4">
                        <div className="border rounded p-3 d-flex justify-content-between align-items-center">
                          <div>
                            <strong>{c.name}</strong>
                            <p className="text-secondary small mb-0 text-truncate" style={{ maxWidth: '200px' }}>{c.description}</p>
                          </div>
                          <button className="btn btn-sm btn-outline-danger border-0" onClick={() => handleDeleteCategory(c.id)}>
                            <i className="bi bi-trash-fill"></i>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <hr />

                  <h4 className="fw-bold my-4">Rights Articles</h4>
                  <form onSubmit={handleCreateRight} className="row g-3 mb-5">
                    <h5>Create Rights Article</h5>
                    <div className="col-md-6">
                      <label className="form-label small text-secondary">English Title</label>
                      <input type="text" className="form-control form-glass-control" value={newRightTitle} onChange={(e) => setNewRightTitle(e.target.value)} required />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small text-secondary">Tamil Title</label>
                      <input type="text" className="form-control form-glass-control" value={newRightTamilTitle} onChange={(e) => setNewRightTamilTitle(e.target.value)} required />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small text-secondary">English Content</label>
                      <textarea className="form-control form-glass-control" rows="3" value={newRightContent} onChange={(e) => setNewRightContent(e.target.value)} required />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small text-secondary">Tamil Content</label>
                      <textarea className="form-control form-glass-control" rows="3" value={newRightTamilContent} onChange={(e) => setNewRightTamilContent(e.target.value)} required />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label small text-secondary">Select Category</label>
                      <select className="form-select form-glass-control" value={newRightCatId} onChange={(e) => setNewRightCatId(e.target.value)}>
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-8">
                      <label className="form-label small text-secondary">References/Resources</label>
                      <input type="text" className="form-control form-glass-control" value={newRightRes} onChange={(e) => setNewRightRes(e.target.value)} placeholder="Constitutional Articles, legal portals, books..." />
                    </div>
                    <div className="col-12 mt-3">
                      <button type="submit" className="btn btn-danger py-2 px-4">Publish Article</button>
                    </div>
                  </form>

                  <h5 className="mb-3">Published Articles</h5>
                  <div className="table-responsive">
                    <table className="table table-hover table-glass">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Category</th>
                          <th>English Title</th>
                          <th>Tamil Title</th>
                          <th className="text-end">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rights.map((r) => (
                          <tr key={r.id}>
                            <td>{r.id}</td>
                            <td>{r.category.name}</td>
                            <td>{r.title}</td>
                            <td>{r.tamilTitle}</td>
                            <td className="text-end">
                              <button className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteRight(r.id)}>
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Schemes Tab */}
              {activeTab === 'schemes' && (
                <div>
                  <h4 className="fw-bold mb-4">Welfare Scheme Registry</h4>
                  <form onSubmit={handleCreateScheme} className="row g-3 mb-5">
                    <h5>Add Government Scheme</h5>
                    <div className="col-md-6">
                      <label className="form-label small text-secondary">Scheme Title</label>
                      <input type="text" className="form-control form-glass-control" value={newSchemeTitle} onChange={(e) => setNewSchemeTitle(e.target.value)} required />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small text-secondary">Category Label (e.g. Farmers, Healthcare)</label>
                      <input type="text" className="form-control form-glass-control" value={newSchemeCategory} onChange={(e) => setNewSchemeCategory(e.target.value)} required />
                    </div>
                    <div className="col-md-12">
                      <label className="form-label small text-secondary">Eligibility Rules</label>
                      <textarea className="form-control form-glass-control" rows="2" value={newSchemeEligibility} onChange={(e) => setNewSchemeEligibility(e.target.value)} required />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small text-secondary">Required Documents</label>
                      <textarea className="form-control form-glass-control" rows="2" value={newSchemeDocs} onChange={(e) => setNewSchemeDocs(e.target.value)} required />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small text-secondary">Application Steps</label>
                      <textarea className="form-control form-glass-control" rows="2" value={newSchemeProcess} onChange={(e) => setNewSchemeProcess(e.target.value)} required />
                    </div>
                    <div className="col-md-12">
                      <label className="form-label small text-secondary">Official Link URL</label>
                      <input type="url" className="form-control form-glass-control" value={newSchemeLink} onChange={(e) => setNewSchemeLink(e.target.value)} placeholder="https://..." />
                    </div>
                    <div className="col-12 mt-3">
                      <button type="submit" className="btn btn-danger py-2 px-4">Register Scheme</button>
                    </div>
                  </form>

                  <h5 className="mb-3">Registered Welfare Schemes</h5>
                  <div className="table-responsive">
                    <table className="table table-hover table-glass">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Category</th>
                          <th>Title</th>
                          <th>Portal Link</th>
                          <th className="text-end">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {schemes.map((s) => (
                          <tr key={s.id}>
                            <td>{s.id}</td>
                            <td>{s.category}</td>
                            <td>{s.title}</td>
                            <td><a href={s.officialLink} target="_blank" rel="noreferrer" className="text-truncate d-block small" style={{ maxWidth: '200px' }}>{s.officialLink}</a></td>
                            <td className="text-end">
                              <button className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteScheme(s.id)}>
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Logs Tab */}
              {activeTab === 'logs' && (
                <div>
                  <h4 className="fw-bold mb-4">Security & Activity Audit Logs</h4>
                  <div className="table-responsive" style={{ maxHeight: '550px', overflowY: 'auto' }}>
                    <table className="table table-hover table-glass">
                      <thead>
                        <tr>
                          <th>Timestamp</th>
                          <th>Email</th>
                          <th>Action</th>
                          <th>Details</th>
                        </tr>
                      </thead>
                      <tbody>
                        {logs.map((log) => (
                          <tr key={log.id}>
                            <td className="small">{new Date(log.timestamp).toLocaleString()}</td>
                            <td className="small fw-bold">{log.user ? log.user.email : 'SYSTEM'}</td>
                            <td>
                              <span className={`badge ${log.action === 'CHAT' ? 'bg-info' : log.action === 'LOGIN' ? 'bg-success' : log.action === 'REGISTER' ? 'bg-primary' : 'bg-warning'}`}>
                                {log.action}
                              </span>
                            </td>
                            <td className="small text-secondary">{log.details}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            </div>
          )}
        </div>
      </div>
    </div>
  );
}
