import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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
import './index.css';

function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <RightSidebar />
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/profile/:handle" element={<ProfilePage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/feed" element={<FeedPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/bytes" element={<BytesPage />} />
        <Route path="/blogs" element={<BlogsPage />} />
        <Route path="/versechat" element={<VerseChat />} />
        <Route path="/chat/:chatId" element={<ChatPage />} />
        <Route path="/" element={<Navigate to="/feed" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
