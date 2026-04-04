import React from 'react';
import { X, Download, Maximize } from 'lucide-react';

interface ImageViewerModalProps {
  imageUrl: string;
  onClose: () => void;
}

const ImageViewerModal: React.FC<ImageViewerModalProps> = ({ imageUrl, onClose }) => {
  const handleDownload = async () => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `SocialVerse_${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      // Fallback
      window.open(imageUrl, '_blank');
    }
  };

  return (
    <div 
      className="image-viewer-overlay animate-fade-in"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 5000,
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
        backdropFilter: 'blur(30px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'default'
      }}
      onClick={onClose}
    >
      {/* Blurred Background Image for depth */}
      <div 
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url(${imageUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 0.3,
          filter: 'blur(80px) saturate(1.8)',
          zIndex: -1
        }}
      />

      {/* Header Controls */}
      <div 
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          padding: '24px 30px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.4), transparent)',
          zIndex: 100
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'white' }}>
          <Maximize size={20} style={{ opacity: 0.7 }} />
          <span style={{ fontWeight: 600, fontSize: '0.9rem', letterSpacing: '0.02em' }}>High Resolution View</span>
        </div>
        <div style={{ display: 'flex', gap: '20px' }}>
          <button 
            onClick={handleDownload}
            style={{ 
              background: 'rgba(255,255,255,0.1)', 
              border: 'none', 
              color: 'white', 
              cursor: 'pointer', 
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s',
              backdropFilter: 'blur(10px)'
            }}
            title="Download Image"
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
          >
            <Download size={22} />
          </button>
          <button 
            onClick={onClose}
            style={{ 
              background: 'rgba(239, 68, 68, 0.1)', 
              border: 'none', 
              color: '#ef4444', 
              cursor: 'pointer', 
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s',
              backdropFilter: 'blur(10px)'
            }}
            title="Close"
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
          >
            <X size={28} />
          </button>
        </div>
      </div>

      {/* Main Image */}
      <div 
        style={{
          width: '100%',
          height: '100%',
          maxWidth: '1200px',
          maxHeight: '85vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          userSelect: 'none'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <img 
          src={imageUrl} 
          alt="Chat content" 
          style={{ 
            maxWidth: '100%', 
            maxHeight: '100%', 
            objectFit: 'contain',
            borderRadius: '12px',
            boxShadow: '0 30px 60px rgba(0,0,0,0.5)',
            border: '1px solid rgba(255,255,255,0.1)',
            animation: 'zoomIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
          onContextMenu={(e) => e.preventDefault()}
        />
      </div>

      <style>{`
        @keyframes zoomIn {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default ImageViewerModal;
