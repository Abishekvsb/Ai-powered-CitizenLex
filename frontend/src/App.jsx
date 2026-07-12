import React, { useState, lazy, Suspense } from 'react';
import { Routes, Route, useLocation, Outlet } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import IntroAnimation from './components/IntroAnimation';
import ErrorBoundary from './components/ErrorBoundary';
import DashboardLayout from './components/DashboardLayout';
import { useAuth } from './context/AuthContext';

// Eager-loaded critical pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';

// Cache-busting lazy loader: on chunk load failure (stale PWA cache after new deploy),
// force a one-time hard reload to get the new hashed assets from the server.
function lazyWithRetry(importFn) {
  return lazy(() =>
    importFn().catch((err) => {
      const reloadKey = 'citizenlex_chunk_reload';
      const hasReloaded = sessionStorage.getItem(reloadKey);
      if (!hasReloaded) {
        sessionStorage.setItem(reloadKey, 'true');
        window.location.reload();
        // Return a never-resolving promise to prevent ErrorBoundary while reloading
        return new Promise(() => {});
      }
      // If we already reloaded once and still failing, throw to ErrorBoundary
      sessionStorage.removeItem(reloadKey);
      throw err;
    })
  );
}

// Lazy-loaded heavy pages (code splitting)
const Dashboard = lazyWithRetry(() => import('./pages/Dashboard'));
const AiAssistant = lazyWithRetry(() => import('./pages/AiAssistant'));
const RightsExplorer = lazyWithRetry(() => import('./pages/RightsExplorer'));
const SchemeFinder = lazyWithRetry(() => import('./pages/SchemeFinder'));
const DocumentAnalyzer = lazyWithRetry(() => import('./pages/DocumentAnalyzer'));
const Profile = lazyWithRetry(() => import('./pages/Profile'));
const LegalDrafts = lazyWithRetry(() => import('./pages/LegalDrafts'));
const AdminDashboard = lazyWithRetry(() => import('./pages/AdminDashboard'));
const OcrScanner = lazyWithRetry(() => import('./pages/OcrScanner'));
const LegalCopilot = lazyWithRetry(() => import('./pages/LegalCopilot'));
const NotificationCenter = lazyWithRetry(() => import('./pages/NotificationCenter'));
const LawyerMarketplace = lazyWithRetry(() => import('./pages/LawyerMarketplace'));
const LawyerProfileDetail = lazyWithRetry(() => import('./pages/LawyerProfileDetail'));
const LawyerDashboard = lazyWithRetry(() => import('./pages/LawyerDashboard'));
const UserConsultations = lazyWithRetry(() => import('./pages/UserConsultations'));


import { usePWA } from './context/PWAContext';

// Layout for core app routes
function AppLayout() {
  const { user } = useAuth();
  if (user) {
    return (
      <DashboardLayout>
        <Outlet />
      </DashboardLayout>
    );
  } else {
    return (
      <div className="d-flex flex-column min-vh-100">
        <Navbar />
        <main className="flex-grow-1">
          <Outlet />
        </main>
        <Footer />
      </div>
    );
  }
}

// Layout for landing page
function PublicLayout() {
  return (
    <div className="d-flex flex-column min-vh-100">
      <Navbar />
      <main className="flex-grow-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}


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
    <div className="min-vh-100" style={{ position: 'relative', zIndex: 1 }}>
      <ErrorBoundary>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Auth pages have NO layout */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Landing page always gets public layout */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<Landing />} />
            </Route>

            {/* Core pages get conditional Dashboard or Public layout */}
            <Route element={<AppLayout />}>
              <Route path="/rights" element={<RightsExplorer />} />
              <Route path="/schemes" element={<SchemeFinder />} />
              <Route path="/lawyers" element={<LawyerMarketplace />} />
              <Route path="/lawyers/:id" element={<LawyerProfileDetail />} />

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
            </Route>
          </Routes>
        </Suspense>
      </ErrorBoundary>
      
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
