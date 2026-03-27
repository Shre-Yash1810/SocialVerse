import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Branding from '../components/Branding';
import { Camera } from 'lucide-react';
import api from '../services/api';
import '../styles/Auth.css';

const OnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState({
    profilePic: '',
    userId: '',
    username: '',
    pronouns: '',
    customPronouns: '',
    dob: ''
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfile({ ...profile, profilePic: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const email = sessionStorage.getItem('signup_email');
    const password = sessionStorage.getItem('signup_password');

    if (!email || !password) {
      setError('Signup session expired. Please go back and try again.');
      setLoading(false);
      return;
    }

    try {
      const finalPronouns = profile.pronouns === 'Custom' ? profile.customPronouns : profile.pronouns;
      const res = await api.post('/auth/register', {
        ...profile,
        pronouns: finalPronouns,
        name: profile.username,
        userid: profile.userId,
        email,
        password
      });

      localStorage.setItem('token', res.data.token);
      localStorage.setItem('userid', res.data.userid);
      localStorage.setItem('db_id', res.data._id);
      localStorage.setItem('profilePic', res.data.profilePic || '');
      sessionStorage.removeItem('signup_email');
      sessionStorage.removeItem('signup_password');
      navigate('/profile');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="onboarding-container animate-fade-in">
      <div className="onboarding-card glass">
        <Branding 
          size="medium" 
          subtitle="Let's personalize your space in the verse" 
        />

        {error && <div className="error-message" style={{ color: 'red', marginBottom: '15px', textAlign: 'center' }}>{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="profile-pic-upload" onClick={handleImageClick} style={{ cursor: 'pointer' }}>
            <div className="pic-placeholder">
              {profile.profilePic ? (
                <img src={profile.profilePic} alt="Profile preview" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
              ) : (
                <Camera size={32} color="var(--text-muted)" />
              )}
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Tap to upload profile picture</p>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept="image/*" 
              style={{ display: 'none' }} 
            />
          </div>

          <div className="input-group">
            <label htmlFor="userId">Handle (UserID)</label>
            <input 
              type="text" 
              id="userId"
              placeholder="@alex123"
              value={profile.userId}
              onChange={(e) => setProfile({ ...profile, userId: e.target.value.toLowerCase() })}
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="username">Username (Name)</label>
            <input 
              type="text" 
              id="username"
              placeholder="Alex Johnson"
              value={profile.username}
              onChange={(e) => setProfile({ ...profile, username: e.target.value })}
              required
            />
          </div>

          <div className="form-grid">
            <div className="input-group">
              <label htmlFor="pronouns">Pronouns</label>
              <select 
                id="pronouns"
                value={profile.pronouns}
                onChange={(e) => setProfile({ ...profile, pronouns: e.target.value })}
                style={{
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  background: 'white'
                }}
              >
                <option value="">Select Pronouns</option>
                <option value="he/him">he/him</option>
                <option value="she/her">she/her</option>
                <option value="they/them">they/them</option>
                <option value="Custom">Custom...</option>
              </select>
            </div>

            {profile.pronouns === 'Custom' && (
              <div className="input-group animate-fade-in">
                <label htmlFor="customPronouns">Custom Pronouns</label>
                <input 
                  type="text" 
                  id="customPronouns"
                  placeholder="e.g. ze/zir"
                  value={profile.customPronouns}
                  onChange={(e) => setProfile({ ...profile, customPronouns: e.target.value })}
                  required
                />
              </div>
            )}

            <div className="input-group">
              <label htmlFor="dob">Date of Birth</label>
              <input 
                type="date" 
                id="dob"
                value={profile.dob}
                onChange={(e) => setProfile({ ...profile, dob: e.target.value })}
                required
              />
            </div>
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Please wait...' : 'Complete'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default OnboardingPage;
