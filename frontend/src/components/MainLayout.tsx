import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import BottomNav from './BottomNav';
import RightSidebar from './RightSidebar';
import { useUser } from '../context/UserContext';
import { useNavbarAction } from '../context/NavbarActionContext';

const MainLayout: React.FC = React.memo(() => {
  const location = useLocation();
  
  const { user } = useUser();
  const { onMoreClick, onCreateClick } = useNavbarAction();
  
  // Determine Navbar mode based on path
  const getNavbarMode = () => {
    if (location.pathname.startsWith('/profile')) {
      const parts = location.pathname.split('/');
      const handle = parts[2]; // /profile/:handle
      if (handle && user && handle !== user.userid) {
        return 'other_profile';
      }
      return 'profile';
    }
    if (location.pathname.startsWith('/settings') || location.pathname.startsWith('/admin')) return 'none'; 
    return 'home';
  };

  const isChatView = location.pathname.startsWith('/chat/');
  const isDashboardView = location.pathname.startsWith('/admin') || location.pathname.startsWith('/settings');
  
  return (
    <div className="app-layout">
      {!isChatView && <Navbar mode={getNavbarMode()} onMoreClick={onMoreClick || undefined} onCreateClick={onCreateClick || undefined} />}
      <main className="main-content">
        <Outlet />
      </main>
      {!isDashboardView && !isChatView && <BottomNav />}
      {!isDashboardView && !isChatView && <RightSidebar />}
    </div>
  );
});

export default MainLayout;
