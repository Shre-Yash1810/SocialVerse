import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import api from '../services/api';

interface CreateGroupModalProps {
  onClose: () => void;
  onCreated: (chatId: string) => void;
}

const CreateGroupModal: React.FC<CreateGroupModalProps> = ({ onClose, onCreated }) => {
  const [following, setFollowing] = useState<any[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [groupName, setGroupName] = useState('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const fetchFriends = async () => {
      try {
        const res = await api.get('/users/me');
        // Get full profiles for following
        const myHandle = res.data.userid;
        const profileRes = await api.get(`/users/profile/${myHandle}`);
        setFollowing(profileRes.data.following || []);
      } catch (err) {
        console.error('Failed to fetch following:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchFriends();
  }, []);

  const toggleUser = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const handleCreate = async () => {
    if (!groupName.trim()) {
      alert('Please enter a group name');
      return;
    }
    if (selectedUsers.length === 0) {
      alert('Please select at least one user');
      return;
    }

    setCreating(true);
    try {
      const res = await api.post('/chats', {
        participants: selectedUsers,
        isGroup: true,
        name: groupName
      });
      onCreated(res.data._id);
    } catch (err) {
      console.error('Failed to create group:', err);
      alert('Failed to create group');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="modal-overlay animate-fade-in" style={{ zIndex: 10000 }} onClick={onClose}>
      <div className="edit-profile-modal animate-scale" style={{ maxWidth: '400px', height: '80vh' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <button onClick={onClose}><X size={24} /></button>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>New Group</h2>
          <button 
            style={{ color: 'var(--primary)', fontWeight: 700, opacity: groupName && selectedUsers.length > 0 ? 1 : 0.5 }}
            onClick={handleCreate}
            disabled={creating || !groupName || selectedUsers.length === 0}
          >
            {creating ? '...' : 'Create'}
          </button>
        </div>

        <div style={{ padding: '20px' }}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#64748b', marginBottom: '8px' }}>
              Group Name
            </label>
            <input 
              type="text" 
              placeholder="Enter group name..." 
              value={groupName}
              onChange={e => setGroupName(e.target.value)}
              style={{ 
                width: '100%', 
                padding: '12px', 
                borderRadius: '12px', 
                border: '1px solid #e2e8f0',
                fontSize: '0.95rem',
                outline: 'none'
              }}
            />
          </div>

          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#64748b', marginBottom: '12px' }}>
            Select Members ({selectedUsers.length})
          </label>

          <div style={{ maxHeight: 'calc(100% - 150px)', overflowY: 'auto' }}>
            {loading ? (
              <p style={{ textAlign: 'center', color: '#94a3b8' }}>Loading friends...</p>
            ) : following.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#94a3b8' }}>You aren't following anyone yet.</p>
            ) : (
              following.map(user => (
                <div 
                  key={user._id} 
                  onClick={() => toggleUser(user._id)}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    padding: '12px 0', 
                    borderBottom: '1px solid #f1f5f9',
                    cursor: 'pointer',
                    gap: '12px'
                  }}
                >
                  <img 
                    src={user.profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.userid)}&background=random`} 
                    alt="" 
                    style={{ width: '44px', height: '44px', borderRadius: '14px', objectFit: 'cover' }} 
                  />
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 600, fontSize: '0.9rem', color: '#1e293b' }}>{user.userid}</p>
                    <p style={{ fontSize: '0.8rem', color: '#64748b' }}>{user.name}</p>
                  </div>
                  <div style={{ 
                    width: '24px', 
                    height: '24px', 
                    borderRadius: '50%', 
                    border: selectedUsers.includes(user._id) ? 'none' : '2px solid #cbd5e1',
                    background: selectedUsers.includes(user._id) ? 'var(--primary)' : 'transparent',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    transition: 'all 0.2s'
                  }}>
                    {selectedUsers.includes(user._id) && <Check size={14} color="white" strokeWidth={3} />}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateGroupModal;
