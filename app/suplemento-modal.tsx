// app/suplemento-modal.tsx

import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import Toast from "react-native-toast-message";
import SupplementsCatalog from "../data/supplementsCatalog.json";
import { TrackingType, useSupplements } from "../hooks/useSupplements";

const themeColor = "#5a4fcf";

interface CatalogSupplement {
  name: string;
  defaultDose: number;
  unit: string;
  trackingType: TrackingType;
  category?: string;
}

const catalog = SupplementsCatalog as CatalogSupplement[];

const normalizeText = (value: string) =>
  value
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

export default function SupplementModal() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { supplements, addSupplement, updateSupplement } = useSupplements();
  const router = useRouter();

  const [name, setName] = useState("");
  const [dose, setDose] = useState("");
  const [unit, setUnit] = useState("");
  const [trackingType, setTrackingType] = useState<TrackingType>("daily_check");
  const [showOnHome, setShowOnHome] = useState<boolean>(true);
  const [catalogQuery, setCatalogQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todos");

  const isEditing = !!id;
  const categories = useMemo(() => {
    const unique = Array.from(
      new Set(catalog.map((item) => item.category || "Outros")),
    );
    return ["Todos", ...unique.sort((a, b) => a.localeCompare(b))];
  }, []);

  useEffect(() => {
    if (isEditing) {
      const supplementToEdit = supplements.find((s) => s.id === id);
      if (supplementToEdit) {
        setName(supplementToEdit.name);
        setDose(supplementToEdit.dose.toString());
        setUnit(supplementToEdit.unit);
        setTrackingType(supplementToEdit.trackingType);
        setShowOnHome(supplementToEdit.showOnHome !== false);
      }
    }
  }, [id, supplements, isEditing]);

  const filteredCatalog = useMemo(() => {
    const byCategory =
      selectedCategory === "Todos"
        ? catalog
        : catalog.filter(
            (item) => (item.category || "Outros") === selectedCategory,
          );

    const query = normalizeText(catalogQuery.trim());
    if (!query) {
      return [...byCategory].sort((a, b) => a.name.localeCompare(b.name));
    }

    return [...byCategory]
      .filter((item) => normalizeText(item.name).includes(query))
      .sort((a, b) => {
        const aName = normalizeText(a.name);
        const bName = normalizeText(b.name);
        const aStarts = aName.startsWith(query) ? 0 : 1;
        const bStarts = bName.startsWith(query) ? 0 : 1;
        if (aStarts !== bStarts) return aStarts - bStarts;
        if (aName.length !== bName.length) return aName.length - bName.length;
        return a.name.localeCompare(b.name);
      });
  }, [catalogQuery, selectedCategory]);

  const applyCatalogItem = (item: CatalogSupplement) => {
    setName(item.name);
    setDose(String(item.defaultDose));
    setUnit(item.unit);
    setTrackingType(item.trackingType);
    setCatalogQuery(item.name);
  };

  const handleSave = async () => {
    if (!name || !dose || !unit) {
      Toast.show({
        type: "error",
        text1: "Campos obrigatórios",
        text2: "Por favor, preencha todos os campos.",
        visibilityTime: 3000,
      });
      return;
    }

    try {
      const supplementData = {
        name,
        dose: parseFloat(dose.replace(",", ".")) || 0,
        unit,
        trackingType,
        showOnHome,
      };

      if (isEditing) {
        await updateSupplement({ ...supplementData, id });
        Toast.show({
          type: "success",
          text1: "Suplemento atualizado!",
          text2: `${name} foi editado com sucesso.`,
          visibilityTime: 2500,
        });
      } else {
        await addSupplement(supplementData);
        // Toast já é mostrado no hook useSupplements
      }
      router.back();
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Erro ao salvar",
        text2: "Não foi possível salvar o suplemento.",
        visibilityTime: 3000,
      });
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Stack.Screen
        options={{ title: isEditing ? "Editar Suplemento" : "Novo Suplemento" }}
      />

      <Text style={styles.label}>Nome do Suplemento</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="Ex: Creatina Monohidratada"
      />

      {!isEditing && (
        <>
          <Text style={styles.catalogTitle}>Buscar no catálogo</Text>
          <TextInput
            style={styles.input}
            value={catalogQuery}
            onChangeText={setCatalogQuery}
            placeholder="Digite para filtrar suplementos"
          />

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickList}
          >
            {categories.map((category) => {
              const selected = selectedCategory === category;
              return (
                <Pressable
                  key={category}
                  style={[styles.quickChip, selected && styles.quickChipActive]}
                  onPress={() => setSelectedCategory(category)}
                >
                  <Text
                    style={[
                      styles.quickChipText,
                      selected && styles.quickChipTextActive,
                    ]}
                  >
                    {category}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <View style={styles.suggestionsContainer}>
            <Text style={styles.suggestionsTitle}>
              Resultados ({filteredCatalog.length})
            </Text>
            {filteredCatalog.slice(0, 20).map((item) => (
              <Pressable
                key={`${item.category || "Outros"}-${item.name}`}
                style={styles.suggestionItem}
                onPress={() => applyCatalogItem(item)}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.suggestionName}>{item.name}</Text>
                  <Text style={styles.suggestionMeta}>
                    {item.defaultDose} {item.unit} •{" "}
                    {item.category || "Suplemento"} •{" "}
                    {item.trackingType === "daily_check"
                      ? "Marcação"
                      : "Contador"}
                  </Text>
                </View>
                <Text style={styles.suggestionAction}>Selecionar</Text>
              </Pressable>
            ))}
            {filteredCatalog.length === 0 && (
              <Text style={styles.emptyCatalogText}>
                Nenhum suplemento encontrado para esse filtro.
              </Text>
            )}
          </View>
        </>
      )}

      <View style={styles.row}>
        <View style={styles.column}>
          <Text style={styles.label}>Dose</Text>
          <TextInput
            style={styles.input}
            value={dose}
            onChangeText={setDose}
            keyboardType="numeric"
            placeholder="Ex: 6"
          />
        </View>
        <View style={[styles.column, { marginRight: 0 }]}>
          <Text style={styles.label}>Unidade</Text>
          <TextInput
            style={styles.input}
            value={unit}
            onChangeText={setUnit}
            placeholder="Ex: g, mg, scoop"
          />
        </View>
      </View>

      <Text style={styles.label}>Tipo de Registo</Text>
      <View style={styles.trackingContainer}>
        <Pressable
          style={[
            styles.trackingButton,
            trackingType === "daily_check" && styles.trackingSelected,
          ]}
          onPress={() => setTrackingType("daily_check")}
        >
          <Text
            style={[
              styles.trackingText,
              trackingType === "daily_check" && styles.trackingTextSelected,
            ]}
          >
            Marcação Diária
          </Text>
        </Pressable>
        <Pressable
          style={[
            styles.trackingButton,
            trackingType === "counter" && styles.trackingSelected,
          ]}
          onPress={() => setTrackingType("counter")}
        >
          <Text
            style={[
              styles.trackingText,
              trackingType === "counter" && styles.trackingTextSelected,
            ]}
          >
            Contador
          </Text>
        </Pressable>
      </View>

      <Pressable style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>Salvar</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#f0f2f5" },
  label: { fontSize: 16, marginBottom: 5, color: "gray" },
  catalogTitle: {
    fontSize: 14,
    marginBottom: 8,
    color: "#555",
    fontWeight: "700",
  },
  input: {
    backgroundColor: "white",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    fontSize: 16,
  },
  suggestionsContainer: {
    backgroundColor: "white",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e8e8e8",
    marginBottom: 15,
    overflow: "hidden",
  },
  suggestionsTitle: {
    fontSize: 13,
    color: "#666",
    fontWeight: "600",
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 6,
  },
  suggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  suggestionName: { fontSize: 15, color: "#333", fontWeight: "600" },
  suggestionMeta: { fontSize: 12, color: "#777", marginTop: 2 },
  suggestionAction: { fontSize: 12, color: themeColor, fontWeight: "700" },
  emptyCatalogText: {
    paddingHorizontal: 12,
    paddingVertical: 14,
    fontSize: 13,
    color: "#777",
  },
  quickList: { paddingBottom: 6 },
  quickChip: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
  },
  quickChipActive: {
    backgroundColor: themeColor,
    borderColor: themeColor,
  },
  quickChipText: { fontSize: 13, color: "#333", fontWeight: "600" },
  quickChipTextActive: { color: "white" },
  row: { flexDirection: "row", justifyContent: "space-between" },
  column: { flex: 1, marginRight: 10 },
  trackingContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    gap: 10,
  },
  trackingButton: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    alignItems: "center",
  },
  trackingSelected: { backgroundColor: themeColor, borderColor: themeColor },
  trackingText: { fontSize: 15, color: "#333" },
  trackingTextSelected: { color: "white", fontWeight: "bold" },
  saveButton: {
    backgroundColor: themeColor,
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
  },
  saveButtonText: { color: "white", fontSize: 18, fontWeight: "bold" },
});
