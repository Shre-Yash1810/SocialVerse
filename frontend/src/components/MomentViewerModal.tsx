import React, { useState, useEffect, useRef } from 'react';
import { X, Eye, Trash2, Star } from 'lucide-react';
import api from '../services/api';

interface MomentViewerModalProps {
  momentGroup: any;
  onClose: () => void;
  onNextGroup?: () => void;
  onPrevGroup?: () => void;
}

const MomentViewerModal: React.FC<MomentViewerModalProps> = ({ momentGroup, onClose, onNextGroup, onPrevGroup }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [showViewers, setShowViewers] = useState(false);
  const [localGroup, setLocalGroup] = useState(momentGroup);
  const currentUserId = localStorage.getItem('userid');
  const duration = 5000; // 5 seconds per moment
  const timerRef = useRef<any>(null);

  useEffect(() => {
    if (showViewers) return; // Pause timer if viewers modal is open

    setProgress(0);
    const step = 50; 
    const timePerStep = (step / duration) * 100;
    
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
  }, [currentIndex, localGroup, showViewers]);

  // Mark as viewed when viewed
  useEffect(() => {
    if (localGroup && localGroup.moments[currentIndex] && localGroup.user.userid !== currentUserId) {
       api.post(`/moments/${localGroup.moments[currentIndex]._id}/view`).catch(e => console.error(e));
    }
  }, [currentIndex, localGroup]);

  const handleNext = () => {
    if (showViewers) return;
    if (currentIndex < localGroup.moments.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      if (onNextGroup) onNextGroup();
      else onClose();
    }
  };

  const handlePrev = () => {
    if (showViewers) return;
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    } else {
      if (onPrevGroup) onPrevGroup();
      else onClose();
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this moment?')) return;
    try {
      await api.delete(`/moments/${localGroup.moments[currentIndex]._id}`);
      // Remove from localGroup immediately
      const newMoments = [...localGroup.moments];
      newMoments.splice(currentIndex, 1);
      if (newMoments.length === 0) onClose();
      else {
        setLocalGroup({ ...localGroup, moments: newMoments });
        if (currentIndex >= newMoments.length) setCurrentIndex(newMoments.length - 1);
      }
    } catch (e) { console.error(e); }
  };

  const handleHighlight = async () => {
    try {
      await api.post(`/moments/${localGroup.moments[currentIndex]._id}/highlight`);
      alert('Moment saved to highlights!');
    } catch (e) { console.error(e); }
  };

  if (!localGroup || !localGroup.moments || localGroup.moments.length === 0) return null;

  const currentMoment = localGroup.moments[currentIndex];
  const isAuthor = localGroup.user.userid === currentUserId;

  return (
    <div className="modal-overlay animate-fade-in" style={{ zIndex: 2000, background: '#111' }}>
      <div style={{ position: 'relative', width: '100%', maxWidth: '500px', height: '100dvh', background: '#000', margin: '0 auto', display: 'flex', flexDirection: 'column' }}>
        
        {/* Progress Bars */}
        <div style={{ display: 'flex', gap: '4px', padding: '12px', position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 }}>
          {localGroup.moments.map((_: any, i: number) => (
            <div key={i} style={{ flex: 1, height: '3px', background: 'rgba(255,255,255,0.3)', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{ 
                height: '100%', 
                background: 'white', 
                width: i < currentIndex ? '100%' : (i === currentIndex ? `${progress}%` : '0%'),
                transition: i === currentIndex ? 'width 50ms linear' : 'none'
              }} />
            </div>
          ))}
        </div>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 16px 12px', position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, background: 'linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, transparent 100%)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img src={localGroup.user.profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(localGroup.user.userid)}&background=random`} style={{ width: '32px', height: '32px', borderRadius: '50%' }} alt="" />
            <span style={{ color: 'white', fontWeight: 600, fontSize: '0.9rem', textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>{localGroup.user.userid}</span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: '4px', textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}><X size={24} /></button>
        </div>

        {/* Media */}
        <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
          {currentMoment.type === 'image' ? (
             <img src={currentMoment.media} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          ) : (
             <video src={currentMoment.media} style={{ width: '100%', height: '100%', objectFit: 'contain' }} autoPlay playsInline />
          )}

          {/* Tap Zones */}
          {!showViewers && <div onClick={handlePrev} style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '30%', cursor: 'pointer', zIndex: 5 }} />}
          {!showViewers && <div onClick={handleNext} style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: '70%', cursor: 'pointer', zIndex: 5 }} />}
        </div>

        {/* Author Controls */}
        {isAuthor && !showViewers && (
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '20px 16px', display: 'flex', justifyContent: 'space-between', zIndex: 20, background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%)' }}>
            <button onClick={() => setShowViewers(true)} style={{ color: 'white', background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, cursor: 'pointer' }}>
              <Eye size={20} /> {currentMoment.viewers?.length || 0} Views
            </button>
            <div style={{ display: 'flex', gap: '16px' }}>
              <button onClick={handleHighlight} style={{ color: 'white', background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <Star size={20} /> Highlight
              </button>
              <button onClick={handleDelete} style={{ color: '#ef4444', background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <Trash2 size={20} />
              </button>
            </div>
          </div>
        )}

        {/* Viewers Half-Sheet */}
        {showViewers && (
          <div className="animate-slide-up" style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '50vh', background: 'white', borderTopLeftRadius: '20px', borderTopRightRadius: '20px', zIndex: 50, display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #efefef' }}>
              <span style={{ fontWeight: 600, color: 'black' }}>Viewers ({currentMoment.viewers?.length || 0})</span>
              <button onClick={() => setShowViewers(false)} style={{ background: 'none', border: 'none', color: 'black', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
              {currentMoment.viewers?.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#8e8e8e', marginTop: '20px' }}>No views yet.</p>
              ) : (
                currentMoment.viewers?.map((v: any, index: number) => (
                  <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                    <img src={v.profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(v.userid)}&background=random`} style={{ width: '40px', height: '40px', borderRadius: '50%' }} alt="" />
                    <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'black' }}>{v.userid}</span>
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
