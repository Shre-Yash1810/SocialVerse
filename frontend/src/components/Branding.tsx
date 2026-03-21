import React from 'react';
import logo from '../assets/logo/logo-light.png';

interface BrandingProps {
  subtitle?: string;
  size?: 'small' | 'medium' | 'large';
  showName?: boolean;
}

const Branding: React.FC<BrandingProps> = ({ subtitle, size = 'medium', showName = true }) => {
  const sizes = {
    small: '32px',
    medium: '48px',
    large: '64px'
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '8px',
      margin: size === 'small' ? '0' : '20px 0'
    }}>
      <img 
        src={logo} 
        alt="SocialVerse Logo" 
        style={{ height: sizes[size], objectFit: 'contain' }}
      />
      {showName && (
        <h1 style={{ 
          fontSize: size === 'large' ? '2rem' : '1.5rem', 
          fontWeight: 800,
          letterSpacing: '-0.025em',
          color: 'var(--text-main)'
        }}>
          SocialVerse
        </h1>
      )}
      {subtitle && (
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          {subtitle}
        </p>
      )}
    </div>
  );
};

export default Branding;
