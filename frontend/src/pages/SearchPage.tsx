import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Hand, Check } from 'lucide-react';
import api from '../services/api';
import { useUser } from '../context/UserContext';
import '../styles/Feed.css';

const SearchPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [nearbyUsers, setNearbyUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [locationPerm, setLocationPerm] = useState(localStorage.getItem('nearby_location_granted') === 'true');
  
  const [myFollowing, setMyFollowing] = useState<string[]>(user?.following || []);
  const [wavedAt, setWavedAt] = useState<string[]>([]);
  const currentUserId = user?.userid;

  useEffect(() => {
    const checkAndFetchNearby = async () => {
      if (localStorage.getItem('nearby_location_granted') !== 'true') return;

      try {
        if (navigator.permissions) {
          const status = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
          if (status.state === 'denied') {
            console.log("Location permission denied, skipping auto-prompt.");
            setLocationPerm(false);
            return;
          }
        }

        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              setLocationPerm(true);
              const { latitude, longitude } = position.coords;
              api.post('/discovery/location', { latitude, longitude }).catch(console.error);
              fetchNearby(longitude, latitude);
            },
            (error) => {
              console.error("Location error:", error);
              if (error.code === error.PERMISSION_DENIED) {
                setLocationPerm(false);
              }
            }
          );
        }
      } catch (err) {
        console.error("Permission check failed", err);
      }
    };

    if (user) {
      if (user.isDiscoveryEnabled !== undefined) {
        checkAndFetchNearby();
      }
    }
  }, []);

  const fetchNearby = async (lng: number, lat: number) => {
    setLoading(true);
    try {
      const res = await api.get(`/discovery/nearby?longitude=${lng}&latitude=${lat}`);
      setNearbyUsers(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.get(`/users/search?q=${query.toLowerCase()}`);
        setSearchResults(res.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const handleToggleFollow = async (e: React.MouseEvent, targetUser: any) => {
    e.stopPropagation();
    const isFollowing = myFollowing.includes(targetUser._id);
    try {
      if (isFollowing) {
        await api.delete(`/users/unfollow/${targetUser._id}`);
        setMyFollowing(myFollowing.filter(id => id !== targetUser._id));
      } else {
        await api.post(`/users/follow/${targetUser._id}`);
        setMyFollowing([...myFollowing, targetUser._id]);
      }
    } catch (err) {
      console.error('Follow toggle failed', err);
    }
  };

  const handleWave = async (e: React.MouseEvent, targetUser: any) => {
    e.stopPropagation();
    if (wavedAt.includes(targetUser._id)) return;
    try {
      await api.post(`/discovery/wave/${targetUser._id}`);
      setWavedAt([...wavedAt, targetUser._id]);
    } catch (err) {
      console.error('Wave failed', err);
    }
  };

  const renderUserCard = (user: any) => {
    const isSelf = user.userid === currentUserId;
    const isFollowing = myFollowing.includes(user._id);
    const hasWaved = wavedAt.includes(user._id);

    return (
      <div 
        key={user._id} 
        style={{ 
          padding: '16px', 
          background: 'white', 
          borderBottom: '1px solid #f1f5f9',
        }}
      >
        <div 
          style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', marginBottom: '14px' }}
          onClick={() => navigate(`/profile/${user.userid}`)}
        >
          <img 
            src={user.profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.userid)}&background=random`} 
            alt={user.userid} 
            style={{ width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #efefef' }} 
          />
          <div>
            <p style={{ fontWeight: 700, fontSize: '0.95rem', color: '#1e293b' }}>{user.userid}</p>
            <p style={{ fontSize: '0.85rem', color: '#64748b' }}>{user.name || user.userid}</p>
          </div>
        </div>

        {!isSelf && (
          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              className="glass-btn"
              onClick={(e) => handleWave(e, user)}
              style={{ 
                flex: 1, 
                padding: '8px', 
                borderRadius: '8px', 
                color: hasWaved ? '#94a3b8' : 'var(--primary)', 
                borderColor: hasWaved ? '#e2e8f0' : 'var(--primary)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              {hasWaved ? <Check size={16} /> : <Hand size={16} />}
              <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>{hasWaved ? 'Waved' : 'Wave'}</span>
            </button>
            <button 
              className={isFollowing ? 'glass-btn' : 'btn-primary'}
              onClick={(e) => handleToggleFollow(e, user)}
              style={{ 
                flex: 1, 
                padding: '8px', 
                borderRadius: '8px', 
                fontSize: '0.85rem', 
                fontWeight: 700,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
              }}
            >
              {isFollowing ? 'Following' : 'Follow'}
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="feed-page" style={{ backgroundColor: '#f8fafc', minHeight: '100vh', paddingBottom: '80px' }}>
      <div style={{ background: 'white', padding: '16px', position: 'sticky', top: 0, zIndex: 50, borderBottom: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
        <div style={{ position: 'relative', maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ position: 'absolute', top: '14px', left: '16px', color: '#94a3b8' }}>
            <Search size={20} />
          </div>
          <input 
            type="text" 
            placeholder="Search users..." 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ 
              width: '100%', 
              padding: '14px 16px 14px 48px', 
              borderRadius: '24px', 
              border: '1px solid #e2e8f0', 
              outline: 'none',
              background: '#f8fafc',
              fontSize: '1rem',
              fontWeight: 500,
              color: '#1e293b'
            }}
          />
        </div>
      </div>
      
      <main className="feed-container" style={{ paddingTop: '24px' }}>
        <div className="posts-container" style={{ maxWidth: '600px', width: '100%' }}>
        <div style={{ background: 'white', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
          {query.trim() ? (
            <div>
               <h3 style={{ padding: '16px', fontSize: '1rem', fontWeight: 800, borderBottom: '1px solid #f1f5f9', color: '#1e293b' }}>
                 Search Results
               </h3>
               {loading && <p style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>Searching...</p>}
               {!loading && searchResults.length === 0 && <p style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>No users found for "{query}"</p>}
               {!loading && searchResults.map(renderUserCard)}
            </div>
          ) : (
            <div>
               <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '16px', borderBottom: '1px solid #f1f5f9', color: '#1e293b' }}>
                  <MapPin size={20} color="var(--primary)" />
                  <h3 style={{ fontSize: '1rem', fontWeight: 800 }}>Nearby Active</h3>
               </div>
               
               {!locationPerm && !loading && (
                 <div style={{ textAlign: 'center', padding: '30px 20px' }}>
                   <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: '1.5', marginBottom: '16px' }}>
                     Allow location access to discover people nearby.
                   </p>
                   <button 
                     className="btn-primary" 
                     style={{ padding: '8px 24px', borderRadius: '24px', fontWeight: 600, border: 'none', cursor: 'pointer' }}
                      onClick={() => {
                       if (navigator.geolocation) {
                         setLoading(true);
                         navigator.geolocation.getCurrentPosition(
                           (position) => {
                             const { latitude, longitude } = position.coords;
                             localStorage.setItem('nearby_location_granted', 'true');
                             setLocationPerm(true);
                             api.post('/discovery/location', { latitude, longitude }).catch(console.error);
                             fetchNearby(longitude, latitude);
                           },
                           (error) => {
                             console.error("Location error:", error);
                             setLoading(false);
                             alert("Location access failed.");
                           }
                         );
                       }
                     }}
                   >
                     Enable Location
                   </button>
                 </div>
               )}

               {loading && locationPerm && <p style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>Discovering...</p>}
               {!loading && locationPerm && nearbyUsers.length === 0 && (
                 <p style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>No one nearby right now.</p>
               )}
               {!loading && nearbyUsers.map(renderUserCard)}
            </div>
          )}
        </div>
        </div>
      </main>
    </div>
  );
};

export default SearchPage;
