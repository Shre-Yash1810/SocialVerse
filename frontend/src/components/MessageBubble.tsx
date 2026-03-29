import React from 'react';
import { Play, FileText, ArrowLeft } from 'lucide-react';
import VerifiedBadge from './VerifiedBadge';

interface MessageBubbleProps {
  msg: any;
  isMe: boolean;
  selectedMessageId: string | null;
  hoveredMessageId: string | null;
  setHoveredMessageId: (id: string | null) => void;
  handleLongPressStart: (id: string) => void;
  handleLongPressEnd: () => void;
  handleUnsendMessage: (id: string) => void;
  setSelectedMessageId: (id: string | null) => void;
  setActiveSharedContent: (content: any) => void;
}

const MessageBubble: React.FC<MessageBubbleProps> = React.memo(({
  msg, isMe, selectedMessageId, hoveredMessageId,
  setHoveredMessageId, handleLongPressStart, handleLongPressEnd,
  handleUnsendMessage, setSelectedMessageId, setActiveSharedContent
}) => {
  return (
    <div style={{ marginLeft: isMe ? 'auto' : '0', alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: '75%', display: 'flex', gap: '8px', marginBottom: '12px', width: 'fit-content' }}>
      {!isMe && (
        <div style={{ width: '28px', height: '28px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0, alignSelf: 'flex-end', marginBottom: '4px' }}>
          <img src={msg.sender?.profilePic || `https://ui-avatars.com/api/?name=${msg.sender?.userid}&size=64`} alt="" style={{ width: '100%', height: '100%' }} />
        </div>
      )}
      <div
        onMouseEnter={() => setHoveredMessageId(msg._id)}
        onMouseLeave={() => setHoveredMessageId(null)}
        onPointerDown={(e) => {
          if (e.pointerType === 'touch') {
            isMe && handleLongPressStart(msg._id);
          }
        }}
        onPointerUp={handleLongPressEnd}
        onPointerCancel={handleLongPressEnd}
        onContextMenu={(e) => {
          if (selectedMessageId === msg._id || hoveredMessageId === msg._id) {
            e.preventDefault();
          }
        }}
        style={{
          background: isMe ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.8), rgba(168, 85, 247, 0.8))' : 'rgba(255, 255, 255, 0.15)',
          backdropFilter: 'blur(16px)',
          padding: msg.type === 'post_share' ? '0' : '12px 16px',
          borderRadius: isMe ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
          border: isMe ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
          position: 'relative',
          overflow: 'visible',
          minWidth: msg.type === 'post_share' ? '240px' : 'auto',
          transition: 'transform 0.1s ease',
          transform: selectedMessageId === msg._id ? 'scale(0.98)' : 'scale(1)',
          cursor: 'pointer',
          userSelect: 'none',
          WebkitUserSelect: 'none'
        }}
      >
        {isMe && hoveredMessageId === msg._id && (
          <div
            className="desktop-only"
            style={{
              position: 'absolute',
              left: '-32px',
              top: 0,
              bottom: 0,
              width: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10
            }}
          >
            <div
              onClick={(e) => { e.stopPropagation(); if (window.confirm('Unsend?')) handleUnsendMessage(msg._id); }}
              style={{
                background: 'rgba(255,255,255,0.15)',
                borderRadius: '50%',
                padding: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                backdropFilter: 'blur(4px)',
                transition: 'all 0.2s'
              }}
              className="hover-bg-white-translucent"
              title="Unsend"
            >
              <ArrowLeft size={16} color="white" style={{ transform: 'rotate(90deg)', opacity: 0.9 }} />
            </div>
          </div>
        )}
        {isMe && selectedMessageId === msg._id && (
          <div
            style={{
              position: 'absolute',
              top: '-40px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: '#ef4444',
              color: 'white',
              padding: '6px 12px',
              borderRadius: '10px',
              fontSize: '0.8rem',
              fontWeight: 'bold',
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
              zIndex: 1000,
              whiteSpace: 'nowrap'
            }}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              handleUnsendMessage(msg._id);
              setSelectedMessageId(null);
            }}
            className="unsend-btn"
          >
            Unsend
          </div>
        )}

        {msg.type === 'post_share' && msg.sharedPost ? (
          <div onClick={() => setActiveSharedContent(msg.sharedPost)} style={{ cursor: 'pointer' }}>
            <div style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.05)' }}>
              <img src={msg.sharedPost.author?.profilePic || `https://ui-avatars.com/api/?name=${msg.sharedPost.author?.userid}`} style={{ width: '24px', height: '24px', borderRadius: '50%' }} alt="" />
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>{msg.sharedPost.author?.userid}</span>
                {msg.sharedPost.author?.isVerified && <VerifiedBadge size={12} />}
              </div>
            </div>
            <div style={{ position: 'relative', width: '100%', aspectRatio: '1/1', background: '#000' }}>
              {msg.sharedPost.type?.toLowerCase() === 'video' ? (
                <>
                  <video src={msg.sharedPost.content} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'rgba(0,0,0,0.3)', borderRadius: '50%', padding: '8px' }}><Play size={20} color="white" fill="white" /></div>
                </>
              ) : msg.sharedPost.type?.toLowerCase() === 'image' ? (
                <img src={msg.sharedPost.content} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
              ) : (
                <div style={{ padding: '20px', color: 'white', backgroundColor: '#1e293b', fontSize: '0.8rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                  <FileText size={40} style={{ marginBottom: '12px', opacity: 0.9 }} />
                  <p style={{ textAlign: 'center', fontWeight: 700, fontSize: '0.9rem', width: '100%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{msg.sharedPost.caption || 'Shared a blog'}</p>
                </div>
              )}
              {msg.sharedPost.type?.toLowerCase() !== 'blog' && (
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '8px', background: 'linear-gradient(transparent, rgba(0,0,0,0.6))', fontSize: '0.75rem' }}>
                  <p style={{ margin: 0, opacity: 0.9 }}>View {msg.sharedPost.type?.toLowerCase() === 'video' ? 'Byte' : 'Post'}</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <p style={{ margin: 0, fontSize: '0.92rem', lineHeight: '1.5', fontWeight: 500, letterSpacing: '0.01em', color: 'white' }}>{msg.text}</p>
        )}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px', padding: msg.type === 'post_share' ? '8px' : '4px 0 0', opacity: 0.7 }}>
          <span style={{ fontSize: '0.65rem', color: 'white' }}>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          {isMe && <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#818cf8' }}></div>}
        </div>
      </div>
    </div>
  );
});

export default MessageBubble;
