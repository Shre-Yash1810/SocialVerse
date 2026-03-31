import React from 'react';
import ChatListPane from '../components/ChatListPane';

const VerseChat: React.FC = () => {
  return (
    <div style={{ 
      backgroundColor: '#ffffff', 
      minHeight: '100vh', 
      paddingBottom: '80px', 
      paddingTop: window.innerWidth < 768 ? '60px' : '0' 
    }}>
      <ChatListPane />
    </div>
  );
};

export default VerseChat;
