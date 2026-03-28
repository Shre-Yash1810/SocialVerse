import { 
  Star, Globe, Palette, Zap, Cloud, Sun, Target, Moon, Wind, 
  Sparkles, Mic, Magnet, Radio, ArrowDownCircle, Rocket 
} from 'lucide-react';

export const BADGE_CONFIG: { [key: string]: { icon: any, color: string, reason: string } } = {
  'THE RISING STAR': { icon: Star, color: '#FFD700', reason: 'Reach Level 7' },
  'THE GROWING ORBIT': { icon: Globe, color: '#00E5FF', reason: 'Reach Level 10' },
  'THE GALACTIC CREATOR': { icon: Palette, color: '#D500F9', reason: 'Reach Level 15' },
  'THE GREAT ATTRACTOR': { icon: Zap, color: '#FF1744', reason: 'Reach Level 20' },
  'THE NEBULA FORGER': { icon: Cloud, color: '#651FFF', reason: 'Receive 10,000 total likes across posts' },
  'THE SUPERNOVA MOMENT': { icon: Sun, color: '#FF9100', reason: 'A single post reaches 5,000 likes' },
  'THE LORD OF RINGS': { icon: Target, color: '#00E676', reason: 'Gain 1,000 followers' },
  'THE SILVER MOON': { icon: Moon, color: '#E0E0E0', reason: 'Receive 500 total comments' },
  'THE SHOOTING STAR': { icon: Wind, color: '#18FFFF', reason: 'A post gains 1,000 likes within 24 hours' },
  'THE STAR CLUSTER': { icon: Sparkles, color: '#FFEA00', reason: 'Receive 25,000 total likes across posts' },
  'THE COSMIC VOICE': { icon: Mic, color: '#AA00FF', reason: 'Receive 2,000 total comments' },
  'THE CELESTIAL MAGNET': { icon: Magnet, color: '#F50057', reason: 'Gain 5,000 followers' },
  'THE AURORA SIGNAL': { icon: Radio, color: '#1DE9B6', reason: 'Gain 100 followers in a single day' },
  'THE GRAVITY WELL': { icon: ArrowDownCircle, color: '#6D28D9', reason: 'Reach 50,000 total likes' },
  'THE COSMIC VOYAGER': { icon: Rocket, color: '#FF3D00', reason: 'Maintain an active SocialVerse account for 1 year' },
};
