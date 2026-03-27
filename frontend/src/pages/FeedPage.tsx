import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, MessageCircle, Share2, Bookmark } from 'lucide-react';
import api from '../services/api';
import CommentsModal from '../components/CommentsModal';
import ShareModal from '../components/ShareModal';
import PostDetailModal from '../components/PostDetailModal';
import { formatRelativeTime } from '../utils/timeUtils';
import { FeedSkeleton } from '../components/Skeletons';
import Linkify from '../components/Linkify';
import '../styles/Feed.css';

interface Post {
  _id: string;
  author: { userid: string; name: string; profilePic: string };
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
  const videoRef = useRef<HTMLVideoElement>(null);
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
  const [posts, setPosts] = useState<Post[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(localStorage.getItem('db_id'));
  const [loading, setLoading] = useState(true);
  const [activeCommentPost, setActiveCommentPost] = useState<string | null>(null);
  const [activeSharePost, setActiveSharePost] = useState<string | null>(null);
  const [activeDetailPost, setActiveDetailPost] = useState<any | null>(null);
  const navigate = useNavigate();

  const fetchFeed = async () => {
    try {
      let myId = currentId;
      if (!myId) {
        const userRes = await api.get('/users/me');
        myId = userRes.data._id;
        localStorage.setItem('db_id', myId!);
        setCurrentId(myId);
      }

      const res = await api.get('/posts/feed');
      const feedData = res.data
        .filter((post: any) => post.type !== 'Blog')
        .map((post: any) => ({
        ...post,
        isLiked: post.likes?.some((id: any) => id.toString() === myId),
        isSaved: post.savedBy?.some((id: any) => id.toString() === myId)
      }));
      setPosts(feedData);
    } catch (err) {
      console.error('Failed to fetch feed', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeed();
  }, [currentId]);

  const handleLike = async (id: string) => {
    try {
      const res = await api.post(`/posts/${id}/like`);
      setPosts(posts.map(post => 
        post._id === id ? { ...post, isLiked: !post.isLiked, likes: res.data.likes } : post
      ));
    } catch (err) {
      console.error('Like failed', err);
    }
  };

  const handleSave = async (id: string) => {
    try {
      const res = await api.post(`/posts/${id}/save`);
      setPosts(posts.map(post => 
        post._id === id ? { ...post, isSaved: !post.isSaved, savedBy: res.data.savedBy } : post
      ));
    } catch (err) {
      console.error('Save failed', err);
    }
  };

  const handleShare = (id: string) => {
    setActiveSharePost(id);
  };

  const handleComment = (id: string) => {
    setActiveCommentPost(id);
  };

  if (loading) return <FeedSkeleton />;

  return (
    <div className="feed-page">
      <main className="feed-container">
        {posts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            <h3>No posts yet.</h3>
            <p>Be the first one to post in the verse!</p>
          </div>
        ) : (
          posts.map(post => (
            <article key={post._id} className="post-card">
              <div className="post-header" onClick={() => navigate(`/profile/${post.author.userid}`)} style={{ cursor: 'pointer' }}>
                <img src={post.author.profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(post.author.userid || post.author.name)}&background=random`} alt={post.author.name} className="post-avatar" />
                <div className="post-user-info">
                  <h4>{post.author.userid || post.author.name}</h4>
                  <p>{formatRelativeTime(post.createdAt)}</p>
                </div>
              </div>
              <div className="post-image-container" onClick={() => setActiveDetailPost(post)} style={{ cursor: 'pointer' }}>
                {post.type === 'Image' && <img src={post.content} alt="Post content" className="post-image" />}
                {post.type === 'Video' && <FeedVideo src={post.content} />}
              </div>
              <div className="post-actions">
                <Heart 
                  size={26} 
                  className={`icon-btn-action ${post.isLiked ? 'liked' : ''}`} 
                  onClick={() => handleLike(post._id)}
                />
                <MessageCircle 
                  size={26} 
                  className="icon-btn-action" 
                  onClick={() => handleComment(post._id)}
                />
                <Share2 
                  size={26} 
                  className="icon-btn-action" 
                  onClick={() => handleShare(post._id)}
                />
                <div style={{ marginLeft: 'auto' }}>
                  <Bookmark 
                    size={26} 
                    className={`icon-btn-action ${post.isSaved ? 'saved' : ''}`} 
                    onClick={() => handleSave(post._id)}
                  />
                </div>
              </div>
              <div className="post-content">
                <p><strong>{post.likes?.length || 0} likes</strong></p>
                <p className="post-caption">
                  <strong>{post.author.userid || post.author.name}</strong> <Linkify text={post.caption || ''} />
                </p>
                {post.commentsCount > 0 && (
                  <p 
                    style={{ fontSize: '0.85rem', color: 'var(--text-muted)', cursor: 'pointer', marginTop: '8px' }}
                    onClick={() => handleComment(post._id)}
                  >
                    View all {post.commentsCount} comments
                  </p>
                )}
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
          onCommentAdded={fetchFeed}
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
          onUpdate={fetchFeed}
        />
      )}
    </div>
  );
};

export default FeedPage;
