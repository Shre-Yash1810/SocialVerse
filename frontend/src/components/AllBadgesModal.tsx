import React, { useState } from 'react';
import { BADGE_CONFIG } from '../utils/badges';
import { X, Check, Star } from 'lucide-react';
import '../styles/Badges.css';

interface AllBadgesModalProps {
  earnedBadges: string[];
  initialSelected: string[];
  isOwnProfile: boolean;
  onClose: () => void;
  onSave: (selected: string[]) => void;
}

const AllBadgesModal: React.FC<AllBadgesModalProps> = ({ 
  earnedBadges, 
  initialSelected, 
  isOwnProfile, 
  onClose, 
  onSave 
}) => {
  const [selected, setSelected] = useState<string[]>(initialSelected);

  const toggleSelection = (badgeName: string) => {
    if (!isOwnProfile) return;
    
    if (selected.includes(badgeName)) {
      setSelected(selected.filter(b => b !== badgeName));
    } else {
      if (selected.length >= 2) {
        // Automatically replace the oldest selected one or queue them
        setSelected([...selected.slice(1), badgeName]);
      } else {
        setSelected([...selected, badgeName]);
      }
    }
  };

  const hasChanges = JSON.stringify(selected.sort()) !== JSON.stringify([...initialSelected].sort());

  return (
    <div className="badges-modal-overlay" onClick={onClose}>
      <div className="badges-modal-container" onClick={(e) => e.stopPropagation()}>
        
        <div className="badges-modal-header">
          <div className="badges-modal-title">
            <h2>Cosmic Achievements</h2>
            <p>{isOwnProfile ? 'Select up to 2 badges to feature on your profile.' : 'Badges unlocked by this Voyager.'}</p>
          </div>
          <button className="badge-close-btn" onClick={onClose}>
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>

        <div className="badges-modal-content">
          {!Array.isArray(earnedBadges) || earnedBadges.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No achievements unlocked yet.
            </div>
          ) : (
            earnedBadges.map((badgeName) => {
              if (!badgeName) return null;
              const config = BADGE_CONFIG[badgeName] || { color: '#94a3b8', reason: 'Achievement Unlocked', icon: null };
              
              const isSelected = selected.includes(badgeName);
              const Icon = config.icon || Star;

              return (
                <div 
                  key={badgeName}
                  className={`gamified-badge-card ${isSelected ? 'is-selected' : ''}`}
                  style={{ '--badge-color': config.color } as React.CSSProperties}
                  onClick={() => toggleSelection(badgeName)}
                >
                  <div className="badge-icon-visual">
                    <Icon size={28} strokeWidth={2} />
                  </div>
                  
                  <div className="badge-details">
                    <h3 className="badge-name">{badgeName}</h3>
                    <p className="badge-reason">{config.reason}</p>
                  </div>

                  {isOwnProfile && (
                    <div className="selection-indicator">
                      {isSelected && <Check size={14} strokeWidth={4} />}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {isOwnProfile && (
          <div className="badges-modal-footer">
            <button 
              className="save-badges-btn" 
              onClick={() => onSave(selected)}
              disabled={!hasChanges}
            >
              Save Featured
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default AllBadgesModal;
