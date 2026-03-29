import React, { useState } from 'react';
import { X, ShieldAlert, UserMinus, ChevronLeft, AlertCircle, Image as ImageIcon } from 'lucide-react';
import api from '../services/api';
import '../styles/Settings.css';

interface ProfileOptionsModalProps {
  user: any;
  onClose: () => void;
  onBlockSuccess?: () => void;
}

const ProfileOptionsModal: React.FC<ProfileOptionsModalProps> = ({ user, onClose, onBlockSuccess }) => {
  const [activeView, setActiveView] = useState<'main' | 'report'>('main');
  const [reportReason, setReportReason] = useState('Spam');
  const [reportDetails, setReportDetails] = useState('');
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const handleBlock = async () => {
    if (window.confirm(`Are you sure you want to block @${user.userid}? They won't be able to find your profile, posts or story on SocialVerse.`)) {
      try {
        await api.post(`/users/block/${user._id}`);
        if(onBlockSuccess) onBlockSuccess();
        onClose();
      } catch (err) {
        console.error('Failed to block user', err);
        alert('Failed to block user. Please try again.');
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setScreenshot(base64String);
        setPreview(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post('/users/report', { 
        targetId: user._id, 
        reason: `${reportReason}${reportDetails ? ` - ${reportDetails}` : ''}`,
        screenshot
      });
      setMessage('Report submitted successfully with evidence. We will review this shortly.');
      setTimeout(() => onClose(), 2000);
    } catch (err) {
      console.error('Failed to report user', err);
      setMessage('Failed to submit report.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderMainView = () => (
    <>
      <div className="settings-header" style={{ padding: '15px 20px' }}>
        <h2 style={{ fontSize: '1rem', justifyContent: 'center', width: '100%', paddingLeft: '24px' }}>Options</h2>
        <button onClick={onClose} style={{ position: 'absolute', right: '15px' }}><X size={20} /></button>
      </div>
      <div className="options-body">
        <button className="option-btn danger" onClick={() => setActiveView('report')}>
          <ShieldAlert size={18} />
          Report
        </button>
        <button className="option-btn danger" onClick={handleBlock}>
          <UserMinus size={18} />
          Block
        </button>
        <button className="option-btn" onClick={onClose}>
          Cancel
        </button>
      </div>
    </>
  );

  const renderReportView = () => (
    <>
      <div className="settings-header" style={{ padding: '15px 20px' }}>
        <button onClick={() => setActiveView('main')}><ChevronLeft size={20} /></button>
        <h2 style={{ fontSize: '1rem', flex: 1, textAlign: 'center' }}>Report User</h2>
        <button onClick={onClose} style={{ visibility: 'hidden' }}><X size={20} /></button>
      </div>
      
      {message ? (
        <div style={{ padding: '30px 20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <AlertCircle size={40} style={{ color: '#10b981', margin: '0 auto 15px' }} />
          <p>{message}</p>
        </div>
      ) : (
        <form className="report-form" onSubmit={handleReport}>
          <div>
            <label>Why are you reporting this user?</label>
            <select value={reportReason} onChange={e => setReportReason(e.target.value)} required style={{ marginTop: '8px' }}>
              <option value="Spam">It's spam</option>
              <option value="Nudity or sexual activity">Nudity or sexual activity</option>
              <option value="Hate speech or symbols">Hate speech or symbols</option>
              <option value="Violence or dangerous organizations">Violence or dangerous organizations</option>
              <option value="Bullying or harassment">Bullying or harassment</option>
              <option value="Scam or fraud">Scam or fraud</option>
              <option value="False information">False information</option>
              <option value="Just don't like it">I just don't like it</option>
            </select>
          </div>
          <div>
            <label>Additional Details (optional)</label>
            <textarea 
              placeholder="Provide more detail to help us understand the issue..."
              value={reportDetails}
              onChange={e => setReportDetails(e.target.value)}
              style={{ marginTop: '8px' }}
            />
          </div>
          <div style={{ marginTop: '15px' }}>
            <label>Evidence (Upload Screenshot)</label>
            <div style={{ 
              width: '100%', 
              padding: '12px', 
              borderRadius: '8px', 
              background: 'rgba(255,255,255,0.05)', 
              border: '1px dotted rgba(255,255,255,0.2)', 
              color: '#fff',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '10px',
              cursor: 'pointer',
              position: 'relative',
              marginTop: '8px'
            }}>
              <input 
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                style={{ 
                  position: 'absolute', 
                  top: 0, 
                  left: 0, 
                  width: '100%', 
                  height: '100%', 
                  opacity: 0, 
                  cursor: 'pointer' 
                }}
              />
              {preview ? (
                <img src={preview} alt="Preview" style={{ width: '100%', maxHeight: '150px', objectFit: 'contain', borderRadius: '4px' }} />
              ) : (
                <>
                  <ImageIcon size={24} style={{ opacity: 0.5 }} />
                  <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>Click to upload screenshot</span>
                </>
              )}
            </div>
          </div>
          <button 
            type="submit" 
            className="btn-primary" 
            style={{ width: '100%', padding: '12px', borderRadius: '8px', marginTop: '10px' }}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Report'}
          </button>
        </form>
      )}
    </>
  );

  return (
    <div className="modal-overlay animate-fade-pure" style={{ zIndex: 9999, pointerEvents: 'auto' }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="options-modal-content animate-scale" onClick={e => e.stopPropagation()}>
        {activeView === 'main' && renderMainView()}
        {activeView === 'report' && renderReportView()}
      </div>
    </div>
  );
};

export default ProfileOptionsModal;
