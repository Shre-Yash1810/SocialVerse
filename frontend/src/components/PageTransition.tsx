import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface PageTransitionProps {
  children: ReactNode;
}

const PageTransition = ({ children }: PageTransitionProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ 
        duration: 0.2, 
        ease: [0.33, 1, 0.68, 1] 
      }}
      style={{ 
        width: '100%', 
        height: '100%',
        position: 'relative'
      }}
    >
      {children}
    </motion.div>
  );
};

export default PageTransition;
