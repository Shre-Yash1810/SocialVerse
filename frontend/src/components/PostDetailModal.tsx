import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { X, Heart, MessageCircle, Share2, Bookmark, ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import ContentOptionsModal from './ContentOptionsModal';
import api from '../services/api';
import { formatRelativeTime } from '../utils/timeUtils';
import ShareModal from './ShareModal';
import Linkify from './Linkify';
import VerifiedBadge from './VerifiedBadge';
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
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [lastWheelTime, setLastWheelTime] = useState<number>(0);
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartY(e.touches[0].clientY);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartY === null) return;
    const touchEndY = e.changedTouches[0].clientY;
    const distance = touchStartY - touchEndY;

    if (distance > 50 && hasNext) {
      onNext?.(); // Swipe up -> next post
    } else if (distance < -50 && hasPrev) {
      onPrev?.(); // Swipe down -> prev post
    }
    setTouchStartY(null);
  };

  const handleWheel = (e: React.WheelEvent) => {
    const now = Date.now();
    if (now - lastWheelTime < 600) return; // Debounce to prevent rapid skipping

    if (e.deltaY > 50 && hasNext) { // Scroll down
      onNext?.();
      setLastWheelTime(now);
    } else if (e.deltaY < -50 && hasPrev) { // Scroll up
      onPrev?.();
      setLastWheelTime(now);
    }
  };

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

  return ReactDOM.createPortal(
    <div className="modal-overlay animate-fade-in" style={{ zIndex: 1300 }}>
      <button onClick={onClose} className="desktop-only" style={{ position: 'absolute', top: '20px', right: '20px', background: 'rgba(0,0,0,0.5)', borderRadius: '50%', padding: '4px', border: 'none', color: 'white', cursor: 'pointer', zIndex: 50 }}>
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
        <div className="pd-header mobile-only" style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid #efefef', background: 'white', position: 'relative' }}>
          <img src={localPost.author?.profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(localPost.author?.userid || 'U')}&background=random`} style={{ width: '32px', height: '32px', borderRadius: '50%' }} alt="" />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontWeight: 610, fontSize: '0.9rem' }}>{localPost.author?.userid}</span>
              {localPost.author?.isVerified && <VerifiedBadge size={14} />}
            </div>
            <span style={{ fontSize: '0.75rem', color: '#8e8e8e' }}>{localPost.author?.name}</span>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button onClick={() => setIsOptionsOpen(true)} style={{ background: 'none', border: 'none', color: '#262626', cursor: 'pointer', display: 'flex', padding: '4px' }}>
              <MoreHorizontal size={22} />
            </button>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#262626', cursor: 'pointer', display: 'flex', padding: '4px' }}>
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Media Section */}
        <div className="post-detail-media" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd} onWheel={handleWheel}>
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

          <div className="pd-header desktop-only" style={{ padding: '16px', borderBottom: '1px solid #efefef', display: 'flex', alignItems: 'center', gap: '12px', position: 'relative' }}>
            <img src={localPost.author?.profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(localPost.author?.userid || 'U')}&background=random`} style={{ width: '32px', height: '32px', borderRadius: '50%' }} alt="" />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ fontWeight: 600 }}>{localPost.author?.userid}</span>
                {localPost.author?.isVerified && <VerifiedBadge size={14} />}
              </div>
              <span style={{ fontSize: '0.8rem', color: '#8e8e8e' }}>{localPost.author?.name}</span>
            </div>
            <button onClick={() => setIsOptionsOpen(true)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#262626', cursor: 'pointer', display: 'flex' }}>
              <MoreHorizontal size={20} />
            </button>
          </div>

          <div className="mobile-only" style={{ padding: '4px 16px 12px' }}>
            <div className="post-actions" style={{ padding: '8px 0', marginBottom: '4px', display: 'flex', gap: '18px' }}>
              <Heart size={26} className={`icon-btn-action ${localPost.isLiked ? 'liked' : ''}`} onClick={handleLike} />
              <MessageCircle size={26} className="icon-btn-action" onClick={() => setShowMobileComments(true)} />
              <Share2 size={26} className="icon-btn-action" onClick={() => setIsShareModalOpen(true)} />
              <div style={{ marginLeft: 'auto' }}>
                <Bookmark size={26} className="icon-btn-action" />
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <p style={{ fontWeight: 700, fontSize: '0.9rem', color: '#262626' }}>{localPost.likes?.length || 0} likes</p>
              {localPost.caption && (
                <p style={{ fontSize: '0.95rem', lineHeight: '1.4', color: '#262626' }}>
                  <strong style={{ marginRight: '6px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    {localPost.author?.userid}
                    {localPost.author?.isVerified && <VerifiedBadge size={12} />}
                  </strong>
                   <Linkify text={localPost.caption} />
                </p>
              )}
              <p onClick={() => setShowMobileComments(true)} style={{ color: '#8e8e8e', fontSize: '0.85rem', marginTop: '6px', cursor: 'pointer' }}>
                View all {comments.length} comments
              </p>
              <p style={{ fontSize: '0.65rem', color: '#8e8e8e', marginTop: '10px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                {formatRelativeTime(localPost.createdAt)}
              </p>
            </div>

          </div>

          <div className="pd-comments-section">
            <div className="desktop-only" style={{ display: 'flex', flexDirection: 'column' }}>

              {/* Author Caption as first comment */}
              {localPost.caption && (
                <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
                  <img src={localPost.author?.profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(localPost.author?.userid || 'U')}&background=random`} style={{ width: '32px', height: '32px', borderRadius: '50%' }} alt="" />
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <p style={{ fontSize: '0.9rem', fontWeight: 700 }}>{localPost.author?.userid}</p>
                      {localPost.author?.isVerified && <VerifiedBadge size={12} />}
                    </div>
                    <p style={{ fontSize: '0.9rem', lineHeight: '1.5', marginTop: '2px' }}>
                      <Linkify text={localPost.caption} />
                    </p>
                  </div>
                </div>
              )}

              {comments.map(comment => (
                <div key={comment._id} style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                  <img src={comment.author.profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.author.userid)}&background=random`} style={{ width: '32px', height: '32px', borderRadius: '50%' }} alt="" />
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <p style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '2px' }}>{comment.author.userid}</p>
                      {comment.author.isVerified && <VerifiedBadge size={12} />}
                    </div>
                    <p style={{ fontSize: '0.9rem' }}>
                      <Linkify text={comment.text} />
                    </p>
                    <span style={{ fontSize: '0.75rem', color: '#8e8e8e', marginTop: '4px', display: 'block' }}>{formatRelativeTime(comment.createdAt)}</span>
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
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            <p style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '2px' }}>{comment.author.userid}</p>
                            {comment.author.isVerified && <VerifiedBadge size={12} />}
                          </div>
                          <p style={{ fontSize: '0.9rem', color: '#262626' }}>
                            <Linkify text={comment.text} />
                          </p>
                          <span style={{ fontSize: '0.75rem', color: '#8e8e8e', marginTop: '4px', display: 'block' }}>{formatRelativeTime(comment.createdAt)}</span>
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '8px' }}>
              <p style={{ fontWeight: 700, fontSize: '0.85rem', color: '#262626', margin: 0 }}>{localPost.likes?.length || 0} likes</p>
              <p style={{ fontSize: '0.65rem', color: '#8e8e8e', textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0 }}>{formatRelativeTime(localPost.createdAt)}</p>
            </div>
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
      {isOptionsOpen && (
        <ContentOptionsModal
          contentId={post._id}
          contentType="post"
          authorId={post.author?._id}
          onClose={() => setIsOptionsOpen(false)}
        />
      )}
    </div>,
    document.body
  );
};

export default PostDetailModal;
