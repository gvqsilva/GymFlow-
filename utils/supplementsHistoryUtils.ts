export type SupplementsHistoryByDate = Record<
  string,
  Record<string, boolean | number>
>;

const isObject = (value: unknown): value is Record<string, any> =>
  !!value && typeof value === "object" && !Array.isArray(value);

const isDateKey = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value);

export const normalizeSupplementsHistoryByDate = (
  rawHistory: unknown,
): SupplementsHistoryByDate => {
  const normalized: SupplementsHistoryByDate = {};

  if (!isObject(rawHistory)) {
    return normalized;
  }

  Object.entries(rawHistory).forEach(([key, value]) => {
    if (!isDateKey(key) || !isObject(value)) return;

    const dateBucket: Record<string, boolean | number> = {};
    Object.entries(value).forEach(([supplementId, status]) => {
      if (typeof status === "boolean" || typeof status === "number") {
        dateBucket[supplementId] = status;
      }
    });

    if (Object.keys(dateBucket).length > 0) {
      normalized[key] = dateBucket;
    }
  });

  Object.values(rawHistory).forEach((entry) => {
    if (!isObject(entry)) return;

    const date = typeof entry.date === "string" ? entry.date : null;
    const supplementId =
      typeof entry.supplementId === "string" ? entry.supplementId : null;
    if (!date || !supplementId) return;

    if (!normalized[date]) {
      normalized[date] = {};
    }

    if (typeof entry.timesTaken === "number") {
      normalized[date][supplementId] = Math.max(0, entry.timesTaken);
      return;
    }

    if (typeof entry.taken === "boolean") {
      normalized[date][supplementId] = entry.taken;
    }
  });

  return normalized;
};

export const upsertSupplementValueByDate = (
  currentHistory: SupplementsHistoryByDate,
  date: string,
  supplementId: string,
  value: boolean | number,
): SupplementsHistoryByDate => {
  const next: SupplementsHistoryByDate = JSON.parse(
    JSON.stringify(currentHistory || {}),
  );

  if (!next[date]) {
    next[date] = {};
  }

  if (value === false || value === 0) {
    delete next[date][supplementId];
  } else {
    next[date][supplementId] = value;
  }

  if (Object.keys(next[date]).length === 0) {
    delete next[date];
  }

  return next;
};
