import React from 'react';
import logo from '../assets/logo/logo-light.png';
import { Search, Bell, Settings, PlusSquare, Menu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import '../styles/Navigation.css';

interface NavbarProps {
  mode?: 'home' | 'profile' | 'other_profile' | 'none';
  onCreateClick?: () => void;
  onSettingsClick?: () => void;
  onMoreClick?: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ mode = 'home', onCreateClick, onSettingsClick, onMoreClick }) => {
  const navigate = useNavigate();

  return (
    <header className="top-nav">
      <div className="top-nav-left">
        <img 
          src={logo} 
          alt="SocialVerse" 
          className="app-nav-logo"
          onClick={() => navigate('/feed')} 
        />
      </div>
      <div className={`top-nav-right ${mode === 'other_profile' ? 'desktop-visible' : ''}`}>
        {mode === 'home' ? (
          <>
            <button className="icon-btn" title="Search" onClick={() => navigate('/search')}>
              <Search size={22} />
            </button>
            <button className="icon-btn" title="Notifications" onClick={() => navigate('/notifications')}>
              <Bell size={22} />
            </button>
          </>
        ) : mode === 'profile' ? (
          <>
            <button className="icon-btn" title="Create Post" onClick={onCreateClick}>
              <PlusSquare size={22} />
            </button>
            <button className="icon-btn" title="Settings" onClick={onSettingsClick}>
              <Settings size={22} />
            </button>
          </>
        ) : mode === 'other_profile' ? (
          <button className="icon-btn" title="More Options" onClick={onMoreClick}>
            <Menu size={22} />
          </button>
        ) : null}
      </div>
    </header>
  );
};

export default Navbar;
