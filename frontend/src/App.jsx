import React, { useState } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import IntroAnimation from './components/IntroAnimation';

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
import OcrScanner from './pages/OcrScanner';
import LegalCopilot from './pages/LegalCopilot';
import NotificationCenter from './pages/NotificationCenter';
import LawyerMarketplace from './pages/LawyerMarketplace';
import LawyerProfileDetail from './pages/LawyerProfileDetail';
import LawyerDashboard from './pages/LawyerDashboard';
import UserConsultations from './pages/UserConsultations';
import { usePWA } from './context/PWAContext';

// Auth pages do not render Navbar/Footer
const AUTH_ROUTES = ['/login', '/register'];

export default function App() {
  const location = useLocation();
  const { installedSuccess } = usePWA();
  const isAuthPage = AUTH_ROUTES.includes(location.pathname);

  const [showIntro, setShowIntro] = useState(
    () => sessionStorage.getItem('citizenlex_intro_played') !== 'true'
  );

  if (showIntro) {
    return <IntroAnimation onComplete={() => setShowIntro(false)} />;
  }

  return (
    <div className="d-flex flex-column min-vh-100" style={{ position: 'relative', zIndex: 1 }}>
      {!isAuthPage && location.pathname !== '/dashboard' && <Navbar />}
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
          <Route path="/ocr" element={
            <ProtectedRoute>
              <OcrScanner />
            </ProtectedRoute>
          } />
          <Route path="/copilot" element={
            <ProtectedRoute>
              <LegalCopilot />
            </ProtectedRoute>
          } />
          <Route path="/notifications" element={
            <ProtectedRoute>
              <NotificationCenter />
            </ProtectedRoute>
          } />
          <Route path="/lawyers" element={<LawyerMarketplace />} />
          <Route path="/lawyers/:id" element={<LawyerProfileDetail />} />
          <Route path="/lawyer/dashboard" element={
            <ProtectedRoute>
              <LawyerDashboard />
            </ProtectedRoute>
          } />
          <Route path="/consultations" element={
            <ProtectedRoute>
              <UserConsultations />
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
      
      {installedSuccess && (
        <div className="custom-toast-container" style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999 }}>
          <div className="custom-toast toast-success" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <i className="bi bi-check-circle-fill text-success"></i>
            <span>Thank you for installing CitizenLex App! 🎉</span>
          </div>
        </div>
      )}
    </div>
  );
}
