// context/SportsProvider.tsx

import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import React, { createContext, ReactNode, useContext } from "react";
import { IconInfo } from "../constants/iconList";
import { useFirebaseStorage } from "../hooks/useFirebaseStorage";

export interface Sport {
  id: string;
  name: string;
  emoji?: string;
  icon:
    | keyof typeof Ionicons.glyphMap
    | keyof typeof MaterialCommunityIcons.glyphMap;
  library: "Ionicons" | "MaterialCommunityIcons";
}

interface SportsContextType {
  sports: Sport[];
  isLoading: boolean;
  isSyncing: boolean;
  lastSyncTime: Date | null;
  isAuthenticated: boolean;
  addSport: (name: string, icon: IconInfo) => Promise<void>;
  deleteSport: (sportId: string) => Promise<void>;
  forceSync: () => Promise<void>;
}

const SPORTS_STORAGE_KEY = "user_sports_list";

const INITIAL_SPORTS_DATA: Sport[] = [
  {
    id: "academia",
    name: "Academia",
    emoji: "💪",
    icon: "barbell-outline",
    library: "Ionicons",
  },
];

const SportsContext = createContext<SportsContextType | undefined>(undefined);

export function SportsProvider({ children }: { children: ReactNode }) {
  const {
    data: sports,
    isLoading,
    isSyncing,
    lastSyncTime,
    isAuthenticated,
    saveData,
    forcSync: forceSync,
  } = useFirebaseStorage<Sport[]>(
    SPORTS_STORAGE_KEY,
    "sports",
    INITIAL_SPORTS_DATA,
    { enableRealtime: true, syncOnMount: true },
  );

  const addSport = async (name: string, icon: IconInfo) => {
    if (!name.trim()) return;
    const newSport: Sport = {
      id: `sport_${Date.now()}`,
      name: name.trim(),
      emoji: "⭐",
      icon: icon.name as any,
      library: icon.library,
    };
    const updatedSports = [...sports, newSport];
    await saveData(updatedSports);
  };

  const deleteSport = async (sportId: string) => {
    if (sportId === "academia") {
      alert('A "Academia" não pode ser removida.');
      return;
    }
    const updatedSports = sports.filter((sport) => sport.id !== sportId);
    await saveData(updatedSports);
  };

  return (
    <SportsContext.Provider
      value={{
        sports,
        isLoading,
        isSyncing,
        lastSyncTime,
        isAuthenticated,
        addSport,
        deleteSport,
        forceSync,
      }}
    >
      {children}
    </SportsContext.Provider>
  );
}

// Hook personalizado para consumir o contexto facilmente
export function useSportsContext() {
  const context = useContext(SportsContext);
  if (context === undefined) {
    throw new Error("useSportsContext must be used within a SportsProvider");
  }
  return context;
}
