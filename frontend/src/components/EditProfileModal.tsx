import React, { useState, useRef } from 'react';
import { X, Camera, Check } from 'lucide-react';
import api from '../services/api';

interface EditProfileModalProps {
  user: any;
  onClose: () => void;
  onUpdate: (updatedUser: any) => void;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({ user, onClose, onUpdate }) => {
  const [formData, setFormData] = useState({
    name: user.name,
    bio: user.bio,
    pronouns: user.pronouns.includes('/') ? user.pronouns : (['he/him', 'she/her', 'they/them'].includes(user.pronouns) ? user.pronouns : 'Custom'),
    customPronouns: !['he/him', 'she/her', 'they/them', ''].includes(user.pronouns) ? user.pronouns : '',
    profilePic: user.profilePic,
    isPrivate: user.isPrivate || false
  });

  const [loading, setLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState(user.profilePic);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
        setFormData({ ...formData, profilePic: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const finalPronouns = formData.pronouns === 'Custom' ? formData.customPronouns : formData.pronouns;
    
    try {
      const res = await api.put('/users/profile', {
        ...formData,
        pronouns: finalPronouns
      });
      onUpdate(res.data.user);
      onClose();
    } catch (err) {
      console.error('Update failed', err);
      alert('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay animate-fade-in" onClick={onClose}>
      <div className="edit-profile-modal animate-scale" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <button className="close-btn" onClick={onClose}><X size={24} /></button>
          <h2>Edit Profile</h2>
          <button className="save-btn" onClick={handleSubmit} disabled={loading}>
            {loading ? '...' : <Check size={24} color="var(--primary)" />}
          </button>
        </div>

        <form className="edit-form" onSubmit={handleSubmit}>
          <div className="edit-pic-section">
            <div className="edit-pic-wrapper" onClick={() => fileInputRef.current?.click()}>
              {previewImage ? (
                <img src={previewImage} alt="Profile" />
              ) : (
                <div className="edit-pic-placeholder"><Camera size={30} /></div>
              )}
              <div className="edit-pic-overlay"><Camera size={20} /></div>
            </div>
            <button type="button" className="change-pic-text" onClick={() => fileInputRef.current?.click()}>
              Change profile photo
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              onChange={handleImageChange}
              accept="image/*"
            />
          </div>

          <div className="edit-input-group">
            <label>Name</label>
            <input 
              type="text" 
              value={formData.name} 
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="Your name"
            />
          </div>

          <div className="edit-input-group">
            <label>Bio</label>
            <textarea 
              value={formData.bio} 
              onChange={e => setFormData({ ...formData, bio: e.target.value })}
              placeholder="Write something about yourself..."
              rows={3}
            />
          </div>

          <div className="edit-input-group">
            <label>Pronouns</label>
            <select 
              value={formData.pronouns} 
              onChange={e => setFormData({ ...formData, pronouns: e.target.value })}
            >
              <option value="">None</option>
              <option value="he/him">he/him</option>
              <option value="she/her">she/her</option>
              <option value="they/them">they/them</option>
              <option value="Custom">Custom...</option>
            </select>
          </div>

          {formData.pronouns === 'Custom' && (
            <div className="edit-input-group animate-fade-in">
              <label>Custom Pronouns</label>
              <input 
                type="text" 
                value={formData.customPronouns} 
                onChange={e => setFormData({ ...formData, customPronouns: e.target.value })}
                placeholder="e.g. ze/zir"
              />
            </div>
          )}

          <div className="edit-toggle-group">
            <div className="toggle-label">
              <span>Private Account</span>
              <p>When your account is private, only people you approve can see your photos and videos.</p>
            </div>
            <label className="switch">
              <input 
                type="checkbox" 
                checked={formData.isPrivate} 
                onChange={e => setFormData({ ...formData, isPrivate: e.target.checked })}
              />
              <span className="slider round"></span>
            </label>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfileModal;
