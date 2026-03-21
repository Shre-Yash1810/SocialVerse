import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, MessageCircle, BookOpen, User } from 'lucide-react';
import BytesIcon from './BytesIcon';
import '../styles/Navigation.css';

const BottomNav: React.FC = () => {

  return (
    <>
      <nav className="bottom-nav">
        <NavLink to="/feed" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
          <Home size={26} />
          <span className="nav-label">Home</span>
        </NavLink>
        <NavLink to="/bytes" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
          <BytesIcon size={26} />
          <span className="nav-label">Bytes</span>
        </NavLink>
        <NavLink to="/versechat" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
          <MessageCircle size={26} />
          <span className="nav-label">VerseChat</span>
        </NavLink>
        <NavLink to="/blogs" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
          <BookOpen size={26} />
          <span className="nav-label">Blogs</span>
        </NavLink>
        <NavLink to="/profile" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
          <User size={26} />
          <span className="nav-label">Profile</span>
        </NavLink>
      </nav>
    </>
  );
};

export default BottomNav;
