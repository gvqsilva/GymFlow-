// components/BodyMeasurementsCard.tsx

import { Ionicons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Toast from "react-native-toast-message";
import {
  BodyMeasurement,
  useBodyMeasurements,
} from "../hooks/useBodyMeasurements";
import { useResponsive } from "../hooks/useResponsive";

const themeColor = "#5a4fcf";

const MEASUREMENT_CONFIG = {
  torax: {
    label: "Tórax",
    icon: "ellipse" as const,
    color: "#FF6B6B",
    bgColor: "#ffe8e8",
  },
  braco: {
    label: "Braço",
    icon: "arrow-up" as const,
    color: "#4ECDC4",
    bgColor: "#e8f8f6",
  },
  cintura: {
    label: "Cintura",
    icon: "remove" as const,
    color: "#FFE66D",
    bgColor: "#fff9e8",
  },
  abdomen: {
    label: "Abdômen",
    icon: "shield-checkmark" as const,
    color: "#95E1D3",
    bgColor: "#e8faf7",
  },
  quadril: {
    label: "Quadril",
    icon: "ellipse" as const,
    color: "#C7CEEA",
    bgColor: "#f5f3ff",
  },
  coxa: {
    label: "Coxa",
    icon: "arrow-up" as const,
    color: "#FF9999",
    bgColor: "#ffe8e8",
  },
};

export function BodyMeasurementsCard() {
  const {
    measurementsData,
    addMeasurement,
    getLatestMeasurement,
    getMeasurementProgress,
  } = useBodyMeasurements();
  const { fontSize, spacing, isTablet } = useResponsive();
  const [showModal, setShowModal] = useState(false);
  const [measurements, setMeasurements] = useState<BodyMeasurement>({
    torax: 0,
    braco: 0,
    cintura: 0,
    abdomen: 0,
    quadril: 0,
    coxa: 0,
  });

  const latestMeasurement = useMemo(
    () => getLatestMeasurement(),
    [getLatestMeasurement],
  );
  const measurementCount = measurementsData.entries.length;
  const hasEntries = measurementCount > 0;

  const handleAddMeasurement = async () => {
    const hasValidMeasurement = Object.values(measurements).some(
      (val) => val > 0,
    );

    if (!hasValidMeasurement) {
      Toast.show({
        type: "error",
        text1: "Erro",
        text2: "Adicione pelo menos uma medida",
      });
      return;
    }

    await addMeasurement(measurements);
    setMeasurements({
      torax: 0,
      braco: 0,
      cintura: 0,
      abdomen: 0,
      quadril: 0,
      coxa: 0,
    });
    setShowModal(false);

    Toast.show({
      type: "success",
      text1: "Medidas Registradas! 📏",
      text2: "Suas medidas foram salvas com sucesso",
    });
  };

  const renderMeasurementCard = (key: keyof BodyMeasurement) => {
    const progress = getMeasurementProgress(key);
    const current = latestMeasurement?.measurements[key];
    const config = MEASUREMENT_CONFIG[key];

    return (
      <View
        key={key}
        style={[styles.measurementCard, { backgroundColor: config.bgColor }]}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.cardIcon, { backgroundColor: config.color }]}>
            <Ionicons name={config.icon} size={20} color="white" />
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.cardLabel}>{config.label}</Text>
            {progress && progress.difference !== 0 && (
              <View style={styles.changeIndicator}>
                <Ionicons
                  name={progress.difference > 0 ? "arrow-up" : "arrow-down"}
                  size={12}
                  color={progress.difference > 0 ? "#2ecc71" : "#e74c3c"}
                />
                <Text
                  style={[
                    styles.cardChange,
                    {
                      color: progress.difference > 0 ? "#2ecc71" : "#e74c3c",
                    },
                  ]}
                >
                  {progress.difference > 0 ? "+" : ""}
                  {progress.difference.toFixed(1)} cm
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.cardValue}>
          <Text style={[styles.cardNumber, { color: config.color }]}>
            {current ? current.toFixed(1) : "-"}
          </Text>
          <Text style={styles.cardUnit}>cm</Text>
        </View>
      </View>
    );
  };

  return (
    <>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.iconContainer}>
              <Ionicons name="body" size={24} color="white" />
            </View>
            <View>
              <Text style={styles.title}>Medidas Corporais</Text>
              <Text style={styles.subtitle}>
                {hasEntries
                  ? `${measurementCount} registro${measurementCount > 1 ? "s" : ""}`
                  : "Nenhuma medida registrada"}
              </Text>
            </View>
          </View>
          <Pressable
            style={styles.addButton}
            onPress={() => setShowModal(true)}
          >
            <View style={styles.addButtonBg}>
              <Ionicons name="add" size={24} color="white" />
            </View>
          </Pressable>
        </View>

        {hasEntries ? (
          <View style={styles.measurementsContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>📦 Tronco</Text>
            </View>
            <View style={styles.cardGrid}>
              {renderMeasurementCard("torax")}
              {renderMeasurementCard("cintura")}
              {renderMeasurementCard("abdomen")}
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>💪 Membro Superior</Text>
            </View>
            <View style={styles.cardGrid}>
              {renderMeasurementCard("braco")}
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>🦵 Membro Inferior</Text>
            </View>
            <View style={styles.cardGrid}>
              {renderMeasurementCard("quadril")}
              {renderMeasurementCard("coxa")}
            </View>
          </View>
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="body" size={56} color="#d0d0d0" />
            </View>
            <Text style={styles.emptyText}>Nenhuma medida registrada</Text>
            <Text style={styles.emptySubtext}>
              Comece adicionando suas medidas para rastrear o progresso corporal
            </Text>
            <Pressable
              style={styles.emptyButton}
              onPress={() => setShowModal(true)}
            >
              <Ionicons name="add-circle" size={20} color="white" />
              <Text style={styles.emptyButtonText}>Adicionar Medida</Text>
            </Pressable>
          </View>
        )}
      </View>

      {/* Modal para Adicionar Medidas */}
      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Adicionar Medidas</Text>
              <Pressable onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={28} color="#333" />
              </Pressable>
            </View>

            <ScrollView
              style={styles.modalScroll}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.modalSectionTitle}>📦 Tronco</Text>
              <View style={styles.inputRow}>
                <View style={styles.inputGroupModal}>
                  <View style={styles.inputIconContainer}>
                    <View
                      style={[styles.inputIcon, { backgroundColor: "#FF6B6B" }]}
                    >
                      <Ionicons name="ellipse" size={16} color="white" />
                    </View>
                    <Text style={styles.inputLabel}>Tórax</Text>
                  </View>
                  <TextInput
                    style={styles.input}
                    placeholder="cm"
                    keyboardType="decimal-pad"
                    value={
                      measurements.torax ? measurements.torax.toString() : ""
                    }
                    onChangeText={(text) =>
                      setMeasurements({
                        ...measurements,
                        torax: parseFloat(text) || 0,
                      })
                    }
                  />
                </View>

                <View style={styles.inputGroupModal}>
                  <View style={styles.inputIconContainer}>
                    <View
                      style={[styles.inputIcon, { backgroundColor: "#FFE66D" }]}
                    >
                      <Ionicons name="remove" size={16} color="white" />
                    </View>
                    <Text style={styles.inputLabel}>Cintura</Text>
                  </View>
                  <TextInput
                    style={styles.input}
                    placeholder="cm"
                    keyboardType="decimal-pad"
                    value={
                      measurements.cintura
                        ? measurements.cintura.toString()
                        : ""
                    }
                    onChangeText={(text) =>
                      setMeasurements({
                        ...measurements,
                        cintura: parseFloat(text) || 0,
                      })
                    }
                  />
                </View>
              </View>

              <View style={styles.inputRow}>
                <View style={styles.inputGroupModal}>
                  <View style={styles.inputIconContainer}>
                    <View
                      style={[styles.inputIcon, { backgroundColor: "#95E1D3" }]}
                    >
                      <Ionicons
                        name="shield-checkmark"
                        size={16}
                        color="white"
                      />
                    </View>
                    <Text style={styles.inputLabel}>Abdômen</Text>
                  </View>
                  <TextInput
                    style={styles.input}
                    placeholder="cm"
                    keyboardType="decimal-pad"
                    value={
                      measurements.abdomen
                        ? measurements.abdomen.toString()
                        : ""
                    }
                    onChangeText={(text) =>
                      setMeasurements({
                        ...measurements,
                        abdomen: parseFloat(text) || 0,
                      })
                    }
                  />
                </View>
              </View>

              <Text style={styles.modalSectionTitle}>💪 Membro Superior</Text>
              <View style={styles.inputRow}>
                <View style={styles.inputGroupModal}>
                  <View style={styles.inputIconContainer}>
                    <View
                      style={[styles.inputIcon, { backgroundColor: "#4ECDC4" }]}
                    >
                      <Ionicons name="arrow-up" size={16} color="white" />
                    </View>
                    <Text style={styles.inputLabel}>Braço</Text>
                  </View>
                  <TextInput
                    style={styles.input}
                    placeholder="cm"
                    keyboardType="decimal-pad"
                    value={
                      measurements.braco ? measurements.braco.toString() : ""
                    }
                    onChangeText={(text) =>
                      setMeasurements({
                        ...measurements,
                        braco: parseFloat(text) || 0,
                      })
                    }
                  />
                </View>
              </View>

              <Text style={styles.modalSectionTitle}>🦵 Membro Inferior</Text>
              <View style={styles.inputRow}>
                <View style={styles.inputGroupModal}>
                  <View style={styles.inputIconContainer}>
                    <View
                      style={[styles.inputIcon, { backgroundColor: "#C7CEEA" }]}
                    >
                      <Ionicons name="ellipse" size={16} color="white" />
                    </View>
                    <Text style={styles.inputLabel}>Quadril</Text>
                  </View>
                  <TextInput
                    style={styles.input}
                    placeholder="cm"
                    keyboardType="decimal-pad"
                    value={
                      measurements.quadril
                        ? measurements.quadril.toString()
                        : ""
                    }
                    onChangeText={(text) =>
                      setMeasurements({
                        ...measurements,
                        quadril: parseFloat(text) || 0,
                      })
                    }
                  />
                </View>

                <View style={styles.inputGroupModal}>
                  <View style={styles.inputIconContainer}>
                    <View
                      style={[styles.inputIcon, { backgroundColor: "#FF9999" }]}
                    >
                      <Ionicons name="arrow-up" size={16} color="white" />
                    </View>
                    <Text style={styles.inputLabel}>Coxa</Text>
                  </View>
                  <TextInput
                    style={styles.input}
                    placeholder="cm"
                    keyboardType="decimal-pad"
                    value={
                      measurements.coxa ? measurements.coxa.toString() : ""
                    }
                    onChangeText={(text) =>
                      setMeasurements({
                        ...measurements,
                        coxa: parseFloat(text) || 0,
                      })
                    }
                  />
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <Pressable
                style={styles.buttonCancel}
                onPress={() => setShowModal(false)}
              >
                <Text style={styles.buttonCancelText}>Cancelar</Text>
              </Pressable>
              <Pressable
                style={styles.buttonSave}
                onPress={handleAddMeasurement}
              >
                <Ionicons name="checkmark" size={20} color="white" />
                <Text style={styles.buttonSaveText}>Salvar</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: themeColor,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 13,
    color: "#999",
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f0ecff",
  },
  addButtonBg: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: themeColor,
    justifyContent: "center",
    alignItems: "center",
  },

  // Measurements Container
  measurementsContainer: {
    marginTop: 12,
  },

  sectionHeader: {
    marginTop: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#333",
    marginLeft: 2,
  },

  cardGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },

  measurementCard: {
    flex: 1,
    minWidth: "30%",
    borderRadius: 12,
    padding: 14,
    justifyContent: "space-between",
    minHeight: 120,
    borderWidth: 0,
  },

  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },

  cardIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },

  cardInfo: {
    flex: 1,
  },

  cardLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#333",
    marginBottom: 2,
  },

  changeIndicator: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },

  cardChange: {
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
  },

  cardValue: {
    flexDirection: "row",
    alignItems: "baseline",
    marginTop: 8,
  },

  cardNumber: {
    fontSize: 24,
    fontWeight: "700",
  },

  cardUnit: {
    fontSize: 12,
    color: "#999",
    marginLeft: 4,
    fontWeight: "500",
  },

  // Empty State
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    borderRadius: 12,
    backgroundColor: "#f8f8f8",
  },

  emptyIconContainer: {
    marginBottom: 16,
  },

  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 6,
  },

  emptySubtext: {
    fontSize: 13,
    color: "#999",
    textAlign: "center",
    marginBottom: 20,
    paddingHorizontal: 16,
  },

  emptyButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: themeColor,
    borderRadius: 8,
    gap: 8,
  },

  emptyButtonText: {
    color: "white",
    fontSize: 13,
    fontWeight: "600",
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },

  modalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: "85%",
    paddingTop: 20,
    paddingHorizontal: 16,
  },

  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1a1a1a",
  },

  modalScroll: {
    flex: 1,
    paddingHorizontal: 4,
  },

  modalSectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#333",
    marginTop: 20,
    marginBottom: 12,
  },

  inputRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },

  inputGroupModal: {
    flex: 1,
  },

  inputIconContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },

  inputIcon: {
    width: 28,
    height: 28,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },

  inputLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#333",
  },

  input: {
    borderWidth: 1.5,
    borderColor: "#e0e0e0",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: "#333",
    backgroundColor: "#f9f9f9",
  },

  modalFooter: {
    flexDirection: "row",
    gap: 12,
    paddingBottom: 20,
    paddingHorizontal: 4,
  },

  buttonCancel: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#e0e0e0",
    justifyContent: "center",
    alignItems: "center",
  },

  buttonCancelText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#666",
  },

  buttonSave: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: themeColor,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },

  buttonSaveText: {
    fontSize: 15,
    fontWeight: "600",
    color: "white",
  },
});
