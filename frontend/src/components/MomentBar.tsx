import React from 'react';

interface MomentBarProps {
  moments: any[];
  onMomentClick: (userId: string) => void;
}

const MomentBar: React.FC<MomentBarProps> = ({ moments, onMomentClick }) => {
  return (
    <div className="moment-bar-container">
      <div className="moment-scroll-wrapper">
        {/* User's own moment / Add moment */}
        {(() => {
          const myId = localStorage.getItem('userid')?.toLowerCase();
          const myDbId = localStorage.getItem('db_id');
          const myMoment = moments.find(m => 
            (m.user._id.toString() === myDbId) || 
            (m.user.userid?.toLowerCase() === myId)
          );
          const myProfilePic = myMoment?.user.profilePic || localStorage.getItem('profilePic') || `https://ui-avatars.com/api/?name=${encodeURIComponent(myId || 'Me')}&background=random`;
          
          return (
            <div className="moment-item" onClick={() => onMomentClick('me')}>
              <div className="saturn-ring-container">
                <div className={`saturn-ring ${!myMoment ? 'ring-add' : 'ring-active'}`}></div>
                <div className="saturn-core">
                  <img src={myProfilePic} alt="Your Story" />
                  {!myMoment && (
                    <div className="mini-add-badge">
                      <div className="add-plus">+</div>
                    </div>
                  )}
                </div>
              </div>
              <span className="moment-label">Your Story</span>
            </div>
          );
        })()}

        {/* Following users' moments (excluding self) */}
        {moments.filter(m => m.user.userid !== localStorage.getItem('userid')).map((item) => (
          <div key={item.user._id} className="moment-item" onClick={() => onMomentClick(item.user._id)}>
            <div className="saturn-ring-container">
              <div className="saturn-ring"></div>
              <div className="saturn-core">
                <img 
                  src={item.user.profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(item.user.userid)}&background=random`} 
                  alt={item.user.userid} 
                />
              </div>
            </div>
            <span className="moment-label">{item.user.userid}</span>
          </div>
        ))}
      </div>

      <style>{`
        .moment-bar-container {
          padding: 16px 0;
          background: white;
          border-bottom: 1px solid #f1f5f9;
          overflow-x: auto;
          scrollbar-width: none;
        }
        .moment-bar-container::-webkit-scrollbar {
          display: none;
        }
        .moment-scroll-wrapper {
          display: flex;
          gap: 20px;
          padding: 0 16px;
        }
        .moment-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          flex-shrink: 0;
        }
        .moment-label {
          font-size: 0.75rem;
          font-weight: 600;
          color: #64748b;
          max-width: 70px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        
        /* Saturn Effect */
        .saturn-ring-container {
          position: relative;
          width: 140px;
          height: 120px;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        .saturn-core {
          position: relative;
          width: 48px;
          height: 48px;
          border-radius: 50%;
          overflow: hidden;
          background: #f1f5f9;
          border: 2px solid var(--primary);
          z-index: 5;
          display: flex;
          justify-content: center;
          align-items: center;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        .saturn-ring {
          position: absolute;
          width: 60px;
          height: 60px;
          border: 2px solid var(--primary);
          border-radius: 50%;
          z-index: 2;
          opacity: 1;
        }
        /* No ring-2 or animations per user request */
        .saturn-ring.ring-add {
          border-color: #cbd5e1;
          border-style: dotted;
          opacity: 0.6;
        }
        .saturn-ring.ring-active {
          border-color: #6366f1;
        }
        .saturn-core img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .mini-add-badge {
          position: absolute;
          bottom: -2px;
          right: -2px;
          background: #6366f1;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          border: 2px solid white;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10;
        }
        .mini-add-badge .add-plus {
          font-size: 14px;
          color: white;
          font-weight: 900;
          margin-top: -1px;
        }
Line 142: 
        .add-plus {
          font-size: 24px;
          color: #94a3b8;
          font-weight: 300;
        }

        @keyframes orbit {
          from { transform: rotateX(75deg) rotateY(-10deg) rotate(0deg); }
          to { transform: rotateX(75deg) rotateY(-10deg) rotate(360deg); }
        }

        .moment-item:hover .saturn-ring {
          opacity: 1;
          border-width: 2px;
        }
      `}</style>
    </div>
  );
};

export default MomentBar;
