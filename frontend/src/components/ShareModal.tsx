import React, { useState, useEffect } from 'react';
import { X, Search, Send, Check } from 'lucide-react';
import api from '../services/api';

interface Target {
  _id: string;
  userid?: string; // for users
  name?: string; // for users or groups
  profilePic?: string;
  isGroup?: boolean;
  type: 'user' | 'chat';
}

interface ShareModalProps {
  postId: string;
  onClose: () => void;
}

const ShareModal: React.FC<ShareModalProps> = ({ postId, onClose }) => {
  const [search, setSearch] = useState('');
  const [recentChats, setRecentChats] = useState<Target[]>([]);
  const [searchResults, setSearchResults] = useState<Target[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTargets, setSelectedTargets] = useState<{ id: string, type: 'user' | 'chat' }[]>([]);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    // Fetch recent chats on mount
    const fetchRecent = async () => {
      try {
        const res = await api.get('/chats');
        const chats: Target[] = res.data.map((c: any) => {
          if (c.isGroup) {
            return {
              _id: c._id,
              name: c.name,
              profilePic: c.groupPic,
              isGroup: true,
              type: 'chat'
            };
          } else {
            const other = c.participants.find((p: any) => p.userid !== localStorage.getItem('userid'));
            return {
              _id: c._id,
              userid: other?.userid,
              name: other?.name,
              profilePic: other?.profilePic,
              isGroup: false,
              type: 'chat'
            };
          }
        });
        setRecentChats(chats);
      } catch (err) {
        console.error('Failed to fetch recent chats', err);
      }
    };
    fetchRecent();
  }, []);

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await api.get(`/users/search?q=${query}`);
      const users: Target[] = res.data.map((u: any) => ({
        _id: u._id,
        userid: u.userid,
        name: u.name,
        profilePic: u.profilePic,
        type: 'user'
      }));
      setSearchResults(users);
    } catch (err) {
      console.error('Search failed', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const toggleTarget = (id: string, type: 'user' | 'chat') => {
    setSelectedTargets(prev => {
      const exists = prev.find(t => t.id === id);
      if (exists) {
        return prev.filter(t => t.id !== id);
      } else {
        return [...prev, { id, type }];
      }
    });
  };

  const isSelected = (id: string) => selectedTargets.some(t => t.id === id);

  const handleSend = async () => {
    if (selectedTargets.length === 0) return;
    setSending(true);
    try {
      await api.post('/chats/share', {
        postId,
        targets: selectedTargets
      });
      onClose();
    } catch (err) {
      console.error('Send failed', err);
      alert('Failed to share. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const displayList = search ? searchResults : recentChats;

  return (
    <div className="modal-overlay animate-fade-in" style={{ zIndex: 1100 }}>
      <div className="edit-profile-modal animate-scale" style={{ 
        maxWidth: '420px', 
        height: '70vh', 
        display: 'flex', 
        flexDirection: 'column',
        borderRadius: '24px',
        overflow: 'hidden'
      }}>
        <div className="modal-header" style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Share</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
            <X size={24} />
          </button>
        </div>

        <div style={{ padding: '16px' }}>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search size={18} style={{ position: 'absolute', left: '16px', color: '#94a3b8' }} />
            <input 
              type="text" 
              placeholder="Search people..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ 
                width: '100%', 
                padding: '12px 16px 12px 48px', 
                borderRadius: '16px', 
                border: 'none',
                background: '#f1f5f9',
                fontSize: '0.95rem',
                outline: 'none'
              }}
            />
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '0 8px' }}>
          {!search && (
             <h3 style={{ padding: '8px 16px', fontSize: '0.9rem', fontWeight: 700, color: '#64748b' }}>Recent</h3>
          )}
          
          {loading ? (
            <p style={{ textAlign: 'center', color: '#94a3b8', marginTop: '20px' }}>Searching...</p>
          ) : displayList.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#94a3b8', marginTop: '40px' }}>
              {search ? 'No users found.' : 'No recent chats.'}
            </p>
          ) : (
            displayList.map(target => (
              <div 
                key={target._id} 
                onClick={() => toggleTarget(target._id, target.type)}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '12px', 
                  padding: '10px 16px', 
                  cursor: 'pointer',
                  borderRadius: '12px',
                  transition: 'background 0.2s',
                  background: isSelected(target._id) ? 'rgba(99, 102, 241, 0.05)' : 'transparent'
                }}
                className="share-item-hover"
              >
                <div style={{ position: 'relative' }}>
                  <img 
                    src={target.profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(target.userid || target.name || 'U')}&background=random`} 
                    alt="" 
                    style={{ width: '48px', height: '48px', borderRadius: '16px', objectFit: 'cover', border: '1px solid #f1f5f9' }} 
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 700, fontSize: '0.95rem', color: '#1e293b' }}>{target.userid || target.name}</p>
                  <p style={{ fontSize: '0.8rem', color: '#64748b' }}>{target.isGroup ? 'Group Chat' : target.name}</p>
                </div>
                <div style={{ 
                  width: '24px', 
                  height: '24px', 
                  borderRadius: '50%', 
                  border: `2px solid ${isSelected(target._id) ? 'var(--primary)' : '#cbd5e1'}`,
                  background: isSelected(target._id) ? 'var(--primary)' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s'
                }}>
                  {isSelected(target._id) && <Check size={14} color="white" />}
                </div>
              </div>
            ))
          )}
        </div>

        <div style={{ padding: '20px', borderTop: '1px solid var(--border)', background: 'white' }}>
          <button 
            className="btn-primary" 
            disabled={selectedTargets.length === 0 || sending}
            onClick={handleSend}
            style={{ 
              width: '100%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '8px',
              padding: '14px',
              borderRadius: '16px',
              fontSize: '1rem',
              fontWeight: 700,
              boxShadow: '0 4px 12px rgba(99, 102, 241, 0.2)'
            }}
          >
            {sending ? 'Sharing...' : `Send ${selectedTargets.length > 0 ? `(${selectedTargets.length})` : ''}`}
            {!sending && <Send size={18} />}
          </button>
        </div>
      </div>
      <style>{`
        .share-item-hover:hover {
          background-color: #f8fafc !important;
        }
      `}</style>
    </div>
  );
};

export default ShareModal;
