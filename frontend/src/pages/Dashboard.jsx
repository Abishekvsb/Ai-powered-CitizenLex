import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Register Chart.js modules
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function Dashboard() {
  const { user } = useAuth();
  const [chats, setChats] = useState([]);
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const chatsRes = await axios.get('/api/chat/history');
        const docsRes = await axios.get('/api/documents');
        setChats(chatsRes.data || []);
        setDocs(docsRes.data || []);
      } catch (err) {
        console.error("Failed to load dashboard statistics", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const chartData = {
    labels: ['AI Chats', 'Uploaded Documents'],
    datasets: [
      {
        label: 'Your Platform Activity',
        data: [chats.length, docs.length],
        backgroundColor: ['rgba(37, 99, 235, 0.65)', 'rgba(56, 189, 248, 0.65)'],
        borderColor: ['#2563eb', '#38bdf8'],
        borderWidth: 1,
        borderRadius: 8,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(255, 255, 255, 0.05)',
        },
        ticks: {
          precision: 0,
        }
      },
    },
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '70vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading Dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-5 text-start">
      <div className="row mb-5 fade-in-el">
        <div className="col-12">
          <h1 className="fw-bold">Welcome back, {user?.firstName}!</h1>
          <p className="text-secondary">Explore legal rights, check schemes eligibility, or upload covenants for instant AI parsing.</p>
        </div>
      </div>

      {/* Metrics Summary Row */}
      <div className="row g-4 mb-5 fade-in-el">
        <div className="col-md-4">
          <div className="glass-panel p-4 d-flex align-items-center gap-3">
            <div className="bg-primary text-white rounded p-3 d-flex align-items-center justify-content-center" style={{ width: '60px', height: '60px' }}>
              <i className="bi bi-chat-dots-fill fs-3"></i>
            </div>
            <div>
              <h6 className="text-secondary mb-1">Total Chat Queries</h6>
              <h2 className="mb-0 fw-bold">{chats.length}</h2>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="glass-panel p-4 d-flex align-items-center gap-3">
            <div className="bg-info text-white rounded p-3 d-flex align-items-center justify-content-center" style={{ width: '60px', height: '60px' }}>
              <i className="bi bi-file-earmark-bar-graph-fill fs-3"></i>
            </div>
            <div>
              <h6 className="text-secondary mb-1">Documents Uploaded</h6>
              <h2 className="mb-0 fw-bold">{docs.length}</h2>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="glass-panel p-4 d-flex align-items-center gap-3">
            <div className="bg-success text-white rounded p-3 d-flex align-items-center justify-content-center" style={{ width: '60px', height: '60px' }}>
              <i className="bi bi-patch-check-fill fs-3"></i>
            </div>
            <div>
              <h6 className="text-secondary mb-1">Verification Status</h6>
              <h2 className="mb-0 fw-bold text-success">Verified</h2>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-5 mb-5 fade-in-el">
        {/* Activity Chart */}
        <div className="col-lg-6">
          <div className="glass-panel p-4 h-100">
            <h5 className="fw-bold mb-4">Activity Visualization</h5>
            <div style={{ maxHeight: '300px' }} className="d-flex align-items-center justify-content-center">
              {chats.length === 0 && docs.length === 0 ? (
                <div className="text-center text-secondary py-5">
                  <i className="bi bi-graph-up fs-2 d-block mb-3 text-secondary-50"></i>
                  <span>No data to display. Start chatting or upload files to generate logs.</span>
                </div>
              ) : (
                <Bar data={chartData} options={chartOptions} />
              )}
            </div>
          </div>
        </div>

        {/* Quick Tools Grid */}
        <div className="col-lg-6">
          <div className="glass-panel p-4 h-100">
            <h5 className="fw-bold mb-4">Quick Legal Tools</h5>
            <div className="row g-3">
              <div className="col-6">
                <Link to="/chat" className="btn btn-outline-primary w-100 p-4 d-flex flex-column align-items-center gap-2 glass-panel-hover h-100">
                  <i className="bi bi-chat-square-text fs-2"></i>
                  <span className="fw-bold">AI Assistant</span>
                </Link>
              </div>
              <div className="col-6">
                <Link to="/analyzer" className="btn btn-outline-info w-100 p-4 d-flex flex-column align-items-center gap-2 glass-panel-hover h-100">
                  <i className="bi bi-file-earmark-pdf fs-2"></i>
                  <span className="fw-bold">Doc Analyzer</span>
                </Link>
              </div>
              <div className="col-6">
                <Link to="/rights" className="btn btn-outline-secondary w-100 p-4 d-flex flex-column align-items-center gap-2 glass-panel-hover h-100">
                  <i className="bi bi-book fs-2"></i>
                  <span className="fw-bold">Explore Rights</span>
                </Link>
              </div>
              <div className="col-6">
                <Link to="/schemes" className="btn btn-outline-success w-100 p-4 d-flex flex-column align-items-center gap-2 glass-panel-hover h-100">
                  <i className="bi bi-search-heart fs-2"></i>
                  <span className="fw-bold">Scheme Finder</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-5 fade-in-el">
        {/* Recent Chat Queries */}
        <div className="col-md-6">
          <div className="glass-panel p-4 h-100">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h5 className="fw-bold mb-0">Recent Chat History</h5>
              <Link to="/chat" className="btn btn-sm btn-link text-decoration-none">Open Chat</Link>
            </div>
            
            {chats.length === 0 ? (
              <p className="text-secondary py-4 text-center">No recent conversations. Ask a legal question to start.</p>
            ) : (
              <div className="list-group list-group-flush" style={{ maxHeight: '350px', overflowY: 'auto' }}>
                {chats.slice(0, 5).map((chat) => (
                  <div key={chat.id} className="list-group-item bg-transparent border-0 border-bottom px-0 py-3 text-start">
                    <div className="d-flex justify-content-between mb-1">
                      <strong className="text-primary text-truncate" style={{ maxWidth: '75%' }}>{chat.message}</strong>
                      <span className="text-secondary small">{new Date(chat.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="text-secondary small mb-0 text-truncate">{chat.response}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Analyzed Docs */}
        <div className="col-md-6">
          <div className="glass-panel p-4 h-100">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h5 className="fw-bold mb-0">Recent Analyzed Documents</h5>
              <Link to="/analyzer" className="btn btn-sm btn-link text-decoration-none">Analyze File</Link>
            </div>

            {docs.length === 0 ? (
              <p className="text-secondary py-4 text-center">No uploaded documents. Upload a contract to start.</p>
            ) : (
              <div className="list-group list-group-flush" style={{ maxHeight: '350px', overflowY: 'auto' }}>
                {docs.slice(0, 5).map((doc) => (
                  <div key={doc.id} className="list-group-item bg-transparent border-0 border-bottom px-0 py-3 text-start">
                    <div className="d-flex justify-content-between align-items-center">
                      <div className="d-flex align-items-center gap-2">
                        <i className="bi bi-file-earmark-text text-info fs-4"></i>
                        <strong className="text-truncate" style={{ maxWidth: '200px' }}>{doc.fileName}</strong>
                      </div>
                      <span className="text-secondary small">{new Date(doc.uploadedAt).toLocaleDateString()}</span>
                    </div>
                    <div className="mt-2">
                      <Link to="/analyzer" className="btn btn-sm btn-outline-info">View Analysis</Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
