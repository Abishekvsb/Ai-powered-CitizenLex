import React, { useState, lazy, Suspense } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import IntroAnimation from './components/IntroAnimation';
import ErrorBoundary from './components/ErrorBoundary';

// Eager-loaded critical pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';

// Lazy-loaded heavy pages (code splitting)
const Dashboard = lazy(() => import('./pages/Dashboard'));
const AiAssistant = lazy(() => import('./pages/AiAssistant'));
const RightsExplorer = lazy(() => import('./pages/RightsExplorer'));
const SchemeFinder = lazy(() => import('./pages/SchemeFinder'));
const DocumentAnalyzer = lazy(() => import('./pages/DocumentAnalyzer'));
const Profile = lazy(() => import('./pages/Profile'));
const LegalDrafts = lazy(() => import('./pages/LegalDrafts'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const OcrScanner = lazy(() => import('./pages/OcrScanner'));
const LegalCopilot = lazy(() => import('./pages/LegalCopilot'));
const NotificationCenter = lazy(() => import('./pages/NotificationCenter'));
const LawyerMarketplace = lazy(() => import('./pages/LawyerMarketplace'));
const LawyerProfileDetail = lazy(() => import('./pages/LawyerProfileDetail'));
const LawyerDashboard = lazy(() => import('./pages/LawyerDashboard'));
const UserConsultations = lazy(() => import('./pages/UserConsultations'));

import { usePWA } from './context/PWAContext';

// Page loading fallback
const PageLoader = () => (
  <div className="d-flex justify-content-center align-items-center py-5" style={{ minHeight: '60vh' }}>
    <div className="d-flex flex-column align-items-center gap-3">
      <div className="spinner-border text-primary" role="status" style={{ width: '2.5rem', height: '2.5rem' }}></div>
      <span className="text-secondary small">Loading page...</span>
    </div>
  </div>
);

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
        <ErrorBoundary>
          <Suspense fallback={<PageLoader />}>
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
          </Suspense>
        </ErrorBoundary>
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
