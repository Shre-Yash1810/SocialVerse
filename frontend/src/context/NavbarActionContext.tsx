import React, { createContext, useContext, useState, ReactNode } from 'react';

interface NavbarActionContextType {
  onMoreClick: (() => void) | null;
  setOnMoreClick: (action: (() => void) | null) => void;
  onCreateClick: (() => void) | null;
  setOnCreateClick: (action: (() => void) | null) => void;
}

const NavbarActionContext = createContext<NavbarActionContextType | undefined>(undefined);

export const NavbarActionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [onMoreClick, setOnMoreClick] = useState<(() => void) | null>(null);
  const [onCreateClick, setOnCreateClick] = useState<(() => void) | null>(null);

  return (
    <NavbarActionContext.Provider value={{ onMoreClick, setOnMoreClick, onCreateClick, setOnCreateClick }}>
      {children}
    </NavbarActionContext.Provider>
  );
};

export const useNavbarAction = () => {
  const context = useContext(NavbarActionContext);
  if (context === undefined) {
    throw new Error('useNavbarAction must be used within a NavbarActionProvider');
  }
  return context;
};
