import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import PageTransition from './components/PageTransition';
import AuthPage from './pages/AuthPage';
import OnboardingPage from './pages/OnboardingPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import FeedPage from './pages/FeedPage';
import BytesPage from './pages/BytesPage';
import BlogsPage from './pages/BlogsPage';
import SearchPage from './pages/SearchPage';
import NotificationsPage from './pages/NotificationsPage';
import VerseChat from './pages/VerseChat';
import ChatPage from './pages/ChatPage';
import RightSidebar from './components/RightSidebar';
import { ByteProvider } from './context/ByteContext';
import './index.css';

function AnimatedRoutes() {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/auth" element={<PageTransition><AuthPage /></PageTransition>} />
        <Route path="/onboarding" element={<PageTransition><OnboardingPage /></PageTransition>} />
        <Route path="/profile" element={<PageTransition><ProfilePage /></PageTransition>} />
        <Route path="/profile/:handle" element={<PageTransition><ProfilePage /></PageTransition>} />
        <Route path="/settings" element={<PageTransition><SettingsPage /></PageTransition>} />
        <Route path="/feed" element={<PageTransition><FeedPage /></PageTransition>} />
        <Route path="/search" element={<PageTransition><SearchPage /></PageTransition>} />
        <Route path="/notifications" element={<PageTransition><NotificationsPage /></PageTransition>} />
        <Route path="/bytes" element={<PageTransition><BytesPage /></PageTransition>} />
        <Route path="/blogs" element={<PageTransition><BlogsPage /></PageTransition>} />
        <Route path="/versechat" element={<PageTransition><VerseChat /></PageTransition>} />
        <Route path="/chat/:chatId" element={<PageTransition><ChatPage /></PageTransition>} />
        <Route path="/" element={<Navigate to="/feed" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  return (
    <ByteProvider>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <RightSidebar />
        <AnimatedRoutes />
      </Router>
    </ByteProvider>
  );
}

export default App;
