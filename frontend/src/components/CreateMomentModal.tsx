import React, { useState, useRef } from 'react';
import { X, Camera } from 'lucide-react';
import api from '../services/api';

interface CreateMomentModalProps {
  onClose: () => void;
  onMomentCreated: () => void;
}

const CreateMomentModal: React.FC<CreateMomentModalProps> = ({ onClose, onMomentCreated }) => {
  const [content, setContent] = useState('');
  const [momentType, setMomentType] = useState<'image' | 'video'>('image');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type.startsWith('video/')) setMomentType('video');
    else setMomentType('image');

    const reader = new FileReader();
    reader.onloadend = () => {
      setContent(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handlePost = async () => {
    if (!content.trim()) return;
    setLoading(true);

    try {
      await api.post('/moments', {
        type: momentType,
        media: content
      });
      onMomentCreated();
      onClose();
    } catch (err) {
      console.error('Failed to create moment', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay animate-fade-in" style={{ zIndex: 2000 }}>
      <div className="animate-scale" style={{ width: '100%', maxWidth: '400px', background: '#000', borderRadius: '16px', overflow: 'hidden' }}>
        <div style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #333' }}>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}><X size={24} /></button>
          <span style={{ color: 'white', fontWeight: 600 }}>Create Moment</span>
          <button 
            onClick={handlePost} 
            disabled={loading || !content} 
            style={{ background: 'none', border: 'none', color: content ? '#0095f6' : '#555', fontWeight: 700, cursor: content ? 'pointer' : 'default' }}
          >
            {loading ? '...' : 'Share'}
          </button>
        </div>

        <div style={{ height: '500px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#111', position: 'relative' }}>
          {content ? (
            momentType === 'image' ? (
              <img src={content} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            ) : (
              <video src={content} style={{ width: '100%', height: '100%', objectFit: 'contain' }} autoPlay loop muted playsInline />
            )
          ) : (
            <div onClick={() => fileInputRef.current?.click()} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', cursor: 'pointer' }}>
              <div style={{ padding: '20px', background: '#222', borderRadius: '50%' }}>
                <Camera size={40} color="white" />
              </div>
              <span style={{ color: '#aaa', fontSize: '0.9rem' }}>Tap to select photo</span>
            </div>
          )}
          <input 
            type="file" 
            ref={fileInputRef} 
            style={{ display: 'none' }} 
            onChange={handleFileChange}
            accept="image/*,video/mp4,video/webm,video/quicktime"
          />
        </div>
      </div>
    </div>
  );
};

export default CreateMomentModal;
