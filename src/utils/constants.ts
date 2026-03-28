export const XP_LEVELS: { [key: number]: number } = {
  1: 0,
  2: 900,
  3: 3100,
  4: 7600,
  5: 16600,
  6: 32800,
  7: 59800,
  8: 104800,
  9: 176800,
  10: 284800,
  11: 737800,
  12: 644800, // PRD says 644800 after 737800, which is odd, but I'll follow it or adjust if logical.
  13: 914800,
  14: 1256800,
  15: 1688800,
  16: 2228800,
  17: 2876800,
  18: 3632800,
  19: 4460800,
  20: 5360800,
};

export const XP_REWARDS = {
  LIKE: 10,
  COMMENT: 20,
  BIRTHDAY_BONUS: 500,
  ANNIVERSARY_BONUS: 1000,
};

export const BADGES = [
  // --- Level Based ---
  { name: 'THE RISING STAR', type: 'LEVEL', threshold: 7, icon: 'Star' },
  { name: 'THE GROWING ORBIT', type: 'LEVEL', threshold: 10, icon: 'Orbit' },
  { name: 'THE GALACTIC CREATOR', type: 'LEVEL', threshold: 15, icon: 'Palette' },
  { name: 'THE GREAT ATTRACTOR', type: 'LEVEL', threshold: 20, icon: 'Zap' },

  // --- Likes Based ---
  { name: 'THE NEBULA FORGER', type: 'TOTAL_LIKES', threshold: 10000, icon: 'CloudRain' },
  { name: 'THE STAR CLUSTER', type: 'TOTAL_LIKES', threshold: 25000, icon: 'Sparkles' },
  { name: 'THE GRAVITY WELL', type: 'TOTAL_LIKES', threshold: 50000, icon: 'ArrowDownCircle' },
  { name: 'THE SUPERNOVA MOMENT', type: 'SINGLE_POST_LIKES', threshold: 5000, icon: 'Sun' },
  { name: 'THE SHOOTING STAR', type: 'VELOCITY_LIKES', threshold: 1000, icon: 'Wind' }, // 1k in 24h

  // --- Followers Based ---
  { name: 'THE LORD OF RINGS', type: 'FOLLOWERS', threshold: 1000, icon: 'CircleDot' },
  { name: 'THE CELESTIAL MAGNET', type: 'FOLLOWERS', threshold: 5000, icon: 'Magnet' },
  { name: 'THE AURORA SIGNAL', type: 'VELOCITY_FOLLOWERS', threshold: 100, icon: 'Waves' }, // 100 in 1d

  // --- Comments Based ---
  { name: 'THE SILVER MOON', type: 'TOTAL_COMMENTS', threshold: 500, icon: 'Moon' },
  { name: 'THE COSMIC VOICE', type: 'TOTAL_COMMENTS', threshold: 2000, icon: 'Mic' },

  // --- Time Based ---
  { name: 'THE COSMIC VOYAGER', type: 'ACCOUNT_AGE', threshold: 365, icon: 'Rocket' }, // 1 year
];
