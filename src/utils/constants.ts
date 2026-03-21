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
  { name: 'THE RISING STAR', level: 7 },
  { name: 'THE GROWING ORBIT', level: 10 },
  { name: 'THE GALACTIC CREATOR', level: 15 },
  { name: 'THE GREAT ATTRACTOR', level: 20 },
  // ... more based on likes/comments/followers from PRD
];
