import React, { useState, useEffect } from 'react';
import { X, Heart, MessageCircle, Share2, Bookmark, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../services/api';
import { formatRelativeTime } from '../utils/timeUtils';
import ShareModal from './ShareModal';
import '../styles/Feed.css';

interface PostDetailModalProps {
  post: any;
  onClose: () => void;
  onUpdate?: () => void;
  onNext?: () => void;
  onPrev?: () => void;
  hasNext?: boolean;
  hasPrev?: boolean;
}

const PostDetailModal: React.FC<PostDetailModalProps> = ({ post, onClose, onUpdate, onNext, onPrev, hasNext, hasPrev }) => {
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [localPost, setLocalPost] = useState(post);
  const [showMobileComments, setShowMobileComments] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  useEffect(() => {
    // Reset local post state if the `post` prop changes (e.g. hitting Next/Prev)
    setLocalPost(post);
    setShowMobileComments(false);
  }, [post]);

  useEffect(() => {
    const fetchComments = async () => {
      try {
        const res = await api.get(`/posts/${post._id}/comments`);
        setComments(res.data);
      } catch (err) {
        console.error('Failed to fetch comments', err);
      }
    };
    fetchComments();
  }, [post._id]);

  const handleLike = async () => {
    try {
      const res = await api.post(`/posts/${post._id}/like`);
      const updatedPost = { 
        ...localPost, 
        isLiked: !localPost.isLiked, 
        likes: res.data.likes 
      };
      setLocalPost(updatedPost);
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error('Like failed', err);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || loading) return;
    setLoading(true);
    try {
      const res = await api.post(`/comments/${post._id}`, { content: newComment });
      setComments([res.data, ...comments]);
      setNewComment('');
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error('Comment failed', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay animate-fade-in" style={{ zIndex: 1300 }}>
      <button onClick={onClose} style={{ position: 'absolute', top: '20px', right: '20px', background: 'rgba(0,0,0,0.5)', borderRadius: '50%', padding: '4px', border: 'none', color: 'white', cursor: 'pointer', zIndex: 50 }}>
        <X size={28} />
      </button>

      {/* Navigation Arrows for Profile Grid (Desktop Only) */}
      {hasPrev && (
        <button onClick={(e) => { e.stopPropagation(); onPrev?.(); }} style={{ position: 'absolute', left: '2vw', top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.85)', border: 'none', borderRadius: '50%', padding: '12px', cursor: 'pointer', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }} className="desktop-only icon-btn-action">
          <ChevronLeft size={32} color="black" />
        </button>
      )}
      {hasNext && (
        <button onClick={(e) => { e.stopPropagation(); onNext?.(); }} style={{ position: 'absolute', right: '2vw', top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.85)', border: 'none', borderRadius: '50%', padding: '12px', cursor: 'pointer', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }} className="desktop-only icon-btn-action">
          <ChevronRight size={32} color="black" />
        </button>
      )}

      <div className="post-detail-modal-content animate-scale">
        <div className="pd-header mobile-only" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid #efefef' }}>
           <img src={localPost.author?.profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(localPost.author?.userid || 'U')}&background=random`} style={{ width: '32px', height: '32px', borderRadius: '50%' }} alt="" />
           <span style={{ fontWeight: 600 }}>{localPost.author?.userid || 'Unknown User'}</span>
        </div>

        {/* Media Section */}
        <div className="post-detail-media">
          {localPost.type === 'Image' ? (
            <img src={localPost.content} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          ) : (
            <video 
              src={localPost.content} 
              style={{ width: '100%', height: '100%', objectFit: 'contain', cursor: 'pointer' }} 
              autoPlay 
              loop 
              playsInline
              muted={isMuted}
              onClick={() => setIsMuted(!isMuted)}
            />
          )}
        </div>

        {/* Info Section */}
        <div className="post-detail-info">
          
          <div className="pd-header desktop-only" style={{ padding: '16px', borderBottom: '1px solid #efefef', display: 'flex', alignItems: 'center', gap: '12px' }}>
             <img src={localPost.author?.profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(localPost.author?.userid || 'U')}&background=random`} style={{ width: '32px', height: '32px', borderRadius: '50%' }} alt="" />
             <span style={{ fontWeight: 600 }}>{localPost.author?.userid || 'Unknown User'}</span>
          </div>

          <div className="mobile-only" style={{ padding: '12px 16px' }}>
            <div className="post-actions" style={{ padding: '0', marginBottom: '8px', display: 'flex', gap: '16px' }}>
              <Heart size={26} className={`icon-btn-action ${localPost.isLiked ? 'liked' : ''}`} onClick={handleLike} />
              <MessageCircle size={26} className="icon-btn-action" onClick={() => setShowMobileComments(true)} />
              <Share2 size={26} className="icon-btn-action" onClick={() => setIsShareModalOpen(true)} />
              <div style={{ marginLeft: 'auto' }}>
                <Bookmark size={26} className="icon-btn-action" />
              </div>
            </div>
            <p style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '4px' }}>{localPost.likes?.length || 0} likes</p>
            {localPost.caption && (
              <p style={{ fontSize: '0.9rem', lineHeight: '1.4' }}>
                <strong style={{ marginRight: '6px' }}>{localPost.author?.userid}</strong>
                {localPost.caption}
              </p>
            )}
            <p onClick={() => setShowMobileComments(true)} style={{ color: '#8e8e8e', fontSize: '0.85rem', marginTop: '6px', cursor: 'pointer' }}>
              View all {comments.length} comments
            </p>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
            <div className="desktop-only">
              {comments.map(comment => (
                <div key={comment._id} style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                  <img src={comment.author.profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.author.userid)}&background=random`} style={{ width: '32px', height: '32px', borderRadius: '50%' }} alt="" />
                  <div>
                    <p style={{ fontSize: '0.9rem' }}><strong>{comment.author.userid}</strong> {comment.content}</p>
                    <span style={{ fontSize: '0.75rem', color: '#8e8e8e' }}>{formatRelativeTime(comment.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Mobile Comments Overlay (Bottom Sheet) */}
          {showMobileComments && (
            <div className="mobile-only animate-fade-in" style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(0,0,0,0.6)', zIndex: 2000,
              display: 'flex', flexDirection: 'column', justifyContent: 'flex-end'
            }}>
              <div className="animate-slide-up" style={{
                background: 'white', borderTopLeftRadius: '20px', borderTopRightRadius: '20px',
                height: '75vh', display: 'flex', flexDirection: 'column'
              }}>
                <div style={{ padding: '16px', borderBottom: '1px solid #efefef', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                  <div style={{ width: '40px', height: '4px', background: '#ccc', borderRadius: '4px', position: 'absolute', top: '8px' }} />
                  <span style={{ fontWeight: 600 }}>Comments</span>
                  <button onClick={() => setShowMobileComments(false)} style={{ position: 'absolute', right: '16px', background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex' }}>
                    <X size={20} />
                  </button>
                </div>
                
                <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
                  {comments.length === 0 ? (
                    <p style={{ textAlign: 'center', color: '#8e8e8e', marginTop: '20px' }}>No comments yet. Be the first to reply!</p>
                  ) : (
                    comments.map(comment => (
                      <div key={comment._id} style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                        <img src={comment.author.profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.author.userid)}&background=random`} style={{ width: '32px', height: '32px', borderRadius: '50%' }} alt="" />
                        <div>
                          <p style={{ fontSize: '0.9rem' }}><strong>{comment.author.userid}</strong> <span style={{ color: '#262626' }}>{comment.content}</span></p>
                          <span style={{ fontSize: '0.75rem', color: '#8e8e8e' }}>{formatRelativeTime(comment.createdAt)}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div style={{ padding: '12px 16px', borderTop: '1px solid #efefef', display: 'flex', gap: '12px', background: 'white', paddingBottom: 'calc(12px + env(safe-area-inset-bottom))' }}>
                  <input 
                    type="text" 
                    placeholder="Add a comment..." 
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    style={{ flex: 1, border: 'none', outline: 'none', fontSize: '0.9rem' }}
                  />
                  <button 
                    onClick={handleAddComment}
                    disabled={!newComment.trim() || loading}
                    style={{ background: 'none', border: 'none', color: '#0095f6', fontWeight: 600, cursor: 'pointer', opacity: !newComment.trim() ? 0.5 : 1 }}
                  >
                    Post
                  </button>
                </div>
              </div>
            </div>
          )}
          <div className="desktop-only" style={{ padding: '16px', borderTop: '1px solid #efefef' }}>
            <div className="post-actions" style={{ padding: '0', marginBottom: '12px', display: 'flex', gap: '16px' }}>
              <Heart size={26} className={`icon-btn-action ${localPost.isLiked ? 'liked' : ''}`} onClick={handleLike} />
              <MessageCircle size={26} className="icon-btn-action" />
              <Share2 size={26} className="icon-btn-action" onClick={() => setIsShareModalOpen(true)} />
              <div style={{ marginLeft: 'auto' }}>
                <Bookmark size={26} className="icon-btn-action" />
              </div>
            </div>
            <p style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '6px' }}>{localPost.likes?.length || 0} likes</p>
            {localPost.caption && (
              <p style={{ fontSize: '0.9rem', marginBottom: '8px', lineHeight: '1.4' }}>
                <strong style={{ marginRight: '6px' }}>{localPost.author?.userid}</strong>
                {localPost.caption}
              </p>
            )}
            <p style={{ fontSize: '0.65rem', color: '#8e8e8e', marginTop: '4px', textTransform: 'uppercase' }}>{formatRelativeTime(localPost.createdAt)}</p>
          </div>

          <form onSubmit={handleAddComment} className="desktop-only" style={{ padding: '12px 16px', borderTop: '1px solid #efefef', display: 'flex', gap: '12px' }}>
            <input 
              type="text" 
              placeholder="Add a comment..." 
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              style={{ flex: 1, border: 'none', outline: 'none', fontSize: '0.9rem' }}
            />
            <button 
              type="submit" 
              disabled={!newComment.trim() || loading}
              style={{ background: 'none', border: 'none', color: '#0095f6', fontWeight: 600, cursor: 'pointer', opacity: !newComment.trim() ? 0.5 : 1 }}
            >
              Post
            </button>
          </form>
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

export default PostDetailModal;
