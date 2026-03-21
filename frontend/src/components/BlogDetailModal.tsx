import React, { useState } from 'react';
import { X, Heart, MessageCircle, Share2 } from 'lucide-react';
import api from '../services/api';
import { formatRelativeTime } from '../utils/timeUtils';
import ShareModal from './ShareModal';
import '../styles/Feed.css';

interface BlogDetailModalProps {
  post: any;
  onClose: () => void;
  onUpdate?: () => void;
}

const BlogDetailModal: React.FC<BlogDetailModalProps> = ({ post, onClose, onUpdate }) => {
  const [localPost, setLocalPost] = useState(post);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const handleLike = async () => {
    try {
      const res = await api.post(`/posts/${post._id}/like`);
      setLocalPost({ ...localPost, isLiked: !localPost.isLiked, likes: res.data.likes });
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error('Like failed', err);
    }
  };

  return (
    <div className="blog-reader-overlay animate-fade-in" style={{ 
      position: 'fixed', 
      top: 0, left: 0, right: 0, bottom: 0, 
      width: '100vw', height: '100dvh', 
      background: '#0a0a0c',
      zIndex: 99999, 
      fontFamily: "'Inter', sans-serif",
      display: 'flex',
      flexDirection: 'column',
      color: '#fff'
    }}>
      {/* Universe Background Overlay */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundImage: 'url("https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=2000&q=80")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        opacity: 0.35,
        zIndex: 0,
        pointerEvents: 'none',
        backgroundAttachment: 'fixed'
      }} />

      {/* Sticky Top Nav for Reader */}
      <div style={{ 
        position: 'sticky', top: 0, 
        background: 'rgba(0, 0, 0, 0.4)', 
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        padding: '15px 30px', 
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        zIndex: 100,
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <img src={post.author?.profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(post.author?.userid || 'A')}&background=6366f1&color=fff`} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.2)' }} alt="" />
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0, color: '#fff' }}>{post.author?.userid || 'Author'}</h3>
            <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>{formatRelativeTime(post.createdAt)}</span>
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'background 0.2s' }}>
            <X size={24} color="#fff" />
          </button>
        </div>
      </div>

      {/* Scrollable Content */}
      <div style={{ flex: 1, overflowY: 'auto', position: 'relative', zIndex: 10 }}>
        <div style={{ 
          maxWidth: '800px', 
          margin: '0 auto', 
          padding: '80px 24px 160px',
        }}>
          
          <h1 style={{ 
            fontSize: 'clamp(2.2rem, 6vw, 3.5rem)', 
            fontWeight: 800, 
            lineHeight: '1.1', 
            marginBottom: '40px', 
            color: '#fff',
            letterSpacing: '-0.03em',
            textShadow: '0 10px 30px rgba(0,0,0,0.5)'
          }}>
            {post.caption || 'Untitled Entry'}
          </h1>

          <article style={{ 
            fontSize: '1.25rem', 
            lineHeight: '1.8', 
            color: 'rgba(255,255,255,0.95)', 
            whiteSpace: 'pre-wrap',
            textShadow: '0 2px 10px rgba(0,0,0,0.3)',
            fontWeight: 400
          }}>
            {post.content}
          </article>
        </div>
      </div>

      {/* Fixed Bottom interaction bar */}
      <div style={{ 
        position: 'fixed',
        bottom: 30, left: '50%',
        transform: 'translateX(-50%)',
        padding: '8px', 
        background: 'rgba(255, 255, 255, 0.08)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.1)',
        display: 'flex', alignItems: 'center', gap: '15px', 
        borderRadius: '40px',
        zIndex: 100,
        boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', padding: '10px 25px', borderRadius: '35px', background: localPost.isLiked ? 'rgba(255,48,64,0.15)' : 'transparent', transition: 'all 0.2s' }} onClick={handleLike}>
          <Heart size={22} fill={localPost.isLiked ? '#ff3040' : 'none'} color={localPost.isLiked ? '#ff3040' : '#fff'} />
          <span style={{ fontSize: '0.95rem', color: '#fff', fontWeight: 600 }}>{localPost.likes?.length || 0}</span>
        </div>
        <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.1)' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', padding: '10px 25px' }}>
          <MessageCircle size={22} color="#fff" />
          <span style={{ fontSize: '0.95rem', color: '#fff', fontWeight: 600 }}>{post.commentsCount || 0}</span>
        </div>
        <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.1)' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', padding: '10px 25px' }} onClick={() => setIsShareModalOpen(true)}>
          <Share2 size={22} color="#fff" />
          <span style={{ fontSize: '0.95rem', color: '#fff', fontWeight: 600 }}>Share</span>
        </div>
      </div>

      {isShareModalOpen && (
        <ShareModal 
          postId={post._id} 
          onClose={() => setIsShareModalOpen(false)} 
        />
      )}
    </div>
  );
};

export default BlogDetailModal;
