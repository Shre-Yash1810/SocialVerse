import React, { useState, useEffect } from 'react';
import { X, UserMinus, UserPlus, LogOut, Edit2, Camera } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

interface GroupInfoModalProps {
  chat: any;
  currentUser: any;
  onClose: () => void;
  onUpdate: () => void;
}

const GroupInfoModal: React.FC<GroupInfoModalProps> = ({ chat, currentUser, onClose, onUpdate }) => {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState(chat.name || '');
  const [loading, setLoading] = useState(false);
  const [availableFriends, setAvailableFriends] = useState<any[]>([]);
  const [showAddMember, setShowAddMember] = useState(false);

  useEffect(() => {
    setIsAdmin(chat.admins?.includes(currentUser?._id));
  }, [chat, currentUser]);

  const handleUpdateName = async () => {
    if (!newName.trim() || newName === chat.name) {
      setIsEditingName(false);
      return;
    }
    setLoading(true);
    try {
      await api.put(`/chats/${chat._id}`, { name: newName });
      setIsEditingName(false);
      onUpdate();
    } catch (err) {
      console.error('Failed to update name:', err);
      alert('Failed to update group name');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePic = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      setLoading(true);
      try {
        await api.put(`/chats/${chat._id}`, { groupPic: reader.result });
        onUpdate();
      } catch (err) {
        console.error('Failed to update group picture:', err);
        alert('Failed to update group picture');
      } finally {
        setLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveMember = async (userId: string) => {
    if (!window.confirm('Remove this member?')) return;
    try {
      await api.delete(`/chats/${chat._id}/participants/${userId}`);
      onUpdate();
    } catch (err) {
      console.error('Failed to remove member:', err);
    }
  };

  const handleLeave = async () => {
    if (!window.confirm('Leave this group?')) return;
    try {
      await api.delete(`/chats/${chat._id}/leave`);
      onClose();
      navigate('/versechat');
    } catch (err) {
      console.error('Failed to leave group:', err);
    }
  };

  const fetchFriendsToAdd = async () => {
    try {
      const res = await api.get('/users/me');
      const profileRes = await api.get(`/users/profile/${res.data.userid}`);
      const following = profileRes.data.following || [];
      // Filter out those already in chat
      const existingIds = chat.participants.map((p: any) => p._id);
      setAvailableFriends(following.filter((f: any) => !existingIds.includes(f._id)));
      setShowAddMember(true);
    } catch (err) {
      console.error('Failed to fetch friends:', err);
    }
  };

  const handleAddMember = async (userId: string) => {
    try {
      await api.post(`/chats/${chat._id}/participants`, { participants: [userId] });
      setShowAddMember(false);
      onUpdate();
    } catch (err) {
      console.error('Failed to add member:', err);
    }
  };

  return (
    <div className="modal-overlay animate-fade-in" style={{ zIndex: 10000 }} onClick={onClose}>
      <div className="edit-profile-modal animate-scale" style={{ maxWidth: '400px', height: '80vh' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <button onClick={onClose}><X size={24} /></button>
          <h2>Group Info</h2>
          <div style={{ width: 24 }}></div>
        </div>

        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Group Header Info */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ position: 'relative', width: '80px', height: '80px', margin: '0 auto 12px' }}>
              <img 
                src={chat.groupPic || `https://ui-avatars.com/api/?name=${encodeURIComponent(chat.name)}&background=random`} 
                alt="" 
                style={{ width: '80px', height: '80px', borderRadius: '24px', objectFit: 'cover', border: '3px solid #f1f5f9' }} 
              />
              {isAdmin && (
                <>
                  <label htmlFor="group-pic-input" style={{ 
                    position: 'absolute', 
                    bottom: '-4px', 
                    right: '-4px', 
                    background: 'var(--primary)', 
                    color: 'white', 
                    width: '28px', 
                    height: '28px', 
                    borderRadius: '50%', 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center', 
                    cursor: 'pointer',
                    border: '2px solid white',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}>
                    <Camera size={16} />
                  </label>
                  <input 
                    id="group-pic-input" 
                    type="file" 
                    accept="image/*" 
                    onChange={handleUpdatePic} 
                    style={{ display: 'none' }} 
                  />
                </>
              )}
            </div>
            
            {isEditingName ? (
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                <input 
                  type="text" 
                  value={newName} 
                  onChange={e => setNewName(e.target.value)}
                  style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem', outline: 'none' }}
                  autoFocus
                />
                <button 
                  onClick={handleUpdateName} 
                  disabled={loading}
                  style={{ color: 'var(--primary)', fontWeight: 600, opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
                >
                  {loading ? 'Saving...' : 'Save'}
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>{chat.name}</h3>
                {isAdmin && <button onClick={() => setIsEditingName(true)} style={{ color: '#64748b' }}><Edit2 size={16} /></button>}
              </div>
            )}
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: '4px' }}>{chat.participants.length} members</p>
          </div>

          {/* Members List */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1e293b' }}>Members</h4>
              {isAdmin && (
                <button 
                  onClick={fetchFriendsToAdd}
                  style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600 }}
                >
                  <UserPlus size={16} /> Add
                </button>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {chat.participants.map((member: any) => (
                <div key={member._id} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <img 
                    src={member.profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.userid)}&background=random`} 
                    alt="" 
                    style={{ width: '36px', height: '36px', borderRadius: '12px', objectFit: 'cover' }} 
                  />
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '0.9rem', fontWeight: 600, color: '#1e293b' }}>
                      {member.userid} 
                      {chat.admins?.includes(member._id) && <span style={{ marginLeft: '6px', fontSize: '0.7rem', color: 'var(--primary)', background: 'rgba(99, 102, 241, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>Admin</span>}
                    </p>
                  </div>
                  {isAdmin && member._id !== currentUser?._id && (
                    <button onClick={() => handleRemoveMember(member._id)} style={{ color: '#ef4444' }}>
                      <UserMinus size={18} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <button 
            onClick={handleLeave}
            style={{ 
              marginTop: 'auto',
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '8px', 
              padding: '12px', 
              borderRadius: '12px', 
              background: '#fff1f2', 
              color: '#e11d48', 
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer'
            }}
          >
            <LogOut size={20} /> Leave Group
          </button>
        </div>

        {/* Add Member Sub-Modal/Layer */}
        {showAddMember && (
          <div style={{ 
            position: 'absolute', 
            top: 0, left: 0, right: 0, bottom: 0, 
            background: 'white', 
            zIndex: 100, 
            padding: '20px',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h4 style={{ fontWeight: 800 }}>Add Members</h4>
              <button onClick={() => setShowAddMember(false)}><X size={24} /></button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {availableFriends.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#94a3b8' }}>No more friends to add.</p>
              ) : (
                availableFriends.map(friend => (
                  <div 
                    key={friend._id} 
                    onClick={() => handleAddMember(friend._id)}
                    style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 0', borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }}
                  >
                    <img 
                      src={friend.profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(friend.userid)}&background=random`} 
                      alt="" 
                      style={{ width: '40px', height: '40px', borderRadius: '14px' }} 
                    />
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: 600 }}>{friend.userid}</p>
                      <p style={{ fontSize: '0.8rem', color: '#64748b' }}>{friend.name}</p>
                    </div>
                    <UserPlus size={18} color="var(--primary)" />
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

export default GroupInfoModal;
