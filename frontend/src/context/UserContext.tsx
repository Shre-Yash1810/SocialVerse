import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../services/api';

interface User {
  _id: string;
  userid: string;
  name: string;
  email: string;
  profilePic?: string;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  xp: number;
  level: number;
  following: string[];
  isDiscoveryEnabled?: boolean;
}

interface UserContextType {
  user: User | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    try {
       const res = await api.get('/users/me');
       const userData = {
         ...res.data,
         following: res.data.following?.map((f: any) => typeof f === 'object' ? f._id : f) || []
       };
       setUser(userData);
       localStorage.setItem('db_id', userData._id);
       localStorage.setItem('userid', userData.userid);
    } catch (err) {
      console.error('UserProvider: Failed to fetch user', err);
      // Clear storage if unauthorized
      if ((err as any).response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('db_id');
        localStorage.removeItem('userid');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  return (
    <UserContext.Provider value={{ user, loading, refreshUser: fetchUser }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
