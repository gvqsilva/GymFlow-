// app/(tabs)/historico.tsx

import AsyncStorage from "@react-native-async-storage/async-storage";
import { Stack } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import Toast from "react-native-toast-message";

import FoodDatabase from "../../data/foodData.json";
import { useFoodHistory } from "../../hooks/useFoodHistory";
import { useWorkoutHistory } from "../../hooks/useWorkoutHistory";
import { firebaseSyncService } from "../../services/firebaseSync";

const themeColor = "#5a4fcf";

// --- INTERFACES E TIPOS ---

type MealType = "Café" | "Almoço" | "Jantar" | "Lanche";
const MEAL_TYPES: MealType[] = ["Café", "Almoço", "Jantar", "Lanche"];

interface NutritionResult {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface FoodItem {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  measures?: Record<string, number>;
}

interface FoodEntry {
  id: string;
  date: string;
  mealType: MealType;
  description: string;
  data: NutritionResult;
}

interface GroupedMealData {
  mealType: MealType;
  totalCalories: number;
  items: FoodEntry[];
}

// --- FIM DAS INTERFACES ---

const allFoods: FoodItem[] = Object.values(FoodDatabase).flat();

const getLocalDateString = (date: Date | string = new Date()) => {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const ResultMacroText = ({
  label,
  value,
  unit,
  emoji,
}: {
  label: string;
  value: number | undefined | null;
  unit: string;
  emoji: string;
}) => (
  <View style={styles.macroRow}>
    <Text style={styles.macroLabel}>
      <Text style={styles.macroEmoji}>{emoji} </Text>
      <Text style={styles.macroTextBold}>{label}:</Text>
    </Text>
    <Text style={styles.macroValue}>
      {value ? value.toFixed(1) : "0.0"} {unit}
    </Text>
  </View>
);

const processDailyData = (
  entries: FoodEntry[],
  today: string,
): { totalCalories: number; groupedMeals: GroupedMealData[] } => {
  const todayEntries = entries.filter((entry) => entry.date === today);
  let totalCalories = 0;

  const mealMap = new Map<MealType, GroupedMealData>();
  MEAL_TYPES.forEach((type) => {
    mealMap.set(type, { mealType: type, totalCalories: 0, items: [] });
  });

  todayEntries.forEach((entry) => {
    totalCalories += entry.data.calories;
    const mealData = mealMap.get(entry.mealType);
    if (mealData) {
      mealData.totalCalories += entry.data.calories;
      mealData.items.push(entry);
    }
  });

  const groupedMeals = Array.from(mealMap.values())
    .filter((meal) => meal.items.length > 0)
    .map((meal) => ({
      ...meal,
      totalCalories: Math.round(meal.totalCalories),
    }));

  return { totalCalories: Math.round(totalCalories), groupedMeals };
};

const getDailySummary = async (
  setDailyTotalCalories: React.Dispatch<React.SetStateAction<number>>,
  setDailyMealsData: React.Dispatch<React.SetStateAction<GroupedMealData[]>>,
) => {
  try {
    const today = getLocalDateString();
    const existingEntriesJSON = await AsyncStorage.getItem("foodHistory");
    const existingEntries: FoodEntry[] = existingEntriesJSON
      ? JSON.parse(existingEntriesJSON)
      : [];
    const { totalCalories, groupedMeals } = processDailyData(
      existingEntries,
      today,
    );
    setDailyTotalCalories(totalCalories);
    setDailyMealsData(groupedMeals);
  } catch (e) {
    console.error("Falha ao carregar o resumo diário e detalhes.", e);
  }
};

const MealDetail = ({
  mealData,
}: {
  mealData: GroupedMealData | undefined;
}) => {
  if (!mealData || mealData.items.length === 0) {
    return (
      <Text style={styles.noItemsText}>
        Nenhum item registrado para esta refeição hoje.
      </Text>
    );
  }

  return (
    <View style={styles.mealDetailContainer}>
      <Text style={styles.mealDetailTitleText}>
        Itens Registrados em {mealData.mealType} ({mealData.totalCalories} Kcal)
      </Text>
      {mealData.items.map((item) => (
        <View key={item.id} style={styles.mealItemBox}>
          <Text style={styles.itemDescription}>{item.description}</Text>
          <Text style={styles.itemKcal}>
            {Math.round(item.data.calories)} Kcal
          </Text>
        </View>
      ))}
    </View>
  );
};

export default function HistoricoScreen() {
  // hooks (mantive suas chamadas originais)
  const { foodHistory, addFoodEntry, getFoodEntriesByDate } = useFoodHistory();
  const { workoutHistory, addWorkoutEntry, getWorkoutStats } =
    useWorkoutHistory();

  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [lastResult, setLastResult] = useState<NutritionResult | null>(null);
  const [dailyTotalCalories, setDailyTotalCalories] = useState(0);
  const [selectedMeal, setSelectedMeal] = useState<MealType>("Café");
  const [dailyMealsData, setDailyMealsData] = useState<GroupedMealData[]>([]);
  const [viewingMeal, setViewingMeal] = useState<MealType>("Café");
  const [suggestions, setSuggestions] = useState<FoodItem[]>([]);
  const [isInputFocused, setIsInputFocused] = useState(false);

  const loadDailySummary = useCallback(async () => {
    // tenta sincronizar com firebase, mas não falha a UI se der errado
    try {
      const firebaseHistory = await firebaseSyncService.loadFoodHistory();
      if (firebaseHistory && firebaseHistory.length > 0) {
        await AsyncStorage.setItem(
          "foodHistory",
          JSON.stringify(firebaseHistory),
        );
        console.log("✅ Histórico de alimentação carregado do Firebase");
      }
    } catch (syncError) {
      console.warn(
        "⚠️ Falha ao carregar do Firebase, usando dados locais:",
        syncError,
      );
    }

    await getDailySummary(setDailyTotalCalories, setDailyMealsData);
  }, []);

  useEffect(() => {
    loadDailySummary();
  }, [loadDailySummary]);

  const saveFoodEntry = async (
    description: string,
    result: NutritionResult,
    mealType: MealType,
  ) => {
    try {
      const today = getLocalDateString();
      const newEntry: FoodEntry = {
        id: `food_${Date.now()}_${Math.random()}`,
        date: today,
        mealType,
        description,
        data: result,
      };
      const existingEntriesJSON = await AsyncStorage.getItem("foodHistory");
      const existingEntries: FoodEntry[] = existingEntriesJSON
        ? JSON.parse(existingEntriesJSON)
        : [];
      existingEntries.unshift(newEntry);
      await AsyncStorage.setItem(
        "foodHistory",
        JSON.stringify(existingEntries),
      );

      // Sincronizar com Firebase (tentativa silenciosa)
      try {
        await firebaseSyncService.syncFoodHistory(existingEntries);
        console.log("✅ Histórico de alimentação sincronizado com Firebase");
      } catch (syncError) {
        console.warn("⚠️ Falha na sincronização com Firebase:", syncError);
      }
    } catch (e) {
      console.error("Falha ao salvar histórico.", e);
      Toast.show({
        type: "error",
        text1: "Erro ao Salvar",
        text2: "Não foi possível guardar o registro.",
      });
    }
  };

  const cleanNameForSearch = (name: string) =>
    name.toUpperCase().replace(/[^A-ZÀ-ÚÇ]/g, "");

  const handleQueryChange = (text: string) => {
    setQuery(text);
    const quantityMatch = text.match(
      /^(\d+\s*(g|ml|fatias|unidades|colher\s*de\s*sopa)?\s*(de)?\s*)/i,
    );
    const foodNamePart = quantityMatch
      ? text.substring(quantityMatch[0].length)
      : text;
    if (foodNamePart.trim().length > 1) {
      const searchName = cleanNameForSearch(foodNamePart);
      const filteredFoods = allFoods.filter((item) =>
        cleanNameForSearch(item.name).includes(searchName),
      );
      const uniqueFoods = filteredFoods.filter(
        (item, index, arr) =>
          arr.findIndex((food) => food.name === item.name) === index,
      );
      setSuggestions(uniqueFoods.slice(0, 5));
    } else {
      setSuggestions([]);
    }
  };

  const onSuggestionPress = (foodName: string) => {
    const quantityMatch = query.match(
      /^(\d+\s*(g|ml|fatias|unidades|colher\s*de\s*sopa)?\s*(de)?\s*)/i,
    );
    const quantityPart = quantityMatch ? quantityMatch[0] : "";
    setQuery(`${quantityPart}${foodName} `);
    setSuggestions([]);
  };

  // --- CORREÇÃO: NÃO COLOQUE JSX DENTRO DE funcoes auxiliares ---
  const handleSearch = async () => {
    if (!query.trim()) {
      Toast.show({ type: "error", text1: "Campo Vazio" });
      return;
    }
    setIsLoading(true);
    setLastResult(null);

    const knownUnits: Record<string, string[]> = {
      g: ["G", "GRAMA", "GRAMAS"],
      ml: ["ML", "MLS"],
      "COLHER DE SOPA": ["COLHER DE SOPA", "COLHERES DE SOPA", "COLHER SOPA"],
      UNIDADE: ["UNIDADE", "UNIDADES", "UNID"],
      FATIA: ["FATIA", "FATIAS"],
    };

    let upperQuery = query.toUpperCase();
    let parsedUnit: string | null = null;
    let foodNamePart = upperQuery;
    let quantity = 1;

    const quantityMatch = upperQuery.match(/^(\d+)/);
    if (quantityMatch) {
      quantity = parseInt(quantityMatch[1], 10);
    }

    for (const unit in knownUnits) {
      for (const keyword of knownUnits[unit]) {
        if (upperQuery.includes(keyword)) {
          parsedUnit = unit;
          foodNamePart = upperQuery
            .replace(keyword, "")
            .replace(String(quantity), "");
          break;
        }
      }
      if (parsedUnit) break;
    }

    const finalSearchTerm = cleanNameForSearch(foodNamePart);
    const foundFood = allFoods.find((item) =>
      cleanNameForSearch(item.name).includes(finalSearchTerm),
    );

    if (!foundFood) {
      Toast.show({
        type: "error",
        text1: "Não Encontrado",
        text2: `"${foodNamePart.trim()}" não está na base de dados.`,
      });
      setIsLoading(false);
      return;
    }

    let finalGrams = 0;
    if (parsedUnit === "g" || parsedUnit === "ml") {
      finalGrams = quantity;
    } else if (
      parsedUnit &&
      foundFood.measures &&
      (foundFood.measures as any)[parsedUnit]
    ) {
      finalGrams = quantity * (foundFood.measures as any)[parsedUnit];
    } else if (!parsedUnit && foundFood.measures?.["UNIDADE"]) {
      finalGrams = quantity * foundFood.measures["UNIDADE"];
    } else if (quantityMatch) {
      finalGrams = quantity;
    } else {
      finalGrams = 100;
    }

    const factor = finalGrams / 100;
    const finalResult: NutritionResult = {
      calories: Math.round(foundFood.calories * factor),
      protein: parseFloat((foundFood.protein * factor).toFixed(1)),
      carbs: parseFloat((foundFood.carbs * factor).toFixed(1)),
      fat: parseFloat((foundFood.fat * factor).toFixed(1)),
    };

    setLastResult(finalResult);
    await saveFoodEntry(query, finalResult, selectedMeal);
    await loadDailySummary();
    setIsLoading(false);
  };

  // --- JSX do componente (apenas aqui, no return) ---
  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Alimentação",
          headerStyle: { backgroundColor: themeColor },
          headerTintColor: "#fff",
        }}
      />
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        style={{ flex: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.container}>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryTitle}>Total Consumido Hoje</Text>
            <Text style={styles.summaryKcal}>{dailyTotalCalories} Kcal</Text>
          </View>

          <Text style={styles.headerTitle}>Refeição para Registro</Text>
          <View style={styles.mealSelectorContainer}>
            {MEAL_TYPES.map((meal) => (
              <Pressable
                key={meal}
                style={[
                  styles.mealButton,
                  selectedMeal === meal && styles.mealButtonActive,
                ]}
                onPress={() => setSelectedMeal(meal)}
                disabled={isLoading}
              >
                <Text
                  style={[
                    styles.mealButtonText,
                    selectedMeal === meal && styles.mealButtonTextActive,
                  ]}
                >
                  {meal}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={[styles.headerTitle, { marginTop: 20 }]}>
            Adicionar Alimento
          </Text>
          <View>
            <TextInput
              style={styles.input}
              placeholder="Ex: 150g de Arroz Branco"
              placeholderTextColor="#999"
              value={query}
              onChangeText={handleQueryChange}
              editable={!isLoading}
              onFocus={() => setIsInputFocused(true)}
              onBlur={() => setTimeout(() => setIsInputFocused(false), 200)}
            />
            {isInputFocused && suggestions.length > 0 && (
              <ScrollView
                style={styles.suggestionsList}
                nestedScrollEnabled={true}
                keyboardShouldPersistTaps="always"
              >
                {suggestions.map((item, index) => (
                  <Pressable
                    key={`${item.name}-${index}`}
                    style={styles.suggestionItem}
                    onPressIn={() => setIsInputFocused(true)}
                    onPress={() => onSuggestionPress(item.name)}
                  >
                    <Text style={styles.suggestionText}>{item.name}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            )}
          </View>

          <Pressable
            style={[
              styles.searchButton,
              isLoading && styles.searchButtonDisabled,
            ]}
            onPress={handleSearch}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.buttonText}>
                Calcular e Registrar Refeição
              </Text>
            )}
          </Pressable>

          <View style={styles.resultsContainer}>
            {lastResult ? (
              <View>
                <Text style={styles.resultTitle}>Análise Rápida</Text>
                <ResultMacroText
                  emoji="⚡️"
                  label="Calorias"
                  value={lastResult.calories}
                  unit="Kcal"
                />
                <ResultMacroText
                  emoji="🥩"
                  label="Proteína"
                  value={lastResult.protein}
                  unit="g"
                />
                <ResultMacroText
                  emoji="🍚"
                  label="Carboidratos"
                  value={lastResult.carbs}
                  unit="g"
                />
                <ResultMacroText
                  emoji="🥑"
                  label="Gordura"
                  value={lastResult.fat}
                  unit="g"
                />
              </View>
            ) : (
              <View>
                <Text style={[styles.infoText, { marginBottom: 10 }]}>
                  A aplicação usa a base de dados local.
                </Text>
                <Text style={styles.infoTextBold}>
                  Formato: [Qtd] [Unidade] [Alimento]
                </Text>
              </View>
            )}
          </View>

          <View style={styles.separator} />

          <Text style={styles.listSectionHeader}>
            Histórico Detalhado do Dia
          </Text>
          <View style={styles.mealSelectorContainer}>
            {dailyMealsData.map((meal) => (
              <Pressable
                key={`view-${meal.mealType}`}
                style={[
                  styles.viewMealButton,
                  viewingMeal === meal.mealType && styles.viewMealButtonActive,
                ]}
                onPress={() => setViewingMeal(meal.mealType)}
              >
                <Text
                  style={[
                    styles.viewMealButtonText,
                    viewingMeal === meal.mealType &&
                      styles.mealButtonTextActive,
                  ]}
                >
                  {meal.mealType} ({meal.totalCalories} Kcal)
                </Text>
              </Pressable>
            ))}
          </View>

          <MealDetail
            mealData={dailyMealsData.find((m) => m.mealType === viewingMeal)}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f0f2f5" },
  container: { padding: 20 },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#333",
  },
  listSectionHeader: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
    color: themeColor,
  },
  input: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#ddd",
    marginBottom: 5,
  },
  searchButton: {
    backgroundColor: themeColor,
    borderRadius: 10,
    padding: 15,
    alignItems: "center",
    justifyContent: "center",
    height: 50,
    marginTop: 10,
  },
  mealSelectorContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 20,
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 5,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  mealButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 8,
    marginHorizontal: 2,
    minWidth: "22%",
  },
  viewMealButton: {
    width: "48%",
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 8,
    marginVertical: 3,
    marginHorizontal: 2,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#eee",
  },
  mealButtonActive: {
    backgroundColor: themeColor,
    shadowColor: themeColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  viewMealButtonActive: {
    backgroundColor: themeColor,
    borderColor: themeColor,
  },
  mealButtonText: {
    color: "#333",
    fontWeight: "600",
    fontSize: 13,
    textAlign: "center",
  },
  mealButtonTextActive: { color: "white", fontWeight: "bold" },
  viewMealButtonText: {
    color: "#333",
    fontWeight: "600",
    fontSize: 13,
    textAlign: "center",
  },
  searchButtonDisabled: { opacity: 0.7 },
  buttonText: { color: "white", fontSize: 18, fontWeight: "bold" },
  resultsContainer: {
    marginTop: 30,
    padding: 15,
    backgroundColor: "white",
    borderRadius: 10,
    borderLeftWidth: 5,
    borderLeftColor: themeColor,
    elevation: 1,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    color: themeColor,
  },
  infoText: { fontSize: 14, color: "#666", textAlign: "center" },
  infoTextBold: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginTop: 5,
  },
  summaryBox: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
    marginBottom: 25,
    borderBottomWidth: 5,
    borderBottomColor: themeColor,
    elevation: 2,
  },
  summaryTitle: { fontSize: 16, color: "#666", marginBottom: 5 },
  summaryKcal: { fontSize: 32, fontWeight: "bold", color: themeColor },
  mealDetailContainer: {
    marginTop: 10,
    padding: 15,
    backgroundColor: "white",
    borderRadius: 10,
    borderLeftWidth: 5,
    borderLeftColor: "#f59042",
    elevation: 1,
    marginBottom: 30,
  },
  mealDetailTitleText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingBottom: 10,
    marginBottom: 10,
  },
  mealItemBox: {
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  itemDescription: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
    flex: 1,
  },
  mealItemMacros: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 10,
  },
  mealItemCalorieText: {
    fontSize: 14,
    fontWeight: "bold",
    color: themeColor,
    marginRight: 10,
  },
  mealItemMacroText: { fontSize: 12, color: "#666", marginLeft: 5 },
  noItemsText: {
    textAlign: "center",
    fontSize: 15,
    color: "#999",
    padding: 20,
    backgroundColor: "white",
    borderRadius: 10,
  },
  macroRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
    alignItems: "center",
  },
  macroLabel: { flexDirection: "row", alignItems: "center" },
  macroEmoji: { fontSize: 16, marginRight: 5 },
  macroTextBold: { fontWeight: "bold", color: "#333" },
  macroValue: { fontSize: 16, fontWeight: "bold", color: themeColor },
  suggestionsList: {
    maxHeight: 200,
    backgroundColor: "white",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    marginTop: 5,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  suggestionItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  suggestionText: {
    fontSize: 16,
    color: "#333",
  },
  mealListSection: {
    paddingBottom: 20,
  },
  separator: {
    height: 1,
    backgroundColor: "#ddd",
    marginVertical: 20,
  },
  mealCard: {
    backgroundColor: "white",
    borderRadius: 10,
    marginBottom: 15,
    padding: 15,
    elevation: 1,
  },
  mealHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    marginBottom: 10,
  },
  mealTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  mealTotalKcal: {
    fontSize: 18,
    fontWeight: "bold",
    color: themeColor,
  },
  mealItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 5,
  },
  itemKcal: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  noDataText: {
    textAlign: "center",
    color: "#888",
    fontStyle: "italic",
    marginTop: 10,
  },
});
