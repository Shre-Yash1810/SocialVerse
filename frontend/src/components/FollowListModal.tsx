import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

interface FollowListModalProps {
  userHandle: string;
  type: 'followers' | 'following';
  onClose: () => void;
}

const FollowListModal: React.FC<FollowListModalProps> = ({ userHandle, type, onClose }) => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const currentUserId = localStorage.getItem('userid');
  const [myFollowing, setMyFollowing] = useState<string[]>([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await api.get(`/users/profile/${userHandle}`);
        setUsers(type === 'followers' ? (res.data.followers || []) : (res.data.following || []));
      } catch (err) {
        console.error('Failed to fetch list', err);
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };
    
    // Also fetch my own profile to know whom I follow for the toggle buttons
    const fetchMe = async () => {
      try {
        const res = await api.get('/users/me');
        // Check if populated following or just IDs
        const followingIds = res.data.following?.map((f: any) => typeof f === 'object' ? f._id : f) || [];
        setMyFollowing(followingIds);
      } catch (err) {
        console.error('Failed to fetch my following list', err);
      }
    };

    fetchUsers();
    fetchMe();
  }, [userHandle, type]);

  const handleToggleFollow = async (e: React.MouseEvent, targetUser: any) => {
    e.stopPropagation();
    const isFollowing = myFollowing.includes(targetUser._id);
    try {
      if (isFollowing) {
        await api.delete(`/users/unfollow/${targetUser._id}`);
        setMyFollowing(myFollowing.filter(id => id !== targetUser._id));
      } else {
        await api.post(`/users/follow/${targetUser._id}`);
        setMyFollowing([...myFollowing, targetUser._id]);
      }
    } catch (err) {
      console.error('Follow toggle failed', err);
    }
  };

  return (
    <div className="modal-overlay animate-fade-in" style={{ zIndex: 10000 }} onClick={onClose}>
      <div className="edit-profile-modal animate-scale" style={{ maxWidth: '400px', height: '60vh', borderRadius: '16px' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header" style={{ justifyContent: 'center', position: 'relative' }}>
          <h2 style={{ textTransform: 'capitalize' }}>{type}</h2>
          <button onClick={onClose} style={{ position: 'absolute', right: '15px' }}><X size={20} /></button>
        </div>
        
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 15px' }}>
          {loading ? (
             <p style={{ textAlign: 'center', padding: '20px', color: '#8e8e8e' }}>Loading...</p>
          ) : !users || users.length === 0 ? (
             <p style={{ textAlign: 'center', padding: '20px', color: '#8e8e8e' }}>No {type} found.</p>
          ) : (
            users.map(u => {
              if (!u) return null; // Safe guard against deleted users in the array
              const isFollowing = myFollowing.includes(u._id);
              const isSelf = u.userid === currentUserId;
              
              return (
                <div 
                  key={u._id} 
                  style={{ display: 'flex', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }}
                  onClick={() => {
                    onClose();
                    navigate(`/profile/${u.userid}`);
                  }}
                >
                  <img 
                    src={u.profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.userid)}&background=random`} 
                    alt="" 
                    style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #efefef' }} 
                  />
                  <div style={{ marginLeft: '12px', flex: 1 }}>
                    <p style={{ fontWeight: 600, fontSize: '0.9rem', color: '#262626' }}>{u.userid}</p>
                    <p style={{ fontSize: '0.8rem', color: '#8e8e8e' }}>{u.name || u.userid}</p>
                  </div>
                  
                  {!isSelf && (
                    <button 
                      onClick={(e) => handleToggleFollow(e, u)}
                      style={{ 
                        padding: '6px 16px', 
                        borderRadius: '8px', 
                        fontSize: '0.85rem', 
                        fontWeight: 600,
                        border: 'none',
                        cursor: 'pointer',
                        background: isFollowing ? '#efefef' : '#0095f6',
                        color: isFollowing ? '#262626' : 'white'
                      }}
                    >
                      {isFollowing ? 'Following' : 'Follow'}
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default FollowListModal;
