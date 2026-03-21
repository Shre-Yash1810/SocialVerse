const BytesIcon = ({ size = 26, color = 'currentColor', className = '' }: { size?: number, color?: string, className?: string }) => {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke={color} 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
      style={{ flexShrink: 0 }}
    >
      <polygon points="10 8 16 12 10 16 10 8" />
      <path d="M8 4H6a2 2 0 0 0-2 2v2" />
      <path d="M16 4h2a2 2 0 0 1 2 2v2" />
      <path d="M8 20H6a2 2 0 0 1-2-2v-2" />
      <path d="M16 20h2a2 2 0 0 0 2-2v-2" />
    </svg>
  );
};

export default BytesIcon;
