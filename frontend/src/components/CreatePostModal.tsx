import React, { useState, useRef } from 'react';
import { X, Image as ImageIcon, Video as VideoIcon, FileText, Trash2 } from 'lucide-react';
import api from '../services/api';
import '../styles/Auth.css';

interface CreatePostModalProps {
  onClose: () => void;
  onPostCreated: () => void;
}

const CreatePostModal: React.FC<CreatePostModalProps> = ({ onClose, onPostCreated }) => {
  const [type, setType] = useState<'Image' | 'Video' | 'Blog'>('Image');
  const [content, setContent] = useState('');
  const [caption, setCaption] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (type === 'Image' && !file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }
    if (type === 'Video' && !file.type.startsWith('video/')) {
      setError('Please select a video file');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setContent(reader.result as string);
      setError('');
    };
    reader.readAsDataURL(file);
  };

  const handlePost = async () => {
    if (!content.trim()) return;
    setLoading(true);
    setError('');

    try {
      await api.post('/posts', {
        type: type === 'Video' ? 'Video' : type,
        content,
        caption,
        hashtags: caption.match(/#[a-z0-9_]+/gi) || []
      });
      onPostCreated();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay animate-fade-in" style={{ zIndex: 1200 }}>
      <div className="edit-profile-modal animate-scale" style={{ maxWidth: '600px', height: '85vh', borderRadius: '20px', display: 'flex', flexDirection: 'column', background: 'white', overflow: 'hidden' }}>
        <div className="modal-header" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #efefef' }}>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '5px' }}><X size={24} /></button>
          <h2 style={{ fontSize: '1rem', fontWeight: 700 }}>Create New Post</h2>
          <button 
            onClick={handlePost} 
            disabled={loading || !content} 
            style={{ 
              background: 'none', 
              border: 'none', 
              color: (loading || !content) ? '#b2dffc' : '#0095f6', 
              fontWeight: 700, 
              fontSize: '0.9rem',
              cursor: (loading || !content) ? 'default' : 'pointer'
            }}
          >
            {loading ? 'Sharing...' : 'Share'}
          </button>
        </div>

        <div className="edit-form" style={{ flex: 1, overflowY: 'auto', padding: '0' }}>
          {error && <p style={{ color: '#ff3b30', fontSize: '0.85rem', padding: '15px', textAlign: 'center', margin: '0' }}>{error}</p>}
          
          <div className="type-selector" style={{ display: 'flex', borderBottom: '1px solid #efefef' }}>
            {[
              { id: 'Image', icon: <ImageIcon size={20} /> },
              { id: 'Video', icon: <VideoIcon size={20} />, label: 'Byte' },
              { id: 'Blog', icon: <FileText size={20} /> }
            ].map(t => (
              <button 
                key={t.id}
                onClick={() => {
                  setType(t.id as any);
                  setContent('');
                  setError('');
                }}
                className={`tab-item ${type === t.id ? 'active' : ''}`}
                style={{ 
                  flex: 1, 
                  height: '50px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: '8px',
                  background: 'none',
                  border: 'none',
                  borderBottom: type === t.id ? '2px solid #262626' : 'none',
                  color: type === t.id ? '#262626' : '#8e8e8e',
                  fontSize: '0.85rem',
                  fontWeight: type === t.id ? 600 : 400,
                  cursor: 'pointer'
                }}
              >
                {t.icon}
                <span>{t.label || t.id}</span>
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {type !== 'Blog' ? (
              <div style={{ width: '100%', aspectRatio: '1/1', background: '#fafafa', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                {content ? (
                  <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                    {type === 'Image' ? (
                      <img src={content} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <video src={content} style={{ width: '100%', height: '100%', objectFit: 'cover' }} autoPlay muted loop />
                    )}
                    <button 
                      onClick={() => setContent('')}
                      style={{ 
                        position: 'absolute', 
                        top: '15px', 
                        right: '15px', 
                        background: 'rgba(0,0,0,0.7)', 
                        color: 'white', 
                        border: 'none', 
                        borderRadius: '50%', 
                        width: '32px', 
                        height: '32px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        cursor: 'pointer'
                      }}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ) : (
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    style={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center', 
                      gap: '15px', 
                      cursor: 'pointer',
                      padding: '40px',
                      textAlign: 'center'
                    }}
                  >
                    <div style={{ width: '96px', height: '77px', position: 'relative' }}>
                      <ImageIcon size={48} color="#262626" style={{ position: 'absolute', top: 0, left: 0 }} />
                      <VideoIcon size={48} color="#262626" style={{ position: 'absolute', bottom: 0, right: 0, opacity: 0.5 }} />
                    </div>
                    <p style={{ fontSize: '1.25rem', color: '#262626', fontWeight: 300 }}>Select photos and videos here</p>
                    <button style={{ background: '#0095f6', color: 'white', border: 'none', padding: '7px 16px', borderRadius: '8px', fontWeight: 600, fontSize: '0.9rem' }}>
                      Select from computer
                    </button>
                  </div>
                )}
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  style={{ display: 'none' }} 
                  onChange={handleFileChange}
                  accept={type === 'Image' ? 'image/*' : 'video/*'}
                />
              </div>
            ) : (
              <div style={{ padding: '20px' }}>
                <textarea 
                  placeholder="What's your story today?"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  style={{ 
                    width: '100%', 
                    height: '250px', 
                    padding: '0', 
                    border: 'none',
                    outline: 'none',
                    fontSize: '1rem',
                    lineHeight: '1.5',
                    resize: 'none',
                    color: '#262626'
                  }}
                />
              </div>
            )}

            <div style={{ padding: '16px', borderTop: '1px solid #efefef' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#eee', overflow: 'hidden' }}>
                   <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(localStorage.getItem('userid') || 'U')}&background=random`} style={{ width: '100%', height: '100%' }} />
                </div>
                <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{localStorage.getItem('userid')}</span>
              </div>
              <textarea 
                placeholder="Write a caption..."
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                style={{ 
                  width: '100%', 
                  height: '100px', 
                  padding: '0', 
                  border: 'none',
                  outline: 'none',
                  fontSize: '0.95rem',
                  lineHeight: '1.4',
                  resize: 'none',
                  color: '#262626'
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatePostModal;
