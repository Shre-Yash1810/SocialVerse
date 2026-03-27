import React, { useState, useEffect } from 'react';
import api from '../services/api';
import BlogDetailModal from '../components/BlogDetailModal';
import '../styles/Feed.css';

interface Blog {
  _id: string;
  author: { userid: string; name: string; profilePic: string };
  type: string;
  content: string; // The blog text
  caption?: string; // The title
  createdAt: string;
}

const BlogsPage: React.FC = () => {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(localStorage.getItem('db_id'));
  const [loading, setLoading] = useState(true);
  const [activeDetailBlog, setActiveDetailBlog] = useState<any | null>(null);

  const fetchBlogs = async () => {
    try {
      let myId = currentId;
      if (!myId) {
        const userRes = await api.get('/users/me');
        myId = userRes.data._id;
        localStorage.setItem('db_id', myId!);
        setCurrentId(myId);
      }

      const res = await api.get('/posts/feed');
      const blogData = res.data.filter((post: any) => post.type === 'Blog');
      setBlogs(blogData);
    } catch (err) {
      console.error('Failed to fetch blogs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, [currentId]);

  if (loading) return <div className="loading-screen">Reading the verse...</div>;

  const featuredBlog = blogs[0];
  const otherBlogs = blogs.slice(1);

  const calculateReadTime = (text: string) => {
    const wordsPerMinute = 200;
    const words = text.split(/\s+/).length;
    const minutes = Math.ceil(words / wordsPerMinute);
    return `${minutes} min read`;
  };

  return (
    <div className="blogs-page">
      <main className="blogs-container">
        <header className="blogs-header">
          <h2>The Social Verse Blogs</h2>
          <p>Explore thoughts, stories, and ideas from our community</p>
        </header>

        {blogs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '10px' }}>No blogs yet.</h3>
            <p>Be the first to share your voice with the verse!</p>
          </div>
        ) : (
          <>
            {featuredBlog && (
              <section className="featured-section">
                <div className="blog-featured-card" onClick={() => setActiveDetailBlog(featuredBlog)}>
                  <div className="blog-featured-content">
                    <span className="featured-tag">Featured Story</span>
                    <h3>{featuredBlog.caption || 'Untitled Blog'}</h3>
                    <p className="blog-excerpt">
                      {featuredBlog.content && featuredBlog.content.length > 200 
                        ? featuredBlog.content.substring(0, 200) + '...' 
                        : featuredBlog.content}
                    </p>
                    <div className="blog-meta">
                      <div className="author-mini">
                        <img 
                          src={featuredBlog.author.profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(featuredBlog.author.userid || featuredBlog.author.name)}&background=random`} 
                          alt="" 
                        />
                        <span>{featuredBlog.author.userid}</span>
                      </div>
                      <span className="spacer">•</span>
                      <span>{calculateReadTime(featuredBlog.content || '')}</span>
                    </div>
                  </div>
                </div>
              </section>
            )}

            <section className="recent-blogs-section">
              <h2 className="blog-list-section-title">Latest Updates</h2>
              <div className="blogs-list">
                {otherBlogs.length > 0 ? (
                  otherBlogs.map((blog) => (
                    <div key={blog._id} className="blog-list-item" onClick={() => setActiveDetailBlog(blog)}>
                      <div className="blog-list-info">
                        <div className="blog-meta">
                          <div className="author-mini">
                            <img src={blog.author.profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(blog.author.userid || blog.author.name)}&background=random`} alt="" />
                            <span>{blog.author.userid}</span>
                          </div>
                          <span className="spacer">•</span>
                          <span>{calculateReadTime(blog.content)}</span>
                        </div>
                        <h3>{blog.caption || 'Untitled Blog'}</h3>
                        <p>
                          {blog.content.length > 150 
                            ? blog.content.substring(0, 150) + '...' 
                            : blog.content}
                        </p>
                      </div>
                      <div className="blog-list-thumb" />
                    </div>
                  ))
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    <p>No other entries yet. Stay tuned!</p>
                  </div>
                )}
              </div>
            </section>
          </>
        )}
      </main>
      {activeDetailBlog && (
        <BlogDetailModal 
          post={activeDetailBlog} 
          onClose={() => setActiveDetailBlog(null)} 
        />
      )}
    </div>
  );
};

export default BlogsPage;
