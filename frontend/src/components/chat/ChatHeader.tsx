import React from 'react';
import { ArrowLeft, MoreVertical } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import VerifiedBadge from '../VerifiedBadge';
import { formatRelativeTime } from '../../utils/timeUtils';

interface ChatHeaderProps {
  chat: any;
  otherParticipant: any;
  chatName: string;
  chatSubtext: string;
  chatAvatar: string;
  setIsGroupInfoOpen: (open: boolean) => void;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({
  chat,
  otherParticipant,
  chatName,
  chatSubtext,
  chatAvatar,
  setIsGroupInfoOpen
}) => {
  const navigate = useNavigate();

  return (
    <header style={{ flexShrink: 0, height: '64px', display: 'flex', alignItems: 'center', padding: '0 16px', background: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', zIndex: 100, justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={() => chat?.isGroup ? setIsGroupInfoOpen(true) : otherParticipant && navigate(`/profile/${otherParticipant.userid}`)}>
        <ArrowLeft onClick={(e: any) => { e.stopPropagation(); navigate(-1); }} style={{ cursor: 'pointer', color: 'white' }} />
        <div style={{ width: '40px', height: '40px', borderRadius: '12px', overflow: 'hidden', border: '2px solid rgba(255,255,255,0.8)', background: '#f1f5f9' }}>
          <img src={chatAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(chatName || 'C')}&background=random`} alt={chatName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        <div>
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#ffffff', display: 'flex', alignItems: 'center' }}>
            {chatName}
            {!chat?.isGroup && otherParticipant?.isVerified && <VerifiedBadge size={14} />}
          </h3>
          <p style={{ margin: 0, fontSize: '0.75rem', opacity: 0.9, color: '#e2e8f0', fontWeight: 500 }}>
            {chat?.isGroup ? chatSubtext : (
              <>
                {chatSubtext && <span style={{ marginRight: '8px' }}>{chatSubtext}</span>}
                {otherParticipant?.lastSeen
                  ? (new Date().getTime() - new Date(otherParticipant.lastSeen).getTime() < 2 * 60 * 1000
                    ? '• Active now'
                    : `• Active ${formatRelativeTime(otherParticipant.lastSeen)}`)
                  : '• Offline'}
              </>
            )}
          </p>
        </div>
      </div>
      <div style={{ display: 'flex', gap: '12px' }}>
        {chat?.isGroup && <MoreVertical size={20} onClick={() => setIsGroupInfoOpen(true)} style={{ color: 'white', cursor: 'pointer' }} />}
      </div>
    </header>
  );
};

export default React.memo(ChatHeader);
