import React, { useState } from 'react';
import { X, Send, Trash2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { useUser } from '../context/UserContext';
import { formatRelativeTime } from '../utils/timeUtils';
import Linkify from './Linkify';
import VerifiedBadge from './VerifiedBadge';

interface Comment {
  _id: string;
  author: { userid: string; name: string; profilePic: string; isVerified?: boolean };
  text: string;
  createdAt: string;
}

interface Post {
  _id: string;
  author: { userid: string; name: string; profilePic: string; isVerified?: boolean };
  caption?: string;
  createdAt: string;
}

interface CommentsModalProps {
  postId: string;
  post?: Post;
  onClose: () => void;
  onCommentAdded: () => void;
}

const CommentsModal: React.FC<CommentsModalProps> = ({ postId, post, onClose, onCommentAdded }) => {
  const { user } = useUser();
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState('');
  const currentUserId = user?.userid;

  // Fetch Comments
  const { data: comments = [], isLoading } = useQuery<Comment[]>({
    queryKey: ['comments', postId],
    queryFn: async () => {
      const res = await api.get(`/posts/${postId}/comments`);
      return res.data;
    },
    enabled: !!postId,
  });

  // Add Comment Mutation (Optimistic)
  const addMutation = useMutation({
    mutationFn: (text: string) => api.post('/comments', { postId, text }),
    onMutate: async (text) => {
      await queryClient.cancelQueries({ queryKey: ['comments', postId] });
      const previousComments = queryClient.getQueryData<Comment[]>(['comments', postId]);

      const tempComment: Comment = {
        _id: `temp-${Date.now()}`,
        author: {
          userid: user?.userid || '',
          name: user?.name || '',
          profilePic: user?.profilePic || '',
        },
        text,
        createdAt: new Date().toISOString(),
      };

      queryClient.setQueryData(['comments', postId], (old: Comment[] | undefined) => [tempComment, ...(old || [])]);
      setNewComment('');
      return { previousComments };
    },
    onError: (_err, _text, context) => {
      if (context?.previousComments) {
        queryClient.setQueryData(['comments', postId], context.previousComments);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
      onCommentAdded(); // To update the feed count
    },
  });

  // Delete Comment Mutation (Optimistic)
  const deleteMutation = useMutation({
    mutationFn: (commentId: string) => api.delete(`/comments/${commentId}`),
    onMutate: async (commentId) => {
      await queryClient.cancelQueries({ queryKey: ['comments', postId] });
      const previousComments = queryClient.getQueryData<Comment[]>(['comments', postId]);
      queryClient.setQueryData(['comments', postId], (old: Comment[] | undefined) => 
        old?.filter(c => c._id !== commentId)
      );
      return { previousComments };
    },
    onError: (_err, _id, context) => {
      if (context?.previousComments) {
        queryClient.setQueryData(['comments', postId], context.previousComments);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
      onCommentAdded();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    addMutation.mutate(newComment);
  };

  const handleDelete = (commentId: string) => {
    if (!window.confirm('Delete this comment?')) return;
    deleteMutation.mutate(commentId);
  };

  return (
    <div className="modal-overlay animate-fade-in">
      <div className="edit-profile-modal animate-scale" style={{ maxWidth: '500px', height: '80vh' }}>
        <div className="modal-header">
          <h2>Comments</h2>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        
        <div className="edit-form" style={{ flex: 1, overflowY: 'auto', padding: '15px' }}>
          {isLoading && comments.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Loading comments...</p>
          ) : (
            <>
              {post && post.caption && (
                <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', alignItems: 'flex-start', borderBottom: '1px solid #f1f5f9', paddingBottom: '15px' }}>
                  <img src={post.author.profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(post.author.userid || post.author.name)}&background=random`} alt="" style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <p style={{ fontSize: '0.85rem', fontWeight: 700 }}>{post.author.userid}</p>
                      {post.author.isVerified && <VerifiedBadge size={12} />}
                    </div>
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
                  <div key={comment._id} style={{ display: 'flex', gap: '12px', marginBottom: '20px', alignItems: 'flex-start', opacity: comment._id.startsWith('temp-') ? 0.6 : 1 }}>
                    <img src={comment.author.profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.author.userid || comment.author.name)}&background=random`} alt="" style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <p style={{ fontSize: '0.85rem', fontWeight: 700 }}>{comment.author.userid}</p>
                          {comment.author.isVerified && <VerifiedBadge size={12} />}
                        </div>
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
            disabled={addMutation.isPending}
            style={{ flex: 1, padding: '10px 15px', borderRadius: '20px', border: '1px solid var(--border)', fontSize: '0.9rem' }}
          />
          <button type="submit" className="icon-btn" style={{ color: 'var(--primary)' }} disabled={!newComment.trim() || addMutation.isPending}>
            <Send size={20} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default CommentsModal;
