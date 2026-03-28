import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { Navigation, Shield, FileText, ChevronRight, LogOut, Info, Lock, ChevronLeft, UserX } from 'lucide-react';
import api from '../services/api';
import '../styles/Settings.css';

const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'main' | 'privacy' | 'terms' | 'blocked' | 'account' | 'security' | 'about' | 'admin_rights'>('main');
  
  const [nearbyEnabled, setNearbyEnabled] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [blockedUsers, setBlockedUsers] = useState<any[]>([]);
  const [loadingBlocked, setLoadingBlocked] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.get('/users/me');
        setUser(res.data);
        setNearbyEnabled(res.data.isDiscoveryEnabled !== false);
      } catch (err) {
        console.error('Failed to fetch user', err);
        navigate('/auth');
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [navigate]);

  const handleToggleNearby = async () => {
    setIsUpdating(true);
    try {
      const newValue = !nearbyEnabled;
      setNearbyEnabled(newValue);
      await api.post('/discovery/toggle', { enabled: newValue });
    } catch (err) {
      console.error('Failed to toggle nearby share', err);
      setNearbyEnabled(!nearbyEnabled);
    } finally {
      setIsUpdating(false);
    }
  };

  const fetchBlockedUsers = async () => {
    setLoadingBlocked(true);
    try {
      const res = await api.get('/users/blocked');
      setBlockedUsers(res.data);
    } catch (err) {
      console.error('Failed to fetch blocked users', err);
    } finally {
      setLoadingBlocked(false);
    }
  };

  const handleUnblock = async (id: string) => {
    try {
      await api.delete(`/users/unblock/${id}`);
      setBlockedUsers(prev => prev.filter(u => u._id !== id));
    } catch (err) {
      console.error('Failed to unblock user', err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userid');
    navigate('/auth');
  };

  if (loading) return <div className="loading-screen">Loading Settings...</div>;

  const renderMainView = () => (
    <>
      <div className="settings-page-header">
        <button className="back-btn" onClick={() => navigate('/profile')}><ChevronLeft size={24} /></button>
        <h2>Settings</h2>
      </div>
      
      <div className="settings-page-body">
        <div className="settings-section">
          <div className="settings-section-title">Account</div>
          <div className="settings-item" onClick={() => setActiveView('account')}>
            <div className="settings-item-left">
              <Info size={20} className="settings-item-icon" />
              <div>
                <div style={{ fontWeight: 500 }}>Account Information</div>
                {user && <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{user.name} (@{user.userid})</div>}
              </div>
            </div>
            <div className="settings-item-right"><ChevronRight size={20} /></div>
          </div>
          <div className="settings-item" onClick={() => setActiveView('security')}>
            <div className="settings-item-left">
              <Lock size={20} className="settings-item-icon" />
              <span>Security</span>
            </div>
            <div className="settings-item-right"><ChevronRight size={20} /></div>
          </div>
        </div>

        <div className="settings-section">
          <div className="settings-section-title">Features</div>
          <div className="settings-item">
            <div className="settings-item-left">
              <Navigation size={20} className="settings-item-icon" style={{ color: '#10b981' }} />
              <div>
                <div style={{ fontWeight: 500 }}>Nearby Share</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Allow nearby active users to see you</div>
              </div>
            </div>
            <div className="settings-item-right">
              <label className="toggle-switch">
                <input 
                  type="checkbox" 
                  checked={nearbyEnabled} 
                  onChange={handleToggleNearby} 
                  disabled={isUpdating}
                />
                <span className="slider"></span>
              </label>
            </div>
          </div>
        </div>

        <div className="settings-section">
          <div className="settings-section-title">About & Legal</div>
          <div className="settings-item" onClick={() => setActiveView('about')}>
            <div className="settings-item-left">
              <Info size={20} className="settings-item-icon" style={{ color: '#eab308' }} />
              <span>About SocialVerse</span>
            </div>
            <div className="settings-item-right"><ChevronRight size={20} /></div>
          </div>
          <div className="settings-item" onClick={() => { setActiveView('blocked'); fetchBlockedUsers(); }}>
            <div className="settings-item-left">
              <UserX size={20} className="settings-item-icon" style={{ color: '#ef4444' }} />
              <span>Blocked Users</span>
            </div>
            <div className="settings-item-right"><ChevronRight size={20} /></div>
          </div>
          <div className="settings-item" onClick={() => setActiveView('privacy')}>
            <div className="settings-item-left">
              <Shield size={20} className="settings-item-icon" style={{ color: '#8b5cf6' }} />
              <span>Privacy Policy</span>
            </div>
            <div className="settings-item-right"><ChevronRight size={20} /></div>
          </div>
          <div className="settings-item" onClick={() => setActiveView('terms')}>
            <div className="settings-item-left">
              <FileText size={20} className="settings-item-icon" style={{ color: '#3b82f6' }} />
              <span>Terms & Conditions</span>
            </div>
            <div className="settings-item-right"><ChevronRight size={20} /></div>
          </div>
          {(user?.role === 'admin' || user?.role === 'founder') && (
            <div className="settings-item" onClick={() => setActiveView('admin_rights')}>
              <div className="settings-item-left">
                <Shield size={20} className="settings-item-icon" style={{ color: '#f59e0b' }} />
                <span>Admin/Founder's Rights</span>
              </div>
              <div className="settings-item-right"><ChevronRight size={20} /></div>
            </div>
          )}
        </div>

        <button className="logout-btn-page" onClick={handleLogout}>
          <LogOut size={20} />
          Log Out
        </button>
      </div>
    </>
  );

  const renderBlockedView = () => (
    <>
      <div className="settings-page-header">
        <button className="back-btn" onClick={() => setActiveView('main')}><ChevronLeft size={24} /></button>
        <h2>Blocked Users</h2>
      </div>
      <div className="settings-page-body">
        {loadingBlocked ? (
          <div className="empty-state">Loading...</div>
        ) : blockedUsers.length === 0 ? (
          <div className="empty-state">No blocked users.</div>
        ) : (
          <div className="blocked-list">
            {blockedUsers.map(u => (
              <div key={u._id} className="blocked-user-card">
                <div className="blocked-user-info">
                  <img src={u.profilePic || '/Logo/logo.png'} alt={u.name} />
                  <div>
                    <div className="blocked-user-name">{u.name}</div>
                    <div className="blocked-user-handle">@{u.userid}</div>
                  </div>
                </div>
                <button className="unblock-btn" onClick={() => handleUnblock(u._id)}>
                  Unblock
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );

  const renderPrivacyView = () => (
    <>
      <div className="settings-page-header">
        <button className="back-btn" onClick={() => setActiveView('main')}><ChevronLeft size={24} /></button>
        <h2>Privacy Policy</h2>
      </div>
      <div className="settings-page-body legal-page-content">
        <h3>1. Data Collection</h3>
        <p>At SocialVerse, we believe your data belongs to you. We only collect the necessary information required to provide you with a seamless and connective experience. This includes basic profile details, interactions, and real-time location (only when Nearby Share is actively enabled).</p>
        
        <h3>2. Usage of Information</h3>
        <p>Your information is utilized strictly to curate your feed, connect you with adjacent peers through our discovery features, and maintain the integrity of our platform. We do not sell your personal data to third-party data brokers.</p>

        <h3>3. Visibility and Control</h3>
        <p>Features like "Nearby Share" operate entirely on an opt-in/opt-out basis. If you choose to disable discovery, your location and profile will immediately cease being broadcasted to nearby users.</p>

        <h3>4. Security Measures</h3>
        <p>SocialVerse employs industry-standard encryption protocols to safeguard your personal messages (VerseChat) and credential data against unauthorized access. We continually monitor our infrastructure to ensure the highest tier of data security.</p>
        
        <div className="legal-footer">
          Last Updated: March 2026<br/>
          SocialVerse Inc.
        </div>
      </div>
    </>
  );

  const renderTermsView = () => (
    <>
      <div className="settings-page-header">
        <button className="back-btn" onClick={() => setActiveView('main')}><ChevronLeft size={24} /></button>
        <h2>Terms & Conditions</h2>
      </div>
      <div className="settings-page-body legal-page-content">
        <h3>1. Acceptance of Terms</h3>
        <p>By accessing and utilizing SocialVerse, you implicitly agree to be bound by these Terms and Conditions. Our platform is designed as a sanctuary for respectful expression and digital socialization.</p>

        <h3>2. User Conduct</h3>
        <p>Users must abstain from posting hate speech, malicious content, or any material that infringes upon intellectual property rights. SocialVerse reserves the unilateral right to suspend or terminate accounts that persistently violate community standards.</p>

        <h3>3. Content Ownership</h3>
        <p>You retain full ownership rights over the Posts, Bytes, and Blogs you publish. However, by posting, you grant SocialVerse a non-exclusive license to display, distribute, and promote your content within the platform ecosystem.</p>

        <h3>4. Limitation of Liability</h3>
        <p>SocialVerse is provided "as is". We strive for 100% uptime, but make no guarantees regarding uninterrupted service. We are not liable for any data loss, damages, or distress arising from platform use.</p>

        <div className="legal-footer">
          Last Updated: March 2026<br/>
          SocialVerse Inc.
        </div>
      </div>
    </>
  );

  const renderAccountView = () => (
    <>
      <div className="settings-page-header">
        <button className="back-btn" onClick={() => setActiveView('main')}><ChevronLeft size={24} /></button>
        <h2>Account Information</h2>
      </div>
      <div className="settings-page-body" style={{ padding: '20px' }}>
        {user && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Name</label>
              <div style={{ fontSize: '1.05rem', color: 'var(--text-primary)', marginTop: '5px', fontWeight: 500 }}>{user.name}</div>
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Username</label>
              <div style={{ fontSize: '1.05rem', color: 'var(--text-primary)', marginTop: '5px', fontWeight: 500 }}>@{user.userid}</div>
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Email</label>
              <div style={{ fontSize: '1.05rem', color: 'var(--text-primary)', marginTop: '5px', fontWeight: 500 }}>{user.email || 'Not provided'}</div>
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Date of Birth</label>
              <div style={{ fontSize: '1.05rem', color: 'var(--text-primary)', marginTop: '5px', fontWeight: 500 }}>
                {user.dob ? new Date(user.dob).toLocaleDateString() : 'Not provided'}
              </div>
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Joined</label>
              <div style={{ fontSize: '1.05rem', color: 'var(--text-primary)', marginTop: '5px', fontWeight: 500 }}>
                {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Recently'}
              </div>
            </div>
            <div style={{ marginTop: '20px', padding: '15px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '12px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                To edit your profile information such as your name, bio, pronouns, or profile picture, please use the "Edit Profile" button directly on your profile page.
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  );

  const renderSecurityView = () => (
    <>
      <div className="settings-page-header">
        <button className="back-btn" onClick={() => setActiveView('main')}><ChevronLeft size={24} /></button>
        <h2>Security</h2>
      </div>
      <div className="settings-page-body" style={{ padding: '0' }}>
        <div className="settings-section" style={{ borderBottom: 'none' }}>
          <div className="settings-item" onClick={() => alert('Password reset flow will be available soon.')}>
            <div className="settings-item-left">
              <Lock size={20} className="settings-item-icon" />
              <span>Change Password</span>
            </div>
            <div className="settings-item-right"><ChevronRight size={20} /></div>
          </div>
          <div className="settings-item" onClick={() => alert('Two-Factor Authentication is currently being rolled out across regions.')}>
            <div className="settings-item-left">
              <Shield size={20} className="settings-item-icon" style={{ color: '#10b981' }} />
              <div>
                <div style={{ fontWeight: 500 }}>Two-Factor Authentication</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Off</div>
              </div>
            </div>
            <div className="settings-item-right"><ChevronRight size={20} /></div>
          </div>
        </div>
        <div style={{ padding: '20px', fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
          Your security is our priority. If you believe your account has been compromised, please contact support immediately or change your password.
        </div>
      </div>
    </>
  );

  const renderAboutView = () => (
    <>
      <div className="settings-page-header">
        <button className="back-btn" onClick={() => setActiveView('main')}><ChevronLeft size={24} /></button>
        <h2>About SocialVerse</h2>
      </div>
      <div className="settings-page-body legal-page-content">
        <h3>Our Mission</h3>
        <p>SocialVerse was founded with a singular, unyielding vision: to redefine digital connectivity by putting authentic human interaction first. In a world inundated with noisy algorithms and endless doom-scrolling, SocialVerse aims to be a sanctuary of meaningful connections, blending the comfort of intimate communication with the thrill of global discovery.</p>
        
        <h3>The Ecosystem</h3>
        <p>Our platform isn't just an app; it is a living ecosystem designed to adapt to how you naturally want to socialize:</p>
        <p><strong>Posts & Bytes:</strong> Share your best moments instantly. Whether through stunning imagery or short, engaging video 'Bytes', you have the creative tools to express yourself vividly.</p>
        <p><strong>Blogs:</strong> For when an image isn't enough, our integrated blogging platform allows you to narrate your stories, share your expertise, and connect with a community that loves to read.</p>
        <p><strong>VerseChat:</strong> Real-time, encrypted messaging ensures your private conversations remain exactly that—private. Connect seamlessly with friends or groups without ever leaving the platform.</p>
        <p><strong>Nearby Discovery:</strong> A revolutionary feature bridging the digital and physical worlds. Find and connect with active SocialVerse members in your immediate vicinity, sparking spontaneous interactions and new friendships in your local community.</p>
        
        <h3>Our Promise to You</h3>
        <p>We are relentlessly committed to a premium, minimalistic design that prioritizes your experience over our metrics. We believe in high-fidelity aesthetics, absolute data privacy, and giving you absolute control over your digital footprint.</p>
        
        <p>Welcome to the future of connection. Welcome to SocialVerse.</p>

        <div className="legal-footer">
          Version 1.0.0<br/>
          Built with passion by the SocialVerse Team
        </div>
      </div>
    </>
  );

  const renderAdminRightsView = () => (
    <>
      <div className="settings-page-header">
        <button className="back-btn" onClick={() => setActiveView('main')}><ChevronLeft size={24} /></button>
        <h2>Founders & Admin Charter</h2>
      </div>
      <div className="settings-page-body legal-page-content">
        <h3>1. Authority and Governance</h3>
        <p>As a Founder or Administrator of SocialVerse, you are entrusted with the stewardship of our digital sanctuary. Your authority is derived from your commitment to maintaining a respectful, safe, and flourishing community. Founders hold ultimate decision-making power regarding platform architecture and core policies.</p>

        <h3>2. Moderation & Content Management</h3>
        <p>Administrators have the right and responsibility to monitor user-generated content for violations of our community standards. This includes the power to remove malicious content, suspend accounts that infringe upon our Terms, and mediate disputes between users with impartiality and fairness.</p>

        <h3>3. Data Privacy & Ethical Access</h3>
        <p>Founders and Admins must uphold the highest standards of data ethics. Access to administrative tools is granted strictly for platform maintenance and security purposes. Unauthorized access to personal user data or private VerseChat communications is strictly prohibited and constitutes a breach of this charter.</p>

        <h3>4. Community Evolution</h3>
        <p>Founders possess the right to introduce new features, refine platform aesthetics, and evolve the SocialVerse ecosystem. Admins are encouraged to provide direct feedback from the community to help shape these decisions, ensuring SocialVerse remains a user-centric environment.</p>

        <div style={{ marginTop: '30px', padding: '20px', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '12px', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#d97706' }}>Administrative Tools</h4>
          <p style={{ fontSize: '0.9rem', marginBottom: '15px' }}>As an authorized member, you can access the central management console to oversee platform metrics and user accounts.</p>
          <button 
            className="action-btn-primary" 
            style={{ width: '100%', padding: '12px', borderRadius: '8px', background: '#f59e0b', color: 'white', fontWeight: 600 }}
            onClick={() => navigate('/admin')}
          >
            Open Admin Dashboard
          </button>
        </div>

        <div className="legal-footer">
          SocialVerse Administrative Board<br/>
          Ratified: March 2026
        </div>
      </div>
    </>
  );

  return (
    <div className="page-wrapper animate-fade-in">
      <main className="settings-container">
        {activeView === 'main' && renderMainView()}
        {activeView === 'blocked' && renderBlockedView()}
        {activeView === 'privacy' && renderPrivacyView()}
        {activeView === 'terms' && renderTermsView()}
        {activeView === 'account' && renderAccountView()}
        {activeView === 'security' && renderSecurityView()}
        {activeView === 'about' && renderAboutView()}
        {activeView === 'admin_rights' && renderAdminRightsView()}
      </main>
      <BottomNav />
    </div>
  );
};

export default SettingsPage;
