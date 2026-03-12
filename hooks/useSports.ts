// hooks/useSports.ts

import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useCallback } from "react";
import { IconInfo } from "../constants/iconList";
import { ToastPresets } from "../utils/toastUtils";
import { useFirebaseStorage } from "./useFirebaseStorage";

export interface Sport {
  id: string;
  name: string;
  emoji?: string;
  icon:
    | keyof typeof Ionicons.glyphMap
    | keyof typeof MaterialCommunityIcons.glyphMap;
  library: "Ionicons" | "MaterialCommunityIcons";
}

const SPORTS_STORAGE_KEY = "user_sports_list";

// Dados iniciais SEM "Natação"
const INITIAL_SPORTS_DATA: Sport[] = [
  {
    id: "academia",
    name: "Academia",
    emoji: "💪",
    icon: "barbell-outline",
    library: "Ionicons",
  },
  {
    id: "volei_quadra",
    name: "Vôlei de Quadra",
    emoji: "🏐",
    icon: "volleyball",
    library: "MaterialCommunityIcons",
  },
  {
    id: "volei_praia",
    name: "Vôlei de Praia",
    emoji: "🏖️",
    icon: "sunny-outline",
    library: "Ionicons",
  },
  {
    id: "futebol",
    name: "Futebol Society",
    emoji: "⚽",
    icon: "football-outline",
    library: "Ionicons",
  },
  {
    id: "boxe",
    name: "Boxe",
    emoji: "🥊",
    icon: "boxing-glove",
    library: "MaterialCommunityIcons",
  },
];

export function useSports() {
  const {
    data: sports = INITIAL_SPORTS_DATA,
    isLoading,
    isSyncing,
    isAuthenticated,
    saveData,
    reloadData: refreshSports,
  } = useFirebaseStorage<Sport[]>(
    SPORTS_STORAGE_KEY,
    "sports",
    INITIAL_SPORTS_DATA,
    { syncOnMount: false },
  );

  const addSport = useCallback(
    async (name: string, icon: IconInfo) => {
      if (!name.trim()) return;

      const newSport: Sport = {
        id: `sport_${Date.now()}`,
        name: name.trim(),
        icon: icon.name as any,
        library: icon.library,
      };

      const updatedSports = [...(sports || INITIAL_SPORTS_DATA), newSport];
      await saveData(updatedSports);

      ToastPresets.success(
        "Esporte adicionado!",
        `${name} foi salvo na sua lista.`,
      );
    },
    [sports, saveData],
  );

  const deleteSport = useCallback(
    async (sportId: string) => {
      // Apenas "Academia" não pode ser removida.
      if (sportId === "academia") {
        ToastPresets.error(
          "Não é possível remover",
          'A "Academia" é um esporte padrão.',
        );
        return;
      }

      const currentSports = sports || INITIAL_SPORTS_DATA;
      const sportToDelete = currentSports.find((s) => s.id === sportId);
      const updatedSports = currentSports.filter(
        (sport) => sport.id !== sportId,
      );
      await saveData(updatedSports);

      ToastPresets.info(
        "Esporte removido",
        `${sportToDelete?.name || "Esporte"} foi excluído da lista.`,
      );
    },
    [sports, saveData],
  );

  return {
    sports: sports || INITIAL_SPORTS_DATA,
    isLoading,
    isSyncing,
    isAuthenticated,
    addSport,
    deleteSport,
    refreshSports,
  };
}
