import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { 
  ChevronLeft, 
  Trash2, 
  Search as SearchIcon, 
  Users, 
  LayoutDashboard, 
  ShieldCheck, 
  Image as ImageIcon,
  Video,
  FileText,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  Activity,
  Zap,
  Menu,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import logo from '../assets/logo/logo-light.png';
import '../styles/AdminPanel.css';

const AdminPanel: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'posts' | 'bytes' | 'blogs' | 'reports'>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [chartMounted, setChartMounted] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [meRes, statsRes, usersRes, postsRes, reportsRes] = await Promise.all([
          api.get('/users/me'),
          api.get('/admin/stats'),
          api.get('/admin/users'),
          api.get('/admin/posts'),
          api.get('/admin/reports')
        ]);
        
        setCurrentUser(meRes.data);
        setStats(statsRes.data);
        setUsers(usersRes.data);
        setPosts(postsRes.data);
        setReports(reportsRes.data);
        
        if (meRes.data.role === 'user') navigate('/feed');
        
        // Wait for next tick to ensure DOM is ready for chart
        setTimeout(() => setChartMounted(true), 500);
      } catch (err) {
        console.error('Failed to fetch platform data', err);
        navigate('/feed');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [navigate]);

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [activeTab]);

  const containerRef = React.useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    if (chartMounted && containerRef.current) {
      setContainerWidth(containerRef.current.clientWidth);
    }
  }, [chartMounted]);

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // --- Actions ---
  const handleUpdateRole = async (id: string, role: string) => {
    if (id === currentUser?._id) return;
    try {
      await api.put(`/admin/users/${id}/role`, { role });
      setUsers(prev => prev.map(u => u._id === id ? { ...u, role } : u));
    } catch (err) { console.error('Role update failed', err); }
  };

  const handleDeleteUser = async (id: string) => {
    if (!window.confirm('Delete this user? This action cannot be undone.')) return;
    try {
      await api.delete(`/admin/users/${id}`);
      setUsers(prev => prev.filter(u => u._id !== id));
      const statsRes = await api.get('/admin/stats');
      setStats(statsRes.data);
    } catch (err) { console.error('User deletion failed', err); }
  };

  const handleDeletePost = async (id: string) => {
    if (!window.confirm('Delete this content?')) return;
    try {
      await api.delete(`/admin/posts/${id}`);
      setPosts(prev => prev.filter(p => p._id !== id));
      const statsRes = await api.get('/admin/stats');
      setStats(statsRes.data);
    } catch (err) { console.error('Post deletion failed', err); }
  };

  const handleResolveReport = async (id: string, status: 'Resolved' | 'Dismissed') => {
    try {
      await api.put(`/admin/reports/${id}`, { status });
      setReports(prev => prev.map(r => r._id === id ? { ...r, status } : r));
      const statsRes = await api.get('/admin/stats');
      setStats(statsRes.data);
    } catch (err) { console.error('Report resolution failed', err); }
  };

  // --- Search & Filtering ---
  const filteredUsers = useMemo(() => 
    users.filter(u => u.name?.toLowerCase().includes(searchQuery.toLowerCase()) || u.userid?.toLowerCase().includes(searchQuery.toLowerCase())),
    [users, searchQuery]
  );

  const partitionedPosts = useMemo(() => ({
    images: posts.filter(p => p.type === 'Image'),
    bytes: posts.filter(p => p.type === 'Video' || p.type === 'Moment'),
    blogs: posts.filter(p => p.type === 'Blog')
  }), [posts]);

  // --- Render Helpers ---
  const TrendBadge = ({ value }: { value: number }) => (
    <div className={`m-trend ${value >= 0 ? 'up' : 'down'}`}>
      {value >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
      {Math.abs(value)}%
    </div>
  );

  const CustomChartTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length >= 2) {
      return (
        <div className="chart-tooltip-pixel">
          <p className="tooltip-label">{label}</p>
          <div className="tooltip-data">
            <p className="p-users">Users: {payload[0].value}</p>
            <p className="p-posts">Posts: {payload[1].value}</p>
          </div>
        </div>
      );
    }
    return null;
  };

  if (loading) return (
    <div className="loading-hq">
      <div className="hq-spinner"></div>
      <span>Initializing Analytics Suite...</span>
    </div>
  );

  return (
    <div className={`hq-layout animate-fade-in ${isSidebarOpen ? 'sidebar-open' : ''}`}>
      
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            className="hq-sidebar-overlay" 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar Navigation */}
      <aside className={`hq-sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="hq-sidebar-header">
          <div className="hq-brand-wrap" style={{ cursor: 'pointer' }} onClick={() => navigate('/feed')}>
            <img src={logo} alt="SV" className="hq-logo-img" />
            <h1>SocialVerse <span>Founders</span></h1>
          </div>
          <button className="mobile-only hq-close-btn" onClick={() => setIsSidebarOpen(false)}>
            <X size={20} />
          </button>
        </div>
        
        <nav className="hq-nav-stack">
          {[
            { id: 'overview', icon: LayoutDashboard, label: 'Dashboard' },
            { id: 'users', icon: Users, label: 'User Directory' },
            { id: 'posts', icon: ImageIcon, label: 'Feed Posts' },
            { id: 'bytes', icon: Video, label: 'Short Bytes' },
            { id: 'blogs', icon: FileText, label: 'Blog Articles' },
            { id: 'reports', icon: ShieldCheck, label: 'Moderation Hub' }
          ].map(tab => (
            <button key={tab.id} className={`nav-link ${activeTab === tab.id ? 'active' : ''}`} onClick={() => setActiveTab(tab.id as any)}>
              <tab.icon size={18} />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>

        <div className="hq-footer">
          <button className="hq-back-btn" onClick={() => navigate('/settings')}>
            <ChevronLeft size={16} /> Exit Dashboard
          </button>
        </div>
      </aside>

      {/* Main Flow Area */}
      <main className="hq-main">
        <header className="hq-header">
          <div className="hq-header-left">
            <button className="mobile-only hq-back-btn-sm" onClick={() => navigate('/settings')}>
              <ChevronLeft size={20} />
            </button>
            <button className="mobile-only hq-menu-btn" onClick={() => setIsSidebarOpen(true)}>
              <Menu size={20} />
            </button>
            <div className="header-meta">
              <h2>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Control Panel</h2>
            </div>
          </div>
          <div className="header-status">
            <div className="status-badge desktop-only">
              <div className="dot"></div>
              <span>Live: HQ Alpha</span>
            </div>
            <div className="user-profile-sm">
              <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{currentUser?.userid}</span>
            </div>
          </div>
        </header>

        <div className="hq-content-scroll">
          <AnimatePresence mode="wait">
            {activeTab === 'overview' && stats && (
              <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                
                {/* Executive Analytics Grid */}
                <section className="premium-metrics-grid">
                  <div className="metric-card">
                    <span className="m-label">Total Expansion</span>
                    <div className="m-value-wrap">
                      <span className="m-value">{stats.userCount.toLocaleString()}</span>
                      <TrendBadge value={stats.userGrowth} />
                    </div>
                    <span className="m-subtext">Registered SocialVerse users</span>
                  </div>
                  
                  <div className="metric-card">
                    <span className="m-label">New Joins (24H)</span>
                    <div className="m-value-wrap">
                      <span className="m-value">{stats.newUsers}</span>
                      <div className="m-trend up" style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                        <ArrowUpRight size={12} /> Join velocity
                      </div>
                    </div>
                    <span className="m-subtext">Verified nodes in last 24h</span>
                  </div>

                  <div className="metric-card">
                    <span className="m-label">Content Stream</span>
                    <div className="m-value-wrap">
                      <span className="m-value">{stats.postCount.toLocaleString()}</span>
                      <TrendBadge value={stats.postGrowth} />
                    </div>
                    <span className="m-subtext">Unified media count</span>
                  </div>

                  <div className="metric-card border-glow">
                    <span className="m-label">Safety Status</span>
                    <div className="m-value-wrap">
                      <span className="m-value">{stats.reportCount}</span>
                      <span className={`m-trend ${stats.reportCount > 5 ? 'down' : 'up'}`} style={{ fontSize: '10px' }}>
                        {stats.reportCount > 5 ? 'Attention' : 'Optimal'}
                      </span>
                    </div>
                    <span className="m-subtext">Pending moderation flags</span>
                  </div>
                </section>

                <div className="dashboard-sub-grid">
                  <div className="sub-panel chart-panel">
                    <h3><Zap size={16} color="#6366f1" /> Growth Visualization</h3>
                    <div className="chart-wrap-container" ref={containerRef} style={{ minHeight: '300px' }}>
                      {chartMounted && containerWidth > 0 && (
                        <ResponsiveContainer width="100%" height={300}>
                          <AreaChart data={stats.trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                              <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                              </linearGradient>
                              <linearGradient id="colorPosts" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#18181b" />
                            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#71717a' }} tickFormatter={(val) => val.split('-').slice(1).join('/')} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#71717a' }} />
                            <Tooltip content={<CustomChartTooltip />} cursor={{ stroke: '#18181b', strokeWidth: 1 }} />
                            <Area type="monotone" dataKey="users" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorUsers)" />
                            <Area type="monotone" dataKey="posts" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorPosts)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </div>

                  <div className="sub-panel">
                    <h3><Activity size={16} color="#10b981" /> Signal Integrity</h3>
                    <div style={{ padding: '20px 0' }}>
                      <div style={{ marginBottom: '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '8px' }}>
                          <span>Community Pulse</span>
                          <span style={{ color: '#10b981' }}>94% Excellent</span>
                        </div>
                        <div style={{ height: '6px', background: '#1c1c1f', borderRadius: '3px' }}>
                          <motion.div initial={{ width: 0 }} animate={{ width: '94%' }} style={{ height: '100%', background: '#10b981', borderRadius: '3px', boxShadow: '0 0 10px rgba(16, 185, 129, 0.3)' }}></motion.div>
                        </div>
                      </div>
                      <p style={{ fontSize: '0.8rem', color: 'var(--hq-text-dim)', lineHeight: '1.5' }}>
                        Network nodes are reporting high engagement and low churn rates for the current epoch.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="urgent-list">
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '20px' }}>System Prioritized Case Files</h3>
                  {reports.slice(0, 5).map(r => (
                    <div key={r._id} className="report-card-premium">
                      <div className="rc-indicator"></div>
                      <div className="rc-content">
                        <div className="rc-header">
                          <span className="rc-badge" style={{ background: r.targetType === 'User' ? 'rgba(99, 102, 241, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: r.targetType === 'User' ? '#6366f1' : '#ef4444' }}>
                            {r.targetType || 'User'}
                          </span>
                          <span className="rc-target" style={{ fontWeight: 600 }}>@{r.target?.userid || 'Unknown'}</span>
                        </div>
                        <p className="rc-reason" style={{ fontSize: '0.85rem', color: '#a1a1aa' }}>{r.reason}</p>
                      </div>
                      <button className="nav-link" style={{ height: '36px', padding: '0 16px' }} onClick={() => setActiveTab('reports')}>Analyze</button>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'users' && (
              <motion.div key="users" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="search-bar-refined">
                  <SearchIcon size={18} />
                  <input type="text" placeholder="Search for user nodes..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                </div>
                
                <div className="sub-panel table-scroll-panel" style={{ padding: 0 }}>
                  {/* Desktop-only Table View */}
                  <div className="table-responsive-wrapper desktop-only">
                    <table className="hq-table-refined">
                      <thead>
                        <tr>
                          <th>Node Profile</th>
                          <th>Identifier</th>
                          <th>Privilege Level</th>
                          <th>Executive Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredUsers.map(user => (
                          <tr key={user._id}>
                            <td>
                              <div className="user-cell-wrap">
                                <img src={user.profilePic || logo} alt="" />
                                <div className="user-cell-meta">
                                  <span style={{ fontWeight: 600 }}>{user.name}</span>
                                  <span className="handle">joined platforms</span>
                                </div>
                              </div>
                            </td>
                            <td style={{ fontFamily: 'monospace', color: 'var(--hq-accent)', fontSize: '0.9rem' }}>@{user.userid}</td>
                            <td>
                              <select value={user.role} onChange={(e) => handleUpdateRole(user._id, e.target.value)} className="hq-select-refined" disabled={user._id === currentUser?._id}>
                                <option value="user">USER</option>
                                <option value="admin">ADMIN</option>
                                <option value="founder">FOUNDER</option>
                              </select>
                            </td>
                            <td>
                              <button className="action-btn-red" onClick={() => handleDeleteUser(user._id)} disabled={user.role === 'founder' && currentUser?.role !== 'founder'} title="Terminate Node">
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile-native Card View */}
                  <div className="user-cards-stack mobile-only">
                    {filteredUsers.map(user => (
                      <div key={user._id} className="user-control-card">
                        <div className="ucc-header">
                          <img src={user.profilePic || logo} alt="" className="ucc-img" />
                          <div className="ucc-info">
                            <span className="ucc-name">{user.name}</span>
                            <span className="ucc-handle">@{user.userid}</span>
                          </div>
                          <button className="action-btn-red" onClick={() => handleDeleteUser(user._id)} disabled={user.role === 'founder' && currentUser?.role !== 'founder'}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                        <div className="ucc-footer">
                          <label>Access Level</label>
                          <select value={user.role} onChange={(e) => handleUpdateRole(user._id, e.target.value)} className="hq-select-refined" disabled={user._id === currentUser?._id}>
                            <option value="user">USER</option>
                            <option value="admin">ADMIN</option>
                            <option value="founder">FOUNDER</option>
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {(activeTab === 'posts' || activeTab === 'bytes' || activeTab === 'blogs') && (
              <motion.div key={activeTab} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="content-grid-refined">
                  {(activeTab === 'posts' ? partitionedPosts.images : activeTab === 'bytes' ? partitionedPosts.bytes : partitionedPosts.blogs).map(post => (
                    <motion.div key={post._id} layout className="post-card-premium">
                      <div className="post-media-wrap">
                        {post.type === 'Blog' ? (
                          <div style={{ padding: '24px', fontSize: '0.85rem', color: '#a1a1aa' }}>{post.content.substring(0, 160)}...</div>
                        ) : post.type === 'Video' ? (
                          <video src={post.content} muted />
                        ) : (
                          <img src={post.content} alt="" />
                        )}
                        <span className="post-overlay-meta" style={{ background: post.type === 'Image' ? '#6366f1' : post.type === 'Blog' ? '#f59e0b' : '#ef4444' }}>
                          {post.type}
                        </span>
                      </div>
                      <div className="post-card-footer">
                        <span style={{ fontSize: '0.75rem', color: 'var(--hq-text-dim)', fontWeight: 500 }}>@{post.author?.userid}</span>
                        <button className="action-btn-red" onClick={() => handleDeletePost(post._id)}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'reports' && (
              <motion.div key="reports" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="dashboard-sub-grid stack-on-mobile" style={{ gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                  <div className="report-stack">
                    <h3 style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Users size={18} color="#6366f1" /> Profile Safety
                    </h3>
                    {reports.filter(r => (r.targetType === 'User' || !r.targetType) && r.status === 'Pending').map(r => (
                      <div key={r._id} className="report-card-premium">
                        <div className="rc-indicator" style={{ background: '#6366f1' }}></div>
                        <div className="rc-content">
                          <span className="rc-target" style={{ fontWeight: 600 }}>@{r.target?.userid || 'Target Node'}</span>
                          <p style={{ fontSize: '0.8rem', marginTop: '6px', color: '#a1a1aa' }}>{r.reason}</p>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={() => handleResolveReport(r._id, 'Resolved')} className="action-btn-red" style={{ background: '#22c55e', color: '#fff', width: 'auto', padding: '0 12px', borderColor: '#22c55e' }}>Clear</button>
                          <button onClick={() => handleResolveReport(r._id, 'Dismissed')} className="action-btn-red" style={{ background: 'transparent', color: '#71717a', width: 'auto', padding: '0 12px', borderColor: '#27272a' }}>Ignore</button>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="report-stack">
                    <h3 style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <ImageIcon size={18} color="#ef4444" /> Media Integrity
                    </h3>
                    {reports.filter(r => r.targetType === 'Post' && r.status === 'Pending').map(r => (
                      <div key={r._id} className="report-card-premium">
                        <div className="rc-indicator" style={{ background: '#ef4444' }}></div>
                        <div className="rc-content">
                          <span className="rc-target">Content ID: {r.target?._id?.substring(0, 10)}</span>
                          <p style={{ fontSize: '0.8rem', marginTop: '6px', color: '#a1a1aa' }}>{r.reason}</p>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={() => handleResolveReport(r._id, 'Resolved')} className="action-btn-red" style={{ background: '#22c55e', color: '#fff', width: 'auto', padding: '0 12px', borderColor: '#22c55e' }}>Clear</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

export default AdminPanel;
