import React from 'react';
import { useNavigate } from 'react-router-dom';

interface LinkifyProps {
  text: string;
}

const Linkify: React.FC<LinkifyProps> = ({ text }) => {
  const navigate = useNavigate();
  if (!text) return null;

  // Regex to match @username or #hashtag
  const parts = text.split(/(@[a-zA-Z0-9_]+|#[a-zA-Z0-9_]+)/g);

  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('@')) {
          const userid = part.slice(1);
          return (
            <span
              key={i}
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/profile/${userid.toLowerCase()}`);
              }}
              style={{ color: '#6366f1', cursor: 'pointer', fontWeight: 600 }}
              onMouseOver={(e) => (e.currentTarget.style.textDecoration = 'underline')}
              onMouseOut={(e) => (e.currentTarget.style.textDecoration = 'none')}
            >
              {part}
            </span>
          );
        }
        if (part.startsWith('#')) {
          return (
            <span 
              key={i} 
              style={{ color: '#6366f1', fontWeight: 600, cursor: 'pointer' }}
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/search?q=${encodeURIComponent(part)}`);
              }}
            >
              {part}
            </span>
          );
        }
        return part;
      })}
    </>
  );
};

export default Linkify;
