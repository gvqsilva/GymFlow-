// hooks/useWeeklyPlan.ts

import { useCallback, useEffect, useMemo, useState } from "react";
import { useFirebaseStorage } from "./useFirebaseStorage";

export type Period = "manha" | "tarde" | "noite";

export interface Activity {
  id: string;
  name: string;
  notes?: string;
  emoji?: string;
}

export interface DayPlan {
  day: string;
  periods: {
    manha: Activity[];
    tarde: Activity[];
    noite: Activity[];
  };
}

export type WeeklyPlan = DayPlan[];

const STORAGE_KEY = "weekly-plan";

const DAYS_OF_WEEK = [
  "Domingo",
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
];

const PERIOD_LABELS: Record<Period, string> = {
  manha: "🌅 Manhã",
  tarde: "🌤️ Tarde",
  noite: "🌙 Noite",
};

const createEmptyWeek = (): WeeklyPlan => {
  return DAYS_OF_WEEK.map((day) => ({
    day,
    periods: {
      manha: [],
      tarde: [],
      noite: [],
    },
  }));
};

const DEFAULT_DATA: WeeklyPlan = createEmptyWeek();

const getLocalDayKey = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export function useWeeklyPlan() {
  const {
    data: weeklyPlanData,
    isLoading,
    isSyncing,
    saveData: saveDataFirebase,
    reloadData,
  } = useFirebaseStorage<WeeklyPlan>(STORAGE_KEY, "weeklyPlan", DEFAULT_DATA, {
    syncOnMount: true,
  });

  // Memoizar weeklyPlan para garantir reatividade correta
  const weeklyPlan = useMemo(() => {
    return Array.isArray(weeklyPlanData) ? weeklyPlanData : DEFAULT_DATA;
  }, [weeklyPlanData]);

  const [localDayKey, setLocalDayKey] = useState(getLocalDayKey);

  useEffect(() => {
    const interval = setInterval(() => {
      const nextKey = getLocalDayKey();
      setLocalDayKey((prev) => (prev === nextKey ? prev : nextKey));
    }, 30 * 1000);

    return () => clearInterval(interval);
  }, []);

  // Plano de hoje
  const todayWeeklyPlan = useMemo(() => {
    const today = new Date();
    const dayIndex = today.getDay(); // 0=domingo, 6=sábado
    const dayPlan = weeklyPlan[dayIndex];

    if (!dayPlan) {
      return {
        day: DAYS_OF_WEEK[dayIndex],
        periods: { manha: [], tarde: [], noite: [] },
      };
    }

    return dayPlan;
  }, [weeklyPlan, localDayKey]);

  // Adicionar atividade
  const addActivityToDay = useCallback(
    async (
      dayIndex: number,
      period: Period,
      activityId: string,
      activityName: string,
      notes?: string,
      emoji?: string,
    ) => {
      if (!weeklyPlan || !Array.isArray(weeklyPlan)) {
        console.warn("⚠️ Plano semanal não encontrado");
        return;
      }

      const newWeeklyPlan = [...weeklyPlan];
      const dayPlan = newWeeklyPlan[dayIndex];

      if (!dayPlan) {
        console.warn("⚠️ Dia não encontrado");
        return;
      }

      // Evitar duplicatas
      if (dayPlan.periods[period].some((a) => a.id === activityId)) {
        console.warn("⚠️ Atividade já existe neste período");
        return;
      }

      const updatedDay: DayPlan = {
        ...dayPlan,
        periods: {
          ...dayPlan.periods,
          [period]: [
            ...dayPlan.periods[period],
            {
              id: activityId,
              name: activityName,
              ...(notes && notes.trim() ? { notes: notes.trim() } : {}),
              ...(emoji ? { emoji } : {}),
            },
          ],
        },
      };

      newWeeklyPlan[dayIndex] = updatedDay;
      await saveDataFirebase(newWeeklyPlan);
    },
    [weeklyPlan, saveDataFirebase],
  );

  // Remover atividade
  const removeActivityFromDay = useCallback(
    async (dayIndex: number, period: Period, activityId: string) => {
      if (!weeklyPlan || !Array.isArray(weeklyPlan)) {
        console.warn("⚠️ Plano semanal não encontrado");
        return;
      }

      const newWeeklyPlan = [...weeklyPlan];
      const dayPlan = newWeeklyPlan[dayIndex];

      if (!dayPlan) {
        console.warn("⚠️ Dia não encontrado");
        return;
      }

      const updatedActivities = dayPlan.periods[period].filter(
        (a) => a.id !== activityId,
      );

      const updatedDay: DayPlan = {
        ...dayPlan,
        periods: {
          ...dayPlan.periods,
          [period]: updatedActivities,
        },
      };

      newWeeklyPlan[dayIndex] = updatedDay;
      await saveDataFirebase(newWeeklyPlan);
    },
    [weeklyPlan, saveDataFirebase],
  );

  // Limpar período
  const clearPeriod = useCallback(
    async (dayIndex: number, period: Period) => {
      if (!weeklyPlan || !Array.isArray(weeklyPlan)) {
        console.warn("⚠️ Plano semanal não encontrado");
        return;
      }

      const newWeeklyPlan = [...weeklyPlan];
      const dayPlan = newWeeklyPlan[dayIndex];

      if (!dayPlan) return;

      const updatedDay: DayPlan = {
        ...dayPlan,
        periods: {
          ...dayPlan.periods,
          [period]: [],
        },
      };

      newWeeklyPlan[dayIndex] = updatedDay;
      await saveDataFirebase(newWeeklyPlan);
    },
    [weeklyPlan, saveDataFirebase],
  );

  // Limpar dia
  const clearDay = useCallback(
    async (dayIndex: number) => {
      if (!weeklyPlan || !Array.isArray(weeklyPlan)) {
        console.warn("⚠️ Plano semanal não encontrado");
        return;
      }

      const newWeeklyPlan = [...weeklyPlan];
      const dayPlan = newWeeklyPlan[dayIndex];

      if (!dayPlan) return;

      const updatedDay: DayPlan = {
        ...dayPlan,
        periods: {
          manha: [],
          tarde: [],
          noite: [],
        },
      };

      newWeeklyPlan[dayIndex] = updatedDay;
      await saveDataFirebase(newWeeklyPlan);
    },
    [weeklyPlan, saveDataFirebase],
  );

  // Limpar semana inteira
  const clearWeek = useCallback(async () => {
    await saveDataFirebase(createEmptyWeek());
  }, [saveDataFirebase]);

  return {
    // Dados
    weeklyPlan,
    todayWeeklyPlan,

    // Estados
    isLoading,
    isSyncing,

    // Ações
    addActivityToDay,
    removeActivityFromDay,
    clearPeriod,
    clearDay,
    clearWeek,
    reloadData,

    // Utilitários
    periodLabels: PERIOD_LABELS,
    daysOfWeek: DAYS_OF_WEEK,
  };
}
