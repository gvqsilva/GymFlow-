// app/gerir-suplementos.tsx

import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import * as Haptics from 'expo-haptics';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, SafeAreaView, StyleSheet, Switch, Text, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { Supplement, useSupplements } from '../hooks/useSupplements';
import { scheduleAllReminders } from '../lib/notificationService';

const themeColor = '#5a4fcf';
const REMINDERS_KEY = 'all_supplement_reminders';
const SUPPLEMENTS_HISTORY_KEY = 'supplements_history';

const getLocalDateString = (date = new Date()) => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
};

interface ReminderSettings {
    [supplementId: string]: {
        enabled: boolean;
        time: string;
        supplementName: string;
    };
}

export default function ManageSupplementsScreen() {
    const { supplements, isLoading, deleteSupplement, updateSupplement, refreshSupplements } = useSupplements();
    const router = useRouter();

    const [reminders, setReminders] = useState<ReminderSettings>({});
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [editingReminderFor, setEditingReminderFor] = useState<Supplement | null>(null);
    const [supplementsHistory, setSupplementsHistory] = useState<Record<string, any>>({});

    const loadReminders = useCallback(async () => {
        const remindersJSON = await AsyncStorage.getItem(REMINDERS_KEY);
        setReminders(remindersJSON ? JSON.parse(remindersJSON) : {});
    }, []);

    const loadSupplementsHistory = useCallback(async () => {
        try {
            const json = await AsyncStorage.getItem(SUPPLEMENTS_HISTORY_KEY);
            setSupplementsHistory(json ? JSON.parse(json) : {});
        } catch (e) {
            console.warn('Falha ao carregar histórico de suplementos', e);
            setSupplementsHistory({});
        }
    }, []);

    const updateSupplementValue = async (supplement: Supplement, newValue: boolean | number) => {
        const today = getLocalDateString();
        const newHistory = JSON.parse(JSON.stringify(supplementsHistory || {}));

        if (!newHistory[today]) newHistory[today] = {};

        const previousValue = newHistory[today][supplement.id];
        newHistory[today][supplement.id] = newValue;

        if (!newValue) delete newHistory[today][supplement.id];

        setSupplementsHistory(newHistory);
        await AsyncStorage.setItem(SUPPLEMENTS_HISTORY_KEY, JSON.stringify(newHistory));

        if (supplement.trackingType === 'daily_check') {
            Toast.show({ type: newValue ? 'success' : 'info', text1: newValue ? `${supplement.name} registado!` : `Registo de ${supplement.name} removido.` });
        } else if (supplement.trackingType === 'counter') {
            const didIncrement = (typeof newValue === 'number') && newValue > (previousValue || 0);
            Toast.show({ type: didIncrement ? 'success' : 'info', text1: didIncrement ? `Dose de ${supplement.name} adicionada` : `Dose de ${supplement.name} removida` });
        }
    };

    useFocusEffect(
        useCallback(() => {
            refreshSupplements();
            loadReminders();
            loadSupplementsHistory();
        }, [refreshSupplements, loadReminders, loadSupplementsHistory])
    );

    const handleUpdateReminder = async (supplement: Supplement, newSettings: { enabled: boolean; time: Date }) => {
        const updatedReminders = {
            ...reminders,
            [supplement.id]: {
                enabled: newSettings.enabled,
                time: newSettings.time.toISOString(),
                supplementName: supplement.name,
            }
        };
        setReminders(updatedReminders);
        await AsyncStorage.setItem(REMINDERS_KEY, JSON.stringify(updatedReminders));
        await scheduleAllReminders();
    };

    const handleTimePress = (supplement: Supplement) => {
        setEditingReminderFor(supplement);
        setShowTimePicker(true);
    };

    const handleToggleReminder = (supplement: Supplement) => {
        const currentReminder = reminders[supplement.id];
        const newEnabledStatus = !currentReminder?.enabled;
        const time = currentReminder ? new Date(currentReminder.time) : new Date(new Date().setHours(8, 0, 0, 0));
        
        handleUpdateReminder(supplement, { enabled: newEnabledStatus, time });

        Toast.show({
            type: newEnabledStatus ? 'success' : 'info',
            text1: `Lembrete para ${supplement.name} ${newEnabledStatus ? 'ativado' : 'desativado'}.`
        });
    };

    const onChangeTime = (event: DateTimePickerEvent, selectedDate?: Date) => {
        setShowTimePicker(false);
        if (event.type === 'set' && selectedDate && editingReminderFor) {
            handleUpdateReminder(editingReminderFor, { enabled: true, time: selectedDate });
            Toast.show({
                type: 'success',
                text1: `Lembrete para ${editingReminderFor.name} atualizado.`
            });
        }
        setEditingReminderFor(null);
    };

    const handleDelete = (supplement: Supplement) => {
        Alert.alert( `Apagar "${supplement.name}"?`, "Esta ação não pode ser desfeita.",
            [{ text: "Cancelar" }, { text: "Apagar", style: "destructive", onPress: () => deleteSupplement(supplement.id) }]
        );
    };
    
    const formatTime = (date: Date) => date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (isLoading) {
        return <ActivityIndicator size="large" color={themeColor} style={{ flex: 1 }} />;
    }

    // ✅ CORRIGIDO: Componente para renderizar o cabeçalho da lista
    const ListHeader = () => (
        <>
            <Text style={styles.sectionHeader}>Meus Suplementos e Lembretes</Text>
            <Text style={styles.hintText}>Toque na hora para editar. Use o botão para ativar/desativar o lembrete.</Text>
        </>
    );

    return (
        <SafeAreaView style={styles.safeArea}>
            <Stack.Screen options={{ title: 'Gerir Suplementos' }} />
            
            {/* ✅ CORRIGIDO: A FlatList agora é o componente principal de scroll */}
            <FlatList
                data={supplements}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
                ListHeaderComponent={ListHeader}
                renderItem={({ item }) => {
                    const reminder = reminders[item.id];
                    const isReminderEnabled = reminder?.enabled ?? false;
                    const reminderTimeDate = reminder ? new Date(reminder.time) : new Date(new Date().setHours(8, 0, 0, 0));

                    const todayKey = getLocalDateString();
                    const currentValue = supplementsHistory[todayKey]?.[item.id];

                    return (
                        <View style={styles.card}>
                            <View style={styles.infoRow}>
                                <View style={styles.info}>
                                    <Text style={styles.cardTitle}>{item.name}</Text>
                                    <Text style={styles.cardSubtitle}>{`${item.dose}${item.unit}`}</Text>
                                </View>

                                <View style={styles.reminderControlsInline}>
                                    <View style={{ alignItems: 'flex-end' }}>
                                        <Pressable onPress={() => handleTimePress(item)}>
                                            <Text style={[styles.reminderTimeText, { color: isReminderEnabled ? themeColor : 'gray' }]}> 
                                                {formatTime(reminderTimeDate)}
                                            </Text>
                                        </Pressable>
                                        <Switch
                                            trackColor={{ false: "#ccc", true: "#81b0ff" }}
                                            thumbColor={isReminderEnabled ? themeColor : "#f4f3f4"}
                                            onValueChange={() => handleToggleReminder(item)}
                                            value={isReminderEnabled}
                                            style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }], marginTop: 6 }}
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
                                                await updateSupplement({ ...item, showOnHome: newVal } as any);
                                                Toast.show({ type: 'success', text1: newVal ? 'Visível na home' : 'Oculto na home' });
                                            } catch (e) {
                                                console.warn('Falha ao atualizar visibilidade:', e);
                                            }
                                        }}
                                        style={[styles.iconButton, { marginRight: 12 }]}
                                    >
                                        <Ionicons name={item.showOnHome === false ? 'eye-off-outline' : 'eye-outline'} size={22} color={item.showOnHome === false ? '#888' : themeColor} />
                                    </Pressable>

                                    <Pressable style={[styles.iconButton, { marginRight: 12 }]} onPress={() => router.push({ pathname: '/suplemento-modal', params: { id: item.id } })}>
                                        <Ionicons name="pencil-outline" size={22} color={'#3498db'} />
                                    </Pressable>
                                    <Pressable style={styles.iconButton} onPress={() => handleDelete(item)}>
                                        <Ionicons name="trash-outline" size={22} color="#e74c3c" />
                                    </Pressable>
                                </View>

                                <View style={styles.actionRight}>
                                    {/* Markers group: show on right */}
                                    {item.trackingType === 'daily_check' ? (
                                        <Pressable
                                            onPress={() => {
                                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                                const taken = !!currentValue;
                                                updateSupplementValue(item, !taken);
                                            }}
                                            style={styles.toggleCheckButton}
                                        >
                                            <Text style={styles.toggleCheckText}>{currentValue ? '✔' : '○'}</Text>
                                        </Pressable>
                                    ) : (
                                        <View style={styles.counterContainerInline}>
                                            <Pressable
                                                onPress={() => {
                                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                                    const count = Number(currentValue || 0);
                                                    updateSupplementValue(item, Math.max(0, count - 1));
                                                }}
                                                style={styles.counterButton}
                                            >
                                                <Ionicons name="chevron-back-outline" size={18} color="gray" />
                                            </Pressable>
                                            <Text style={styles.counterCountText}>{Number(currentValue || 0)}</Text>
                                            <Pressable
                                                onPress={() => {
                                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                                    const count = Number(currentValue || 0);
                                                    updateSupplementValue(item, count + 1);
                                                }}
                                                style={styles.counterButton}
                                            >
                                                <Ionicons name="chevron-forward-outline" size={18} color="gray" />
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
                    value={reminders[editingReminderFor.id] ? new Date(reminders[editingReminderFor.id].time) : new Date()}
                    mode="time"
                    is24Hour={true}
                    display="default"
                    onChange={onChangeTime}
                />
            )}
            
            <Pressable style={styles.addButton} onPress={() => router.push('/suplemento-modal')}>
                <Ionicons name="add" size={32} color="white" />
            </Pressable>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#f0f2f5' },
    sectionHeader: { fontSize: 18, fontWeight: 'bold', color: '#333', marginTop: 20, marginBottom: 5 },
    hintText: {
        fontSize: 12,
        color: 'gray',
        fontStyle: 'italic',
        marginBottom: 15,
    },
    card: { 
        backgroundColor: 'white',
        borderRadius: 20,
        paddingHorizontal: 25,
        paddingVertical: 14,
        marginBottom: 20,
        flexDirection: 'column',
        justifyContent: 'space-between',
        alignItems: 'stretch',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 3,
        minHeight: 95,
    },
    info: { flex: 1, marginRight: 10 },
    cardTitle: { fontSize: 22, fontWeight: 'bold', color: '#333' },
    cardSubtitle: { fontSize: 14, color: 'gray', marginTop: 5 },
    reminderControls: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 15,
    },
    reminderTimeText: { 
        fontSize: 16, 
        fontWeight: 'bold',
        marginRight: 5,
    },
    actions: { flexDirection: 'row', alignItems: 'center' },
    addButton: { position: 'absolute', bottom: 30, right: 30, backgroundColor: themeColor, width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', elevation: 8 },
    /* New styles for bottom action area */
    infoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    reminderControlsInline: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    actionsBottom: {
        marginTop: 14,
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
        paddingTop: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    actionLeft: { flexDirection: 'row', alignItems: 'center', marginRight: 18 },
    actionRight: { flexDirection: 'row', alignItems: 'center' },
    iconButton: { padding: 8, borderRadius: 10 },
    toggleCheckButton: { marginLeft: 12, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: '#ffffff00' },
    toggleCheckText: { fontSize: 18, color: themeColor, fontWeight: '700' },
    counterContainer: { flexDirection: 'row', alignItems: 'center', marginLeft: 10 },
    counterButton: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    counterCountText: { fontSize: 16, fontWeight: '600', width: 34, textAlign: 'center', color: '#333' },
    /* Home-like quick card styles */
    cardDose: { fontSize: 14, color: 'gray', marginTop: 5 },
    statusIcon: { fontSize: 30 },
    wheyCounter: { flexDirection: 'row', alignItems: 'center' },
    wheyCountText: { fontSize: 28, fontWeight: 'bold', color: '#333', width: 40, textAlign: 'center' },
    wheyArrow: { fontSize: 24, color: 'gray' },
    wheyButton: { paddingHorizontal: 10 },
    trackingRow: { marginTop: 10, flexDirection: 'row', alignItems: 'center' },
    trackingRowInline: { marginTop: 8, alignItems: 'center' },
    counterContainerInline: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
});