import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';

// Import Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import AiAssistant from './pages/AiAssistant';
import RightsExplorer from './pages/RightsExplorer';
import SchemeFinder from './pages/SchemeFinder';
import DocumentAnalyzer from './pages/DocumentAnalyzer';
import Profile from './pages/Profile';
import LegalDrafts from './pages/LegalDrafts';
import AdminDashboard from './pages/AdminDashboard';

// Auth pages do not render Navbar/Footer
const AUTH_ROUTES = ['/login', '/register'];

export default function App() {
  const location = useLocation();
  const isAuthPage = AUTH_ROUTES.includes(location.pathname);

  return (
    <div className="d-flex flex-column min-vh-100" style={{ position: 'relative', zIndex: 1 }}>
      {!isAuthPage && <Navbar />}
      <main className={isAuthPage ? '' : 'flex-grow-1'}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/rights" element={<RightsExplorer />} />
          <Route path="/schemes" element={<SchemeFinder />} />

          {/* Protected User Routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/chat" element={
            <ProtectedRoute>
              <AiAssistant />
            </ProtectedRoute>
          } />
          <Route path="/analyzer" element={
            <ProtectedRoute>
              <DocumentAnalyzer />
            </ProtectedRoute>
          } />
          <Route path="/drafts" element={
            <ProtectedRoute>
              <LegalDrafts />
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />

          {/* Protected Admin Routes */}
          <Route path="/admin" element={
            <ProtectedRoute adminOnly={true}>
              <AdminDashboard />
            </ProtectedRoute>
          } />
        </Routes>
      </main>
      {!isAuthPage && <Footer />}
    </div>
  );
}
