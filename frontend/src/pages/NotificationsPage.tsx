import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Heart, MessageCircle, UserPlus, Hand, AtSign } from 'lucide-react';
import BottomNav from '../components/BottomNav';
import api from '../services/api';
import '../styles/Feed.css';

const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await api.get('/notifications');
        setNotifications(res.data);
      } catch (err) {
        console.error('Failed to fetch notifications', err);
      } finally {
        setLoading(false);
      }
    };
    fetchNotifications();
  }, []);

  const markAsRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      console.error('Failed to mark read', err);
    }
  };

  const handleNotificationClick = (notif: any) => {
    if (!notif.isRead) markAsRead(notif._id);

    // Navigate based on type
    if (notif.type === 'FOLLOW' || notif.type === 'WAVE') {
      if (notif.sender?.userid) {
        navigate(`/profile/${notif.sender.userid}`);
      }
    } else if (notif.post) {
      // In a real app we might open the PostDetailModal, or navigate to a dedicated post page.
      // Since we don't have a dedicated `/p/:id` route yet, we can navigate to their profile for now
      // or implement a generic post view. Let's just go to their profile since that's easy.
      if (notif.sender?.userid) {
        navigate(`/profile/${notif.sender.userid}`);
      }
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'LIKE': return <Heart size={16} fill="#ff3b30" color="#ff3b30" />;
      case 'COMMENT': return <MessageCircle size={16} color="#0095f6" />;
      case 'FOLLOW': return <UserPlus size={16} color="#4f46e5" />;
      case 'WAVE': return <Hand size={16} color="#f59e0b" />;
      case 'MENTION': return <AtSign size={16} color="#6366f1" />;
      default: return <Bell size={16} color="#64748b" />;
    }
  };

  const getNotificationText = (notif: any) => {
    switch (notif.type) {
      case 'LIKE': return `liked your post.`;
      case 'COMMENT': return `commented: "${notif.extraInfo || 'Nice!'}"`;
      case 'FOLLOW': return `started following you.`;
      case 'WAVE': return `waved at you.`;
      case 'MENTION': return `mentioned you in a ${notif.moment ? 'moment' : 'post'}.`;
      default: return `interacted with you.`;
    }
  };

  return (
    <div className="feed-page animate-fade-in" style={{ backgroundColor: '#f8fafc', minHeight: '100vh', paddingBottom: '80px' }}>

      {/* Header */}
      <div style={{ background: 'white', padding: '16px 20px', position: 'sticky', top: 0, zIndex: 50, borderBottom: '1px solid #f1f5f9' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e293b', margin: 0 }}>Notifications</h2>
        </div>
      </div>

      <main className="feed-container" style={{ paddingTop: '16px' }}>
        <div className="posts-container" style={{ maxWidth: '600px', width: '100%', background: 'white', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
          {loading ? (
            <p style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Loading notifications...</p>
          ) : notifications.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
              <Bell size={48} color="#cbd5e1" style={{ marginBottom: '16px' }} />
              <h3>No notifications yet</h3>
              <p style={{ fontSize: '0.85rem' }}>When someone interacts with you, it'll show up here.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {notifications.map(notif => (
                <div
                  key={notif._id}
                  onClick={() => handleNotificationClick(notif)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '16px',
                    gap: '12px',
                    borderBottom: '1px solid #f1f5f9',
                    background: notif.isRead ? 'white' : '#f0f9ff',
                    cursor: 'pointer',
                    transition: 'background 0.2s'
                  }}
                >
                  <div style={{ position: 'relative' }}>
                    <img
                      src={notif.sender?.profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(notif.sender?.userid || 'U')}&background=random`}
                      alt=""
                      style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover' }}
                    />
                    <div style={{ position: 'absolute', bottom: '-4px', right: '-4px', background: 'white', borderRadius: '50%', padding: '2px', display: 'flex' }}>
                      {getNotificationIcon(notif.type)}
                    </div>
                  </div>

                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontSize: '0.95rem', color: '#1e293b', lineHeight: '1.4' }}>
                      <span style={{ fontWeight: 700 }}>{notif.sender?.userid}</span> {getNotificationText(notif)}
                    </p>
                  </div>

                  {notif.post?.content && notif.post?.type === 'Image' && (
                    <img
                      src={notif.post.content}
                      style={{ width: '44px', height: '44px', borderRadius: '8px', objectFit: 'cover' }}
                    />
                  )}
                  {notif.type === 'FOLLOW' && (
                    <button className="btn-primary" style={{ padding: '6px 16px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600 }}>
                      Follow
                    </button>
                  )}
                  {notif.type === 'WAVE' && (
                    <button className="glass-btn" style={{ padding: '6px 16px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600, color: 'var(--primary)', borderColor: 'var(--primary)' }}>
                      Wave back
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default NotificationsPage;
