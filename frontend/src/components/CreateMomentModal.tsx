import React, { useState, useRef, useEffect } from 'react';
import { X, Camera, Type, AtSign, Trash2 } from 'lucide-react';
import api from '../services/api';

interface Overlay {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
  fontSize: number;
  isMention: boolean;
  mentionedUserId?: string;
  style: 'plain' | 'background';
  fontFamily: 'Modern' | 'Classic' | 'Neon' | 'Typewriter' | 'Strong';
}

interface CreateMomentModalProps {
  onClose: () => void;
  onMomentCreated: () => void;
}

const COLORS = ['#FFFFFF', '#000000', '#FF3B30', '#FF9500', '#FFCC00', '#4CD964', '#5AC8FA', '#007AFF', '#5856D6', '#FF2D55'];
const FONTS = {
  Modern: "'Inter', sans-serif",
  Classic: "'Playfair Display', serif",
  Neon: "'Pacifico', cursive",
  Typewriter: "'Space Mono', monospace",
  Strong: "'Anton', sans-serif"
};

interface MediaItem {
  id: string;
  content: string;
  type: 'image' | 'video';
  overlays: Overlay[];
}

const CreateMomentModal: React.FC<CreateMomentModalProps> = ({ onClose, onMomentCreated }) => {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [editingOverlayId, setEditingOverlayId] = useState<string | null>(null);
  const [inputText, setInputText] = useState('');
  const [isMentionMode, setIsMentionMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const FONT_LABELS = { Modern: 'Modern', Classic: 'Classic', Neon: 'Neon', Typewriter: 'Typewriter', Strong: 'Strong' };

  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textInputRef = useRef<HTMLInputElement>(null);

  const currentItem = mediaItems[activeIndex];

  // Sync inputText for mentions
  useEffect(() => {
    if (isMentionMode && inputText.startsWith('@')) {
      setSearchQuery(inputText.slice(1));
    } else {
      setSearchQuery('');
    }
  }, [inputText, isMentionMode]);

  useEffect(() => {
    const searchUsers = async () => {
      if (searchQuery.length > 1) {
        try {
          const res = await api.get(`/users/search?q=${searchQuery}`);
          setSearchResults(res.data);
        } catch (e) { console.error(e); }
      } else {
        setSearchResults([]);
      }
    };
    const timer = setTimeout(searchUsers, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach(file => {
      const type = file.type.startsWith('video/') ? 'video' as const : 'image' as const;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const newItem: MediaItem = {
          id: Math.random().toString(36).substr(2, 9),
          content: ev.target?.result as string,
          type,
          overlays: []
        };
        setMediaItems(prev => [...prev, newItem]);
        if (mediaItems.length === 0) setActiveIndex(0);
      };
      reader.readAsDataURL(file);
    });
    // Reset input
    e.target.value = '';
  };

  const addOverlay = (isMention = false) => {
    if (!currentItem) return;
    const id = Math.random().toString(36).substr(2, 9);
    const newOverlay: Overlay = {
      id,
      text: isMention ? '@' : '',
      x: 50,
      y: 50,
      color: '#FFFFFF',
      fontSize: 28,
      isMention,
      style: 'background',
      fontFamily: 'Modern'
    };
    
    setMediaItems(mediaItems.map((item, i) => 
      i === activeIndex ? { ...item, overlays: [...item.overlays, newOverlay] } : item
    ));
    
    setEditingOverlayId(id);
    setInputText(newOverlay.text);
    setIsMentionMode(isMention);
  };

  const updateOverlayText = (text: string) => {
    setInputText(text);
    setMediaItems(mediaItems.map((item, i) => 
      i === activeIndex ? { 
        ...item, 
        overlays: item.overlays.map(o => o.id === editingOverlayId ? { ...o, text } : o) 
      } : item
    ));
  };

  const updateOverlayStyle = (id: string, updates: Partial<Overlay>) => {
    setMediaItems(mediaItems.map((item, i) => 
      i === activeIndex ? { 
        ...item, 
        overlays: item.overlays.map(o => o.id === id ? { ...o, ...updates } : o) 
      } : item
    ));
  };

  const removeOverlay = (id: string) => {
    setMediaItems(mediaItems.map((item, i) => 
      i === activeIndex ? { 
        ...item, 
        overlays: item.overlays.filter(o => o.id !== id) 
      } : item
    ));
    setEditingOverlayId(null);
  };

  const selectMention = (user: any) => {
    setMediaItems(mediaItems.map((item, i) => 
      i === activeIndex ? { 
        ...item, 
        overlays: item.overlays.map(o => o.id === editingOverlayId ? { ...o, text: `@${user.userid}`, mentionedUserId: user._id } : o) 
      } : item
    ));
    setEditingOverlayId(null);
  };

  const handleDragStart = (e: any, id: string) => {
    if (editingOverlayId) return;
    setDraggingId(id);
    e.stopPropagation();
  };

  const handleDrag = (e: any) => {
    if (!draggingId || !editorRef.current || !currentItem) return;
    
    const rect = editorRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;

    setMediaItems(mediaItems.map((item, i) => 
      i === activeIndex ? { 
        ...item, 
        overlays: item.overlays.map(o => o.id === draggingId ? { ...o, x, y } : o) 
      } : item
    ));
  };

  const handleDragEnd = () => setDraggingId(null);

  const handlePost = async () => {
    if (mediaItems.length === 0) return;
    setLoading(true);
    try {
      for (const item of mediaItems) {
        const mentions = item.overlays.filter(o => o.isMention && o.mentionedUserId).map(o => o.mentionedUserId);
        await api.post('/moments', {
          media: item.content,
          type: item.type,
          overlayData: JSON.stringify(item.overlays),
          mentions
        });
      }
      onMomentCreated();
      onClose();
    } catch (error) {
      console.error('Failed to create moments:', error);
      alert('Failed to post one or more moments. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const currentEditingOverlay = currentItem?.overlays.find(o => o.id === editingOverlayId);

  return (
    <div className="modal-overlay animate-fade-in" style={{ zIndex: 4000, background: '#000', position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="animate-scale" style={{ width: '100%', maxWidth: '480px', height: '100%', maxHeight: '100dvh', background: '#111', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
        
        {/* Top Header */}
        {!editingOverlayId && (
          <div style={{ padding: '24px 20px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, transparent 100%)', position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100 }}>
            <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', cursor: 'pointer', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)' }}><X size={24} /></button>
            <span style={{ color: 'white', fontWeight: 800, fontSize: '1.1rem', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>New Moments ({mediaItems.length})</span>
            <button 
              onClick={handlePost} 
              disabled={loading || mediaItems.length === 0} 
              style={{ 
                background: mediaItems.length > 0 ? 'linear-gradient(135deg, #6366f1, #a855f7)' : 'rgba(255,255,255,0.1)', 
                border: 'none', 
                color: 'white', 
                fontWeight: 800, 
                cursor: mediaItems.length > 0 ? 'pointer' : 'default',
                padding: '10px 24px',
                borderRadius: '25px',
                fontSize: '0.95rem',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: mediaItems.length > 0 ? '0 10px 20px -5px rgba(99, 102, 241, 0.5)' : 'none'
              }}
            >
              {loading ? 'Posting...' : 'Share'}
            </button>
          </div>
        )}

        {/* Editor Canvas */}
        <div 
          ref={editorRef}
          onMouseMove={handleDrag}
          onMouseUp={handleDragEnd}
          onTouchMove={handleDrag}
          onTouchEnd={handleDragEnd}
          style={{ flex: 1, width: '100%', position: 'relative', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}
        >
          {currentItem ? (
            <>
              {currentItem.type === 'image' ? (
                <img src={currentItem.content} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <video src={currentItem.content} style={{ width: '100%', height: '100%', objectFit: 'cover' }} autoPlay loop muted playsInline />
              )}
              
              {currentItem.overlays.map((o) => (
                <div
                  key={o.id}
                  onMouseDown={(e) => handleDragStart(e, o.id)}
                  onTouchStart={(e) => handleDragStart(e, o.id)}
                  onClick={() => { setEditingOverlayId(o.id); setInputText(o.text); setIsMentionMode(o.isMention); }}
                  style={{
                    position: 'absolute',
                    left: `${o.x}%`,
                    top: `${o.y}%`,
                    transform: draggingId === o.id ? 'translate(-50%, -50%) scale(1.1)' : 'translate(-50%, -50%)',
                    color: o.style === 'background' ? (o.color === '#FFFFFF' ? '#000' : '#FFF') : o.color,
                    fontSize: `${o.fontSize * 1.2}px`,
                    fontFamily: FONTS[o.fontFamily as keyof typeof FONTS],
                    fontWeight: o.fontFamily === 'Modern' || o.fontFamily === 'Strong' ? '900' : '700',
                    cursor: draggingId === o.id ? 'grabbing' : 'grab',
                    padding: '12px 20px',
                    borderRadius: o.fontFamily === 'Neon' ? '40px' : '10px',
                    background: o.style === 'background' ? o.color : 'transparent',
                    backdropFilter: 'none',
                    boxShadow: o.style === 'plain' ? '0 2px 8px rgba(0,0,0,0.5)' : 'none',
                    userSelect: 'none',
                    zIndex: editingOverlayId === o.id ? 1000 : 10,
                    textShadow: o.style === 'plain' ? '0 4px 12px rgba(0,0,0,0.8)' : 'none',
                    transition: draggingId === o.id ? 'none' : 'all 0.2s',
                    border: 'none'
                  }}
                >
                  {o.text || 'Type...'}
                </div>
              ))}

              {!editingOverlayId && (
                <div style={{ position: 'absolute', top: '100px', right: '20px', display: 'flex', flexDirection: 'column', gap: '20px', zIndex: 150 }}>
                  <button onClick={() => addOverlay(false)} style={{ width: '52px', height: '52px', borderRadius: '18px', background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(15px)', border: '1px solid rgba(255,255,255,0.3)', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Type size={28} />
                  </button>
                  <button onClick={() => addOverlay(true)} style={{ width: '52px', height: '52px', borderRadius: '18px', background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(15px)', border: '1px solid rgba(255,255,255,0.3)', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <AtSign size={28} />
                  </button>
                </div>
              )}
            </>
          ) : (
            <div onClick={() => fileInputRef.current?.click()} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '30px', cursor: 'pointer', color: 'white', padding: '40px' }}>
              <div style={{ width: '120px', height: '120px', background: 'rgba(255,255,255,0.05)', borderRadius: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px dashed rgba(255,255,255,0.2)' }}>
                <Camera size={56} />
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontWeight: 800, fontSize: '1.8rem', marginBottom: '8px' }}>Create Your Story</p>
                <p style={{ opacity: 0.5, fontSize: '1.1rem' }}>Select photos or videos</p>
              </div>
            </div>
          )}

          {editingOverlayId && currentEditingOverlay && (
            <div className="animate-fade-in" style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 2000, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              
              {/* Size Slider (Left) */}
              <div style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
                <div style={{ height: '200px', width: '6px', background: 'rgba(255,255,255,0.2)', borderRadius: '3px', position: 'relative' }}>
                  <input 
                    type="range"
                    min="12"
                    max="80"
                    step="1"
                    value={92 - currentEditingOverlay.fontSize}
                    onChange={(e) => updateOverlayStyle(editingOverlayId, { fontSize: 92 - parseInt(e.target.value) })}
                    style={{
                      writingMode: 'vertical-lr',
                      appearance: 'none',
                      width: '6px',
                      height: '200px',
                      background: 'none',
                      margin: 0,
                      cursor: 'pointer'
                    }}
                  />
                </div>
                <div style={{ color: 'white', fontSize: '10px', fontWeight: 800, opacity: 0.6 }}>SIZE</div>
              </div>

              <div style={{ width: '100%', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button 
                    onClick={() => {
                      const overlayIndex = currentItem.overlays.findIndex(o => o.id === editingOverlayId);
                      if (overlayIndex === -1) return;
                      const newStyle = currentItem.overlays[overlayIndex].style === 'plain' ? 'background' : 'plain';
                      updateOverlayStyle(editingOverlayId, { style: newStyle });
                    }}
                    style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', borderRadius: '12px', padding: '8px 16px', fontWeight: 800, cursor: 'pointer' }}
                  >A Style</button>
                  <button 
                    onClick={() => {
                      const fontKeys = Object.keys(FONTS) as (keyof typeof FONTS)[];
                      const currentIdx = fontKeys.indexOf(currentEditingOverlay?.fontFamily as any);
                      const nextFont = fontKeys[(currentIdx + 1) % fontKeys.length];
                      updateOverlayStyle(editingOverlayId, { fontFamily: nextFont });
                    }}
                    style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', borderRadius: '12px', padding: '8px 16px', fontWeight: 800, cursor: 'pointer' }}
                  >
                    {currentEditingOverlay ? FONT_LABELS[currentEditingOverlay.fontFamily as keyof typeof FONT_LABELS] : ''}
                  </button>
                </div>
                <button onClick={() => removeOverlay(editingOverlayId)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}><Trash2 size={24} /></button>
              </div>

              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', padding: '0 40px' }}>
                <input
                  ref={textInputRef}
                  value={inputText}
                  onChange={(e) => updateOverlayText(e.target.value)}
                  placeholder={isMentionMode ? 'Username...' : 'Type...'}
                  autoFocus
                  style={{ 
                    background: currentEditingOverlay.style === 'background' ? currentEditingOverlay.color : 'transparent', 
                    border: 'none', 
                    color: currentEditingOverlay.style === 'background' ? (currentEditingOverlay.color === '#FFFFFF' ? '#000' : '#FFF') : currentEditingOverlay.color, 
                    fontSize: `${currentEditingOverlay.fontSize * 1.5}px`, 
                    fontWeight: '900', 
                    textAlign: 'center', 
                    width: '100%', 
                    outline: 'none', 
                    padding: '16px',
                    borderRadius: currentEditingOverlay.fontFamily === 'Neon' ? '40px' : '12px',
                    fontFamily: FONTS[currentEditingOverlay.fontFamily as keyof typeof FONTS]
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && setEditingOverlayId(null)}
                />
              </div>

              {isMentionMode && searchQuery.length > 0 && searchResults.length > 0 && (
                <div style={{ width: '80%', maxHeight: '150px', background: '#222', borderRadius: '15px', marginBottom: '15px', overflowY: 'auto' }}>
                   {searchResults.map(user => (
                     <div key={user._id} onClick={() => selectMention(user)} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 15px', cursor: 'pointer', borderBottom: '1px solid #333' }}>
                        <img src={user.profilePic || `https://ui-avatars.com/api/?name=${user.userid}`} style={{ width: '30px', height: '30px', borderRadius: '50%' }} alt="" />
                        <span style={{ color: 'white', fontWeight: 700 }}>{user.userid}</span>
                     </div>
                   ))}
                </div>
              )}

              <div style={{ width: '100%', padding: '20px', display: 'flex', gap: '12px', overflowX: 'auto', borderTop: '1px solid #333' }}>
                {COLORS.map(c => (
                  <button key={c} onClick={() => updateOverlayStyle(editingOverlayId, { color: c })} style={{ width: '32px', height: '32px', borderRadius: '50%', background: c, border: currentEditingOverlay.color === c ? '3px solid white' : 'none', flexShrink: 0 }} />
                ))}
              </div>

              <div style={{ padding: '20px 20px 40px' }}>
                <button onClick={() => setEditingOverlayId(null)} style={{ background: 'white', color: 'black', border: 'none', borderRadius: '25px', padding: '10px 40px', fontWeight: 900, cursor: 'pointer' }}>Done</button>
              </div>
            </div>
          )}

          <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileChange} multiple accept="image/*,video/*" />
        </div>

        {/* Thumbnail Bar (Multi-Moment) */}
        {mediaItems.length > 0 && !editingOverlayId && (
          <div style={{ height: '80px', background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', gap: '12px', padding: '0 20px', overflowX: 'auto', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            {mediaItems.map((item, i) => (
              <div key={item.id} onClick={() => setActiveIndex(i)} style={{ position: 'relative', width: '50px', height: '50px', borderRadius: '10px', overflow: 'hidden', cursor: 'pointer', border: i === activeIndex ? '2px solid #6366f1' : 'none', flexShrink: 0 }}>
                {item.type === 'image' ? <img src={item.content} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <video src={item.content} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                {i === activeIndex && <div style={{ position: 'absolute', inset: 0, background: 'rgba(99, 102, 241, 0.2)' }} />}
              </div>
            ))}
            <button onClick={() => fileInputRef.current?.click()} style={{ width: '50px', height: '50px', borderRadius: '10px', background: 'rgba(255,255,255,0.1)', border: '1px dashed rgba(255,255,255,0.3)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Camera size={20} /></button>
          </div>
        )}
      </div>
      <style>{`
        input[type=range]::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          background: white;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 0 10px rgba(0,0,0,0.5);
        }
      `}</style>
    </div>
  );
};

export default CreateMomentModal;
