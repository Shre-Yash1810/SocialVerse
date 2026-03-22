import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ByteContextType {
  activeByteId: string | null;
  setActiveByteId: (id: string | null) => void;
}

const ByteContext = createContext<ByteContextType | undefined>(undefined);

export const ByteProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeByteId, setActiveByteId] = useState<string | null>(null);

  return (
    <ByteContext.Provider value={{ activeByteId, setActiveByteId }}>
      {children}
    </ByteContext.Provider>
  );
};

export const useByte = () => {
  const context = useContext(ByteContext);
  if (context === undefined) {
    throw new Error('useByte must be used within a ByteProvider');
  }
  return context;
};
