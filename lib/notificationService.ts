// lib/notificationService.ts

import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { Alert, Platform } from "react-native";
import Toast from "react-native-toast-message";

const REMINDERS_KEY = "all_supplement_reminders";
const SCHEDULED_IDS_KEY = "scheduled_notification_ids";

let scheduleAllRemindersInFlight: Promise<void> | null = null;
let scheduleAllRemindersRerunRequested = false;

export type ReminderFrequency =
  | "once"
  | "daily"
  | "twice_daily"
  | "three_times_daily";

async function registerForPushNotificationsAsync() {
  const existingPermissions = await Notifications.getPermissionsAsync();
  let finalStatus =
    typeof (existingPermissions as any)?.status === "string"
      ? (existingPermissions as any).status
      : "undetermined";

  if (finalStatus !== "granted") {
    const requestedPermissions = await Notifications.requestPermissionsAsync();
    finalStatus =
      typeof (requestedPermissions as any)?.status === "string"
        ? (requestedPermissions as any).status
        : "undetermined";
  }

  if (finalStatus !== "granted") {
    Alert.alert(
      "Permissão negada",
      "Ative as notificações nas configurações do dispositivo.",
    );
    return false;
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }

  return true;
}

function parseReminderTime(value: unknown): Date {
  const fallback = new Date(new Date().setHours(8, 0, 0, 0));

  if (typeof value !== "string") return fallback;

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
  return Number.isNaN(parsed.getTime()) ? fallback : parsed;
}

function toTimeLabel(hour: number, minute: number): string {
  return `${hour.toString().padStart(2, "0")}:${minute
    .toString()
    .padStart(2, "0")}`;
}

function getScheduleSlotsForFrequency(
  baseTime: Date,
  frequency: ReminderFrequency,
): { hour: number; minute: number; label: string }[] {
  const baseHour = baseTime.getHours();
  const baseMinute = baseTime.getMinutes();

  const hours = (() => {
    switch (frequency) {
      case "once":
      case "daily":
        return [baseHour];
      case "twice_daily":
        return [baseHour, (baseHour + 4) % 24];
      case "three_times_daily":
        return [baseHour, (baseHour + 4) % 24, (baseHour + 8) % 24];
      default:
        return [baseHour];
    }
  })();

  const uniqueSortedHours = [...new Set(hours)].sort((a, b) => a - b);

  return uniqueSortedHours.map((hour) => ({
    hour,
    minute: baseMinute,
    label: toTimeLabel(hour, baseMinute),
  }));
}

function frequencyLabel(frequency: ReminderFrequency): string {
  switch (frequency) {
    case "twice_daily":
      return "2x ao dia";
    case "three_times_daily":
      return "3x ao dia";
    case "daily":
    case "once":
    default:
      return "1x ao dia";
  }
}

export async function cancelScheduledReminder(supplementId: string) {
  try {
    const scheduledMapJSON = await AsyncStorage.getItem(SCHEDULED_IDS_KEY);
    const scheduledMap: Record<string, string[]> = scheduledMapJSON
      ? JSON.parse(scheduledMapJSON)
      : {};

    const ids: string[] = scheduledMap[supplementId] || [];
    for (const id of ids) {
      await Notifications.cancelScheduledNotificationAsync(id);
    }

    scheduledMap[supplementId] = [];
    await AsyncStorage.setItem(SCHEDULED_IDS_KEY, JSON.stringify(scheduledMap));

    console.log(`🗑️ Notificações canceladas para ${supplementId}`);
  } catch (e) {
    console.error("Erro ao cancelar notificações:", e);
  }
}

async function cancelAllSupplementNotifications() {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();

    for (const item of scheduled) {
      const data = (item?.content?.data ?? {}) as Record<string, unknown>;
      if (data.reminderType === "supplement") {
        await Notifications.cancelScheduledNotificationAsync(item.identifier);
      }
    }

    await AsyncStorage.setItem(SCHEDULED_IDS_KEY, JSON.stringify({}));
    console.log("🧹 Notificações de suplementos antigas removidas.");
  } catch (e) {
    console.error("Erro ao limpar notificações antigas de suplementos:", e);
  }
}

async function scheduleAllRemindersInternal() {
  console.log("🔄 Reagendando lembretes...");
  const hasPermission = await registerForPushNotificationsAsync();
  if (!hasPermission) return;

  await cancelAllSupplementNotifications();

  const remindersJSON = await AsyncStorage.getItem(REMINDERS_KEY);
  const reminders: Record<string, any> = remindersJSON
    ? JSON.parse(remindersJSON)
    : {};

  const scheduledMap: Record<string, string[]> = {};

  for (const supplementId in reminders) {
    const reminder = reminders[supplementId];

    if (reminder.enabled) {
      const reminderTime = parseReminderTime(reminder.time);
      const frequency: ReminderFrequency = reminder.frequency || "once";
      const scheduledIds: string[] = [];

      try {
        const slots = getScheduleSlotsForFrequency(reminderTime, frequency);

        for (const slot of slots) {
          const notificationId = await Notifications.scheduleNotificationAsync({
            content: {
              title: `Lembrete: ${reminder.supplementName} 💊`,
              body: "Não se esqueça de tomar sua dose!",
              sound: true,
              data: {
                supplementId,
                reminderType: "supplement",
              },
            },
            trigger: {
              type: Notifications.SchedulableTriggerInputTypes.DAILY,
              hour: slot.hour,
              minute: slot.minute,
              ...(Platform.OS === "android" ? { channelId: "default" } : {}),
            } as Notifications.DailyTriggerInput,
          });

          scheduledIds.push(notificationId);

          try {
            Toast.show({
              type: "success",
              text1: `Lembrete agendado: ${reminder.supplementName}`,
              text2: `Hora: ${slot.label} (${frequencyLabel(frequency)})`,
              visibilityTime: 4000,
            });
          } catch {}

          console.log(
            `✅ Notificação diária agendada para ${reminder.supplementName} às ${slot.label} (${frequencyLabel(frequency)})`,
          );
        }

        scheduledMap[supplementId] = scheduledIds;
        await AsyncStorage.setItem(
          SCHEDULED_IDS_KEY,
          JSON.stringify(scheduledMap),
        );
      } catch (e) {
        console.error("Erro ao agendar notificação:", e);
      }
    } else {
      console.log(`⏭️ "${reminder.supplementName}" desativado.`);
    }
  }

  await AsyncStorage.setItem(SCHEDULED_IDS_KEY, JSON.stringify(scheduledMap));
}

export async function scheduleAllReminders() {
  if (scheduleAllRemindersInFlight) {
    scheduleAllRemindersRerunRequested = true;
    return scheduleAllRemindersInFlight;
  }

  const run = async () => {
    do {
      scheduleAllRemindersRerunRequested = false;
      await scheduleAllRemindersInternal();
    } while (scheduleAllRemindersRerunRequested);
  };

  scheduleAllRemindersInFlight = run().finally(() => {
    scheduleAllRemindersInFlight = null;
  });

  return scheduleAllRemindersInFlight;
}

export async function logAllScheduledNotifications() {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    console.log("📋 Notificações agendadas:", scheduled);
    return scheduled;
  } catch (e) {
    console.error("Erro ao obter notificações agendadas:", e);
    return [];
  }
}
