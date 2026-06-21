import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

export default function Profile() {
  const { user, updateUserProfileState } = useAuth();
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [password, setPassword] = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess('');
    setError('');
    setLoading(true);

    try {
      const params = new URLSearchParams();
      params.append('firstName', firstName);
      params.append('lastName', lastName);
      if (password.trim() !== '') {
        params.append('password', password);
      }

      const res = await axios.put('/api/auth/profile', params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      updateUserProfileState(res.data);
      setSuccess('Profile updated successfully!');
      setPassword(''); // Clear password
    } catch (err) {
      console.error(err);
      if (err.response && err.response.data) {
        setError(err.response.data.error || 'Failed to update profile information.');
      } else {
        setError('Network error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-5 text-start">
      <div className="row mb-5 fade-in-el">
        <div className="col-12">
          <span className="badge bg-light text-primary border border-primary-subtle px-3 py-2 mb-3 fw-bold rounded-pill">
            👤 Manage Account
          </span>
          <h1 className="fw-bold">User Profile</h1>
          <p className="text-secondary">Update your profile parameters or secure your account password.</p>
        </div>
      </div>

      <div className="row g-5 justify-content-center">
        
        {/* Left Info Panel */}
        <div className="col-md-5 col-lg-4 fade-in-el">
          <div className="glass-panel p-4 text-center">
            <div className="bg-primary-subtle text-primary rounded-circle d-flex align-items-center justify-content-center mx-auto mb-4" style={{ width: '100px', height: '100px' }}>
              <i className="bi bi-person-fill-gear" style={{ fontSize: '3rem' }}></i>
            </div>
            
            <h4 className="fw-bold mb-1">{user?.firstName} {user?.lastName}</h4>
            <span className="badge bg-secondary mb-3">{user?.role}</span>
            <hr />
            
            <div className="text-start mt-4">
              <div className="mb-3">
                <strong className="text-secondary small d-block">Account Email</strong>
                <span className="text-dark-emphasis">{user?.email}</span>
              </div>
              <div className="mb-3">
                <strong className="text-secondary small d-block">Registered Since</strong>
                <span className="text-dark-emphasis">
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Update Form Panel */}
        <div className="col-md-7 col-lg-6 fade-in-el">
          <div className="glass-panel p-4 p-md-5">
            <h4 className="fw-bold mb-4">Edit Profile Settings</h4>

            {success && (
              <div className="alert alert-success d-flex align-items-center mb-4" role="alert">
                <i className="bi bi-check-circle-fill me-2"></i>
                <div>{success}</div>
              </div>
            )}

            {error && (
              <div className="alert alert-danger d-flex align-items-center mb-4" role="alert">
                <i className="bi bi-exclamation-triangle-fill me-2"></i>
                <div>{error}</div>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label fw-bold">First Name</label>
                  <input
                    type="text"
                    className="form-control form-glass-control"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label fw-bold">Last Name</label>
                  <input
                    type="text"
                    className="form-control form-glass-control"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label fw-bold">Email Address (Read-only)</label>
                <input
                  type="email"
                  className="form-control form-glass-control bg-light-subtle"
                  value={user?.email || ''}
                  disabled
                />
              </div>

              <div className="mb-4">
                <label className="form-label fw-bold">New Password (leave empty to keep current)</label>
                <input
                  type="password"
                  className="form-control form-glass-control"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={6}
                />
              </div>

              <button type="submit" className="btn btn-glass w-100 py-3" disabled={loading}>
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Saving settings...
                  </>
                ) : (
                  'Update Profile Details'
                )}
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}
