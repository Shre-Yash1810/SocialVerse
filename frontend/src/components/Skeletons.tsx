import '../styles/Skeletons.css';

export const FeedSkeleton = () => {
  return (
    <div className="feed-skeleton">
      {[1, 2, 3].map((i) => (
        <div key={i} className="skeleton-card">
          <div className="skeleton-header">
            <div className="skeleton-avatar shm" />
            <div className="skeleton-info">
              <div className="skeleton-line shm" style={{ width: '40%' }} />
              <div className="skeleton-line shm" style={{ width: '20%' }} />
            </div>
          </div>
          <div className="skeleton-media shm" />
          <div className="skeleton-content">
            <div className="skeleton-line shm" style={{ width: '90%' }} />
            <div className="skeleton-line shm" style={{ width: '60%' }} />
          </div>
        </div>
      ))}
    </div>
  );
};

export const ProfileSkeleton = () => {
  return (
    <div className="profile-skeleton">
      <div className="skeleton-profile-header">
        <div className="skeleton-avatar-large shm" />
        <div className="skeleton-stats">
          <div className="skeleton-line shm" style={{ width: '60px' }} />
          <div className="skeleton-line shm" style={{ width: '60px' }} />
        </div>
      </div>
      <div className="skeleton-profile-info">
        <div className="skeleton-line shm" style={{ width: '40%', height: '20px' }} />
        <div className="skeleton-line shm" style={{ width: '30%' }} />
        <div className="skeleton-line shm" style={{ width: '80%', marginTop: '10px' }} />
      </div>
      <div className="skeleton-grid">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="skeleton-grid-item shm" />
        ))}
      </div>
    </div>
  );
};
