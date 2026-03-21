import React, { useState, useEffect } from 'react';
import BottomNav from '../components/BottomNav';
import { Heart, MessageCircle, Share2, MoreVertical, Music } from 'lucide-react';
import api from '../services/api';
import CommentsModal from '../components/CommentsModal';
import ShareModal from '../components/ShareModal';
import { formatRelativeTime } from '../utils/timeUtils';
import { useNavigate } from 'react-router-dom';
import '../styles/Feed.css';

interface Reel {
  _id: string;
  author: { userid: string; name: string; profilePic: string };
  type: string;
  content: string;
  caption?: string;
  likes: string[];
  commentsCount: number;
  isLiked?: boolean;
  createdAt: string;
}

const BytesPage: React.FC = () => {
  const [reels, setReels] = useState<Reel[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(localStorage.getItem('db_id'));
  const [loading, setLoading] = useState(true);
  const [activeCommentPost, setActiveCommentPost] = useState<string | null>(null);
  const [activeSharePost, setActiveSharePost] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchReels = async () => {
    try {
      let myId = currentId;
      if (!myId) {
        const userRes = await api.get('/users/me');
        myId = userRes.data._id;
        localStorage.setItem('db_id', myId!);
        setCurrentId(myId);
      }

      const res = await api.get('/posts/feed');
      // Filter for videos/reels
      const reelsData = res.data
        .filter((post: any) => post.type === 'Video')
        .map((reel: any) => ({
          ...reel,
          isLiked: reel.likes?.some((id: any) => id.toString() === myId)
        }));
      setReels(reelsData);
    } catch (err) {
      console.error('Failed to fetch reels', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReels();
  }, [currentId]);

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
            <div key={reel._id} className="reel-item">
              <div className="reel-video-wrapper">
                {/* Use content URL for video if it's a real URL, otherwise placeholder */}
                {reel.content.startsWith('http') ? (
                  <video 
                    src={reel.content} 
                    className="reel-video" 
                    autoPlay 
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
                    <span style={{ fontWeight: 600 }}>{reel.author.userid || reel.author.name}</span>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        // Follow logic here
                      }}
                      style={{ background: 'transparent', border: '1px solid white', color: 'white', padding: '4px 12px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600 }}
                    >
                      Follow
                    </button>
                  </div>
                  <p style={{ fontSize: '0.9rem', marginBottom: '15px' }}>{reel.caption}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', opacity: 0.9 }}>
                    <Music size={14} />
                    <span>Original Audio - {reel.author.userid || reel.author.name}</span>
                    <span style={{ fontSize: '0.7rem', opacity: 0.6 }}>• {formatRelativeTime(reel.createdAt)}</span>
                  </div>
                </div>

                <div className="reel-actions-side">
                  <div className="reel-action-btn" onClick={() => toggleLike(reel._id)}>
                    <Heart size={30} className={reel.isLiked ? 'liked' : ''} fill={reel.isLiked ? '#ff3b30' : 'none'} color={reel.isLiked ? '#ff3b30' : 'white'} />
                    <span>{reel.likes?.length || 0}</span>
                  </div>
                  <div className="reel-action-btn" onClick={() => handleComment(reel._id)}>
                    <MessageCircle size={30} color="white" />
                    <span>{reel.commentsCount || 0}</span>
                  </div>
                  <div className="reel-action-btn" onClick={() => setActiveSharePost(reel._id)}>
                    <Share2 size={30} color="white" />
                  </div>
                  <div className="reel-action-btn">
                    <MoreVertical size={30} color="white" />
                  </div>
                  <div style={{ width: '32px', height: '32px', borderRadius: '6px', border: '2px solid white', background: '#333', marginTop: '10px', overflow: 'hidden' }}>
                    <img src={reel.author.profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(reel.author.userid || reel.author.name)}&background=random`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </main>
      <BottomNav />
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
    </div>
  );
};

export default BytesPage;
