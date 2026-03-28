import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import BottomNav from './BottomNav';
import RightSidebar from './RightSidebar';

const MainLayout: React.FC = () => {
  const location = useLocation();
  
  // Determine Navbar mode based on path
  const getNavbarMode = () => {
    if (location.pathname.startsWith('/profile')) return 'profile';
    if (location.pathname.startsWith('/settings') || location.pathname.startsWith('/admin')) return 'none'; 
    return 'home';
  };

  const isChatView = location.pathname.startsWith('/chat/');
  const isDashboardView = location.pathname.startsWith('/admin') || location.pathname.startsWith('/settings');
  
  return (
    <div className="app-layout">
      {!isChatView && <Navbar mode={getNavbarMode()} />}
      <main className="main-content">
        <Outlet />
      </main>
      {!isDashboardView && !isChatView && <BottomNav />}
      {!isDashboardView && !isChatView && <RightSidebar />}
    </div>
  );
};

export default MainLayout;
