import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, MessageCircle, BookOpen, User } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import BytesIcon from './BytesIcon';
import api from '../services/api';
import { useUser } from '../context/UserContext';
import { useChat } from '../context/ChatContext';
import '../styles/Navigation.css';

const BottomNav: React.FC = React.memo(() => {
  const queryClient = useQueryClient();
  const { user } = useUser();
  const { unreadChatCount } = useChat();

  const prefetch = (path: string) => {
    // Code prefetching
    switch (path) {
      case '/feed': import('../pages/FeedPage'); break;
      case '/bytes': import('../pages/BytesPage'); break;
      case '/versechat': import('../pages/VerseChat'); break;
      case '/blogs': import('../pages/BlogsPage'); break;
      case '/profile': import('../pages/ProfilePage'); break;
    }

    // Data prefetching
    if (path === '/feed' && user?._id) {
      queryClient.prefetchQuery({
        queryKey: ['feed'],
        queryFn: async () => {
          const res = await api.get('/posts/feed');
          return res.data
            .filter((post: any) => post.type !== 'Blog')
            .map((post: any) => ({
              ...post,
              isLiked: post.likes?.some((id: any) => id.toString() === user._id),
              isSaved: post.savedBy?.some((id: any) => id.toString() === user._id)
            }));
        }
      });
    }

    if (path === '/profile' && user?.userid) {
      queryClient.prefetchQuery({
        queryKey: ['profile', user.userid],
        queryFn: async () => {
          const res = await api.get(`/users/profile/${user.userid}`);
          return res.data;
        }
      });
    }
  };

  return (
    <nav className="bottom-nav">
      <NavLink 
        to="/feed" 
        className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
        onMouseEnter={() => prefetch('/feed')}
        onTouchStart={() => prefetch('/feed')}
      >
        <Home size={26} />
        <span className="nav-label">Home</span>
      </NavLink>
      <NavLink 
        to="/bytes" 
        className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
        onMouseEnter={() => prefetch('/bytes')}
        onTouchStart={() => prefetch('/bytes')}
      >
        <BytesIcon size={26} />
        <span className="nav-label">Bytes</span>
      </NavLink>
      <NavLink 
        to="/versechat" 
        className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
        onMouseEnter={() => prefetch('/versechat')}
        onTouchStart={() => prefetch('/versechat')}
      >
        <div className="icon-container">
          <MessageCircle size={26} />
          {unreadChatCount > 0 && <span className="notification-dot" />}
        </div>
        <span className="nav-label">VerseChat</span>
      </NavLink>
      <NavLink 
        to="/blogs" 
        className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
        onMouseEnter={() => prefetch('/blogs')}
        onTouchStart={() => prefetch('/blogs')}
      >
        <BookOpen size={26} />
        <span className="nav-label">Blogs</span>
      </NavLink>
      <NavLink 
        to="/profile" 
        className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
        onMouseEnter={() => prefetch('/profile')}
        onTouchStart={() => prefetch('/profile')}
      >
        <User size={26} />
        <span className="nav-label">Profile</span>
      </NavLink>
    </nav>
  );
});

export default BottomNav;
