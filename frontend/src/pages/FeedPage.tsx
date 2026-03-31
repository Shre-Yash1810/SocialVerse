import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Heart, MessageCircle, Share2, Bookmark } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import CommentsModal from '../components/CommentsModal';
import ShareModal from '../components/ShareModal';
import PostDetailModal from '../components/PostDetailModal';
import { formatRelativeTime } from '../utils/timeUtils';
import { FeedSkeleton } from '../components/Skeletons';
import Linkify from '../components/Linkify';
import { useUser } from '../context/UserContext';
import VerifiedBadge from '../components/VerifiedBadge';
import { getOptimizedImageUrl, getOptimizedAvatarUrl } from '../utils/cloudinaryUtils';
import '../styles/Feed.css';

interface Post {
  _id: string;
  author: { userid: string; name: string; profilePic: string; isVerified?: boolean };
  type: string;
  content: string;
  caption?: string;
  likes: string[];
  savedBy?: string[];
  isLiked?: boolean;
  isSaved?: boolean;
  commentsCount: number;
  createdAt: string;
}

const FeedVideo: React.FC<{ src: string }> = ({ src }) => {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
      },
      { threshold: 0.8 }
    );

    if (videoRef.current) observer.observe(videoRef.current);
    return () => {
      if (videoRef.current) observer.unobserve(videoRef.current);
    };
  }, []);

  useEffect(() => {
    if (isInView && videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
    } else if (videoRef.current) {
      videoRef.current.pause();
    }
  }, [isInView]);

  return (
    <div style={{ position: 'relative', width: '100%', aspectRatio: '1/1', background: '#000' }}>
      <video 
        ref={videoRef}
        src={src} 
        style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
        muted 
        loop 
        playsInline
      />
    </div>
  );
};

const FeedPage: React.FC = () => {
  const { user } = useUser();
  const queryClient = useQueryClient();
  const [activeCommentPost, setActiveCommentPost] = useState<string | null>(null);
  const [activeSharePost, setActiveSharePost] = useState<string | null>(null);
  const [activeDetailPost, setActiveDetailPost] = useState<any | null>(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Fetch Feed using useQuery
  const { data: posts = [], isLoading } = useQuery<Post[]>({
    queryKey: ['feed'],
    queryFn: async () => {
      const res = await api.get('/posts/feed');
      return res.data
        .filter((post: any) => post.type !== 'Blog')
        .map((post: any) => ({
          ...post,
          isLiked: post.likes?.some((id: any) => id.toString() === user?._id),
          isSaved: post.savedBy?.some((id: any) => id.toString() === user?._id)
        }));
    },
    enabled: !!user?._id,
  });

  // Handle Deep Links
  useEffect(() => {
    const investigateId = searchParams.get('investigate');
    if (investigateId && posts.length > 0) {
      const existing = posts.find(p => p._id === investigateId);
      if (existing) {
        setActiveDetailPost(existing);
      } else {
        api.get(`/posts/${investigateId}`).then(res => {
          if (res.data) setActiveDetailPost(res.data);
        }).catch(err => console.error('Failed to fetch investigation post', err));
      }
    }
  }, [posts, searchParams]);

  // Optimistic Like Mutation
  const likeMutation = useMutation({
    mutationFn: (id: string) => api.post(`/posts/${id}/like`),
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: ['feed'] });
      const previousPosts = queryClient.getQueryData<Post[]>(['feed']);
      
      queryClient.setQueryData(['feed'], (old: Post[] | undefined) => 
        old?.map(post => {
          if (post._id === id) {
            const alreadyLiked = post.isLiked;
            const newLikes = alreadyLiked 
              ? post.likes.filter(uid => uid !== user?._id) 
              : [...post.likes, user?._id || ''];
            return { ...post, isLiked: !alreadyLiked, likes: newLikes };
          }
          return post;
        })
      );
      
      return { previousPosts };
    },
    onError: (_err, _id, context) => {
      if (context?.previousPosts) {
        queryClient.setQueryData(['feed'], context.previousPosts);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });

  // Optimistic Save Mutation
  const saveMutation = useMutation({
    mutationFn: (id: string) => api.post(`/posts/${id}/save`),
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: ['feed'] });
      const previousPosts = queryClient.getQueryData<Post[]>(['feed']);
      
      queryClient.setQueryData(['feed'], (old: Post[] | undefined) => 
        old?.map(post => {
          if (post._id === id) {
            const alreadySaved = post.isSaved;
            const newSavedBy = alreadySaved 
              ? post.savedBy?.filter(uid => uid !== user?._id) 
              : [...(post.savedBy || []), user?._id || ''];
            return { ...post, isSaved: !alreadySaved, savedBy: newSavedBy };
          }
          return post;
        })
      );
      
      return { previousPosts };
    },
    onError: (_err, _id, context) => {
      if (context?.previousPosts) {
        queryClient.setQueryData(['feed'], context.previousPosts);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });

  if (isLoading && posts.length === 0) return <FeedSkeleton />;

  return (
    <div className="feed-page">
      <main className="feed-container">
        {posts.length === 0 && !isLoading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            <h3>No posts yet.</h3>
            <p>Be the first one to post in the verse!</p>
          </div>
        ) : (
          posts.map(post => (
            <article key={post._id} className="post-card">
              <div className="post-header" onClick={() => navigate(`/profile/${post.author.userid}`)} style={{ cursor: 'pointer' }}>
                <img src={getOptimizedAvatarUrl(post.author.profilePic) || `https://ui-avatars.com/api/?name=${encodeURIComponent(post.author.userid || post.author.name)}&background=random`} alt={post.author.name} className="post-avatar" loading="lazy" />
                  <div className="post-user-info">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <h4 style={{ margin: 0 }}>{post.author.userid}</h4>
                      {post.author.isVerified && <VerifiedBadge size={14} />}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{post.author.name}</p>
                    </div>
                  </div>
              </div>
              <div className="post-image-container" onClick={() => setActiveDetailPost(post)} style={{ cursor: 'pointer' }}>
                {post.type === 'Image' && <img src={getOptimizedImageUrl(post.content, { width: 800 })} alt="Post content" className="post-image" loading="lazy" />}
                {post.type === 'Video' && <FeedVideo src={post.content} />}
              </div>
              <div className="post-actions">
                <Heart 
                  size={26} 
                  className={`icon-btn-action ${post.isLiked ? 'liked' : ''}`} 
                  onClick={() => likeMutation.mutate(post._id)}
                />
                <MessageCircle 
                  size={26} 
                  className="icon-btn-action" 
                  onClick={() => setActiveCommentPost(post._id)}
                />
                <Share2 
                  size={26} 
                  className="icon-btn-action" 
                  onClick={() => setActiveSharePost(post._id)}
                />
                <div style={{ marginLeft: 'auto' }}>
                  <Bookmark 
                    size={26} 
                    className={`icon-btn-action ${post.isSaved ? 'saved' : ''}`} 
                    onClick={() => saveMutation.mutate(post._id)}
                  />
                </div>
              </div>
              <div className="post-content">
                <p style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '8px' }}>{post.likes?.length || 0} likes</p>
                
                {post.caption && (
                  <p className="post-caption" style={{ marginTop: 0 }}>
                    <strong style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginRight: '6px' }}>
                      {post.author.userid}
                      {post.author.isVerified && <VerifiedBadge size={12} />}
                    </strong> 
                    <Linkify text={post.caption} />
                  </p>
                )}

                {post.commentsCount > 0 && (
                  <p 
                    style={{ fontSize: '0.85rem', color: 'var(--text-muted)', cursor: 'pointer', marginTop: '6px' }}
                    onClick={() => setActiveCommentPost(post._id)}
                  >
                    View all {post.commentsCount} comments
                  </p>
                )}

                <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: '10px', letterSpacing: '0.4px' }}>
                  {formatRelativeTime(post.createdAt)}
                </p>
              </div>
            </article>
          ))
        )}
      </main>
      {activeCommentPost && (
        <CommentsModal 
          postId={activeCommentPost} 
          post={posts.find(p => p._id === activeCommentPost)}
          onClose={() => setActiveCommentPost(null)} 
          onCommentAdded={() => queryClient.invalidateQueries({ queryKey: ['feed'] })}
        />
      )}
      {activeSharePost && (
        <ShareModal 
          postId={activeSharePost} 
          onClose={() => setActiveSharePost(null)} 
        />
      )}
      {activeDetailPost && (
        <PostDetailModal 
          post={activeDetailPost} 
          onClose={() => setActiveDetailPost(null)} 
          onUpdate={() => queryClient.invalidateQueries({ queryKey: ['feed'] })}
        />
      )}
    </div>
  );
};

export default FeedPage;
