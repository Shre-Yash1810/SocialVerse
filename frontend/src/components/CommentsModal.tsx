import React, { useState, useEffect } from 'react';
import { X, Send, Trash2 } from 'lucide-react';
import api from '../services/api';
import { formatRelativeTime } from '../utils/timeUtils';
import Linkify from './Linkify';

interface Comment {
  _id: string;
  author: { userid: string; name: string; profilePic: string };
  text: string;
  createdAt: string;
}

interface Post {
  _id: string;
  author: { userid: string; name: string; profilePic: string };
  caption?: string;
  createdAt: string;
}

interface CommentsModalProps {
  postId: string;
  post?: Post; // Added optional post prop for caption display
  onClose: () => void;
  onCommentAdded: () => void;
}

const CommentsModal: React.FC<CommentsModalProps> = ({ postId, post, onClose, onCommentAdded }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const currentUserId = localStorage.getItem('userid');

  const fetchComments = async () => {
    try {
      const res = await api.get(`/posts/${postId}/comments`);
      setComments(res.data);
    } catch (err) {
      console.error('Failed to fetch comments', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [postId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      await api.post('/comments', { postId, text: newComment });
      setNewComment('');
      fetchComments();
      onCommentAdded();
    } catch (err) {
      console.error('Failed to post comment', err);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!window.confirm('Delete this comment?')) return;
    try {
      await api.delete(`/comments/${commentId}`);
      fetchComments();
      onCommentAdded();
    } catch (err) {
      console.error('Failed to delete comment', err);
    }
  };

  return (
    <div className="modal-overlay animate-fade-in">
      <div className="edit-profile-modal animate-scale" style={{ maxWidth: '500px', height: '80vh' }}>
        <div className="modal-header">
          <h2>Comments</h2>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        
        <div className="edit-form" style={{ flex: 1, overflowY: 'auto', padding: '15px' }}>
          {loading ? (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Loading comments...</p>
          ) : (
            <>
              {/* Post Caption as the first "comment" */}
              {post && post.caption && (
                <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', alignItems: 'flex-start', borderBottom: '1px solid #f1f5f9', paddingBottom: '15px' }}>
                  <img src={post.author.profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(post.author.userid || post.author.name)}&background=random`} alt="" style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '0.85rem', fontWeight: 700 }}>{post.author.userid || post.author.name}</p>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      <Linkify text={post.caption || ''} />
                    </p>
                    <p style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '4px' }}>{formatRelativeTime(post.createdAt)}</p>
                  </div>
                </div>
              )}

              {comments.length === 0 && !post?.caption ? (
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '20px' }}>No comments yet. Be the first!</p>
              ) : (
                comments.map(comment => (
                  <div key={comment._id} style={{ display: 'flex', gap: '12px', marginBottom: '20px', alignItems: 'flex-start' }}>
                    <img src={comment.author.profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.author.userid || comment.author.name)}&background=random`} alt="" style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <p style={{ fontSize: '0.85rem', fontWeight: 700 }}>{comment.author.userid || comment.author.name}</p>
                        {comment.author.userid === currentUserId && (
                          <button onClick={() => handleDelete(comment._id)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                      <p style={{ fontSize: '0.9rem', color: '#334155', marginTop: '2px' }}>
                        <Linkify text={comment.text} />
                      </p>
                      <p style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '4px' }}>{formatRelativeTime(comment.createdAt)}</p>
                    </div>
                  </div>
                ))
              )}
            </>
          )}
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '15px', borderTop: '1px solid var(--border)', display: 'flex', gap: '10px' }}>
          <input 
            type="text" 
            placeholder="Add a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            style={{ flex: 1, padding: '10px 15px', borderRadius: '20px', border: '1px solid var(--border)', fontSize: '0.9rem' }}
          />
          <button type="submit" className="icon-btn" style={{ color: 'var(--primary)' }}>
            <Send size={20} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default CommentsModal;
