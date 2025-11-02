// lib/notificationService.ts

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Alert, Platform } from 'react-native';
import Toast from 'react-native-toast-message';

const REMINDERS_KEY = 'all_supplement_reminders';
const SUPPLEMENTS_HISTORY_KEY = 'supplements_history';
const SCHEDULED_IDS_KEY = 'scheduled_notification_ids';

// Configuração global para exibir alerta e tocar som
Notifications.setNotificationHandler({
  handleNotification: async (): Promise<Notifications.NotificationBehavior> => {
    return {
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    } as Notifications.NotificationBehavior;
  },
});

// Função utilitária para converter data local
const getLocalDateString = (date = new Date()) => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Solicita permissão para notificações
async function registerForPushNotificationsAsync() {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    Alert.alert('Permissão negada', 'Ative as notificações nas configurações do dispositivo.');
    return false;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  return true;
}

// Cancela notificações de um suplemento
export async function cancelScheduledReminder(supplementId: string) {
  try {
    const scheduledMapJSON = await AsyncStorage.getItem(SCHEDULED_IDS_KEY);
    const scheduledMap: Record<string, string[]> = scheduledMapJSON ? JSON.parse(scheduledMapJSON) : {};

    const ids: string[] = scheduledMap[supplementId] || [];
    for (const id of ids) {
      await Notifications.cancelScheduledNotificationAsync(id);
    }

    scheduledMap[supplementId] = [];
    await AsyncStorage.setItem(SCHEDULED_IDS_KEY, JSON.stringify(scheduledMap));

    console.log(`🗑️ Notificações canceladas para ${supplementId}`);
  } catch (e) {
    console.error('Erro ao cancelar notificações:', e);
  }
}

// Agenda todas as notificações
export async function scheduleAllReminders() {
  console.log('🔄 Reagendando lembretes...');
  const hasPermission = await registerForPushNotificationsAsync();
  if (!hasPermission) return;

  const remindersJSON = await AsyncStorage.getItem(REMINDERS_KEY);
  const reminders: Record<string, any> = remindersJSON ? JSON.parse(remindersJSON) : {};

  const supplementsHistoryJSON = await AsyncStorage.getItem(SUPPLEMENTS_HISTORY_KEY);
  const supplementsHistory: Record<string, any> = supplementsHistoryJSON ? JSON.parse(supplementsHistoryJSON) : {};

  const todayStr = getLocalDateString();
  const todayHistory = supplementsHistory[todayStr] || {};

  let scheduledMap: Record<string, string[]> = {};
  try {
    const scheduledMapJSON = await AsyncStorage.getItem(SCHEDULED_IDS_KEY);
    scheduledMap = scheduledMapJSON ? JSON.parse(scheduledMapJSON) : {};
  } catch (e) {
    console.warn('Não foi possível ler scheduledMap:', e);
  }

  for (const supplementId in reminders) {
    const reminder = reminders[supplementId];
    const alreadyTaken = todayHistory[supplementId];

    // Cancela agendamentos antigos
    await cancelScheduledReminder(supplementId);

    if (reminder.enabled && !alreadyTaken) {
      const reminderTime = new Date(reminder.time);
      const now = new Date();

      let nextTriggerDate = new Date();
      nextTriggerDate.setHours(reminderTime.getHours(), reminderTime.getMinutes(), 0, 0);
      if (nextTriggerDate <= now) nextTriggerDate.setDate(nextTriggerDate.getDate() + 1);

      try {
        const notificationId = await Notifications.scheduleNotificationAsync({
          content: {
            title: `Lembrete: ${reminder.supplementName} 💊`,
            body: 'Não se esqueça de registrar sua dose de hoje.',
            sound: true,
          },
          trigger: nextTriggerDate as any,
        });

        scheduledMap[supplementId] = [notificationId];
        await AsyncStorage.setItem(SCHEDULED_IDS_KEY, JSON.stringify(scheduledMap));

        try {
          Toast.show({
            type: 'success',
            text1: `Lembrete agendado: ${reminder.supplementName}`,
            text2: `Hora: ${nextTriggerDate.toLocaleString()}`,
            visibilityTime: 4000,
          });
        } catch {}

        console.log(`✅ Notificação agendada para ${reminder.supplementName} em ${nextTriggerDate.toLocaleString()}`);
      } catch (e) {
        console.error('Erro ao agendar notificação:', e);
      }
    } else {
      console.log(`⏭️ "${reminder.supplementName}" desativado ou já tomado hoje.`);
    }
  }
}

// Utilitário de debug
export async function logAllScheduledNotifications() {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    console.log('📋 Notificações agendadas:', scheduled);
    return scheduled;
  } catch (e) {
    console.error('Erro ao obter notificações agendadas:', e);
    return [];
  }
}
