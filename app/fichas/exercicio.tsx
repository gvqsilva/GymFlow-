// app/fichas/exercicio-simple.tsx
// Versão simplificada sem gráfico para debug

import AsyncStorage from "@react-native-async-storage/async-storage";
import { Stack, useFocusEffect, useLocalSearchParams } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ExerciseLoadChart, {
    LoadPoint,
} from "../../components/ExerciseLoadChart";
import {
    catalogToWorkoutExercise,
    getExerciseById,
    getExerciseGif,
} from "../../constants/exercisesData";
import { useWorkouts } from "../../hooks/useWorkouts";

const themeColor = "#5a4fcf";

export default function ExerciseDetailScreen() {
  const params = useLocalSearchParams<{
    workoutId: string | string[];
    exerciseId: string | string[];
  }>();
  const workoutId = Array.isArray(params.workoutId)
    ? params.workoutId[0]
    : params.workoutId;
  const exerciseId = Array.isArray(params.exerciseId)
    ? params.exerciseId[0]
    : params.exerciseId;
  const { workouts, isLoading: workoutsLoading } = useWorkouts();
  const [history, setHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [error, setError] = useState<string | null>(null);

  console.log("🏃‍♂️ [ExerciseDetail] Parâmetros recebidos:", {
    workoutId,
    exerciseId,
  });

  useFocusEffect(
    useCallback(() => {
      const loadHistory = async () => {
        try {
          console.log("📊 [ExerciseDetail] Carregando histórico...");
          setIsLoading(true);
          setError(null);
          const historyJSON = await AsyncStorage.getItem("workoutHistory");
          const historyData = historyJSON ? JSON.parse(historyJSON) : [];
          setHistory(historyData);
          console.log(
            "✅ [ExerciseDetail] Histórico carregado:",
            historyData.length,
            "entradas",
          );
        } catch (error) {
          console.error(
            "❌ [ExerciseDetail] Erro ao carregar histórico:",
            error,
          );
          setError(`Erro ao carregar histórico: ${error}`);
          setHistory([]);
        } finally {
          setIsLoading(false);
        }
      };
      loadHistory();
    }, []),
  );

  // Buscar exercício com logs detalhados
  const exercise = useMemo(() => {
    try {
      console.log("🔍 [ExerciseDetail] Buscando exercício...");
      console.log(
        "🏋️‍♂️ [ExerciseDetail] Workouts disponíveis:",
        Object.keys(workouts || {}),
      );

      if (!workoutId || !exerciseId) {
        console.warn("⚠️ [ExerciseDetail] IDs faltando:", {
          workoutId,
          exerciseId,
        });
        setError("IDs de workout ou exercício não fornecidos");
        return null;
      }

      const workout = workoutId ? workouts?.[workoutId] : undefined;
      if (!workout) {
        console.warn("⚠️ [ExerciseDetail] Workout não encontrado:", workoutId);
        setError(`Workout não encontrado: ${workoutId}`);
        return null;
      }

      console.log("🏋️‍♂️ [ExerciseDetail] Workout encontrado:", workout.name);
      console.log(
        "🏋️‍♂️ [ExerciseDetail] Exercícios no workout:",
        workout.exercises?.length || 0,
      );

      const foundExercise = workout.exercises?.find(
        (ex: any) => String(ex.id) === String(exerciseId),
      );
      if (!foundExercise) {
        console.warn(
          "⚠️ [ExerciseDetail] Exercício não encontrado no workout, tentando catálogo:",
          exerciseId,
        );
        console.log(
          "🔍 [ExerciseDetail] IDs disponíveis:",
          workout.exercises?.map((ex: any) => ex.id) || [],
        );

        const catalogExercise = exerciseId
          ? getExerciseById(String(exerciseId))
          : null;
        if (!catalogExercise) {
          console.warn(
            "⚠️ [ExerciseDetail] Exercício também não encontrado no catálogo:",
            exerciseId,
          );
          setError(`Exercício não encontrado: ${exerciseId}`);
          return null;
        }

        const fallback = catalogToWorkoutExercise(catalogExercise);
        console.log(
          "✅ [ExerciseDetail] Exercício reconstruído a partir do catálogo:",
          fallback.name,
        );
        setError(null);
        return fallback;
      }

      console.log(
        "✅ [ExerciseDetail] Exercício encontrado:",
        foundExercise.name,
      );
      console.log(
        "📋 [ExerciseDetail] Estrutura do exercício:",
        Object.keys(foundExercise),
      );

      setError(null);
      return foundExercise;
    } catch (error) {
      console.error("❌ [ExerciseDetail] Erro ao buscar exercício:", error);
      setError(`Erro crítico: ${error}`);
      return null;
    }
  }, [workouts, workoutId, exerciseId]);

  // Calcular recorde pessoal simples
  const personalRecord = useMemo(() => {
    try {
      if (!exerciseId || history.length === 0) {
        console.log("📊 [ExerciseDetail] Sem dados para calcular PR");
        return null;
      }

      const targetExerciseId = String(exerciseId);

      const weights = history
        .filter(
          (entry) =>
            entry.category === "Musculação" &&
            entry.details?.performance?.[targetExerciseId] !== undefined,
        )
        .map((entry) => {
          const weight = entry.details.performance[targetExerciseId];
          return typeof weight === 'number' ? weight : parseFloat(String(weight).replace(",", "."));
        })
        .filter((weight) => !isNaN(weight) && weight > 0);

      const record = weights.length > 0 ? Math.max(...weights) : null;
      console.log(
        "🏆 [ExerciseDetail] Recorde pessoal calculado:",
        record,
        "kg de",
        weights.length,
        "registros",
      );
      return record;
    } catch (error) {
      console.error("❌ [ExerciseDetail] Erro ao calcular PR:", error);
      return null;
    }
  }, [history, exerciseId]);

  const handleImageError = (error: any) => {
    console.warn(
      "⚠️ [ExerciseDetail] Erro ao carregar imagem:",
      error?.nativeEvent?.error || "Erro desconhecido",
    );
    setImageError(true);
  };

  // Debug: listar IDs únicos disponíveis no histórico
  const availableExerciseIds = useMemo(() => {
    if (!history || history.length === 0) return [];
    
    return history
      .filter(e => e.category === "Musculação" && e.details?.performance)
      .flatMap(e => Object.keys(e.details?.performance || {}))
      .filter((v, i, a) => a.indexOf(v) === i) // unique
      .sort();
  }, [history]);

  // Série temporal para o gráfico de progresso
  const seriesData: LoadPoint[] = useMemo(() => {
    try {
      if (!exerciseId || history.length === 0) {
        console.log(
          "📊 [ExerciseDetail] Sem dados para série (exerciseId:",
          exerciseId,
          ", histórico:",
          history.length,
          ")",
        );
        return [];
      }

      // Normalizar exerciseId para string
      const targetExerciseId = String(exerciseId);
      console.log("🎯 [ExerciseDetail] Procurando pelo ID:", targetExerciseId);

      // Filtrar entradas de musculação
      const musculationEntries = history.filter(
        (entry) => entry.category === "Musculação" && entry.details?.performance
      );

      console.log(
        "📊 [ExerciseDetail] Entradas de musculação:",
        musculationEntries.length,
        "de",
        history.length,
      );

      // Debug: mostrar TODOS os IDs disponíveis
      if (musculationEntries.length > 0) {
        const allPerformanceKeys = musculationEntries
          .flatMap(e => Object.keys(e.details?.performance || {}))
          .filter((v, i, a) => a.indexOf(v) === i); // unique
        
        console.log(
          "🔍 [ExerciseDetail] TODOS os IDs de exercício disponíveis no histórico:",
          allPerformanceKeys
        );
        console.log(
          "🔍 [ExerciseDetail] Procurando por:",
          targetExerciseId,
          "Está na lista?",
          allPerformanceKeys.includes(targetExerciseId)
        );
      }

      // Filtrar e agrupar por data
      const byDate: Record<string, number> = {};
      
      musculationEntries.forEach((entry, entryIndex) => {
        try {
          const performance = entry.details?.performance || {};
          
          // Debug: mostrar o que tem nesta entrada
          if (entryIndex < 3) {
            console.log(
              `🔎 [ExerciseDetail] Entrada ${entryIndex} (${entry.date}):`, 
              Object.keys(performance)
            );
          }
          
          // Procurar pelo exerciseId (comparando como string)
          const weight = performance[targetExerciseId];
          
          if (weight !== undefined && weight !== null) {
            const dateStr = String(entry.date);
            const weightNum = typeof weight === 'number' ? weight : parseFloat(String(weight).replace(",", "."));

            if (!isNaN(weightNum) && weightNum > 0) {
              byDate[dateStr] = Math.max(byDate[dateStr] || 0, weightNum);
              console.log(`✅ [ExerciseDetail] Peso encontrado: ${dateStr} -> ${weightNum}kg`);
            }
          }
        } catch (e) {
          console.warn("⚠️ [ExerciseDetail] Erro ao processar entrada:", e);
        }
      });

      const result = Object.entries(byDate)
        .map(([date, weight]) => ({ date, weight }))
        .sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
        );

      console.log(
        "📊 [ExerciseDetail] Série final:",
        result.length,
        "pontos",
      );
      console.log(
        "📊 [ExerciseDetail] Dados da série:",
        JSON.stringify(result, null, 2)
      );
      
      // Validar estrutura de cada ponto
      result.forEach((point, idx) => {
        console.log(`  Ponto ${idx}:`, {
          date: point.date,
          dateType: typeof point.date,
          weight: point.weight,
          weightType: typeof point.weight,
          isValid: point.date && point.weight && !isNaN(Number(point.weight))
        });
      });
      
      return result;
    } catch (e) {
      console.error("❌ [ExerciseDetail] Falha ao montar série do gráfico:", e);
      return [];
    }
  }, [history, exerciseId]);

  // Loading state para workouts
  if (workoutsLoading) {
    console.log("⏳ [ExerciseDetail] Carregando workouts...");
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={themeColor} />
        <Text style={styles.loadingText}>Carregando treinos... </Text>
      </View>
    );
  }

  // Mostrar erro se houver
  if (error) {
    return (
      <SafeAreaView style={[styles.container, styles.centerContent]}>
        <Stack.Screen options={{ title: "Erro" }} />
        <Text style={styles.errorText}>⚠️ Erro</Text>
        <Text style={styles.errorSubtext}>{error}</Text>
        <Text style={styles.errorSubtext}>workout: {workoutId}</Text>
        <Text style={styles.errorSubtext}>exercise: {exerciseId}</Text>
        <Text style={styles.errorSubtext}>
          Workouts disponíveis: {Object.keys(workouts || {}).join(", ")}
        </Text>
      </SafeAreaView>
    );
  }

  // Exercício não encontrado
  if (!exercise) {
    console.error(
      "❌ [ExerciseDetail] Exercício não encontrado para renderização",
    );
    return (
      <SafeAreaView style={[styles.container, styles.centerContent]}>
        <Stack.Screen options={{ title: "Exercício não encontrado" }} />
        <Text style={styles.errorText}>❌ Exercício não encontrado!</Text>
        <Text style={styles.errorSubtext}>workout: {workoutId} </Text>
        <Text style={styles.errorSubtext}>exercise: {exerciseId} </Text>
        <Text style={styles.errorSubtext}>
          Workouts disponíveis: {Object.keys(workouts || {}).join(", ")}{" "}
        </Text>
      </SafeAreaView>
    );
  }

  console.log("✅ [ExerciseDetail] Renderizando exercício:", exercise.name);

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: exercise.name }} />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* HERO com imagem e overlay */}
        <View style={styles.heroContainer}>
          <View style={styles.heroMedia}>
            {(() => {
              const exerciseGif = getExerciseGif(exercise.id);
              return !imageError && exerciseGif ? (
                <Image
                  source={exerciseGif}
                  style={styles.heroImage}
                  resizeMode="contain"
                  onError={handleImageError}
                />
              ) : (
                <View style={[styles.heroImage, styles.heroPlaceholder]}>
                  <Text style={styles.heroPlaceholderEmoji}>💪</Text>{" "}
                </View>
              );
            })()}
            {/* Removido overlay para mostrar imagem inteira */}
            <View style={styles.heroContent}>
              <Text style={styles.heroTitle} numberOfLines={2}>
                {exercise.name}{" "}
              </Text>
              <View style={styles.chipsRow}>
                <InfoChip label="Músculo" value={exercise.muscle} />
                <InfoChip label="Séries" value={String(exercise.series)} />
                <InfoChip label="Reps" value={exercise.reps} />
              </View>
            </View>
          </View>
        </View>

        {/* Observações do exercício */}
        {exercise.obs ? (
          <SectionCard title="📝 Observações">
            <Text style={styles.obsText}>{exercise.obs} </Text>
          </SectionCard>
        ) : null}

        {/* Gráfico de progressão de carga */}
        <SectionCard
          title={`📈 Progressão de Carga ${seriesData.length > 0 ? `(${seriesData.length} registros)` : ""}`}
        >
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color={themeColor} />
              <Text style={styles.loadingText}>Carregando histórico... </Text>
            </View>
          ) : seriesData.length > 0 ? (
            <SafeChartWrapper data={seriesData} />
          ) : (
            <View style={styles.noPrContainer}>
              <Text style={styles.noDataText}>
                📊 Sem dados para este exercício
              </Text>
              <Text style={styles.noDataSubtext}>
                {availableExerciseIds.length > 0 
                  ? `✅ Você tem ${availableExerciseIds.length} exercício(s) com dados, mas não este.`
                  : "❌ Nenhum exercício com peso registrado ainda."}
              </Text>
              <Text style={styles.noDataSubtext}>
                💡 Registre pesos ao fazer treinos para ver a evolução
              </Text>
            </View>
          )}
        </SectionCard>

        {/* Debug e ações removidos conforme pedido */}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f2f5",
  },
  centerContent: {
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  sectionContainer: {
    margin: 20,
    padding: 20,
    backgroundColor: "white",
    borderRadius: 15,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 20,
    textAlign: "center",
  },
  heroContainer: {
    margin: 20,
  },
  heroMedia: {
    width: "100%",
    aspectRatio: 1.1, // leve retângulo para GIFs verticais/quadrados
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  heroPlaceholder: {
    justifyContent: "center",
    alignItems: "center",
  },
  heroPlaceholderEmoji: {
    fontSize: 42,
  },
  // Overlay removido para mostrar GIF completo
  heroContent: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 12,
    backgroundColor: "rgba(0,0,0,0.35)",
    padding: 12,
    borderRadius: 12,
    backdropFilter: "blur(4px)", // ignorado em RN, apenas documentação
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "white",
    marginBottom: 8,
    textShadowColor: "rgba(0,0,0,0.4)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  warningBox: {
    backgroundColor: "#fff3cd",
    padding: 10,
    borderRadius: 6,
    marginVertical: 10,
    borderLeftWidth: 3,
    borderLeftColor: "#ffc107",
  },
  warningText: {
    fontSize: 12,
    color: "#856404",
    textAlign: "center",
  },
  lastLoadContainer: {
    backgroundColor: '#4caf50',
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lastLoadLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    opacity: 0.9,
    marginBottom: 8,
  },
  lastLoadWeight: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  lastLoadDate: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.85,
  },
  simpleChartContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  simpleChartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  statsRowSimple: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  statBoxSimple: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  statLabelSimple: {
    fontSize: 11,
    color: '#666',
    marginBottom: 4,
  },
  statValueSimple: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#5a4fcf',
  },
  dataPointsList: {
    gap: 8,
  },
  dataPointRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fff',
    padding: 8,
    borderRadius: 6,
  },
  dataPointDate: {
    fontSize: 12,
    color: '#666',
    width: 50,
  },
  dataPointBar: {
    flex: 1,
    height: 20,
    backgroundColor: '#eee',
    borderRadius: 4,
    overflow: 'hidden',
  },
  dataPointBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  dataPointWeight: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#333',
    width: 60,
    textAlign: 'right',
  },
  simpleChartFooter: {
    fontSize: 11,
    color: '#999',
    textAlign: 'center',
    marginTop: 12,
  },
  placeholderContainer: {
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  placeholderEmoji: {
    fontSize: 48,
    marginBottom: 10,
  },
  noDataText: {
    color: "gray",
    fontStyle: "italic",
    textAlign: "center",
    paddingVertical: 10,
    fontSize: 14,
  },
  noDataSubtext: {
    color: "#999",
    fontSize: 12,
    textAlign: "center",
    marginTop: 5,
  },
  loadingContainer: {
    padding: 20,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    color: "gray",
    fontSize: 14,
  },
  errorText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ff4757",
    textAlign: "center",
    marginBottom: 10,
  },
  errorSubtext: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
    marginBottom: 5,
  },
  prContainer: {
    alignItems: "center",
    padding: 20,
  },
  prText: {
    fontSize: 32,
    fontWeight: "bold",
    color: themeColor,
    textAlign: "center",
    marginBottom: 5,
  },
  prSubtext: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  noPrContainer: {
    alignItems: "center",
    padding: 20,
  },
  obsText: {
    fontSize: 15,
    color: "#444",
    lineHeight: 22,
  },
});

// Componentes auxiliares
function InfoChip({ label, value }: { label: string; value: string }) {
  return (
    <View style={chipStyles.chipContainer}>
      <Text style={chipStyles.chipLabel}>{label}</Text>
      <Text style={chipStyles.chipValue}>{value}</Text>
    </View>
  );
}

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function SafeChartWrapper({ data }: { data: LoadPoint[] }) {
  console.log("📊 SafeChartWrapper recebeu", data?.length || 0, "pontos");
  console.log("📊 SafeChartWrapper dados:", JSON.stringify(data, null, 2));

  if (!data || data.length === 0) {
    console.warn("⚠️ SafeChartWrapper: dados vazios ou undefined");
    return (
      <View style={styles.noPrContainer}>
        <Text style={styles.noDataText}>📊 Sem dados de evolução</Text>
        <Text style={styles.noDataSubtext}>
          Registre cargas com peso para ver o gráfico
        </Text>
      </View>
    );
  }

  console.log("✅ SafeChartWrapper: passando", data.length, "pontos para ExerciseLoadChart");
  
  // Calcular estatísticas
  const maxWeight = Math.max(...data.map(d => typeof d.weight === 'number' ? d.weight : parseFloat(String(d.weight))));
  const minWeight = Math.min(...data.map(d => typeof d.weight === 'number' ? d.weight : parseFloat(String(d.weight))));
  
  // Última carga (mais recente)
  const lastEntry = data[data.length - 1];
  const lastWeight = typeof lastEntry.weight === 'number' ? lastEntry.weight : parseFloat(String(lastEntry.weight));
  const lastDate = new Date(lastEntry.date).toLocaleDateString('pt-BR', { 
    day: '2-digit', 
    month: 'long',
    year: 'numeric'
  });
  
  return (
    <>
      {/* Última Carga - Destaque */}
      <View style={styles.lastLoadContainer}>
        <Text style={styles.lastLoadLabel}>💪 Última Carga Registrada</Text>
        <Text style={styles.lastLoadWeight}>{lastWeight.toFixed(1)} kg</Text>
        <Text style={styles.lastLoadDate}>{lastDate}</Text>
      </View>

      {/* Tabela simples de dados */}
      <View style={styles.simpleChartContainer}>
        <Text style={styles.simpleChartTitle}>📊 Evolução de Carga</Text>
        
        <View style={styles.statsRowSimple}>
          <View style={styles.statBoxSimple}>
            <Text style={styles.statLabelSimple}>Menor</Text>
            <Text style={styles.statValueSimple}>{minWeight.toFixed(1)} kg</Text>
          </View>
          <View style={styles.statBoxSimple}>
            <Text style={styles.statLabelSimple}>Recorde</Text>
            <Text style={[styles.statValueSimple, { color: '#ff9800' }]}>{maxWeight.toFixed(1)} kg</Text>
          </View>
          <View style={styles.statBoxSimple}>
            <Text style={styles.statLabelSimple}>Evolução</Text>
            <Text style={[styles.statValueSimple, { color: maxWeight > minWeight ? '#4caf50' : '#999' }]}>
              +{(maxWeight - minWeight).toFixed(1)} kg
            </Text>
          </View>
        </View>

        <View style={styles.dataPointsList}>
          {data.slice(-10).reverse().map((point, idx) => {
            const weightNum = typeof point.weight === 'number' ? point.weight : parseFloat(String(point.weight));
            const dateStr = new Date(point.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
            const isMax = weightNum === maxWeight;
            
            return (
              <View key={idx} style={styles.dataPointRow}>
                <Text style={styles.dataPointDate}>{dateStr}</Text>
                <View style={styles.dataPointBar}>
                  <View 
                    style={[
                      styles.dataPointBarFill, 
                      { 
                        width: `${((weightNum - minWeight) / (maxWeight - minWeight || 1)) * 100}%`,
                        backgroundColor: isMax ? '#ff9800' : (idx === 0 ? '#4caf50' : '#5a4fcf')
                      }
                    ]} 
                  />
                </View>
                <Text style={styles.dataPointWeight}>
                  {weightNum.toFixed(1)} kg {isMax ? '🏆' : ''}
                </Text>
              </View>
            );
          })}
        </View>
        
        <Text style={styles.simpleChartFooter}>
          {data.length} registro{data.length > 1 ? 's' : ''} encontrado{data.length > 1 ? 's' : ''}
        </Text>
      </View>
    </>
  );
}

const chipStyles = StyleSheet.create({
  chipContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.6)",
  },
  chipLabel: {
    fontSize: 11,
    color: "#666",
    marginRight: 6,
    fontWeight: "600",
  },
  chipValue: {
    fontSize: 12,
    color: "#111",
    fontWeight: "700",
  },
});
