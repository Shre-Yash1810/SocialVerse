import React from 'react';

export const ChatListSkeleton: React.FC = () => {
  return (
    <div style={{ padding: '8px 0' }}>
      {[...Array(8)].map((_, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '16px', gap: '12px', borderBottom: '1px solid #f1f5f9' }}>
          <div className="skeleton-shimmer" style={{ width: '56px', height: '56px', borderRadius: '18px', background: '#f1f5f9', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div className="skeleton-shimmer" style={{ width: '40%', height: '14px', borderRadius: '4px', background: '#f1f5f9', marginBottom: '8px' }} />
            <div className="skeleton-shimmer" style={{ width: '80%', height: '12px', borderRadius: '4px', background: '#f1f5f9' }} />
          </div>
        </div>
      ))}
      <style>{`
        .skeleton-shimmer {
          position: relative;
          overflow: hidden;
        }
        .skeleton-shimmer::after {
          content: "";
          position: absolute;
          top: 0;
          right: 0;
          bottom: 0;
          left: 0;
          transform: translateX(-100%);
          background-image: linear-gradient(
            90deg,
            rgba(255, 255, 255, 0) 0,
            rgba(255, 255, 255, 0.2) 20%,
            rgba(255, 255, 255, 0.5) 60%,
            rgba(255, 255, 255, 0)
          );
          animation: shimmer 2s infinite;
        }
        @keyframes shimmer {
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </div>
  );
};

export const ChatPageSkeleton: React.FC = () => {
  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#0f172a' }}>
      {/* Header Skeleton */}
      <div style={{ height: '64px', display: 'flex', alignItems: 'center', padding: '0 16px', background: 'rgba(15, 23, 42, 0.95)', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
        <div className="skeleton-shimmer" style={{ width: '24px', height: '24px', borderRadius: '4px', background: 'rgba(255,255,255,0.1)', marginRight: '12px' }} />
        <div className="skeleton-shimmer" style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(255,255,255,0.1)', marginRight: '12px' }} />
        <div style={{ flex: 1 }}>
          <div className="skeleton-shimmer" style={{ width: '100px', height: '14px', borderRadius: '4px', background: 'rgba(255,255,255,0.1)', marginBottom: '6px' }} />
          <div className="skeleton-shimmer" style={{ width: '60px', height: '10px', borderRadius: '4px', background: 'rgba(255,255,255,0.1)' }} />
        </div>
      </div>
      
      {/* Messages Skeleton */}
      <div style={{ flex: 1, padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {[...Array(6)].map((_, i) => (
          <div key={i} style={{ 
            alignSelf: i % 2 === 0 ? 'flex-start' : 'flex-end',
            width: '60%',
            maxWidth: '280px'
          }}>
            <div className="skeleton-shimmer" style={{ 
              height: i % 3 === 0 ? '80px' : '40px', 
              borderRadius: '16px', 
              background: i % 2 === 0 ? 'rgba(255,255,255,0.05)' : 'rgba(129, 140, 248, 0.2)' 
            }} />
          </div>
        ))}
      </div>
      
      {/* Footer Skeleton */}
      <div style={{ padding: '16px', background: 'rgba(255, 255, 255, 0.05)', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
        <div className="skeleton-shimmer" style={{ height: '44px', borderRadius: '22px', background: 'rgba(255,255,255,0.1)' }} />
      </div>
    </div>
  );
};
