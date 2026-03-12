// hooks/useBodyMeasurements.ts

import { useCallback } from "react";
import { useFirebaseStorage } from "./useFirebaseStorage";

export interface BodyMeasurement {
  torax: number; // cm
  braco: number; // cm
  cintura: number; // cm
  abdomen: number; // cm
  quadril: number; // cm
  coxa: number; // cm
}

export interface MeasurementEntry {
  date: string;
  measurements: BodyMeasurement;
  notes?: string;
}

export interface BodyMeasurementsData {
  entries: MeasurementEntry[];
  lastUpdate: string;
}

const BODY_MEASUREMENTS_STORAGE_KEY = "user_body_measurements";

const DEFAULT_BODY_MEASUREMENTS: BodyMeasurementsData = {
  entries: [],
  lastUpdate: new Date().toISOString(),
};

const MEASUREMENT_LABELS = {
  torax: "🫀 Tórax",
  braco: "💪 Braço",
  cintura: "👖 Cintura",
  quadril: "🍑 Quadril",
  coxa: "🦵 Coxa",
  abdomen: "🤰 Abdômen",
};

export function useBodyMeasurements() {
  const {
    data: measurementsData,
    isLoading,
    isSyncing,
    saveData,
    reloadData,
    forcSync: forceSync,
  } = useFirebaseStorage<BodyMeasurementsData>(
    BODY_MEASUREMENTS_STORAGE_KEY,
    "bodyMeasurements",
    DEFAULT_BODY_MEASUREMENTS,
    { syncOnMount: true },
  );

  const addMeasurement = useCallback(
    async (measurements: BodyMeasurement, notes?: string) => {
      const currentData = measurementsData || DEFAULT_BODY_MEASUREMENTS;
      const today = new Date().toISOString().split("T")[0];

      const newEntry: MeasurementEntry = {
        date: today,
        measurements,
        notes,
      };

      const updatedEntries = [newEntry, ...currentData.entries];

      // Manter apenas últimos 100 registros
      const trimmedEntries = updatedEntries.slice(0, 100);

      const updatedData: BodyMeasurementsData = {
        entries: trimmedEntries,
        lastUpdate: new Date().toISOString(),
      };

      await saveData(updatedData);
      console.log("✅ Medidas adicionadas com sucesso");
    },
    [measurementsData, saveData],
  );

  const updateMeasurement = useCallback(
    async (index: number, measurements: BodyMeasurement, notes?: string) => {
      const currentData = measurementsData || DEFAULT_BODY_MEASUREMENTS;

      if (index < 0 || index >= currentData.entries.length) {
        console.warn("⚠️ Índice inválido");
        return;
      }

      const updatedEntries = [...currentData.entries];
      updatedEntries[index] = {
        date: updatedEntries[index].date,
        measurements,
        notes: notes || updatedEntries[index].notes,
      };

      const updatedData: BodyMeasurementsData = {
        entries: updatedEntries,
        lastUpdate: new Date().toISOString(),
      };

      await saveData(updatedData);
      console.log("✅ Medidas atualizadas");
    },
    [measurementsData, saveData],
  );

  const deleteMeasurement = useCallback(
    async (index: number) => {
      const currentData = measurementsData || DEFAULT_BODY_MEASUREMENTS;

      if (index < 0 || index >= currentData.entries.length) {
        console.warn("⚠️ Índice inválido");
        return;
      }

      const updatedEntries = currentData.entries.filter((_, i) => i !== index);

      const updatedData: BodyMeasurementsData = {
        entries: updatedEntries,
        lastUpdate: new Date().toISOString(),
      };

      await saveData(updatedData);
      console.log("✅ Medidas removidas");
    },
    [measurementsData, saveData],
  );

  const getLatestMeasurement = useCallback(() => {
    const currentData = measurementsData || DEFAULT_BODY_MEASUREMENTS;
    return currentData.entries.length > 0 ? currentData.entries[0] : null;
  }, [measurementsData]);

  const getMeasurementProgress = useCallback(
    (
      key: keyof BodyMeasurement,
    ): { current: number; previous: number; difference: number } | null => {
      const currentData = measurementsData || DEFAULT_BODY_MEASUREMENTS;

      if (currentData.entries.length < 2) {
        return null;
      }

      const current = currentData.entries[0].measurements[key] as number;
      const previous = currentData.entries[1].measurements[key] as number;
      const difference = current - previous;

      return { current, previous, difference };
    },
    [measurementsData],
  );

  const getMeasurementHistory = useCallback(
    (key: keyof BodyMeasurement, days: number = 30) => {
      const currentData = measurementsData || DEFAULT_BODY_MEASUREMENTS;
      const today = new Date();
      const cutoffDate = new Date(today.getTime() - days * 24 * 60 * 60 * 1000);

      return currentData.entries
        .filter((entry) => new Date(entry.date) >= cutoffDate)
        .map((entry) => ({
          date: entry.date,
          value: entry.measurements[key] as number,
        }))
        .reverse();
    },
    [measurementsData],
  );

  const refreshMeasurements = useCallback(async () => {
    await reloadData();
    await forceSync();
  }, [reloadData, forceSync]);

  return {
    measurementsData: measurementsData || DEFAULT_BODY_MEASUREMENTS,
    isLoading,
    isSyncing,
    addMeasurement,
    updateMeasurement,
    deleteMeasurement,
    getLatestMeasurement,
    getMeasurementProgress,
    getMeasurementHistory,
    refreshMeasurements,
    measurementLabels: MEASUREMENT_LABELS,
  };
}
