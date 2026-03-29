import React, { useState } from 'react';
import { X, ShieldAlert, ChevronLeft, AlertCircle, Image as ImageIcon } from 'lucide-react';
import ReactDOM from 'react-dom';
import api from '../services/api';
import '../styles/Settings.css';
import '../styles/Modals.css';

interface ContentOptionsModalProps {
  contentId: string;
  contentType: 'post' | 'blog' | 'moment';
  onClose: () => void;
}

const ContentOptionsModal: React.FC<ContentOptionsModalProps> = ({ contentId, contentType, onClose }) => {
  const [activeView, setActiveView] = useState<'main' | 'report'>('main');
  const [reportReason, setReportReason] = useState('Spam');
  const [reportDetails, setReportDetails] = useState('');
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');

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
      await api.post('/posts/report', { 
        targetId: contentId, 
        targetType: contentType,
        reason: `${reportReason}${reportDetails ? ` - ${reportDetails}` : ''}`,
        screenshot
      });
      setMessage('Report submitted successfully with evidence. We will review this shortly.');
      setTimeout(() => onClose(), 2000);
    } catch (err) {
      console.error('Failed to report content', err);
      setMessage('Failed to submit report.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderMainView = () => (
    <>
      <div className="settings-header" style={{ padding: '15px 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', borderBottom: '1px solid var(--border-color)' }}>
        <h2 style={{ fontSize: '1rem', margin: 0 }}>Options</h2>
        <button onClick={onClose} style={{ position: 'absolute', right: '15px', background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer' }}>
          <X size={20} />
        </button>
      </div>
      <div className="options-body">
        <button className="option-btn danger" onClick={() => setActiveView('report')}>
          <ShieldAlert size={18} />
          Report {contentType.charAt(0).toUpperCase() + contentType.slice(1)}
        </button>
        <button className="option-btn" onClick={onClose}>
          Cancel
        </button>
      </div>
    </>
  );

  const renderReportView = () => (
    <>
      <div className="settings-header" style={{ padding: '15px 20px', display: 'flex', alignItems: 'center', borderBottom: '1px solid var(--border-color)' }}>
        <button onClick={() => setActiveView('main')} style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', display: 'flex' }}><ChevronLeft size={20} /></button>
        <h2 style={{ fontSize: '1rem', flex: 1, textAlign: 'center', margin: 0 }}>Report {contentType}</h2>
        <div style={{ width: '20px' }}></div>
      </div>
      
      {message ? (
        <div style={{ padding: '30px 20px', textAlign: 'center' }}>
          <AlertCircle size={40} style={{ color: message.includes('success') ? '#10b981' : '#ef4444', margin: '0 auto 15px' }} />
          <p style={{ color: 'var(--text-primary)' }}>{message}</p>
        </div>
      ) : (
        <form className="report-form" onSubmit={handleReport}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px' }}>Why are you reporting this?</label>
            <select value={reportReason} onChange={e => setReportReason(e.target.value)} required style={{ width: '100%' }}>
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
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px' }}>Details (optional)</label>
            <textarea 
              placeholder="Tell us more..."
              value={reportDetails}
              onChange={e => setReportDetails(e.target.value)}
              style={{ width: '100%', minHeight: '80px' }}
            />
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px' }}>Evidence (Upload Screenshot)</label>
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
              position: 'relative'
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
            style={{ 
              width: '100%', 
              padding: '15px', 
              borderRadius: '12px', 
              background: 'var(--primary)', 
              color: 'white', 
              border: 'none',
              fontSize: '1rem',
              fontWeight: 700,
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              opacity: isSubmitting ? 0.7 : 1,
              marginTop: '10px',
              boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2)'
            }}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Report'}
          </button>
        </form>
      )}
    </>
  );

  return ReactDOM.createPortal(
    <div className="modal-overlay animate-fade-pure" style={{ zIndex: 100000, pointerEvents: 'auto' }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="options-modal-content animate-scale" onClick={e => e.stopPropagation()}>
        {activeView === 'main' && renderMainView()}
        {activeView === 'report' && renderReportView()}
      </div>
    </div>,
    document.body
  );
};

export default ContentOptionsModal;
