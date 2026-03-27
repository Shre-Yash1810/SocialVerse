import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Users, MessageSquare, ChevronRight, MoreVertical } from 'lucide-react';
import MomentBar from '../components/MomentBar';
import api from '../services/api';
import { ChatListSkeleton } from '../components/ChatSkeletons';
import { useUser } from '../context/UserContext';

import CreateGroupModal from '../components/CreateGroupModal';
import CreateMomentModal from '../components/CreateMomentModal';
import MomentViewerModal from '../components/MomentViewerModal';

const VerseChat: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'single' | 'group'>('single');
  const [moments, setMoments] = useState<any[]>([]);
  const [chats, setChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [isCreateMomentOpen, setIsCreateMomentOpen] = useState(false);
  const [activeMomentIndex, setActiveMomentIndex] = useState<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [momentsRes, chatsRes] = await Promise.all([
          api.get('/moments'),
          api.get('/chats')
        ]);
        setMoments(momentsRes.data);
        setChats(chatsRes.data);
      } catch (err) {
        console.error('Failed to fetch chat data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [isCreateGroupOpen]); // Refresh when group created

  const filteredChats = chats.filter(chat => {
    const matchesTab = activeTab === 'group' ? chat.isGroup : !chat.isGroup;
    const matchesSearch = chat.isGroup 
      ? chat.name?.toLowerCase().includes(searchQuery.toLowerCase())
      : chat.participants.some((p: any) => p.userid.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesTab && matchesSearch;
  });

  const handleMomentClick = (userId: string) => {
    const myId = user?.userid?.toLowerCase();
    const myDbId = user?._id;
    
    if (userId === 'me') {
      const myIdx = moments.findIndex((m: any) => 
        (m.user._id.toString() === myDbId) || 
        (m.user.userid?.toLowerCase() === myId)
      );
      
      if (myIdx !== -1) {
        setActiveMomentIndex(myIdx);
      } else {
        setIsCreateMomentOpen(true);
      }
    } else {
      const idx = moments.findIndex((m: any) => m.user._id === userId);
      if (idx !== -1) setActiveMomentIndex(idx);
    }
  };

  const fetchMoments = async () => {
    try {
      const res = await api.get('/moments');
      setMoments(res.data);
    } catch (e) { console.error(e); }
  };

  return (
    <div style={{ backgroundColor: '#ffffff', minHeight: '100vh', paddingBottom: '80px', paddingTop: window.innerWidth < 768 ? '80px' : '20px' }}>
      
      {/* Header & Search */}
      <div className="sticky-header" style={{ padding: '20px 16px 10px', background: 'white' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0f172a' }}>VerseChat</h1>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <button 
              onClick={() => setIsCreateGroupOpen(true)}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '6px', 
                background: 'rgba(99, 102, 241, 0.1)', 
                border: 'none', 
                color: 'var(--primary)', 
                cursor: 'pointer',
                padding: '6px 12px',
                borderRadius: '20px',
                fontWeight: 600,
                fontSize: '0.85rem'
              }}
              title="New Group"
            >
              <Users size={18} />
              New
            </button>
            <MoreVertical size={20} color="#64748b" />
          </div>
        </div>
        
        <div style={{ position: 'relative', marginBottom: '16px' }}>
          <div style={{ position: 'absolute', top: '12px', left: '16px', color: '#94a3b8' }}>
            <Search size={18} />
          </div>
          <input 
            type="text" 
            placeholder="Search chats..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ 
              width: '100%', 
              padding: '12px 16px 12px 44px', 
              borderRadius: '12px', 
              border: 'none', 
              background: '#f1f5f9',
              fontSize: '0.95rem'
            }}
          />
        </div>
      </div>

      {/* Moments Bar */}
      <MomentBar moments={moments} onMomentClick={handleMomentClick} />

      {/* Tabs */}
      <div style={{ display: 'flex', padding: '16px 16px 0', borderBottom: '1px solid #f1f5f9' }}>
        <button 
          onClick={() => setActiveTab('single')}
          style={{ 
            flex: 1, 
            padding: '12px', 
            background: 'none', 
            border: 'none', 
            borderBottom: activeTab === 'single' ? '2px solid var(--primary)' : '2px solid transparent',
            color: activeTab === 'single' ? 'var(--primary)' : '#94a3b8',
            fontWeight: 700,
            fontSize: '0.9rem',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s'
          }}
        >
          <MessageSquare size={18} />
          Chats
        </button>
        <button 
          onClick={() => setActiveTab('group')}
          style={{ 
            flex: 1, 
            padding: '12px', 
            background: 'none', 
            border: 'none', 
            borderBottom: activeTab === 'group' ? '2px solid var(--primary)' : '2px solid transparent',
            color: activeTab === 'group' ? 'var(--primary)' : '#94a3b8',
            fontWeight: 700,
            fontSize: '0.9rem',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s'
          }}
        >
          <Users size={18} />
          Groups
        </button>
      </div>

      {/* Chat List */}
      <div style={{ padding: '8px 0' }}>
        {loading ? (
          <ChatListSkeleton />
        ) : filteredChats.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#94a3b8', marginTop: '60px', padding: '0 40px' }}>
            <MessageSquare size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
            <p>No {activeTab === 'group' ? 'group chats' : 'conversations'} found</p>
          </div>
        ) : (
          filteredChats.map((chat) => (
            <div 
              key={chat._id} 
              className="chat-list-item chat-item-hover"
              onClick={() => navigate(`/chat/${chat._id}`)}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                padding: '16px', 
                gap: '12px',
                cursor: 'pointer',
                borderBottom: '1px solid #f1f5f9',
                transition: 'background 0.2s',
                position: 'relative'
              }}
            >
              <div style={{ position: 'relative' }}>
                <img 
                  src={chat.isGroup ? (chat.groupPic || 'https://ui-avatars.com/api/?name=Group&background=cbd5e1') : (chat.participants.find((p: any) => p.userid !== user?.userid)?.profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(chat.participants.find((p: any) => p.userid !== user?.userid)?.userid || 'User')}&background=random`)}
                  alt="Avatar"
                  style={{ width: '56px', height: '56px', borderRadius: '18px', objectFit: 'cover' }}
                />
                {!chat.isRead && <div style={{ position: 'absolute', top: -2, right: -2, width: '12px', height: '12px', borderRadius: '50%', background: 'var(--primary)', border: '2px solid white' }}></div>}
              </div>
              
              <div style={{ flex: 1, borderBottom: '1px solid #f8fafc', paddingBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1e293b' }}>
                    {chat.isGroup ? chat.name : chat.participants.find((p: any) => p.userid !== user?.userid)?.userid}
                  </h3>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                    {chat.lastMessage ? new Date(chat.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <p style={{ fontSize: '0.85rem', color: chat.isRead ? '#64748b' : '#1e293b', fontWeight: chat.isRead ? 400 : 600, maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {chat.lastMessage?.text || 'Start a conversation'}
                  </p>
                  <ChevronRight size={16} color="#cbd5e1" />
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {isCreateGroupOpen && (
        <CreateGroupModal 
          onClose={() => setIsCreateGroupOpen(false)} 
          onCreated={(chatId) => {
            setIsCreateGroupOpen(false);
            navigate(`/chat/${chatId}`);
          }} 
        />
      )}

      {isCreateMomentOpen && (
        <CreateMomentModal
          onClose={() => setIsCreateMomentOpen(false)}
          onMomentCreated={fetchMoments}
        />
      )}

      {activeMomentIndex !== null && moments[activeMomentIndex] && (
        <MomentViewerModal
          key={activeMomentIndex}
          momentGroup={moments[activeMomentIndex]}
          onClose={() => setTimeout(() => setActiveMomentIndex(null), 0)}
          onNextGroup={() => {
            setTimeout(() => {
              if (activeMomentIndex < moments.length - 1) setActiveMomentIndex(activeMomentIndex + 1);
              else setActiveMomentIndex(null);
            }, 0);
          }}
          onPrevGroup={() => {
            setTimeout(() => {
              if (activeMomentIndex > 0) setActiveMomentIndex(activeMomentIndex - 1);
              else setActiveMomentIndex(null);
            }, 0);
          }}
        />
      )}

    </div>
  );
};

export default VerseChat;
