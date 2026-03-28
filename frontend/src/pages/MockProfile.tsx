import React from 'react';
import { 
  Star, Orbit, Palette, Zap, Sun, CloudRain, 
  Sparkles, ArrowDownCircle, Moon, Mic, 
  Magnet, Rocket, Wind, Waves, CircleDot,
  CheckCircle2, User as UserIcon, Grid, Film, FileText
} from 'lucide-react';
import '../styles/MockProfile.css';

const MockProfile: React.FC = () => {
  const mockUser = {
    name: 'Astra Voyager',
    userid: 'nebula_explorer',
    bio: 'Pioneer of the SocialVerse 🌌 | Digital Alchemist | Chasing the Great Attractor.',
    level: 22,
    xp: 5800000,
    followersCount: '12.4K',
    followingCount: '482',
    isVerified: true,
    badges: [
      'THE RISING STAR',
      'THE GREAT ATTRACTOR',
      'THE SUPERNOVA MOMENT',
      'THE LORD OF RINGS',
      'THE COSMIC VOYAGER'
    ]
  };

  const badgeIcons: { [key: string]: any } = {
    'THE RISING STAR': { icon: Star, color: '#fbbf24', text: 'Reach Level 7' },
    'THE GREAT ATTRACTOR': { icon: Zap, color: '#8b5cf6', text: 'Reach Level 20' },
    'THE SUPERNOVA MOMENT': { icon: Sun, color: '#f59e0b', text: '5,000 likes on a post' },
    'THE LORD OF RINGS': { icon: CircleDot, color: '#3b82f6', text: '1,000 followers' },
    'THE COSMIC VOYAGER': { icon: Rocket, color: '#10b981', text: '1 year active' },
  };

  return (
    <div className="mock-profile-wrapper">
      <div className="mock-container">
        {/* Profile Header */}
        <section className="mock-header">
          <div className="mock-pic-ring">
            <div className="mock-pic-placeholder">
              <UserIcon size={48} strokeWidth={1} color="#6366f1" />
            </div>
          </div>
          <div className="mock-stats-row">
            <div className="m-stat">
              <span className="m-stat-val">124</span>
              <span className="m-stat-lab">Posts</span>
            </div>
            <div className="m-stat">
              <span className="m-stat-val">{mockUser.followersCount}</span>
              <span className="m-stat-lab">Followers</span>
            </div>
            <div className="m-stat">
              <span className="m-stat-val">{mockUser.followingCount}</span>
              <span className="m-stat-lab">Following</span>
            </div>
          </div>
        </section>

        {/* Identity & Verified Badge */}
        <section className="mock-identity">
          <div className="mock-name-row">
            <h1 className="mock-display-name">{mockUser.name}</h1>
            {mockUser.isVerified && (
              <div className="mock-verified-badge-container">
                {/* Fallback SVG for the Verified Badge */}
                <svg width="22" height="22" viewBox="0 0 100 100" className="mock-verified-img">
                   <defs>
                     <linearGradient id="badgeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#1e3a8a" />
                        <stop offset="100%" stopColor="#3b82f6" />
                     </linearGradient>
                   </defs>
                   <path d="M50 5 L64 15 L80 15 L85 31 L97 43 L92 59 L97 75 L85 87 L80 85 L64 97 L50 85 L36 97 L20 85 L15 87 L3 75 L8 59 L3 43 L15 31 L20 15 L36 15 Z" fill="url(#badgeGrad)" stroke="#60a5fa" strokeWidth="2" />
                   <path d="M35 50 L45 60 L65 40" fill="none" stroke="white" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {/* Once the actual image is saved, this replaces the SVG:
                <img src="/src/assets/badges/verified.png" alt="Verified" className="mock-verified-img" /> 
                */}
              </div>
            )}
          </div>
          <div className="mock-sub-row">
            <span className="mock-handle">@{mockUser.userid}</span>
            <div className="mock-level-tag">Lv. {mockUser.level}</div>
          </div>
          <p className="mock-bio">{mockUser.bio}</p>
        </section>

        {/* Badge Showcase Grid */}
        <section className="mock-achievements">
          <div className="section-title">Celestial Achievements</div>
          <div className="badge-grid">
            {mockUser.badges.map(b => {
              const BadgIcon = badgeIcons[b].icon;
              return (
                <div key={b} className="badge-card animate-float" title={badgeIcons[b].text}>
                  <div className="badge-icon-wrap" style={{ 
                    background: `linear-gradient(135deg, ${badgeIcons[b].color}22, ${badgeIcons[b].color}44)`,
                    borderColor: `${badgeIcons[b].color}66`
                  }}>
                    <BadgIcon size={20} color={badgeIcons[b].color} />
                  </div>
                  <span className="badge-name-label">{b.split(' ').slice(-1)}</span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Content Tabs Mock */}
        <div className="mock-tabs">
          <Grid size={20} className="active" />
          <Film size={20} />
          <FileText size={20} />
        </div>
      </div>
    </div>
  );
};

export default MockProfile;
