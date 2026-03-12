// app/gerir-suplementos.tsx

import {
  ReminderFrequency,
  scheduleAllReminders,
} from "@/lib/notificationService";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import * as Haptics from "expo-haptics";
import { Stack, useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import Toast from "react-native-toast-message";
import { useResponsive } from "../hooks/useResponsive";
import { Supplement, useSupplements } from "../hooks/useSupplements";
import { useSupplementsHistory } from "../hooks/useSupplementsHistory";

const themeColor = "#5a4fcf";
const REMINDERS_KEY = "all_supplement_reminders";

const getLocalDateString = (date = new Date()) => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const DEFAULT_REMINDER_DATE = () => new Date(new Date().setHours(8, 0, 0, 0));

const parseReminderTime = (value?: string): Date => {
  if (!value) return DEFAULT_REMINDER_DATE();

  const hhmmMatch = value.match(/^(\d{1,2}):(\d{2})$/);
  if (hhmmMatch) {
    const hour = Number(hhmmMatch[1]);
    const minute = Number(hhmmMatch[2]);
    if (
      Number.isInteger(hour) &&
      Number.isInteger(minute) &&
      hour >= 0 &&
      hour <= 23 &&
      minute >= 0 &&
      minute <= 59
    ) {
      return new Date(new Date().setHours(hour, minute, 0, 0));
    }
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? DEFAULT_REMINDER_DATE() : parsed;
};

const toReminderTimeString = (date: Date) =>
  `${date.getHours().toString().padStart(2, "0")}:${date
    .getMinutes()
    .toString()
    .padStart(2, "0")}`;

interface ReminderSettings {
  [supplementId: string]: {
    enabled: boolean;
    time: string;
    supplementName: string;
    frequency?: ReminderFrequency;
  };
}

const FREQUENCY_OPTIONS: { label: string; value: ReminderFrequency }[] = [
  { label: "1x ao dia ", value: "once" },
  { label: "2x ao dia ", value: "twice_daily" },
  { label: "3x ao dia ", value: "three_times_daily" },
];

export default function ManageSupplementsScreen() {
  const {
    supplements,
    isLoading,
    deleteSupplement,
    updateSupplement,
    refreshSupplements,
  } = useSupplements();
  const {
    supplementsHistory,
    markSupplementTaken,
    markSupplementNotTaken,
    updateSupplementEntry,
    getSupplementStatus,
  } = useSupplementsHistory();
  const router = useRouter();
  const { fontSize, spacing, isTablet, containerPadding, normalize } =
    useResponsive();

  const [reminders, setReminders] = useState<ReminderSettings>({});
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showFrequencyPicker, setShowFrequencyPicker] = useState(false);
  const [editingReminderFor, setEditingReminderFor] =
    useState<Supplement | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const loadReminders = useCallback(async () => {
    const remindersJSON = await AsyncStorage.getItem(REMINDERS_KEY);

    setReminders(remindersJSON ? JSON.parse(remindersJSON) : {});
  }, []);

  const updateSupplementValue = async (
    supplement: Supplement,
    newValue: boolean | number,
  ) => {
    const today = getLocalDateString();
    try {
      const currentStatus = getSupplementStatus(supplement.id, today);
      const previousCounter = Number(currentStatus?.timesTaken || 0);

      if (supplement.trackingType === "daily_check") {
        if (Boolean(newValue)) {
          await markSupplementTaken(
            supplement.id,
            supplement.name,
            today,
            supplement.dose,
          );
        } else {
          await markSupplementNotTaken(supplement.id, supplement.name, today);
        }

        Toast.show({
          type: newValue ? "success" : "info",
          text1: newValue
            ? `${supplement.name} registado!`
            : `Registo de ${supplement.name} removido.`,
        });
        return;
      }

      const nextCounter = Math.max(0, Number(newValue || 0));

      if (nextCounter === 0) {
        await markSupplementNotTaken(supplement.id, supplement.name, today);
      } else if (currentStatus) {
        await updateSupplementEntry(supplement.id, today, {
          taken: true,
          timesTaken: nextCounter,
          doseTaken: supplement.dose,
        });
      } else {
        await markSupplementTaken(
          supplement.id,
          supplement.name,
          today,
          supplement.dose,
        );
        if (nextCounter !== 1) {
          await updateSupplementEntry(supplement.id, today, {
            taken: true,
            timesTaken: nextCounter,
            doseTaken: supplement.dose,
          });
        }
      }

      const didIncrement = nextCounter > previousCounter;
      Toast.show({
        type: didIncrement ? "success" : "info",
        text1: didIncrement
          ? `Dose de ${supplement.name} adicionada`
          : `Dose de ${supplement.name} removida`,
      });
    } catch (error) {
      console.error("Erro ao atualizar histórico de suplementos:", error);
      Toast.show({
        type: "error",
        text1: "Erro",
        text2: "Não foi possível atualizar o suplemento.",
      });
    }
  };

  const handleCounterDelta = (supplement: Supplement, delta: number) => {
    const current = Number(
      getSupplementStatus(supplement.id, todayKey)?.timesTaken || 0,
    );
    const nextValue = Math.max(0, current + delta);
    updateSupplementValue(supplement, nextValue);
  };

  useFocusEffect(
    useCallback(() => {
      refreshSupplements();
      loadReminders();
      scheduleAllReminders().catch((error: unknown) => {
        console.warn("Falha ao reagendar lembretes:", error);
      });
    }, [refreshSupplements, loadReminders]),
  );

  const handleUpdateReminder = async (
    supplement: Supplement,
    newSettings: {
      enabled: boolean;
      time: Date;
      frequency?: ReminderFrequency;
    },
  ) => {
    const updatedReminders = {
      ...reminders,
      [supplement.id]: {
        enabled: newSettings.enabled,
        time: toReminderTimeString(newSettings.time),
        supplementName: supplement.name,
        frequency: newSettings.frequency || "once",
      },
    };
    setReminders(updatedReminders);
    await AsyncStorage.setItem(REMINDERS_KEY, JSON.stringify(updatedReminders));
    await scheduleAllReminders();
  };

  const handleTimePress = (supplement: Supplement) => {
    setEditingReminderFor(supplement);
    setShowTimePicker(true);
  };

  const handleFrequencyPress = (supplement: Supplement) => {
    setEditingReminderFor(supplement);
    setShowFrequencyPicker(true);
  };

  const handleFrequencySelect = (frequency: ReminderFrequency) => {
    if (editingReminderFor) {
      const currentReminder = reminders[editingReminderFor.id];
      const time = currentReminder
        ? parseReminderTime(currentReminder.time)
        : DEFAULT_REMINDER_DATE();

      handleUpdateReminder(editingReminderFor, {
        enabled: currentReminder?.enabled ?? true,
        time,
        frequency,
      });

      const frequencyLabel =
        FREQUENCY_OPTIONS.find((f) => f.value === frequency)?.label ||
        frequency;
      Toast.show({
        type: "success",
        text1: `Frequência atualizada: ${frequencyLabel}`,
      });
    }
    setShowFrequencyPicker(false);
  };

  const handleToggleReminder = (supplement: Supplement) => {
    const currentReminder = reminders[supplement.id];
    const newEnabledStatus = !currentReminder?.enabled;
    const time = currentReminder
      ? parseReminderTime(currentReminder.time)
      : DEFAULT_REMINDER_DATE();
    const frequency = currentReminder?.frequency || "once";

    handleUpdateReminder(supplement, {
      enabled: newEnabledStatus,
      time,
      frequency,
    });

    Toast.show({
      type: newEnabledStatus ? "success" : "info",
      text1: `Lembrete para ${supplement.name} ${newEnabledStatus ? "ativado" : "desativado"}.`,
    });
  };

  const onChangeTime = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowTimePicker(false);
    if (event.type === "set" && selectedDate && editingReminderFor) {
      const frequency = reminders[editingReminderFor.id]?.frequency || "once";
      handleUpdateReminder(editingReminderFor, {
        enabled: true,
        time: selectedDate,
        frequency,
      });
      Toast.show({
        type: "success",
        text1: `Lembrete para ${editingReminderFor.name} atualizado.`,
      });
    }
    setEditingReminderFor(null);
  };

  const handleDelete = (supplement: Supplement) => {
    Alert.alert(
      `Apagar "${supplement.name}"?`,
      "Esta ação não pode ser desfeita.",
      [
        { text: "Cancelar" },
        {
          text: "Apagar",
          style: "destructive",
          onPress: async () => {
            await deleteSupplement(supplement.id);
            await refreshSupplements();
          },
        },
      ],
    );
  };

  const formatTime = (date: Date) =>
    date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const todayKey = getLocalDateString();

  const filteredSupplements = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return supplements;
    return supplements.filter((item) =>
      item.name.toLowerCase().includes(query),
    );
  }, [supplements, searchTerm]);

  const summary = useMemo(() => {
    const remindersEnabled = supplements.filter(
      (item) => reminders[item.id]?.enabled,
    ).length;

    let completedToday = 0;
    let counterDosesToday = 0;

    supplements.forEach((item) => {
      const status = getSupplementStatus(item.id, todayKey);
      if (item.trackingType === "daily_check" && status?.taken) {
        completedToday += 1;
      }
      if (item.trackingType === "counter") {
        counterDosesToday += Number(status?.timesTaken || 0);
      }
    });

    return {
      total: supplements.length,
      remindersEnabled,
      completedToday,
      counterDosesToday,
    };
  }, [
    supplements,
    reminders,
    supplementsHistory,
    todayKey,
    getSupplementStatus,
  ]);

  if (isLoading) {
    return (
      <ActivityIndicator size="large" color={themeColor} style={{ flex: 1 }} />
    );
  }

  // ✅ CORRIGIDO: Componente para renderizar o cabeçalho da lista
  const ListHeader = () => (
    <>
      <View style={styles.headerBlock}>
        <Text style={[styles.sectionHeader, { fontSize: fontSize["3xl"] }]}>
          Suplementos
        </Text>
        <Text style={[styles.hintText, { fontSize: fontSize.sm }]}>
          Toque na hora para editar lembretes e registe as doses de hoje.
        </Text>
      </View>

      <View
        style={[styles.summaryRow, { flexDirection: isTablet ? "row" : "row" }]}
      >
        <View style={[styles.summaryCard, { width: isTablet ? "23%" : "48%" }]}>
          <Text style={[styles.summaryValue, { fontSize: fontSize.xl }]}>
            {summary.total}
          </Text>
          <Text style={[styles.summaryLabel, { fontSize: fontSize.xs }]}>
            Suplementos
          </Text>
        </View>
        <View style={[styles.summaryCard, { width: isTablet ? "23%" : "48%" }]}>
          <Text style={[styles.summaryValue, { fontSize: fontSize.xl }]}>
            {summary.remindersEnabled}
          </Text>
          <Text style={[styles.summaryLabel, { fontSize: fontSize.xs }]}>
            Lembretes ON
          </Text>
        </View>
        <View style={[styles.summaryCard, { width: isTablet ? "23%" : "48%" }]}>
          <Text style={[styles.summaryValue, { fontSize: fontSize.xl }]}>
            {summary.completedToday}
          </Text>
          <Text style={[styles.summaryLabel, { fontSize: fontSize.xs }]}>
            Concluídos hoje
          </Text>
        </View>
        <View style={[styles.summaryCard, { width: isTablet ? "23%" : "48%" }]}>
          <Text style={[styles.summaryValue, { fontSize: fontSize.xl }]}>
            {summary.counterDosesToday}
          </Text>
          <Text style={[styles.summaryLabel, { fontSize: fontSize.xs }]}>
            Doses hoje
          </Text>
        </View>
      </View>

      <View style={styles.searchWrapper}>
        <Ionicons name="search-outline" size={18} color="#8a8a8a" />
        <TextInput
          value={searchTerm}
          onChangeText={setSearchTerm}
          placeholder="Buscar suplemento..."
          style={styles.searchInput}
          placeholderTextColor="#9a9a9a"
        />
      </View>
    </>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen
        options={{
          title: "Suplementos",
          headerStyle: { backgroundColor: themeColor },
          headerTintColor: "#fff",
          headerTitleStyle: { fontWeight: "700" },
        }}
      />

      {/* ✅ CORRIGIDO: A FlatList agora é o componente principal de scroll */}
      <FlatList
        data={filteredSupplements}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          paddingHorizontal: containerPadding,
          paddingBottom: spacing["3xl"] * 3,
        }}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="flask-outline" size={34} color="#9a9a9a" />
            <Text style={styles.emptyTitle}>Nenhum suplemento encontrado</Text>
            <Text style={styles.emptySubtitle}>
              Tente outro termo na busca ou adicione um novo suplemento.
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const reminder = reminders[item.id];
          const isReminderEnabled = reminder?.enabled ?? false;
          const reminderTimeDate = reminder
            ? parseReminderTime(reminder.time)
            : DEFAULT_REMINDER_DATE();

          const currentStatus = getSupplementStatus(item.id, todayKey);
          const currentValue =
            item.trackingType === "daily_check"
              ? Boolean(currentStatus?.taken)
              : Number(currentStatus?.timesTaken || 0);
          const trackingLabel =
            item.trackingType === "daily_check"
              ? "Marcação diária"
              : "Contador";
          const statusLabel =
            item.trackingType === "daily_check"
              ? currentValue
                ? "Tomado hoje"
                : "Pendente hoje"
              : `${Number(currentValue || 0)} dose(s) hoje`;
          const statusBackground =
            item.trackingType === "daily_check" && currentValue
              ? "#e9f8ef"
              : "#f1f3f5";
          const statusColor =
            item.trackingType === "daily_check" && currentValue
              ? "#2f9e44"
              : "#667085";

          return (
            <View style={styles.card}>
              <View style={styles.metaTopRow}>
                <View style={styles.trackingTypeBadge}>
                  <Text style={styles.trackingTypeText}>{trackingLabel}</Text>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: statusBackground },
                  ]}
                >
                  <Text
                    style={[styles.statusBadgeText, { color: statusColor }]}
                  >
                    {statusLabel}
                  </Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <View style={styles.info}>
                  <Text style={styles.cardTitle}>{item.name}</Text>
                  <Text
                    style={styles.cardSubtitle}
                  >{`${item.dose}${item.unit}`}</Text>
                </View>

                <View style={styles.reminderControlsInline}>
                  <View style={{ alignItems: "flex-end" }}>
                    <Pressable onPress={() => handleTimePress(item)}>
                      <Text
                        style={[
                          styles.reminderTimeText,
                          { color: isReminderEnabled ? themeColor : "gray" },
                        ]}
                      >
                        {formatTime(reminderTimeDate)}
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => handleFrequencyPress(item)}
                      style={{ marginTop: 4 }}
                    >
                      <Text
                        style={[
                          styles.frequencyText,
                          { color: isReminderEnabled ? themeColor : "gray" },
                        ]}
                      >
                        {FREQUENCY_OPTIONS.find(
                          (f) => f.value === (reminder?.frequency || "once"),
                        )?.label || "1x ao dia"}
                      </Text>
                    </Pressable>
                    <Switch
                      trackColor={{ false: "#ccc", true: "#81b0ff" }}
                      thumbColor={isReminderEnabled ? themeColor : "#f4f3f4"}
                      onValueChange={() => handleToggleReminder(item)}
                      value={isReminderEnabled}
                      style={{
                        transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }],
                        marginTop: 6,
                      }}
                    />
                  </View>
                </View>
              </View>

              {/* removed separate trackingRow - controls now inline under the time */}

              <View style={styles.actionsBottom}>
                <View style={styles.actionLeft}>
                  {/* Icons group: visibility, edit, delete (left) */}
                  <Pressable
                    onPress={async () => {
                      const newVal = !(item.showOnHome ?? true);
                      try {
                        await updateSupplement({
                          ...item,
                          showOnHome: newVal,
                        } as any);
                        await refreshSupplements();
                        Toast.show({
                          type: "success",
                          text1: newVal ? "Visível na home" : "Oculto na home",
                        });
                      } catch (e) {
                        console.warn("Falha ao atualizar visibilidade:", e);
                      }
                    }}
                    style={[styles.iconButton, { marginRight: 12 }]}
                  >
                    <Ionicons
                      name={
                        item.showOnHome === false
                          ? "eye-off-outline"
                          : "eye-outline"
                      }
                      size={22}
                      color={item.showOnHome === false ? "#888" : themeColor}
                    />
                  </Pressable>

                  <Pressable
                    style={[styles.iconButton, { marginRight: 12 }]}
                    onPress={() =>
                      router.push({
                        pathname: "/suplemento-modal",
                        params: { id: item.id },
                      })
                    }
                  >
                    <Ionicons
                      name="pencil-outline"
                      size={22}
                      color={"#3498db"}
                    />
                  </Pressable>
                  <Pressable
                    style={styles.iconButton}
                    onPress={() => handleDelete(item)}
                  >
                    <Ionicons name="trash-outline" size={22} color="#e74c3c" />
                  </Pressable>
                </View>

                <View style={styles.actionRight}>
                  {/* Markers group: show on right */}
                  {item.trackingType === "daily_check" ? (
                    <Pressable
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        const taken = !!currentValue;
                        updateSupplementValue(item, !taken);
                      }}
                      style={styles.toggleCheckButton}
                    >
                      <Text style={styles.toggleCheckText}>
                        {currentValue ? "✔" : "○"}
                      </Text>
                    </Pressable>
                  ) : (
                    <View style={styles.counterContainerInline}>
                      <Pressable
                        onPress={() => {
                          Haptics.impactAsync(
                            Haptics.ImpactFeedbackStyle.Light,
                          );
                          handleCounterDelta(item, -1);
                        }}
                        style={styles.counterButton}
                      >
                        <Ionicons
                          name="chevron-back-outline"
                          size={18}
                          color="gray"
                        />
                      </Pressable>
                      <Text style={styles.counterCountText}>
                        {Number(currentValue || 0)}
                      </Text>
                      <Pressable
                        onPress={() => {
                          Haptics.impactAsync(
                            Haptics.ImpactFeedbackStyle.Light,
                          );
                          handleCounterDelta(item, 1);
                        }}
                        style={styles.counterButton}
                      >
                        <Ionicons
                          name="chevron-forward-outline"
                          size={18}
                          color="gray"
                        />
                      </Pressable>
                    </View>
                  )}
                </View>
              </View>
            </View>
          );
        }}
      />

      {showTimePicker && editingReminderFor && (
        <DateTimePicker
          value={
            reminders[editingReminderFor.id]
              ? parseReminderTime(reminders[editingReminderFor.id].time)
              : new Date()
          }
          mode="time"
          is24Hour={true}
          display="default"
          onChange={onChangeTime}
        />
      )}

      {showFrequencyPicker && editingReminderFor && (
        <Modal
          visible={showFrequencyPicker}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowFrequencyPicker(false)}
        >
          <View style={styles.frequencyModalOverlay}>
            <View style={styles.frequencyModalContent}>
              <View style={styles.frequencyModalHeader}>
                <Text style={styles.frequencyModalTitle}>
                  Frequência de Lembretes
                </Text>
                <Text style={styles.frequencyModalSubtitle}>
                  {editingReminderFor.name}
                </Text>
              </View>

              <View style={styles.frequencyOptionsContainer}>
                {FREQUENCY_OPTIONS.map((option) => (
                  <Pressable
                    key={option.value}
                    style={[
                      styles.frequencyOption,
                      (reminders[editingReminderFor.id]?.frequency ||
                        "once") === option.value &&
                        styles.frequencyOptionSelected,
                    ]}
                    onPress={() => handleFrequencySelect(option.value)}
                  >
                    <View
                      style={[
                        styles.frequencyOptionRadio,
                        (reminders[editingReminderFor.id]?.frequency ||
                          "once") === option.value &&
                          styles.frequencyOptionRadioSelected,
                      ]}
                    >
                      {(reminders[editingReminderFor.id]?.frequency ||
                        "once") === option.value && (
                        <View style={styles.frequencyOptionRadioDot} />
                      )}
                    </View>
                    <Text style={styles.frequencyOptionLabel}>
                      {option.label}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Pressable
                style={styles.frequencyModalCloseButton}
                onPress={() => setShowFrequencyPicker(false)}
              >
                <Text style={styles.frequencyModalCloseButtonText}>Fechar</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      )}

      <Pressable
        style={styles.addButton}
        onPress={() => router.push("/suplemento-modal")}
      >
        <Ionicons name="add" size={32} color="white" />
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f0f2f5" },
  headerBlock: {
    marginTop: 18,
    marginBottom: 10,
  },
  sectionHeader: { fontWeight: "800", color: "#1f2937", marginBottom: 4 },
  summaryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 14,
    gap: 8,
  },
  summaryCard: {
    width: "48%",
    backgroundColor: "white",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e8e8e8",
    elevation: 1,
  },
  summaryValue: { fontWeight: "800", color: themeColor },
  summaryLabel: { color: "#666", marginTop: 2 },
  searchWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    marginBottom: 14,
    paddingHorizontal: 12,
  },
  searchInput: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 12,
    color: "#333",
  },
  hintText: {
    color: "#6b7280",
    marginBottom: 12,
  },
  emptyState: {
    backgroundColor: "white",
    borderRadius: 14,
    paddingVertical: 26,
    paddingHorizontal: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e8e8e8",
    marginTop: 6,
  },
  emptyTitle: {
    marginTop: 8,
    fontWeight: "700",
    color: "#374151",
  },
  emptySubtitle: {
    marginTop: 4,
    color: "#6b7280",
    textAlign: "center",
  },
  card: {
    backgroundColor: "white",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 14,
    flexDirection: "column",
    justifyContent: "space-between",
    alignItems: "stretch",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#ececec",
    minHeight: 95,
  },
  metaTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  trackingTypeBadge: {
    backgroundColor: "#eef1ff",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  trackingTypeText: {
    color: themeColor,
    fontSize: 11,
    fontWeight: "700",
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  info: { flex: 1, marginRight: 10 },
  cardTitle: { fontSize: 18, fontWeight: "800", color: "#333" },
  cardSubtitle: { fontSize: 13, color: "#6b7280", marginTop: 3 },
  reminderControls: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 15,
  },
  reminderTimeText: {
    fontSize: 16,
    fontWeight: "bold",
    marginRight: 5,
  },
  frequencyText: {
    fontSize: 12,
    fontWeight: "500",
  },
  frequencyModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  frequencyModalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 24,
    paddingBottom: 32,
    paddingHorizontal: 20,
  },
  frequencyModalHeader: {
    marginBottom: 24,
    alignItems: "flex-start",
  },
  frequencyModalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 4,
  },
  frequencyModalSubtitle: {
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "500",
  },
  frequencyOptionsContainer: {
    marginBottom: 24,
  },
  frequencyOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: "#f9fafb",
    borderWidth: 1.5,
    borderColor: "#e5e7eb",
  },
  frequencyOptionSelected: {
    backgroundColor: "#f0f7ff",
    borderColor: themeColor,
  },
  frequencyOptionRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#d1d5db",
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  frequencyOptionRadioSelected: {
    borderColor: themeColor,
  },
  frequencyOptionRadioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: themeColor,
  },
  frequencyOptionLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
  },
  frequencyModalCloseButton: {
    backgroundColor: themeColor,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  frequencyModalCloseButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "white",
  },
  actions: { flexDirection: "row", alignItems: "center" },
  addButton: {
    position: "absolute",
    bottom: 30,
    right: 30,
    backgroundColor: themeColor,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
  },
  /* New styles for bottom action area */
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  reminderControlsInline: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionsBottom: {
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    paddingTop: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  actionLeft: { flexDirection: "row", alignItems: "center", marginRight: 18 },
  actionRight: { flexDirection: "row", alignItems: "center" },
  iconButton: { padding: 8, borderRadius: 10 },
  toggleCheckButton: {
    marginLeft: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#ffffff00",
  },
  toggleCheckText: { fontSize: 18, color: themeColor, fontWeight: "700" },
  counterContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 10,
  },
  counterButton: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  counterCountText: {
    fontSize: 16,
    fontWeight: "600",
    width: 34,
    textAlign: "center",
    color: "#333",
  },
  /* Home-like quick card styles */
  cardDose: { fontSize: 14, color: "gray", marginTop: 5 },
  statusIcon: { fontSize: 30 },
  wheyCounter: { flexDirection: "row", alignItems: "center" },
  wheyCountText: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    width: 40,
    textAlign: "center",
  },
  wheyArrow: { fontSize: 24, color: "gray" },
  wheyButton: { paddingHorizontal: 10 },
  trackingRow: { marginTop: 10, flexDirection: "row", alignItems: "center" },
  trackingRowInline: { marginTop: 8, alignItems: "center" },
  counterContainerInline: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },
});
