import React, { createContext, useContext, useState, ReactNode } from 'react';

interface BioMapContextType {
  selectedDay: string;
  setSelectedDay: (day: string) => void;
}

const BioMapContext = createContext<BioMapContextType | undefined>(undefined);

export const BioMapProvider = ({ children }: { children: ReactNode }) => {
  const [selectedDay, setSelectedDay] = useState<string>("Saturday"); // Default to the main BioMAP day

  return (
    <BioMapContext.Provider value={{ selectedDay, setSelectedDay }}>
      {children}
    </BioMapContext.Provider>
  );
};

export const useBioMap = () => {
  const context = useContext(BioMapContext);
  if (!context) {
    throw new Error('useBioMap must be used within a BioMapProvider');
  }
  return context;
};
