import React, { useRef, useImperativeHandle, forwardRef } from 'react';
import { Virtuoso } from 'react-virtuoso';
import MessageBubble from '../MessageBubble';

interface MessageListProps {
  messages: any[];
  user: any;
  selectedMessageId: string | null;
  hoveredMessageId: string | null;
  setHoveredMessageId: (id: string | null) => void;
  handleLongPressStart: (id: string) => void;
  handleLongPressEnd: () => void;
  handleUnsendMessage: (msg: any) => void;
  setActiveSharedContent: (content: any) => void;
  chatAvatar: string;
  chatName: string;
  otherParticipantId: string;
}

const MessageList = forwardRef<any, MessageListProps>(({
  messages,
  user,
  selectedMessageId,
  hoveredMessageId,
  setHoveredMessageId,
  handleLongPressStart,
  handleLongPressEnd,
  handleUnsendMessage,
  setActiveSharedContent,
  chatAvatar,
  chatName,
  otherParticipantId
}, ref) => {
  const virtuosoRef = useRef<any>(null);

  useImperativeHandle(ref, () => ({
    scrollToIndex: (args: any) => virtuosoRef.current?.scrollToIndex(args)
  }));

  if (messages.length === 0) {
    return (
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        padding: '20px',
        textAlign: 'center',
        color: 'white'
      }}>
        <div style={{ width: '100px', height: '100px', borderRadius: '50%', overflow: 'hidden', border: '4px solid rgba(255,255,255,0.2)', marginBottom: '20px', boxShadow: '0 8px 16px rgba(0,0,0,0.3)' }}>
          <img src={chatAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(chatName || 'C')}&background=random`} alt={chatName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 4px 0' }}>{chatName}</h2>
        <p style={{ fontSize: '1rem', opacity: 0.7, margin: '0 0 20px 0' }}>@{otherParticipantId}</p>
        <p style={{ fontSize: '0.9rem', opacity: 0.9, background: 'rgba(255,255,255,0.1)', padding: '8px 16px', borderRadius: '20px', backdropFilter: 'blur(10px)' }}>Start the conversation with {chatName}</p>
      </div>
    );
  }

  return (
    <Virtuoso
      ref={virtuosoRef}
      data={messages}
      initialTopMostItemIndex={messages.length > 0 ? messages.length - 1 : 0}
      followOutput="auto"
      style={{ flex: 1, padding: '20px 0' }}
      itemContent={(_, msg) => {
        const isMe = String(msg.sender?._id || msg.sender) === String(user?._id);
        return (
          <MessageBubble
            key={msg._id}
            msg={msg}
            isMe={isMe}
            selectedMessageId={selectedMessageId}
            hoveredMessageId={hoveredMessageId}
            setHoveredMessageId={setHoveredMessageId}
            handleLongPressStart={handleLongPressStart}
            handleLongPressEnd={handleLongPressEnd}
            handleUnsendMessage={() => handleUnsendMessage(msg)}
            setActiveSharedContent={setActiveSharedContent}
          />
        );
      }}
    />
  );
});

export default React.memo(MessageList);
