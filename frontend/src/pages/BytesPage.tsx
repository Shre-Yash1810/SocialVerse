import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Heart, MessageCircle, Share2, MoreVertical, Music } from 'lucide-react';
import api from '../services/api';
import CommentsModal from '../components/CommentsModal';
import ShareModal from '../components/ShareModal';
import ContentOptionsModal from '../components/ContentOptionsModal';
import { formatRelativeTime } from '../utils/timeUtils';
import { useNavigate } from 'react-router-dom';
import { useByte } from '../context/ByteContext';
import { useUser } from '../context/UserContext';
import Linkify from '../components/Linkify';
import VerifiedBadge from '../components/VerifiedBadge';
import '../styles/Feed.css';

interface Reel {
  _id: string;
  author: { userid: string; name: string; profilePic: string; isVerified?: boolean };
  type: string;
  content: string;
  caption?: string;
  likes: string[];
  commentsCount: number;
  isLiked?: boolean;
  createdAt: string;
}

const BytePlayer: React.FC<{ 
  reel: Reel; 
  onLike: (id: string) => void; 
  onComment: (id: string) => void;
  onShare: (id: string) => void;
  onOptions: (id: string) => void;
  navigate: ReturnType<typeof useNavigate>;
}> = ({ reel, onLike, onComment, onShare, onOptions, navigate }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { setActiveByteId } = useByte();

  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
      },
      { threshold: 0.8 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isInView && videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(e => console.log("Auto-play blocked", e));
      setActiveByteId(reel._id);
    } else if (videoRef.current) {
      videoRef.current.pause();
    }
  }, [isInView, reel._id, setActiveByteId]);

  return (
    <div key={reel._id} ref={containerRef} className="reel-item">
      <div className="reel-video-wrapper">
        {reel.content.startsWith('http') ? (
          <video 
            ref={videoRef}
            src={reel.content} 
            className="reel-video" 
            loop 
            muted 
            playsInline
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div style={{ 
            width: '100%', 
            height: '100%', 
            background: 'linear-gradient(180deg, #1a1a1a 0%, #000 100%)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center' 
          }}>
            <div style={{ position: 'absolute', top: '15px', left: '15px', zIndex: 10 }}>
              <span style={{ color: '#333', fontSize: '2rem', fontWeight: 800 }}>SVERSE BYTES</span>
            </div>
          </div>
        )}

        <div className="reel-overlay">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', cursor: 'pointer' }} onClick={() => navigate(`/profile/${reel.author.userid}`)}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#444', border: '1px solid white', overflow: 'hidden' }}>
              <img src={reel.author.profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(reel.author.userid || reel.author.name)}&background=random`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontWeight: 600 }}>{reel.author.userid}</span>
              {reel.author.isVerified && <VerifiedBadge size={14} />}
            </div>
            <button 
              onClick={(e) => {
                e.stopPropagation();
              }}
              style={{ background: 'transparent', border: '1px solid white', color: 'white', padding: '4px 12px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600 }}
            >
              Follow
            </button>
          </div>
          <p style={{ fontSize: '0.9rem', marginBottom: '15px' }}>
            <Linkify text={reel.caption || ''} />
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', opacity: 0.9 }}>
            <Music size={14} />
            <span>Original Audio - {reel.author.userid}</span>
            <span style={{ fontSize: '0.7rem', opacity: 0.6 }}>• {formatRelativeTime(reel.createdAt)}</span>
          </div>
        </div>

        <div className="reel-actions-side">
          <div className="reel-action-btn" onClick={() => onLike(reel._id)}>
            <Heart size={30} className={reel.isLiked ? 'liked' : ''} fill={reel.isLiked ? '#ff3b30' : 'none'} color={reel.isLiked ? '#ff3b30' : 'white'} />
            <span>{reel.likes?.length || 0}</span>
          </div>
          <div className="reel-action-btn" onClick={() => onComment(reel._id)}>
            <MessageCircle size={30} color="white" />
            <span>{reel.commentsCount || 0}</span>
          </div>
          <div className="reel-action-btn" onClick={() => onShare(reel._id)}>
            <Share2 size={30} color="white" />
          </div>
          <div className="reel-action-btn" onClick={() => onOptions(reel._id)}>
            <MoreVertical size={30} color="white" />
          </div>
          <div style={{ width: '32px', height: '32px', borderRadius: '6px', border: '2px solid white', background: '#333', marginTop: '10px', overflow: 'hidden' }}>
            <img src={reel.author.profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(reel.author.userid || reel.author.name)}&background=random`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        </div>
      </div>
    </div>
  );
};

const BytesPage: React.FC = () => {
  const [reels, setReels] = useState<Reel[]>([]);
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [activeCommentPost, setActiveCommentPost] = useState<string | null>(null);
  const [activeSharePost, setActiveSharePost] = useState<string | null>(null);
  const [activeOptionsPost, setActiveOptionsPost] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const investigateId = searchParams.get('investigate');
    if (investigateId && reels.length > 0) {
      setTimeout(() => {
        const element = document.getElementById(`byte-${investigateId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 500);
    }
  }, [searchParams, reels]);

  const fetchReels = async () => {
    if (!user?._id) return;
    try {
      const res = await api.get('/posts/feed');
      const reelsData = res.data
        .filter((post: any) => post.type === 'Video')
        .map((reel: any) => ({
          ...reel,
          isLiked: reel.likes?.some((id: any) => id.toString() === user._id)
        }));
      setReels(reelsData);
    } catch (err) {
      console.error('Failed to fetch reels', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?._id) fetchReels();
  }, [user?._id]);

  const toggleLike = async (id: string) => {
    try {
      const res = await api.post(`/posts/${id}/like`);
      setReels(reels.map(reel => 
        reel._id === id ? { ...reel, isLiked: !reel.isLiked, likes: res.data.likes } : reel
      ));
    } catch (err) {
      console.error('Like failed', err);
    }
  };

  const handleComment = (id: string) => {
    setActiveCommentPost(id);
  };

  const handleShare = (id: string) => {
    setActiveSharePost(id);
  };

  const handleOptions = (id: string) => {
    setActiveOptionsPost(id);
  };

  if (loading) return <div className="loading-screen">Loading Bytes...</div>;

  return (
    <div className="reels-page">
      <main className="reels-container">
        {reels.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'white', marginTop: '50vh', transform: 'translateY(-50%)' }}>
             <h3>No bytes found.</h3>
             <p style={{ opacity: 0.7 }}>Be the first to create a byte!</p>
            </div>
        ) : (
          reels.map(reel => (
            <div id={`byte-${reel._id}`} key={reel._id}>
              <BytePlayer 
                reel={reel} 
                onLike={toggleLike} 
                onComment={handleComment} 
                onShare={handleShare}
                onOptions={handleOptions}
                navigate={navigate}
              />
            </div>
          ))
        )}
      </main>
      {activeCommentPost && (
        <CommentsModal 
          postId={activeCommentPost} 
          post={reels.find(r => r._id === activeCommentPost) as any}
          onClose={() => setActiveCommentPost(null)} 
          onCommentAdded={fetchReels}
        />
      )}
      {activeSharePost && (
        <ShareModal 
          postId={activeSharePost} 
          onClose={() => setActiveSharePost(null)} 
        />
      )}
      {activeOptionsPost && (
        <ContentOptionsModal 
          contentId={activeOptionsPost} 
          contentType="post" 
          onClose={() => setActiveOptionsPost(null)} 
        />
      )}
    </div>
  );
};

export default BytesPage;
