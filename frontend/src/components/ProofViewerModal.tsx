import React from 'react';
import { X, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ProofViewerModalProps {
  imageUrl: string;
  onClose: () => void;
  title?: string;
}

const ProofViewerModal: React.FC<ProofViewerModalProps> = ({ imageUrl, onClose, title = 'Evidence Proof' }) => {
  return (
    <AnimatePresence>
      <motion.div 
        className="proof-viewer-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.9)',
          backdropFilter: 'blur(10px)',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}
      >
        <motion.div 
          className="proof-viewer-content"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'relative',
            maxWidth: '95vw',
            maxHeight: '85vh',
            display: 'flex',
            flexDirection: 'column',
            gap: '15px'
          }}
        >
          {/* Header */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            width: '100%',
            color: 'white'
          }}>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>{title}</h3>
            <div style={{ display: 'flex', gap: '15px' }}>
               <a 
                href={imageUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                style={{ color: 'white', opacity: 0.7, transition: 'opacity 0.2s' }}
                title="Open Original"
                onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.7')}
              >
                <ExternalLink size={20} />
              </a>
              <button 
                onClick={onClose}
                style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', opacity: 0.7, padding: 0 }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.7')}
              >
                <X size={24} />
              </button>
            </div>
          </div>

          {/* Image Container */}
          <div style={{ 
            background: '#111', 
            borderRadius: '12px', 
            overflow: 'hidden', 
            boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <img 
              src={imageUrl} 
              alt="Evidence" 
              style={{ 
                maxWidth: '100%', 
                maxHeight: '75vh', 
                display: 'block',
                objectFit: 'contain' 
              }} 
            />
          </div>

          {/* Footer/Hint */}
          <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' }}>
            Click outside to dismiss
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ProofViewerModal;
