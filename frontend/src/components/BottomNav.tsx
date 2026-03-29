import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, MessageCircle, BookOpen, User } from 'lucide-react';
import BytesIcon from './BytesIcon';
import '../styles/Navigation.css';

const BottomNav: React.FC = React.memo(() => {
  const prefetch = (path: string) => {
    switch (path) {
      case '/feed': import('../pages/FeedPage'); break;
      case '/bytes': import('../pages/BytesPage'); break;
      case '/versechat': import('../pages/VerseChat'); break;
      case '/blogs': import('../pages/BlogsPage'); break;
      case '/profile': import('../pages/ProfilePage'); break;
    }
  };

  return (
    <nav className="bottom-nav">
      <NavLink 
        to="/feed" 
        className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
        onMouseEnter={() => prefetch('/feed')}
        onTouchStart={() => prefetch('/feed')}
      >
        <Home size={26} />
        <span className="nav-label">Home</span>
      </NavLink>
      <NavLink 
        to="/bytes" 
        className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
        onMouseEnter={() => prefetch('/bytes')}
        onTouchStart={() => prefetch('/bytes')}
      >
        <BytesIcon size={26} />
        <span className="nav-label">Bytes</span>
      </NavLink>
      <NavLink 
        to="/versechat" 
        className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
        onMouseEnter={() => prefetch('/versechat')}
        onTouchStart={() => prefetch('/versechat')}
      >
        <MessageCircle size={26} />
        <span className="nav-label">VerseChat</span>
      </NavLink>
      <NavLink 
        to="/blogs" 
        className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
        onMouseEnter={() => prefetch('/blogs')}
        onTouchStart={() => prefetch('/blogs')}
      >
        <BookOpen size={26} />
        <span className="nav-label">Blogs</span>
      </NavLink>
      <NavLink 
        to="/profile" 
        className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
        onMouseEnter={() => prefetch('/profile')}
        onTouchStart={() => prefetch('/profile')}
      >
        <User size={26} />
        <span className="nav-label">Profile</span>
      </NavLink>
    </nav>
  );
});

export default BottomNav;
