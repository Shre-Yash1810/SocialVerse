import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Home, Search, BookOpen, MessageCircle, Bell, PlusSquare, User, Settings } from 'lucide-react';
import BytesIcon from './BytesIcon';
import CreatePostModal from './CreatePostModal';

const RightSidebar: React.FC = () => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  if (location.pathname === '/auth') {
    return null;
  }

  return (
    <>
      <nav className="right-sidebar desktop-only">
        <div className="sidebar-top">
          <NavLink to="/feed" className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}>
            <Home size={26} />
            <span className="sidebar-label">Home</span>
          </NavLink>
          <NavLink to="/search" className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}>
            <Search size={26} />
            <span className="sidebar-label">Search</span>
          </NavLink>
          <NavLink to="/bytes" className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}>
            <BytesIcon size={26} />
            <span className="sidebar-label">Bytes</span>
          </NavLink>
          <NavLink to="/blogs" className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}>
            <BookOpen size={26} />
            <span className="sidebar-label">Blogs</span>
          </NavLink>
          <NavLink to="/versechat" className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}>
            <MessageCircle size={26} />
            <span className="sidebar-label">VerseChat</span>
          </NavLink>
          <NavLink to="/notifications" className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`} title="Notifications">
            <Bell size={26} />
            <span className="sidebar-label">Notifications</span>
          </NavLink>
          <div className="sidebar-item" title="Create" onClick={() => setIsCreateOpen(true)}>
            <PlusSquare size={26} />
            <span className="sidebar-label">Create</span>
          </div>
          <NavLink to="/profile" className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}>
            <User size={26} />
            <span className="sidebar-label">Profile</span>
          </NavLink>
        </div>
        <div className="sidebar-bottom">
          <NavLink to="/settings" className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`} title="Settings">
            <Settings size={26} />
            <span className="sidebar-label">Settings</span>
          </NavLink>
        </div>
      </nav>

      {isCreateOpen && (
        <CreatePostModal 
          onClose={() => setIsCreateOpen(false)} 
          onPostCreated={() => {
            setIsCreateOpen(false);
            navigate(0);
          }} 
        />
      )}
    </>
  );
};

export default RightSidebar;
