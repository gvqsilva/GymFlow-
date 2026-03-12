export type RunningGoal =
  | "resistencia"
  | "velocidade"
  | "perda_peso"
  | "5k"
  | "10k"
  | "meia_maratona"
  | "maratona";

export type RunningLevel = "iniciante" | "intermediario" | "avancado";

export type RunningSessionType =
  | "corrida_leve"
  | "regenerativo"
  | "intervalado"
  | "fartlek"
  | "subida"
  | "tempo"
  | "longao";

export interface RunningHistoryInput {
  plannedSessionsLast2Weeks?: number;
  completedSessionsLast2Weeks?: number;
  averageEffortRpe?: number;
  injuryOrPain?: boolean;
}

export interface RunningPlanInput {
  goal: RunningGoal;
  level: RunningLevel;
  weeklyFrequency: number;
  availableMinutesPerWorkout: number;
  preferredSessionTypes?: RunningSessionType[];
  history?: RunningHistoryInput;
  weekNumber?: number;
}

export interface RunningPlanSession {
  day: string;
  type: RunningSessionType;
  warmupMin: number;
  mainMin: number;
  cooldownMin: number;
  totalMin: number;
  estimatedDistanceKm: number;
  intensity: "leve" | "moderado" | "forte";
  details: string;
  tips: string[];
}

export interface RunningPlanWeek {
  goal: RunningGoal;
  level: RunningLevel;
  weeklyFrequency: number;
  availableMinutesPerWorkout: number;
  weekNumber: number;
  sessions: RunningPlanSession[];
  notes: string[];
}

const DAYS_BY_FREQUENCY: Record<number, string[]> = {
  2: ["Terça", "Sábado"],
  3: ["Segunda", "Quarta", "Sábado"],
  4: ["Segunda", "Terça", "Quinta", "Sábado"],
  5: ["Segunda", "Terça", "Quinta", "Sábado", "Domingo"],
  6: ["Segunda", "Terça", "Quarta", "Quinta", "Sábado", "Domingo"],
};

const LEVEL_FREQUENCY_LIMITS: Record<RunningLevel, { min: number; max: number }> =
  {
    iniciante: { min: 2, max: 3 },
    intermediario: { min: 3, max: 5 },
    avancado: { min: 5, max: 6 },
  };

const LEVEL_DURATION_LIMITS: Record<RunningLevel, { min: number; max: number }> = {
  iniciante: { min: 20, max: 40 },
  intermediario: { min: 30, max: 60 },
  avancado: { min: 40, max: 90 },
};

const PACE_MIN_PER_KM: Record<
  RunningLevel,
  Record<"leve" | "moderado" | "forte", number>
> = {
  iniciante: { leve: 8, moderado: 7, forte: 6.2 },
  intermediario: { leve: 6.5, moderado: 5.6, forte: 4.9 },
  avancado: { leve: 5.6, moderado: 4.8, forte: 4.1 },
};

const GOAL_PRIMARY: Record<RunningGoal, RunningSessionType> = {
  resistencia: "longao",
  velocidade: "intervalado",
  perda_peso: "fartlek",
  "5k": "intervalado",
  "10k": "tempo",
  meia_maratona: "longao",
  maratona: "longao",
};

const GOAL_SECONDARY: Record<RunningGoal, RunningSessionType> = {
  resistencia: "corrida_leve",
  velocidade: "subida",
  perda_peso: "intervalado",
  "5k": "tempo",
  "10k": "intervalado",
  meia_maratona: "tempo",
  maratona: "tempo",
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function getWarmupByLevel(level: RunningLevel): number {
  if (level === "avancado") return 12;
  if (level === "intermediario") return 8;
  return 6;
}

function getCooldownByLevel(level: RunningLevel): number {
  if (level === "avancado") return 10;
  if (level === "intermediario") return 8;
  return 6;
}

function normalizeFrequency(input: RunningPlanInput): number {
  const limits = LEVEL_FREQUENCY_LIMITS[input.level];
  return clamp(Math.round(input.weeklyFrequency), limits.min, limits.max);
}

function normalizeDuration(input: RunningPlanInput): number {
  const limits = LEVEL_DURATION_LIMITS[input.level];
  return clamp(Math.round(input.availableMinutesPerWorkout), limits.min, limits.max);
}

function getProgressionFactor(weekNumber: number): number {
  if (weekNumber > 0 && weekNumber % 4 === 0) {
    return 0.85;
  }
  const bounded = clamp(weekNumber, 1, 8);
  return 1 + (bounded - 1) * 0.04;
}

function getHistoryAdjustment(history?: RunningHistoryInput): number {
  if (!history) return 1;

  if (history.injuryOrPain) return 0.8;

  const planned = Number(history.plannedSessionsLast2Weeks || 0);
  const completed = Number(history.completedSessionsLast2Weeks || 0);
  const adherence = planned > 0 ? completed / planned : 1;

  let factor = 1;
  if (adherence < 0.6) factor -= 0.12;
  else if (adherence < 0.8) factor -= 0.06;

  const avgRpe = Number(history.averageEffortRpe || 0);
  if (avgRpe >= 8) factor -= 0.08;

  return clamp(factor, 0.75, 1.08);
}

function buildBasePattern(frequency: number): RunningSessionType[] {
  if (frequency === 2) return ["corrida_leve", "longao"];
  if (frequency === 3) return ["corrida_leve", "intervalado", "longao"];
  if (frequency === 4)
    return ["corrida_leve", "intervalado", "fartlek", "longao"];
  if (frequency === 5)
    return ["corrida_leve", "intervalado", "regenerativo", "tempo", "longao"];
  return ["corrida_leve", "intervalado", "regenerativo", "subida", "tempo", "longao"];
}

function applyGoalAndPreferences(
  basePattern: RunningSessionType[],
  input: RunningPlanInput,
): RunningSessionType[] {
  const primary = GOAL_PRIMARY[input.goal];
  const secondary = GOAL_SECONDARY[input.goal];
  const preferred = (input.preferredSessionTypes || []).filter(Boolean);

  const next = [...basePattern];

  const firstQualityIndex = next.findIndex(
    (t) => t === "intervalado" || t === "fartlek" || t === "tempo" || t === "subida",
  );
  if (firstQualityIndex >= 0) {
    next[firstQualityIndex] = primary;
  }

  const secondQualityIndex = next.findIndex(
    (t, idx) =>
      idx !== firstQualityIndex &&
      (t === "intervalado" || t === "fartlek" || t === "tempo" || t === "subida"),
  );
  if (secondQualityIndex >= 0) {
    next[secondQualityIndex] = secondary;
  }

  preferred.forEach((type) => {
    const replaceableIdx = next.findIndex(
      (t) => t === "corrida_leve" || t === "fartlek" || t === "tempo" || t === "subida",
    );
    if (replaceableIdx >= 0) {
      next[replaceableIdx] = type;
    }
  });

  return next;
}

function getIntensity(type: RunningSessionType): "leve" | "moderado" | "forte" {
  if (type === "regenerativo" || type === "corrida_leve") return "leve";
  if (type === "longao" || type === "fartlek" || type === "tempo") return "moderado";
  return "forte";
}

function getDetails(type: RunningSessionType, level: RunningLevel, mainMin: number): string {
  if (type === "intervalado") {
    if (level === "iniciante") return "4x400m forte com 2min trote entre séries";
    if (level === "intermediario") return "5x800m forte com 2-3min trote";
    return "6x1000m forte com 2-3min trote";
  }

  if (type === "subida") {
    if (level === "iniciante") return "6 repetições de 30s em subida leve";
    if (level === "intermediario") return "8 repetições de 45s em subida moderada";
    return "10 repetições de 60s em subida moderada/forte";
  }

  if (type === "fartlek") {
    return `Blocos alternando 1-3min forte e 2-3min leve por ${mainMin}min`;
  }

  if (type === "tempo") {
    return `Ritmo moderado/forte sustentado por ${Math.max(10, Math.floor(mainMin * 0.7))}min`;
  }

  if (type === "longao") {
    return "Ritmo confortável, foco em constância e técnica";
  }

  if (type === "regenerativo") {
    return "Ritmo muito leve, foco em recuperação ativa";
  }

  return "Ritmo leve com respiração controlada";
}

function getTips(intensity: "leve" | "moderado" | "forte"): string[] {
  if (intensity === "forte") {
    return [
      "Hidrate-se antes e após o treino",
      "Mantenha postura alta e passadas curtas",
      "Finalize com 5-10 min de desaquecimento",
    ];
  }

  if (intensity === "moderado") {
    return [
      "Controle a respiração em ritmo estável",
      "Evite começar rápido demais",
      "Faça mobilidade após o treino",
    ];
  }

  return [
    "Mantenha ritmo confortável (consegue conversar)",
    "Foque em técnica e cadência constante",
    "Respeite sinais de fadiga ou dor",
  ];
}

function buildSession(
  day: string,
  type: RunningSessionType,
  level: RunningLevel,
  targetDuration: number,
): RunningPlanSession {
  const warmupMin = getWarmupByLevel(level);
  const cooldownMin = getCooldownByLevel(level);
  const totalMin = Math.max(targetDuration, warmupMin + cooldownMin + 10);
  const mainMin = Math.max(10, totalMin - warmupMin - cooldownMin);
  const intensity = getIntensity(type);
  const pace = PACE_MIN_PER_KM[level][intensity];
  const estimatedDistanceKm = round1(mainMin / pace);

  return {
    day,
    type,
    warmupMin,
    mainMin,
    cooldownMin,
    totalMin,
    estimatedDistanceKm,
    intensity,
    details: getDetails(type, level, mainMin),
    tips: getTips(intensity),
  };
}

export function generateRunningPlan(input: RunningPlanInput): RunningPlanWeek {
  const normalizedFrequency = normalizeFrequency(input);
  const normalizedDuration = normalizeDuration(input);
  const weekNumber = clamp(Math.round(input.weekNumber || 1), 1, 52);

  const progression = getProgressionFactor(weekNumber);
  const historyAdjustment = getHistoryAdjustment(input.history);
  const durationFactor = progression * historyAdjustment;

  const basePattern = buildBasePattern(normalizedFrequency);
  const sessionTypes = applyGoalAndPreferences(basePattern, {
    ...input,
    weeklyFrequency: normalizedFrequency,
  });

  const days = DAYS_BY_FREQUENCY[normalizedFrequency] || DAYS_BY_FREQUENCY[3];
  const sessions = sessionTypes.map((type, index) => {
    let targetDuration = Math.round(normalizedDuration * durationFactor);

    if (type === "regenerativo") targetDuration = Math.round(targetDuration * 0.75);
    if (type === "longao") targetDuration = Math.round(targetDuration * 1.2);
    if (type === "intervalado" || type === "subida") {
      targetDuration = Math.round(targetDuration * 0.95);
    }

    const levelLimits = LEVEL_DURATION_LIMITS[input.level];
    targetDuration = clamp(targetDuration, levelLimits.min, levelLimits.max);

    return buildSession(days[index], type, input.level, targetDuration);
  });

  const notes: string[] = [
    "Plano gerado por regras fixas (determinístico).",
    "Ajuste de volume aplicado por semana e histórico recente.",
  ];

  if (input.history?.injuryOrPain) {
    notes.push("Carga reduzida por indicação de dor/lesão recente.");
  }

  if ((input.history?.averageEffortRpe || 0) >= 8) {
    notes.push("Intensidade atenuada por esforço percebido elevado (RPE).");
  }

  return {
    goal: input.goal,
    level: input.level,
    weeklyFrequency: normalizedFrequency,
    availableMinutesPerWorkout: normalizedDuration,
    weekNumber,
    sessions,
    notes,
  };
}

export function runningPlanToWeeklyPlanActivities(plan: RunningPlanWeek): Array<{
  day: string;
  period: "manha" | "tarde" | "noite";
  id: string;
  name: string;
  notes: string;
  emoji: string;
}> {
  return plan.sessions.map((session, index) => {
    const emoji =
      session.type === "longao"
        ? "🏃"
        : session.type === "intervalado"
          ? "⚡"
          : session.type === "subida"
            ? "⛰️"
            : session.type === "fartlek"
              ? "🎯"
              : session.type === "tempo"
                ? "🔥"
                : "🫁";

    return {
      day: session.day,
      period: "manha",
      id: `run-${session.type}-${index + 1}`,
      name: `Corrida ${session.type.replace("_", " ")}`,
      notes: `${session.totalMin}min • ~${session.estimatedDistanceKm}km • ${session.details}`,
      emoji,
    };
  });
}
