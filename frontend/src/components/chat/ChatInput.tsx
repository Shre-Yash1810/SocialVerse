import React, { useState, useRef } from 'react';
import { Send, Image, Smile } from 'lucide-react';

interface EmojiCategory {
  name: string;
  emojis: string[];
}

interface ChatInputProps {
  onSendMessage: (text: string) => void;
  onMediaSelect: (file: File) => void;
  isUploading: boolean;
  isPending: boolean;
  emojiCategories: EmojiCategory[];
}

const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  onMediaSelect,
  isUploading,
  isPending,
  emojiCategories
}) => {
  const [newMessage, setNewMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newMessage.trim()) return;
    onSendMessage(newMessage);
    setNewMessage('');
    setShowEmojiPicker(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onMediaSelect(file);
    }
  };

  return (
    <footer style={{ padding: '16px', background: 'rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(30px)', zIndex: 10, borderTop: '1px solid rgba(255, 255, 255, 0.1)', position: 'relative' }}>
      {showEmojiPicker && (
        <div style={{ position: 'absolute', bottom: '80px', left: '16px', right: '16px', maxWidth: '400px', background: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(30px)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '24px', padding: '16px', boxShadow: '0 20px 50px rgba(0,0,0,0.4)', zIndex: 100, maxHeight: '350px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {emojiCategories.map(cat => (
            <div key={cat.name}>
              <p style={{ margin: '0 0 8px 0', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', opacity: 0.5, color: 'white', letterSpacing: '0.05em' }}>{cat.name}</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: '8px' }}>
                {cat.emojis.map((emoji: string) => (
                  <button key={emoji} onClick={() => { setNewMessage(prev => prev + emoji); }} style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', padding: '4px', borderRadius: '8px', transition: 'transform 0.1s' }} className="emoji-btn">{emoji}</button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      <form onSubmit={handleSubmit} style={{ display: 'flex', alignItems: 'center', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '24px', padding: '4px 12px', border: '1px solid rgba(255, 255, 255, 0.2)', position: 'relative' }}>
        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*,video/*" style={{ display: 'none' }} />
        {isUploading && (
          <div style={{ position: 'absolute', top: '-40px', left: '50%', transform: 'translateX(-50%)', background: 'rgba(99, 102, 241, 0.9)', color: 'white', padding: '4px 12px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600 }}>
            Uploading...
          </div>
        )}
        <div style={{ display: 'flex', gap: '8px', marginRight: '8px', alignItems: 'center' }}>
          <Image size={22} onClick={() => fileInputRef.current?.click()} style={{ opacity: 0.7, cursor: 'pointer' }} />
          <Smile size={22} onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="desktop-only" style={{ opacity: 0.7, cursor: 'pointer', color: showEmojiPicker ? '#818cf8' : 'inherit' }} />
        </div>
        <input 
          type="text" 
          id="message-input" 
          name="message" 
          value={newMessage} 
          onChange={(e) => setNewMessage(e.target.value)} 
          onFocus={() => setShowEmojiPicker(false)} 
          placeholder="Explore the universe..." 
          style={{ flex: 1, background: 'transparent', border: 'none', color: 'white', padding: '10px 4px', outline: 'none', fontSize: '0.95rem' }} 
        />
        <button type="submit" disabled={!newMessage.trim() || isPending || isUploading} style={{ background: 'transparent', border: 'none', color: (newMessage.trim() && !isUploading) ? '#818cf8' : 'rgba(255,255,255,0.3)', fontWeight: 'bold', cursor: 'pointer', marginLeft: '8px' }}><Send size={24} /></button>
      </form>
    </footer>
  );
};

export default React.memo(ChatInput);
