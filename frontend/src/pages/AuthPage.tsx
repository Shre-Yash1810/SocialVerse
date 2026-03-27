import React, { useState } from 'react';
import Branding from '../components/Branding';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import '../styles/Auth.css';

const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    userId: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        const identifier = (formData.email || formData.userId).toLowerCase();
        const res = await api.post('/auth/login', { 
          email: identifier, 
          password: formData.password 
        });
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('userid', res.data.userid);
        localStorage.setItem('db_id', res.data._id);
        localStorage.setItem('profilePic', res.data.profilePic || '');
        navigate('/profile');
      } else {
        // First step of signup (email/password)
        // Note: Backend registerUser expects all fields. 
        // We'll store email/password in session for now and move to onboarding.
        sessionStorage.setItem('signup_email', formData.email);
        sessionStorage.setItem('signup_password', formData.password);
        navigate(isLogin ? '/profile' : '/onboarding');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container animate-fade-in">
      <div className="auth-card glass">
        <Branding 
          size="large" 
          subtitle={isLogin ? "Welcome back to the verse" : "Join the future of social networking"} 
        />
        
        {error && <div className="error-message" style={{ color: 'red', marginBottom: '15px', textAlign: 'center' }}>{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="input-group">
            <label htmlFor="identifier">{isLogin ? "Email or UserID" : "Email"}</label>
            <input 
              type="text" 
              id="identifier"
              placeholder={isLogin ? "Enter email or userid" : "Enter your email"}
              value={isLogin && formData.userId ? formData.userId : formData.email}
              onChange={(e) => {
                const val = e.target.value;
                setFormData({ 
                  ...formData, 
                  [isLogin ? 'userId' : 'email']: isLogin ? val.toLowerCase() : val 
                });
              }}
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="password">Password</label>
            <input 
              type="password" 
              id="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? (isLogin ? "Logging in..." : "Signing up...") : (isLogin ? "Login" : "Sign Up")}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            {isLogin ? "Don't have an account?" : "Already have an account?"}
            <button onClick={() => setIsLogin(!isLogin)} className="btn-link">
              {isLogin ? "Sign Up" : "Login"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
