import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import PageTransition from './components/PageTransition';
import './styles/Modals.css';
import MainLayout from './components/MainLayout';
import { ByteProvider } from './context/ByteContext';
import { UserProvider } from './context/UserContext';
import './index.css';

// Lazy load pages
const AuthPage = lazy(() => import('./pages/AuthPage'));
const OnboardingPage = lazy(() => import('./pages/OnboardingPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const FeedPage = lazy(() => import('./pages/FeedPage'));
const BytesPage = lazy(() => import('./pages/BytesPage'));
const BlogsPage = lazy(() => import('./pages/BlogsPage'));
const SearchPage = lazy(() => import('./pages/SearchPage'));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'));
const VerseChat = lazy(() => import('./pages/VerseChat'));
const ChatPage = lazy(() => import('./pages/ChatPage'));
const AdminPanel = lazy(() => import('./pages/AdminPanel'));
const MockProfile = lazy(() => import('./pages/MockProfile'));

const LoadingScreen = () => (
  <div className="loading-screen" style={{ background: 'var(--bg-main)' }}>
    <div className="shimmer" style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
  </div>
);

function AnimatedRoutes() {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="popLayout">
      <Suspense fallback={<LoadingScreen />}>
        <Routes location={location} key={location.pathname}>
          {/* Auth routes without MainLayout */}
          <Route path="/auth" element={<PageTransition><AuthPage /></PageTransition>} />
          <Route path="/onboarding" element={<PageTransition><OnboardingPage /></PageTransition>} />
          
          {/* Main App routes with MainLayout */}
          <Route element={<MainLayout />}>
            <Route path="/feed" element={<PageTransition><FeedPage /></PageTransition>} />
            <Route path="/profile" element={<PageTransition><ProfilePage /></PageTransition>} />
            <Route path="/profile/:handle" element={<PageTransition><ProfilePage /></PageTransition>} />
            <Route path="/settings" element={<PageTransition><SettingsPage /></PageTransition>} />
            <Route path="/search" element={<PageTransition><SearchPage /></PageTransition>} />
            <Route path="/notifications" element={<PageTransition><NotificationsPage /></PageTransition>} />
            <Route path="/bytes" element={<PageTransition><BytesPage /></PageTransition>} />
            <Route path="/blogs" element={<PageTransition><BlogsPage /></PageTransition>} />
            <Route path="/versechat" element={<PageTransition><VerseChat /></PageTransition>} />
            <Route path="/chat/:chatId" element={<PageTransition><ChatPage /></PageTransition>} />
            <Route path="/" element={<Navigate to="/feed" replace />} />
          </Route>

          {/* Dedicated Admin Route (No Main Nav) */}
          <Route path="/admin" element={<PageTransition><AdminPanel /></PageTransition>} />
          
          {/* Mock Preview Route */}
          <Route path="/mock-profile" element={<PageTransition><MockProfile /></PageTransition>} />
        </Routes>
      </Suspense>
    </AnimatePresence>
  );
}

function App() {
  return (
    <UserProvider>
      <ByteProvider>
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AnimatedRoutes />
        </Router>
      </ByteProvider>
    </UserProvider>
  );
}

export default App;
