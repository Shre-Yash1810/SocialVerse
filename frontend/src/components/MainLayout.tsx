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
    if (location.pathname.startsWith('/settings')) return 'none'; // Settings usually has its own header or none
    return 'home';
  };

  const isChatView = location.pathname.startsWith('/chat/');
  
  return (
    <div className="app-layout">
      {!isChatView && <Navbar mode={getNavbarMode()} />}
      <main className="main-content">
        <Outlet />
      </main>
      <BottomNav />
      <RightSidebar />
    </div>
  );
};

export default MainLayout;
