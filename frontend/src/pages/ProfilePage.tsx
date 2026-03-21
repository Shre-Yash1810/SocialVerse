import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { User as UserIcon, Edit2, Grid, Film, FileText, Heart, MessageCircle } from 'lucide-react';
import EditProfileModal from '../components/EditProfileModal';
import CreatePostModal from '../components/CreatePostModal';
import PostDetailModal from '../components/PostDetailModal';
import BlogDetailModal from '../components/BlogDetailModal';
import FollowListModal from '../components/FollowListModal';
import ProfileOptionsModal from '../components/ProfileOptionsModal';
import BottomNav from '../components/BottomNav';
import api from '../services/api';
import '../styles/Profile.css';

const ProfilePage: React.FC = () => {
  const { handle: urlHandle } = useParams<{ handle?: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('posts');
  const [loading, setLoading] = useState(true);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [activeDetailPost, setActiveDetailPost] = useState<any | null>(null);
  const [activeDetailBlog, setActiveDetailBlog] = useState<any | null>(null);
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followListType, setFollowListType] = useState<'followers' | 'following' | null>(null);
  const [isProfileOptionsOpen, setIsProfileOptionsOpen] = useState(false);
  const [showXpBar, setShowXpBar] = useState(false);

  const currentUserId = localStorage.getItem('userid');
  const targetId = urlHandle || currentUserId;
  const isOwnProfile = !urlHandle || urlHandle === currentUserId;

  useEffect(() => {
    const fetchProfile = async () => {
      if (!targetId) {
        navigate('/auth');
        return;
      }

      setLoading(true);
      try {
        const res = await api.get(`/users/profile/${targetId}`); 
        setUser(res.data);
        setIsFollowing(res.data.followers?.some((f: any) => f.userid === currentUserId) || false);
      } catch (err) {
        console.error('Failed to fetch profile', err);
        setUser({
          name: 'SocialVerse User',
          userid: targetId,
          level: 1,
          followersCount: 0,
          followingCount: 0,
          gender: 'Not specified',
          bio: 'Welcome to SocialVerse!',
          profilePic: ''
        });
      } finally {
        setLoading(false);
      }
    };
    
    const fetchUserPosts = async () => {
      if (!targetId) return;
      try {
        const res = await api.get(`/posts/user/${targetId}`);
        setUserPosts(res.data);
      } catch (err) {
        console.error('Failed to fetch user posts', err);
      }
    };

    fetchProfile();
    fetchUserPosts();
  }, [targetId, navigate, currentUserId]);

  const handleFollow = async () => {
    if (!user?._id) return;
    try {
      if (isFollowing) {
        await api.delete(`/users/unfollow/${user._id}`);
        setUser({ ...user, followersCount: Math.max(0, user.followersCount - 1) });
      } else {
        await api.post(`/users/follow/${user._id}`);
        setUser({ ...user, followersCount: user.followersCount + 1 });
      }
      setIsFollowing(!isFollowing);
    } catch (err) {
      console.error('Failed to toggle follow status', err);
    }
  };

  const handleStartChat = async () => {
    if (!user?._id) return;
    try {
      const res = await api.post('/chats', { participants: [user._id], isGroup: false });
      navigate(`/chat/${res.data._id}`);
    } catch (err) {
      console.error('Failed to start chat', err);
    }
  };

  const getXpProgress = () => {
    if (!user) return { current: 0, target: 900, percentage: 0, remaining: 900 };
    const current = user.xp || 0;
    const level = user.level || 1;
    const target = level * 900; 
    const percentage = Math.min(100, Math.max(0, (current / target) * 100));
    const remaining = Math.max(0, target - current);
    return { current, target, percentage, remaining };
  };

  const filteredPosts = userPosts.filter(post => {
    if (activeTab === 'posts') return post.type === 'Image';
    if (activeTab === 'bytes') return post.type === 'Video';
    if (activeTab === 'blogs') return post.type === 'Blog';
    return false;
  });

  if (loading) return <div className="loading-screen">Loading Profile...</div>;

  return (
    <>
      <div className={`profile-wrapper animate-fade-in ${(isPreviewOpen || isEditOpen || activeDetailPost || activeDetailBlog) ? 'overflow-hidden' : ''}`}>
        <Navbar 
          mode={isOwnProfile ? "profile" : "other_profile"} 
          onCreateClick={isOwnProfile ? () => setIsCreateOpen(true) : undefined} 
          onSettingsClick={isOwnProfile ? () => navigate('/settings') : undefined} 
          onMoreClick={!isOwnProfile ? () => setIsProfileOptionsOpen(true) : undefined}
        />
        
        <main className="profile-container">
        {/* Header Section */}
        <section className="profile-header">
          <div className="profile-action-left">
            {isOwnProfile ? (
              <button className="edit-profile-btn glass-btn" onClick={() => setIsEditOpen(true)}>
                <Edit2 size={16} />
                <span>Edit Profile</span>
              </button>
            ) : (
              <div className="profile-actions-other">
                <button 
                  className={isFollowing ? 'glass-btn' : 'btn-primary'} 
                  onClick={handleFollow}
                  style={{ padding: '8px 20px', borderRadius: '8px' }}
                >
                  {isFollowing ? 'Following' : 'Follow'}
                </button>
                <button 
                  className="glass-btn" 
                  style={{ padding: '8px 20px', borderRadius: '8px' }}
                  onClick={handleStartChat}
                >
                  VerseChat
                </button>
              </div>
            )}
          </div>

          <div className="profile-pic-container">
            <div className="profile-pic-ring" onClick={() => setIsPreviewOpen(true)}>
              {user.profilePic ? (
                <img src={user.profilePic} alt={user.name} className="main-profile-pic" />
              ) : (
                <div className="main-profile-pic-placeholder">
                  <UserIcon size={40} strokeWidth={1.5} />
                </div>
              )}
            </div>
          </div>

          <div className="profile-stats-right-vertical">
            <div className="stat-item-compact" onClick={() => setFollowListType('followers')} style={{ cursor: 'pointer' }}>
              <span className="stat-value-large">{user.followersCount}</span>
              <span className="stat-label-subtle">Followers</span>
            </div>
            <div className="stat-item-compact" onClick={() => setFollowListType('following')} style={{ cursor: 'pointer' }}>
              <span className="stat-value-large">{user.followingCount}</span>
              <span className="stat-label-subtle">Following</span>
            </div>
          </div>
        </section>

        {/* Identity Section */}
        <section className="profile-identity">
          <div className="name-badge-row">
            <div 
              className="level-badge" 
              onClick={() => setShowXpBar(!showXpBar)}
              style={{ cursor: 'pointer', transition: 'transform 0.2s', transform: showXpBar ? 'scale(1.05)' : 'scale(1)' }}
              title="Click to view XP"
            >
              Lv. {user.level || 1}
            </div>
            <h1 className="display-name">{user.name}</h1>
          </div>
          
          {showXpBar && (
            <div className="animate-fade-in" style={{
              margin: '8px auto 15px auto',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              borderRadius: '16px',
              padding: '12px 16px',
              width: '80%',
              maxWidth: '260px',
              boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 600 }}>
                <span style={{ color: 'var(--primary-color)' }}>{getXpProgress().current} XP</span>
                <span style={{ color: 'var(--text-muted)' }}>{getXpProgress().target} XP</span>
              </div>
              <div style={{ 
                width: '100%', 
                height: '8px', 
                background: 'rgba(59, 130, 246, 0.05)', 
                border: '1px solid rgba(59, 130, 246, 0.3)', 
                borderRadius: '8px', 
                padding: '1px'
              }}>
                <div style={{ 
                  height: '100%', 
                  width: `${getXpProgress().percentage}%`, 
                  background: '#3b82f6', 
                  borderRadius: '6px',
                  transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)' 
                }} />
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                {getXpProgress().remaining} more needed for Level {(user.level || 1) + 1}
              </div>
            </div>
          )}

          <div className="handle-row">
            <span className="handle">@{user.userid}</span>
            {user.pronouns && (
              <>
                <span className="dot-separator">•</span>
                <span className="gender-tag">{user.pronouns}</span>
              </>
            )}
          </div>

          <div className="bio-container">
            <p className="bio-text">{user.bio}</p>
          </div>
        </section>

        {/* Content Section (Instagram style) */}
        <section className="profile-content">
          <div className="content-tabs">
            <button 
              className={`tab-item ${activeTab === 'posts' ? 'active' : ''}`}
              onClick={() => setActiveTab('posts')}
            >
              <Grid size={18} />
              <span>Posts</span>
            </button>
            <button 
              className={`tab-item ${activeTab === 'bytes' ? 'active' : ''}`}
              onClick={() => setActiveTab('bytes')}
            >
              <Film size={18} />
              <span>Bytes</span>
            </button>
            <button 
              className={`tab-item ${activeTab === 'blogs' ? 'active' : ''}`}
              onClick={() => setActiveTab('blogs')}
            >
              <FileText size={18} />
              <span>Blogs</span>
            </button>
          </div>

          <div className="posts-grid">
            {filteredPosts.map((post) => (
                <div 
                  key={post._id} 
                  className="post-skeleton"
                  style={{ 
                    background: post.type === 'Blog' 
                      ? 'url("https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=2000&q=80")' 
                      : 'var(--bg-secondary)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }}
                  onClick={() => post.type === 'Blog' ? setActiveDetailBlog(post) : setActiveDetailPost(post)}
                >
                  {post.type === 'Image' && <img src={post.content} alt="" />}
                  {post.type === 'Video' && <video src={post.content} muted />}
                  {post.type === 'Blog' && (
                    <div style={{ padding: '20px', color: 'white', display: 'flex', flexDirection: 'column', height: '100%' }}>
                      <h4 style={{ fontSize: '1rem', marginBottom: '8px', lineHeight: 1.4 }}>{post.caption}</h4>
                      <p style={{ fontSize: '0.8rem', opacity: 0.8, overflow: 'hidden' }}>{post.content.substring(0, 80)}...</p>
                    </div>
                  )}
                  <div className="post-overlay">
                    <div className="post-overlay-stat">
                      <Heart fill="white" size={24} /> {post.likes?.length || 0}
                    </div>
                    <div className="post-overlay-stat">
                      <MessageCircle fill="white" size={24} /> {post.commentsCount || 0}
                    </div>
                  </div>
                </div>
              ))}
            {filteredPosts.length === 0 && (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                No {activeTab} yet.
              </div>
            )}
          </div>
        </section>
      </main>
      <BottomNav />
      </div>

      {/* Modals outside the layout wrapper to prevent stacking context clipping */}
      {isPreviewOpen && (
        <div className="pic-preview-modal animate-fade-in" onClick={() => setIsPreviewOpen(false)}>
          <div className="preview-content animate-scale">
            <img src={user.profilePic || '/Logo/logo.png'} alt="Profile Large" />
          </div>
        </div>
      )}

      {isEditOpen && (
        <EditProfileModal 
          user={user} 
          onClose={() => setIsEditOpen(false)} 
          onUpdate={(updatedUser) => setUser(updatedUser)} 
        />
      )}
      {isCreateOpen && (
        <CreatePostModal 
          onClose={() => setIsCreateOpen(false)} 
          onPostCreated={() => {
            setIsCreateOpen(false);
            window.location.reload();
          }} 
        />
      )}
      {activeDetailPost && (
        <PostDetailModal 
          post={activeDetailPost} 
          onClose={() => setActiveDetailPost(null)} 
          onUpdate={() => {}} // Could refresh posts here
          onNext={() => {
            const idx = filteredPosts.findIndex(p => p._id === activeDetailPost._id);
            if (idx < filteredPosts.length - 1) setActiveDetailPost(filteredPosts[idx + 1]);
          }}
          onPrev={() => {
            const idx = filteredPosts.findIndex(p => p._id === activeDetailPost._id);
            if (idx > 0) setActiveDetailPost(filteredPosts[idx - 1]);
          }}
          hasNext={filteredPosts.findIndex(p => p._id === activeDetailPost._id) < filteredPosts.length - 1}
          hasPrev={filteredPosts.findIndex(p => p._id === activeDetailPost._id) > 0}
        />
      )}
      {activeDetailBlog && (
        <BlogDetailModal 
          post={activeDetailBlog} 
          onClose={() => setActiveDetailBlog(null)} 
        />
      )}
      {followListType && (
        <FollowListModal 
          userHandle={user.userid} 
          type={followListType} 
          onClose={() => setFollowListType(null)} 
        />
      )}
      {isProfileOptionsOpen && (
        <ProfileOptionsModal 
          user={user} 
          onClose={() => setIsProfileOptionsOpen(false)} 
          onBlockSuccess={() => window.location.href = '/feed'}
        />
      )}
    </>
  );
};

export default ProfilePage;
