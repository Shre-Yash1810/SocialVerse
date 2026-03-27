import React, { useState, useEffect, useRef } from 'react';
import { X, Eye, Trash2, Star, Loader2 } from 'lucide-react';
import api from '../services/api';
import { useUser } from '../context/UserContext';

interface MomentViewerModalProps {
  momentGroup: any;
  onClose: () => void;
  onNextGroup?: () => void;
  onPrevGroup?: () => void;
}

const FONTS = {
  Modern: "'Inter', sans-serif",
  Classic: "'Playfair Display', serif",
  Neon: "'Pacifico', cursive",
  Typewriter: "'Space Mono', monospace",
  Strong: "'Anton', sans-serif"
};

const MomentViewerModal: React.FC<MomentViewerModalProps> = ({ momentGroup, onClose, onNextGroup, onPrevGroup }) => {
  const { user } = useUser();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [showViewers, setShowViewers] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const currentUserId = user?.userid;
  const duration = 5000; // 5 seconds per moment
  const timerRef = useRef<any>(null);

  // Set initial index to first unviewed moment if any
  useEffect(() => {
    const firstUnviewed = momentGroup.moments.findIndex((m: any) => !m.viewers.some((v: any) => (v._id || v) === currentUserId));
    if (firstUnviewed !== -1) setCurrentIndex(firstUnviewed);
  }, [momentGroup, currentUserId]);

  useEffect(() => {
    if (showViewers || isLoading) return;

    setProgress(0);
    const step = 40; 
    const timePerStep = (step / duration) * 100;
    
    if (timerRef.current) clearInterval(timerRef.current);
    
    timerRef.current = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          handleNext();
          return 100;
        }
        return p + timePerStep;
      });
    }, step);

    return () => clearInterval(timerRef.current);
  }, [currentIndex, momentGroup, showViewers, isLoading]);

  // Mark as viewed
  useEffect(() => {
    const currentMoment = momentGroup.moments[currentIndex];
    const isAlreadyViewed = (currentMoment?.viewers || []).some((v: any) => (v._id || v) === currentUserId);
    
    if (currentMoment && !isAlreadyViewed && momentGroup.user.userid !== currentUserId) {
        api.post(`/moments/${currentMoment._id}/view`).catch(e => console.error(e));
    }
  }, [currentIndex, momentGroup, currentUserId]);

  const handleNext = () => {
    if (showViewers) return;
    if (currentIndex < momentGroup.moments.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsLoading(true); // Show loader for next media
    } else {
      if (onNextGroup) onNextGroup();
      else onClose();
    }
  };

  const handlePrev = () => {
    if (showViewers) return;
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsLoading(true);
    } else {
      if (onPrevGroup) onPrevGroup();
      else onClose();
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this moment?')) return;
    try {
      await api.delete(`/moments/${momentGroup.moments[currentIndex]._id}`);
      // Since we uses props directly, we rely on parent to refresh if needed, 
      // but for simplicity we'll just skip to next or close if last
      if (momentGroup.moments.length === 1) onClose();
      else handleNext();
    } catch (e) { console.error(e); }
  };

  const handleMemory = async () => {
    try {
      await api.post(`/moments/${momentGroup.moments[currentIndex]._id}/memory`);
      alert('Moment saved to Memories!');
    } catch (e) { console.error(e); }
  };

  if (!momentGroup || !momentGroup.moments || momentGroup.moments.length === 0) return null;

  const currentMoment = momentGroup.moments[currentIndex];
  const isAuthor = momentGroup.user.userid === currentUserId;

  return (
    <div className="modal-overlay animate-fade-in" style={{ zIndex: 3000, background: '#000', position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'relative', width: '100%', maxWidth: '480px', height: '100%', maxHeight: '100dvh', background: '#000', display: 'flex', flexDirection: 'column' }}>
        
        {/* Progress Bars */}
        <div style={{ display: 'flex', gap: '4px', padding: '12px', position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100 }}>
          {momentGroup.moments.map((_: any, i: number) => (
            <div key={i} style={{ flex: 1, height: '2px', background: 'rgba(255,255,255,0.2)', borderRadius: '1px', overflow: 'hidden' }}>
              <div style={{ 
                height: '100%', 
                background: 'white', 
                width: i < currentIndex ? '100%' : (i === currentIndex ? `${progress}%` : '0%'),
                transition: i === currentIndex && !isLoading ? 'width 40ms linear' : 'none'
              }} />
            </div>
          ))}
        </div>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 16px 12px', position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100, background: 'linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, transparent 100%)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img src={momentGroup.user.profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(momentGroup.user.userid)}&background=random`} style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.2)' }} alt="" />
            <span style={{ color: 'white', fontWeight: 700, fontSize: '0.9rem', textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>{momentGroup.user.userid}</span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: '4px' }}><X size={28} /></button>
        </div>

        {/* Media Container */}
        <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
          
          {isLoading && (
            <div style={{ position: 'absolute', zIndex: 10, color: 'white' }}>
              <Loader2 className="animate-spin" size={40} />
            </div>
          )}

          {currentMoment.type === 'image' ? (
             <img 
               src={currentMoment.media} 
               alt="" 
               onLoad={() => setIsLoading(false)}
               style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: isLoading ? 0 : 1, transition: 'opacity 0.2s' }} 
             />
          ) : (
             <video 
               src={currentMoment.media} 
               onLoadedData={() => setIsLoading(false)}
               style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: isLoading ? 0 : 1, transition: 'opacity 0.2s' }} 
               autoPlay 
               playsInline 
               muted={false}
             />
          )}

          {/* Overlays */}
          {!isLoading && currentMoment.overlayData && JSON.parse(currentMoment.overlayData).map((o: any) => (
            <div
              key={o.id}
              onClick={(e) => {
                if (o.isMention && o.mentionedUserId) {
                  e.stopPropagation();
                  onClose();
                  window.location.href = `/profile/${o.text.slice(1)}`;
                }
              }}
              style={{
                position: 'absolute',
                left: `${o.x}%`,
                top: `${o.y}%`,
                transform: 'translate(-50%, -50%)',
                color: o.style === 'background' ? (o.color === '#FFFFFF' ? '#000' : '#FFF') : o.color,
                fontSize: `${o.fontSize * 1.2}px`,
                fontFamily: FONTS[o.fontFamily as keyof typeof FONTS] || FONTS.Modern,
                fontWeight: o.fontFamily === 'Modern' || o.fontFamily === 'Strong' ? '900' : '700',
                padding: '10px 16px',
                borderRadius: o.fontFamily === 'Neon' ? '30px' : '10px',
                background: o.style === 'background' ? o.color : (o.isMention && !o.style ? 'rgba(99, 102, 241, 0.4)' : 'transparent'),
                backdropFilter: 'none',
                boxShadow: o.style === 'plain' ? '0 2px 4px rgba(0,0,0,0.5)' : 'none',
                whiteSpace: 'nowrap',
                zIndex: 150,
                textShadow: o.style === 'plain' ? '0 2px 12px rgba(0,0,0,0.9)' : 'none',
                cursor: o.isMention ? 'pointer' : 'default',
                pointerEvents: o.isMention ? 'auto' : 'none',
                border: o.isMention && !o.style ? '1px solid rgba(255,255,255,0.3)' : 'none'
              }}
            >
              {o.text}
            </div>
          ))}

          {/* Tap Zones */}
          {!showViewers && !isLoading && (
            <>
              <div onClick={handlePrev} style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '30%', cursor: 'pointer', zIndex: 200 }} />
              <div onClick={handleNext} style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: '70%', cursor: 'pointer', zIndex: 200 }} />
            </>
          )}
        </div>

        {/* Footer Controls */}
        {isAuthor && !showViewers && (
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '30px 20px', display: 'flex', justifyContent: 'space-between', zIndex: 250, background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%)' }}>
            <button onClick={() => setShowViewers(true)} style={{ color: 'white', background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, cursor: 'pointer', padding: '10px 16px', borderRadius: '25px' }}>
              <Eye size={18} /> {currentMoment.viewers?.length || 0}
            </button>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={handleMemory} style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <Star size={20} />
              </button>
              <button onClick={handleDelete} style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <Trash2 size={20} />
              </button>
            </div>
          </div>
        )}

        {/* Viewers Sheet */}
        {showViewers && (
          <div className="animate-slide-up" style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '60vh', background: 'white', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', zIndex: 500, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9' }}>
              <h3 style={{ fontWeight: 800, color: '#0f172a', margin: 0 }}>Viewed by {currentMoment.viewers?.length || 0}</h3>
              <button onClick={() => setShowViewers(false)} style={{ background: '#f1f5f9', border: 'none', color: '#64748b', cursor: 'pointer', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={20} /></button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '10px 20px' }}>
              {currentMoment.viewers?.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8' }}>
                   <Eye size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
                   <p>No views yet. Share your moment to get started!</p>
                </div>
              ) : (
                currentMoment.viewers?.map((v: any, index: number) => (
                  <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '12px 0' }}>
                    <img src={v.profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(v.userid)}&background=random`} style={{ width: '44px', height: '44px', borderRadius: '14px', objectFit: 'cover' }} alt="" />
                    <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#1e293b' }}>{v.userid}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MomentViewerModal;
