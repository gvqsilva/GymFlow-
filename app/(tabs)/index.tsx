// app/(tabs)/index.tsx

import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { Link } from 'expo-router';
import * as Sharing from 'expo-sharing';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Animated, Dimensions, FlatList, Modal, Pressable, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';
import ViewShot from 'react-native-view-shot';
import ShareCard from '../../components/ShareCard';
import { useSportsContext } from '../../context/SportsProvider';
import { useFirebaseData } from '../../hooks/useFirebaseData';
import { Supplement, useSupplements } from '../../hooks/useSupplements';
import { DEFAULT_USER_GOALS, DEFAULT_VISIBLE_METRICS } from '../../hooks/useUserConfig';
import { useWorkouts } from '../../hooks/useWorkouts';
import { autoSyncService } from '../../services/autoSync';
import { firebaseSyncService } from '../../services/firebaseSync';

const themeColor = '#5a4fcf';
const gradientColors = ['#6c5ce7', '#5a4fcf', '#4834d4'];
const { width, height } = Dimensions.get('window');

const SUPPLEMENTS_HISTORY_KEY = 'supplements_history';

// ✅ NOVO: Configurações de tema
const theme = {
    colors: {
        primary: '#5a4fcf',
        secondary: '#6c5ce7',
        accent: '#ff6b6b',
        success: '#4CAF50',
        warning: '#FF9800',
        info: '#45b7d1',
        background: '#f8f9fa',
        surface: '#ffffff',
        text: '#333333',
        textSecondary: '#666666',
        textLight: '#999999',
        border: '#e0e0e0',
    },
    shadows: {
        small: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
        },
        medium: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 8,
            elevation: 5,
        },
        large: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.2,
            shadowRadius: 16,
            elevation: 8,
        },
    },
};

const getLocalDateString = (date = new Date()) => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
};
const getStartOfWeek = (date = new Date()) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    d.setHours(0, 0, 0, 0);
    return new Date(d.setDate(diff));
};

// ✅ NOVO: Função para obter a saudação baseada na hora
const getGreeting = () => {
    const currentHour = new Date().getHours();
    if (currentHour < 12) {
        return "Bom dia";
    } else if (currentHour < 18) {
        return "Boa tarde";
    } else {
        return "Boa noite";
    }
};

// ✅ NOVO: Função para obter emoji baseado na hora
const getTimeEmoji = () => {
    const currentHour = new Date().getHours();
    if (currentHour < 6) return "🌙";
    if (currentHour < 12) return "🌅";
    if (currentHour < 18) return "☀️";
    if (currentHour < 20) return "🌇";
    return "🌙";
};

// ✅ NOVO: Função para obter iniciais do nome
const getInitials = (name: string) => {
    return name
        .split(' ')
        .map(word => word.charAt(0))
        .join('')
        .toUpperCase()
        .slice(0, 2);
};

// ✅ MELHORADO: Componente de métricas com animações avançadas
const AnimatedMetric = ({ 
    icon, 
    title, 
    value, 
    unit, 
    color = themeColor, 
    delay = 0, 
    onPress,
    expanded = false,
    goal,
    id
}: {
    icon: string;
    title: string;
    value: string | number;
    unit?: string;
    color?: string;
    delay?: number;
    onPress?: () => void;
    expanded?: boolean;
    goal?: number;
    id?: string;
}) => {
    const scaleAnim = useRef(new Animated.Value(0)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const bounceAnim = useRef(new Animated.Value(1)).current;
    const rotateAnim = useRef(new Animated.Value(0)).current;
    const expandAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Animação de entrada melhorada
        Animated.sequence([
            Animated.delay(delay),
            Animated.parallel([
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    tension: 80,
                    friction: 6,
                    useNativeDriver: true,
                }),
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 800,
                    useNativeDriver: true,
                }),
                Animated.timing(rotateAnim, {
                    toValue: 1,
                    duration: 600,
                    useNativeDriver: true,
                }),
            ]),
        ]).start();
    }, []);

    useEffect(() => {
        Animated.spring(expandAnim, {
            toValue: expanded ? 1 : 0,
            tension: 100,
            friction: 8,
            useNativeDriver: false, // ✅ CORREÇÃO: height não suporta useNativeDriver
        }).start();
    }, [expanded]);

    const handlePressIn = () => {
        // Feedback háptico
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        
        Animated.spring(bounceAnim, {
            toValue: 0.92,
            useNativeDriver: true,
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(bounceAnim, {
            toValue: 1,
            tension: 150,
            friction: 4,
            useNativeDriver: true,
        }).start();
    };

    const handlePress = () => {
        // Feedback háptico para clique
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onPress?.();
    };

    const rotate = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['180deg', '0deg'],
    });

    const progress = goal ? Math.min((Number(value) / goal) * 100, 100) : 0;

    return (
        <Animated.View
            style={[
                styles.metricCard,
                {
                    transform: [
                        { scale: scaleAnim },
                        { scale: bounceAnim },
                        { rotate }
                    ],
                    opacity: fadeAnim,
                    // ✅ CORREÇÃO: Removido height animado para evitar conflito com useNativeDriver
                },
            ]}
        >
            <TouchableOpacity
                onPress={handlePress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                activeOpacity={0.9}
                style={styles.metricContent}
            >
                <View style={[styles.metricIconContainer, { backgroundColor: color + '20' }]}>
                    <Animated.View style={{ transform: [{ rotate }] }}>
                        <Ionicons name={icon as any} size={24} color={color} />
                    </Animated.View>
                </View>
                
                <Text style={styles.metricTitle}>{title} </Text>
                
                <View style={styles.metricValueContainer}>
                    <Text style={[styles.metricValue, { color }]}>{value} </Text>
                    {unit && <Text style={styles.metricUnit}>{unit} </Text>}
                </View>

                {/* ✅ SIMPLIFICADO: Apenas mostrar progresso se expandido */}
                {expanded && goal && (
                    <Animated.View 
                        style={{
                            opacity: expandAnim,
                            marginTop: 10,
                            transform: [{
                                translateY: expandAnim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [20, 0],
                                }),
                            }],
                        }}
                    >
                        <Text style={[styles.metricTitle, { fontSize: 12, color: '#666' }]}>
                            {progress.toFixed(0)}% da meta ({goal} {unit}) </Text>
                    </Animated.View>
                )}
            </TouchableOpacity>
        </Animated.View>
    );
};

// ✅ NOVO: Componente de progresso circular animado
const CircularProgress = ({ percentage, size = 60, strokeWidth = 6, color = themeColor }: {
    percentage: number;
    size?: number;
    strokeWidth?: number;
    color?: string;
}) => {
    const animatedValue = useRef(new Animated.Value(0)).current;
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;

    useEffect(() => {
        Animated.timing(animatedValue, {
            toValue: percentage,
            duration: 1500,
            useNativeDriver: false,
        }).start();
    }, [percentage]);

    return (
        <View style={{ width: size, height: size }}>
            <View style={[styles.circularProgressContainer, { width: size, height: size }]}>
                <View style={[styles.circularProgressBackground, {
                    width: size,
                    height: size,
                    borderRadius: size / 2,
                    borderWidth: strokeWidth,
                    borderColor: color + '20',
                }]} />
                <Animated.View
                    style={[
                        styles.circularProgressFill,
                        {
                            width: size,
                            height: size,
                            borderRadius: size / 2,
                            borderWidth: strokeWidth,
                            borderColor: color,
                            transform: [{
                                rotate: animatedValue.interpolate({
                                    inputRange: [0, 100],
                                    outputRange: ['0deg', '360deg'],
                                })
                            }]
                        }
                    ]}
                />
                <View style={[styles.circularProgressCenter, {
                    width: size - strokeWidth * 2,
                    height: size - strokeWidth * 2,
                    borderRadius: (size - strokeWidth * 2) / 2,
                }]}>
                    <Text style={[styles.circularProgressText, { color }]}>
                        {Math.round(percentage)}% </Text>
                </View>
            </View>
        </View>
    );
};

// ✅ NOVO: Componente de estatística rápida
const QuickStat = ({ icon, title, value, unit, color = themeColor, onPress }: {
    icon: string;
    title: string;
    value: string | number;
    unit?: string;
    color?: string;
    onPress?: () => void;
}) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
        Animated.spring(scaleAnim, {
            toValue: 0.95,
            useNativeDriver: true,
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: true,
        }).start();
    };

    return (
        <Pressable
            onPress={onPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            style={[styles.quickStatCard, { opacity: onPress ? 1 : 0.9 }]}
        >
            <Animated.View style={[styles.quickStatContent, { transform: [{ scale: scaleAnim }] }]}>
                <View style={[styles.quickStatIcon, { backgroundColor: color + '20' }]}>
                    <Ionicons name={icon as any} size={24} color={color} />
                </View>
                <Text style={styles.quickStatTitle}>{title} </Text>
                <View style={styles.quickStatValueContainer}>
                    <Text style={[styles.quickStatValue, { color }]}>{value} </Text>
                    {unit && <Text style={styles.quickStatUnit}>{unit} </Text>}
                </View>
            </Animated.View>
        </Pressable>
    );
};

// ✅ NOVO: Componente de progresso de meta
const ProgressGoal = ({ title, current, goal, unit, icon }: {
    title: string;
    current: number;
    goal: number;
    unit: string;
    icon: string;
}) => {
    const progress = Math.min(current / goal, 1);
    const progressAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(progressAnim, {
            toValue: progress,
            duration: 1000,
            useNativeDriver: false,
        }).start();
    }, [progress]);

    return (
        <View style={styles.progressCard}>
            <View style={styles.progressHeader}>
                <View style={styles.progressIconContainer}>
                    <Ionicons name={icon as any} size={20} color={themeColor} />
                </View>
                <Text style={styles.progressTitle}>{title}</Text>
            </View>
            <View style={styles.progressBarContainer}>
                <View style={styles.progressBarBackground}>
                    <Animated.View 
                        style={[
                            styles.progressBarFill,
                            {
                                width: progressAnim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: ['0%', '100%'],
                                })
                            }
                        ]}
                    />
                </View>
                <Text style={styles.progressText}>
                    {current} / {goal} {unit} </Text>
            </View>
        </View>
    );
};

const WeeklySummaryGraph = ({ data, iconMap }: { data: { [key: string]: number }, iconMap: any }) => {
    const activities = Object.entries(data);

    if (activities.length === 0) {
        return (
            <View style={styles.graphContainer}>
                <Text style={styles.graphTitle}>Resumo da Semana </Text>
                <Text style={styles.noActivityText}>Nenhuma atividade registada esta semana. </Text>
            </View>
        );
    }
    const maxCount = Math.max(...activities.map(([, count]) => count), 1);
    
    return (
        <View style={styles.graphContainer}>
            <Text style={styles.graphTitle}>Resumo da Semana </Text>
            <View style={styles.barGraphContainer}>
                {activities.map(([category, count]) => {
                    const iconInfo = iconMap[category];
                    const IconComponent = iconInfo?.library === 'MaterialCommunityIcons' 
                        ? MaterialCommunityIcons 
                        : Ionicons;

                    return (
                        <View key={category} style={styles.barWrapper}>
                            <View style={styles.barItem}>
                                <Text style={styles.barLabelCount}>{count}x</Text>
                                <View style={[styles.bar, { height: `${(count / maxCount) * 100}%` }]} />
                            </View>
                            {iconInfo ? (
                                <IconComponent name={iconInfo.name as any} size={28} color={themeColor} style={styles.barLabelIcon} />
                            ) : (
                                <Ionicons name="help-circle-outline" size={28} color="gray" style={styles.barLabelIcon} />
                            )}
                        </View>
                    );
                })}
            </View>
        </View>
    );
};


export default function HomeScreen() {
    const { workouts, isLoading: isLoadingWorkouts, refreshWorkouts } = useWorkouts();
    const { sports } = useSportsContext();
    const { supplements, refreshSupplements } = useSupplements();

    // ✅ NOVOS HOOKS FIREBASE - Substituindo estados antigos
    const firebaseData = useFirebaseData();
    const {
        userConfig: userConfigState,
        supplementsHistory,
        workoutHistory,
        foodHistory,
    } = firebaseData;
    const currentUserConfig = userConfigState.userConfig;

    const [userName, setUserName] = useState(currentUserConfig?.name || 'Utilizador');
    const [userAvatarColor, setUserAvatarColor] = useState(themeColor);
    const [weeklyGymWorkouts, setWeeklyGymWorkouts] = useState(0);
    const [weeklySummary, setWeeklySummary] = useState<{ [key: string]: number }>({});
    const [nextWorkoutId, setNextWorkoutId] = useState('A');
    const [totalCaloriesToday, setTotalCaloriesToday] = useState(0);
    const [isDetailsModalVisible, setIsDetailsModalVisible] = useState(false);
    const [todayActivities, setTodayActivities] = useState<any[]>([]);
    const [expandedMetric, setExpandedMetric] = useState<string | null>(null);

    const visibleMetrics = useMemo(() => ({
        ...DEFAULT_VISIBLE_METRICS,
        ...(currentUserConfig?.visibleMetrics || {}),
    }), [currentUserConfig]);

    const userGoals = useMemo(() => ({
        ...DEFAULT_USER_GOALS,
        ...(currentUserConfig?.userGoals || {}),
    }), [currentUserConfig]);

    const viewShotRef = useRef<ViewShot>(null);
    const isFocused = useIsFocused();
    const welcomeToastShown = useRef(false);
    
    const sportIconMap = useMemo(() => {
        const map: Record<string, { name: string; library: string }> = {};
        sports.forEach(sport => {
            const key = sport.name === 'Academia' ? 'Musculação' : sport.name;
            map[key] = { name: sport.icon as string, library: sport.library };
        });
        return map;
    }, [sports]);

    const loadData = useCallback(async () => {
        const today = getLocalDateString();
        try {
            // 🔥 SINCRONIZAÇÃO FIREBASE - Carrega dados da nuvem primeiro
            try {
                // Carrega histórico de treinos
                const firebaseWorkoutHistory = await firebaseSyncService.loadWorkoutHistory();
                if (firebaseWorkoutHistory && firebaseWorkoutHistory.length > 0) {
                    await AsyncStorage.setItem('workoutHistory', JSON.stringify(firebaseWorkoutHistory));
                    console.log('✅ Histórico de treinos carregado do Firebase');
                }

                // Carrega histórico de suplementos
                const firebaseSupplementsHistory = await firebaseSyncService.loadSupplementsHistory();
                if (firebaseSupplementsHistory) {
                    await AsyncStorage.setItem(SUPPLEMENTS_HISTORY_KEY, JSON.stringify(firebaseSupplementsHistory));
                    console.log('✅ Histórico de suplementos carregado do Firebase');
                }
            } catch (syncError) {
                console.warn('⚠️ Falha ao carregar do Firebase, usando dados locais:', syncError);
            }

            const profileJSON = await AsyncStorage.getItem('userProfile');
            if (profileJSON) {
                const profile = JSON.parse(profileJSON);
                setUserName(profile.name || 'Utilizador');
                setUserAvatarColor(profile.avatarColor || themeColor);
            }

            // supplementsHistory agora vem do hook Firebase
            // const historyJSON = await AsyncStorage.getItem(SUPPLEMENTS_HISTORY_KEY);
            // setSupplementsHistory(historyJSON ? JSON.parse(historyJSON) : {});

            const workoutHistoryJSON = await AsyncStorage.getItem('workoutHistory');
            if (workoutHistoryJSON) {
                const history: { date: string, category: string, details: { calories?: number, type?: string, duration?: number } }[] = JSON.parse(workoutHistoryJSON);
                
                const startOfWeekString = getLocalDateString(getStartOfWeek());
                const weeklyHistory = history.filter(entry => entry.date >= startOfWeekString);
                
                const gymWorkoutsThisWeek = weeklyHistory.filter(entry => entry.category === 'Musculação');
                setWeeklyGymWorkouts(gymWorkoutsThisWeek.length);
                
                const summary = weeklyHistory.reduce((acc, entry) => {
                    const category = entry.category || 'Outro';
                    acc[category] = (acc[category] || 0) + 1;
                    return acc;
                }, {} as { [key: string]: number });
                setWeeklySummary(summary);

                const activitiesToday = history.filter(entry => entry.date === today);
                setTodayActivities(activitiesToday);

                const totalKcal = activitiesToday.reduce((sum, entry) => sum + (entry.details?.calories || 0), 0);
                setTotalCaloriesToday(totalKcal);

            } else {
                setWeeklyGymWorkouts(0);
                setWeeklySummary({});
                setTotalCaloriesToday(0);
                setTodayActivities([]);
            }

            const savedNextWorkoutId = await AsyncStorage.getItem('nextWorkoutId');
            setNextWorkoutId(savedNextWorkoutId || 'A');
        } catch (e) {
            console.error("Failed to load data.", e);
        }
    }, []);
    
    // ✅ NOVO: Função para verificar conquistas
    const checkAchievements = useCallback((newCalories: number, newActivities: number, newWorkouts: number) => {
        const achievements = [];
        
        // Conquista de calorias
        if (newCalories >= userGoals.dailyCalories && totalCaloriesToday < userGoals.dailyCalories) {
            achievements.push({
                title: '🔥 Meta de Calorias!',
                message: `Você queimou ${userGoals.dailyCalories} kcal hoje!`,
                type: 'success'
            });
        }
        
        // Conquista de atividades semanais
        if (newActivities >= userGoals.weeklyActivities && Object.values(weeklySummary).reduce((sum, count) => sum + count, 0) < userGoals.weeklyActivities) {
            achievements.push({
                title: '💪 Semana Ativa!',
                message: `Você completou ${userGoals.weeklyActivities} atividades esta semana!`,
                type: 'success'
            });
        }
        
        // Conquista de treinos semanais
        if (newWorkouts >= userGoals.weeklyWorkouts && weeklyGymWorkouts < userGoals.weeklyWorkouts) {
            achievements.push({
                title: '🏆 Meta de Treinos!',
                message: `${userGoals.weeklyWorkouts} treinos concluídos esta semana!`,
                type: 'success'
            });
        }
        
        // Mostrar conquistas com feedback háptico
        achievements.forEach((achievement, index) => {
            setTimeout(() => {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                Toast.show({
                    type: achievement.type,
                    text1: achievement.title,
                    text2: achievement.message,
                    visibilityTime: 4000,
                });
            }, index * 1000);
        });
    }, [userGoals, totalCaloriesToday, weeklySummary, weeklyGymWorkouts]);

    // ✅ NOVO: Carregar configurações do usuário
    useEffect(() => {
        if (isFocused) {
            refreshSupplements();
            loadData();
            refreshWorkouts();
            
            // 🔥 INICIA SINCRONIZAÇÃO AUTOMÁTICA
            autoSyncService.startAutoSync();
        }
    }, [isFocused, loadData, refreshWorkouts, refreshSupplements]);

    useEffect(() => {
        if (currentUserConfig?.name) {
            setUserName(currentUserConfig.name);
        }
    }, [currentUserConfig?.name]);

    useEffect(() => {
        if (isFocused && !welcomeToastShown.current && userName !== 'Utilizador') {
            Toast.show({
                type: 'info',
                text1: `Bem-vindo de volta, ${userName}!`,
                text2: 'Pronto para esmagar os seus objetivos hoje? 💪',
                visibilityTime: 4000
            });
            welcomeToastShown.current = true;
        }
    }, [isFocused, userName]);

    const updateSupplementValue = async (supplement: Supplement, newValue: boolean | number) => {
        const today = getLocalDateString();
        
        try {
            if (typeof newValue === 'boolean' && !newValue) {
                // Marcar como não tomado (para daily_check)
                await supplementsHistory.markSupplementNotTaken(supplement.id, supplement.name, today);
            } else if (typeof newValue === 'number') {
                const previousValue = supplementsHistory.getSupplementStatus(supplement.id, today)?.timesTaken || 0;
                if (newValue < previousValue) {
                    // Remover dose
                    await supplementsHistory.updateSupplementEntry(supplement.id, today, { timesTaken: newValue });
                } else if (newValue > previousValue) {
                    // Adicionar dose
                    await supplementsHistory.markSupplementTaken(supplement.id, supplement.name, today, supplement.dose);
                } else if (newValue === 0) {
                    // Reset para contador
                    await supplementsHistory.markSupplementNotTaken(supplement.id, supplement.name, today);
                }
            } else {
                // Marcar como tomado
                const dose = typeof newValue === 'number' ? newValue : supplement.dose;
                await supplementsHistory.markSupplementTaken(supplement.id, supplement.name, today, dose);
            }

            // Firebase sync é automático através do hook
            console.log('✅ Histórico de suplementos atualizado automaticamente no Firebase');

            if (supplement.trackingType === 'daily_check') {
                Toast.show({
                    type: newValue ? 'success' : 'info',
                    text1: newValue ? `${supplement.name} registado!` : `Registo de ${supplement.name} removido.`
                });
            } else if (supplement.trackingType === 'counter') {
                const previousValue = supplementsHistory.getSupplementStatus(supplement.id, today)?.timesTaken || 0;
                const didIncrement = Number(newValue) > previousValue;
                Toast.show({
                    type: didIncrement ? 'success' : 'info',
                    text1: `Dose de ${supplement.name} ${didIncrement ? 'Adicionada' : 'Removida'} (${newValue})`
                });
            }
        } catch (error) {
            console.error('Erro ao atualizar suplemento:', error);
            Toast.show({
                type: 'error',
                text1: 'Erro ao salvar suplemento',
                text2: 'Tente novamente'
            });
        }
    };
    
    const handleShare = async () => {
        if (viewShotRef.current?.capture) {
            try {
                const uri = await viewShotRef.current.capture();
                if (!(await Sharing.isAvailableAsync())) {
                    Alert.alert("Erro", "A partilha não está disponível neste dispositivo.");
                    return;
                }
                await Sharing.shareAsync(uri);
            } catch (error) {
                console.error("Erro ao partilhar:", error);
                Alert.alert("Erro", "Não foi possível partilhar a imagem.");
            }
        }
    };

    // ✅ NOVO: Obtém a saudação e o nome do utilizador
    const greeting = getGreeting();
    const welcomeMessage = `${greeting},`;

    const nextWorkoutName = isLoadingWorkouts ? 'A carregar...' : (workouts[nextWorkoutId]?.name || 'Treino');
    const totalDurationToday = todayActivities.reduce((sum, entry) => sum + (entry.details?.duration || (entry.category === 'Musculação' ? 60 : 0)), 0);
    const totalWeeklyActivities = Object.values(weeklySummary).reduce((sum, count) => sum + count, 0);

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="light-content" backgroundColor={themeColor} />
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* ✅ APRIMORADO: Header com gradiente e animações */}
                <View style={styles.headerContainer}>
                    <View style={[styles.headerGradient, { backgroundColor: themeColor }]}>
                        <View style={styles.headerContent}>
                            <View style={styles.greetingContainer}>
                                <Text style={styles.greetingSmall}>
                                    {welcomeMessage} </Text>
                                <Text style={styles.greetingLarge}>{userName} </Text>
                            </View>
                            <Link href="/perfil" asChild>
                                <TouchableOpacity style={styles.profileIconContainer}>
                                    <View style={[
                                        styles.profileAvatar,
                                        { backgroundColor: userAvatarColor }
                                    ]}>
                                        <Text style={styles.profileInitial}>
                                            {getInitials(userName)} </Text>
                                    </View>
                                </TouchableOpacity>
                            </Link>
                        </View>
                    </View>
                </View>

                {/* ✅ APRIMORADO: Métricas animadas com expansão */}
                <View style={styles.metricsContainer}>
                    {visibleMetrics.calories && (
                        <AnimatedMetric
                            icon="flame-outline"
                            title="Calorias"
                            value={totalCaloriesToday}
                            unit="kcal"
                            color={theme.colors.accent}
                            delay={0}
                            onPress={() => setIsDetailsModalVisible(true)}
                        />
                    )}
                    {visibleMetrics.activities && (
                        <AnimatedMetric
                            icon="bar-chart-outline"
                            title="Atividades"
                            value={totalWeeklyActivities}
                            unit="sem"
                            color={theme.colors.success}
                            delay={100}
                            onPress={() => {
                                setExpandedMetric(expandedMetric === 'activities' ? null : 'activities');
                            }}
                            expanded={expandedMetric === 'activities'}
                            goal={userGoals.weeklyActivities}
                            id="activities"
                        />
                    )}
                    {visibleMetrics.time && (
                        <AnimatedMetric
                            icon="time-outline"
                            title="Tempo"
                            value={Math.round(totalDurationToday)}
                            unit="min"
                            color={theme.colors.info}
                            delay={200}
                            onPress={() => {
                                setExpandedMetric(expandedMetric === 'time' ? null : 'time');
                            }}
                            expanded={expandedMetric === 'time'}
                            goal={userGoals.dailyTime}
                            id="time"
                        />
                    )}
                </View>

                {/* ✅ REDESIGN: Card de progresso semanal compacto */}
                <View style={styles.weeklyProgressCard}>
                    <View style={styles.weeklyProgressHeader}>
                        <View style={styles.weeklyIconContainer}>
                            <Ionicons name="calendar-outline" size={20} color="white" />
                        </View>
                        <View style={styles.weeklyTitleContainer}>
                            <Text style={styles.weeklyTitle}>Progresso da Semana </Text>
                            <Text style={styles.weeklySubtitle}>{weeklyGymWorkouts}/{userGoals.weeklyWorkouts} treinos </Text>
                        </View>
                        <Text style={styles.weeklyProgressPercentage}>
                            {Math.round((weeklyGymWorkouts / userGoals.weeklyWorkouts) * 100)}% </Text>
                    </View>
                    
                    <View style={styles.weeklyProgressContent}>
                        <View style={styles.weeklyProgressBarContainer}>
                            <View style={styles.weeklyProgressBarBackground}>
                                <Animated.View 
                                    style={[
                                        styles.weeklyProgressBarFill,
                                        { width: `${Math.min((weeklyGymWorkouts / userGoals.weeklyWorkouts) * 100, 100)}%` }
                                    ]} 
                                />
                            </View>
                        </View>
                        
                        {weeklyGymWorkouts >= userGoals.weeklyWorkouts ? (
                            <View style={styles.weeklyCompletedBadge}>
                                <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                                <Text style={styles.weeklyCompletedText}>Meta Concluída! 🎉 </Text>
                            </View>
                        ) : (
                            <Text style={styles.weeklyMotivationText}>
                                {weeklyGymWorkouts === 0 
                                    ? "Vamos começar! 💪" 
                                    : weeklyGymWorkouts === 1 
                                    ? "Continue assim! 🔥"
                                    : weeklyGymWorkouts === 2
                                    ? "Meio caminho! ⚡"
                                    : "Quase lá! 🚀"
                                } </Text>
                        )}
                    </View>
                </View>

                <View style={styles.content}>
                    {/* ✅ APRIMORADO: Card do próximo treino com mais destaque */}
                    <View style={[styles.nextWorkoutCard, styles.featuredCard]}>
                        <View style={styles.nextWorkoutHeader}>
                            <View style={styles.workoutIconBadge}>
                                <Ionicons name="barbell-outline" size={24} color="white" />
                            </View>
                            <View style={styles.nextWorkoutInfo}>
                                <Text style={styles.nextWorkoutTitle}>Próximo Treino </Text>
                                <Text style={styles.nextWorkoutName}>{nextWorkoutName} </Text>
                            </View>
                        </View>
                        <Link 
                            href={{ pathname: "/fichas/[id]", params: { id: nextWorkoutId, title: nextWorkoutName } }} 
                            asChild
                        >
                            <TouchableOpacity style={styles.startWorkoutButton}>
                                <Text style={styles.startWorkoutText}>Iniciar Agora </Text>
                                <Ionicons name="play-circle" size={24} color="white" />
                            </TouchableOpacity>
                        </Link>
                    </View>

                    {/* ✅ APRIMORADO: Suplementos com design melhorado */}
                    {supplements.filter((s: any) => s.showOnHome !== false).length > 0 && (
                        <View style={styles.supplementsSection}>
                            <Text style={styles.sectionTitle}>
                                <Ionicons name="medical-outline" size={20} color={theme.colors.primary} /> Suplementos Diários </Text>
                            {supplements.filter((s: any) => s.showOnHome !== false).map((supplement: any, index: number) => {
                                const today = getLocalDateString();
                                const supplementStatus = supplementsHistory.getSupplementStatus(supplement.id, today);

                                if (supplement.trackingType === 'daily_check') {
                                    const isTaken = supplementStatus?.taken || false;
                                    return (
                                        <Animated.View 
                                            key={supplement.id}
                                            style={[
                                                styles.supplementCardEnhanced,
                                                isTaken && styles.supplementCardTaken,
                                                { transform: [{ scale: 1 }] }
                                            ]}
                                        >
                                            <TouchableOpacity 
                                                style={styles.supplementContent}
                                                onPress={() => {
                                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                                    updateSupplementValue(supplement, !isTaken);
                                                }}
                                            >
                                                <View style={styles.supplementInfo}>
                                                    <Text style={[styles.supplementName, isTaken && styles.supplementNameTaken]}>
                                                        {supplement.name}
                                                    </Text>
                                                    <Text style={styles.supplementDose}>
                                                        {`${supplement.dose}${supplement.unit}`}
                                                    </Text>
                                                </View>
                                                <View style={[styles.supplementStatusIcon, isTaken && styles.supplementStatusIconTaken]}>
                                                    <Ionicons 
                                                        name={isTaken ? "checkmark-circle" : "ellipse-outline"} 
                                                        size={28} 
                                                        color={isTaken ? theme.colors.success : theme.colors.textLight} 
                                                    />
                                                </View>
                                            </TouchableOpacity>
                                        </Animated.View>
                                    );
                                }

                                if (supplement.trackingType === 'counter') {
                                    const count = supplementStatus?.timesTaken || 0;
                                    return (
                                        <View key={supplement.id} style={styles.supplementCardEnhanced}>
                                            <View style={styles.supplementContent}>
                                                <View style={styles.supplementInfo}>
                                                    <Text style={styles.supplementName}>{supplement.name} </Text>
                                                    <Text style={styles.supplementDose}>
                                                        {`${supplement.dose}${supplement.unit} por dose`} </Text>
                                                </View>
                                                <View style={styles.counterEnhanced}>
                                                    <TouchableOpacity 
                                                        onPress={() => {
                                                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                                                updateSupplementValue(supplement, Math.max(0, count - 1));
                                                        }} 
                                                        style={[styles.counterButtonEnhanced, styles.counterButtonMinus]}
                                                    >
                                                        <Ionicons name="remove" size={18} color="white" />
                                                    </TouchableOpacity>
                                                    <Text style={styles.counterTextEnhanced}>{count} </Text>
                                                    <TouchableOpacity 
                                                        onPress={() => {
                                                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                                            updateSupplementValue(supplement, count + 1);
                                                        }} 
                                                        style={[styles.counterButtonEnhanced, styles.counterButtonPlus]}
                                                    >
                                                        <Ionicons name="add" size={18} color="white" />
                                                    </TouchableOpacity>
                                                </View>
                                            </View>
                                        </View>
                                    );
                                }
                                return null;
                            })}
                        </View>
                    )}

                    {/* ✅ MANTIDO: Gráfico semanal com melhorias visuais */}
                    <View style={[styles.graphContainer, styles.enhancedCard]}>
                        <Text style={styles.graphTitle}>
                            <Ionicons name="bar-chart-outline" size={20} color={theme.colors.primary} /> Atividades da Semana </Text>
                        <WeeklySummaryGraph data={weeklySummary} iconMap={sportIconMap} />
                    </View>
                </View>
            </ScrollView>

            <Modal
                animationType="slide"
                transparent={true}
                visible={isDetailsModalVisible}
                onRequestClose={() => setIsDetailsModalVisible(false)}
            >
                <View style={{ position: 'absolute', top: -10000 }}>
                    <ViewShot ref={viewShotRef} options={{ format: 'jpg', quality: 0.9 }}>
                        <ShareCard 
                            activities={todayActivities} 
                            totalKcal={totalCaloriesToday}
                            totalDuration={totalDurationToday}
                            date={new Date()}
                            workouts={workouts}
                        />
                    </ViewShot>
                </View>

                <Pressable style={styles.modalContainer} onPress={() => setIsDetailsModalVisible(false)}>
                    <Pressable style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Gasto Calórias de Hoje </Text>
                        <FlatList
                            data={todayActivities}
                            keyExtractor={(item, index) => `${item.category}-${index}`}
                            renderItem={({ item }) => {
                                let activityDisplayName = item.category;
                                if (item.category === 'Musculação' && item.details?.type) {
                                    const workoutName = workouts && workouts[item.details.type] ? workouts[item.details.type].name : item.details.type;
                                    activityDisplayName = `Musculação (${workoutName})`;
                                }
                                return (
                                    <View style={styles.activityItem}>
                                        <Text style={styles.activityName}>{activityDisplayName} </Text>
                                        <Text style={styles.activityCalories}>{item.details?.calories || 0} kcal</Text>
                                    </View>
                                );
                            }}
                            ListEmptyComponent={<Text style={styles.noActivityTextModal}>Nenhuma atividade registada.</Text>}
                        />
                        <View style={styles.modalFooter}>
                            {todayActivities.length > 0 && (
                                <Pressable style={styles.shareButton} onPress={handleShare}>
                                    <Ionicons name="share-social-outline" size={20} color={themeColor} />
                                    <Text style={styles.shareButtonText}>Compartilhar </Text>
                                </Pressable>
                            )}
                            <Pressable style={styles.closeButton} onPress={() => setIsDetailsModalVisible(false)}>
                                <Text style={styles.closeButtonText}>Fechar </Text>
                            </Pressable>
                        </View>
                    </Pressable>
                </Pressable>
            </Modal>
            
            {/* ✅ NOVO: Toast para notificações */}
            <Toast />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: { 
        flex: 1, 
        backgroundColor: theme.colors.background,
    },
    
    // ✅ APRIMORADO: Header com gradiente
    headerContainer: {
        backgroundColor: themeColor,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        overflow: 'hidden',
        ...theme.shadows.medium,
    },
    headerGradient: {
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 30,
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    greetingContainer: {
        flex: 1,
    },
    greetingSmall: { 
        fontSize: 16, 
        color: 'rgba(255,255,255,0.8)',
        marginBottom: 4,
    },
    greetingLarge: { 
        fontSize: 28, 
        fontWeight: 'bold', 
        color: 'white',
        marginBottom: 4,
    },
    motivationText: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.7)',
        marginTop: 4,
    },
    profileIconContainer: {
        padding: 4,
    },
    profileAvatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    profileInitial: {
        fontSize: 18,
        fontWeight: 'bold',
        color: 'white',
    },

    // ✅ NOVO: Card de progresso semanal compacto
    weeklyProgressCard: {
        backgroundColor: theme.colors.surface,
        borderRadius: 24,
        marginHorizontal: 20,
        marginBottom: 16,
        overflow: 'hidden',
        ...theme.shadows.small,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    weeklyProgressHeader: {
        backgroundColor: theme.colors.primary,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
    },
    weeklyIconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    weeklyTitleContainer: {
        flex: 1,
    },
    weeklyTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 2,
    },
    weeklySubtitle: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.8)',
    },
    weeklyProgressContent: {
        padding: 16,
    },
    weeklyStatsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        marginBottom: 20,
    },
    weeklyStatItem: {
        alignItems: 'center',
        flex: 1,
    },
    weeklyStatNumber: {
        fontSize: 32,
        fontWeight: 'bold',
        color: theme.colors.primary,
        marginBottom: 4,
    },
    weeklyStatLabel: {
        fontSize: 12,
        color: theme.colors.textSecondary,
        textAlign: 'center',
        fontWeight: '500',
    },
    weeklyProgressDivider: {
        width: 1,
        height: 40,
        backgroundColor: theme.colors.border,
        marginHorizontal: 20,
    },
    weeklyProgressBarContainer: {
        marginBottom: 12,
    },
    weeklyProgressBarBackground: {
        height: 8,
        backgroundColor: theme.colors.border,
        borderRadius: 6,
        overflow: 'hidden',
    },
    weeklyProgressBarFill: {
        height: '100%',
        backgroundColor: theme.colors.primary,
        borderRadius: 6,
    },
    weeklyProgressPercentage: {
        fontSize: 14,
        fontWeight: 'bold',
        color: 'white',
    },
    weeklyCompletedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#E8F5E8',
        borderRadius: 12,
        paddingVertical: 6,
        paddingHorizontal: 12,
    },
    weeklyCompletedText: {
        fontSize: 12,
        color: '#4CAF50',
        fontWeight: '600',
        marginLeft: 6,
    },
    weeklyMotivationText: {
        fontSize: 12,
        color: theme.colors.textSecondary,
        textAlign: 'center',
        fontStyle: 'italic',
    },

    // ✅ NOVO: Métricas animadas
    metricsContainer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingVertical: 20,
        justifyContent: 'space-between',
    },
    metricCard: {
        flex: 1,
        marginHorizontal: 4,
        backgroundColor: theme.colors.surface,
        borderRadius: 20,
        overflow: 'hidden',
        ...theme.shadows.small,
    },
    metricContent: {
        padding: 16,
        alignItems: 'center',
    },
    metricIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    metricTitle: {
        fontSize: 12,
        color: theme.colors.textSecondary,
        textAlign: 'center',
        marginBottom: 4,
        fontWeight: '500',
    },
    metricValueContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    metricValue: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    metricUnit: {
        fontSize: 12,
        color: theme.colors.textSecondary,
        marginLeft: 2,
    },

    // ✅ NOVO: Dashboard de progresso
    dashboardContainer: {
        backgroundColor: theme.colors.surface,
        marginHorizontal: 20,
        marginBottom: 20,
        borderRadius: 20,
        padding: 20,
        ...theme.shadows.small,
    },
    dashboardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.colors.text,
        marginBottom: 16,
        textAlign: 'center',
    },
    progressRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
    },
    progressItem: {
        alignItems: 'center',
    },
    progressLabel: {
        fontSize: 12,
        color: theme.colors.textSecondary,
        marginTop: 8,
        textAlign: 'center',
        fontWeight: '500',
    },

    // ✅ NOVO: Progresso circular
    circularProgressContainer: {
        position: 'relative',
        justifyContent: 'center',
        alignItems: 'center',
    },
    circularProgressBackground: {
        position: 'absolute',
    },
    circularProgressFill: {
        position: 'absolute',
        borderTopColor: 'transparent',
        borderRightColor: 'transparent',
        borderBottomColor: 'transparent',
    },
    circularProgressCenter: {
        position: 'absolute',
        backgroundColor: theme.colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
    },
    circularProgressText: {
        fontSize: 12,
        fontWeight: 'bold',
    },

    content: { 
        padding: 20 
    },

    // ✅ APRIMORADO: Card do próximo treino
    nextWorkoutCard: {
        backgroundColor: theme.colors.surface,
        borderRadius: 20,
        padding: 20,
        marginBottom: 20,
        ...theme.shadows.medium,
    },
    featuredCard: {
        borderWidth: 2,
        borderColor: theme.colors.primary + '30',
    },
    nextWorkoutHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    workoutIconBadge: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: theme.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    nextWorkoutInfo: {
        flex: 1,
    },
    nextWorkoutTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.textSecondary,
        marginBottom: 4,
    },
    nextWorkoutName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: theme.colors.text,
    },
    startWorkoutButton: {
        backgroundColor: theme.colors.primary,
        borderRadius: 16,
        paddingVertical: 16,
        paddingHorizontal: 24,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        ...theme.shadows.small,
    },
    startWorkoutText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
        marginRight: 8,
    },

    // ✅ APRIMORADO: Suplementos
    supplementsSection: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.colors.text,
        marginBottom: 16,
        flexDirection: 'row',
        alignItems: 'center',
    },
    supplementCardEnhanced: {
        backgroundColor: theme.colors.surface,
        borderRadius: 16,
        marginBottom: 12,
        overflow: 'hidden',
        ...theme.shadows.small,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    supplementContent: {
        padding: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    supplementInfo: {
        flex: 1,
    },
    supplementName: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.text,
        marginBottom: 4,
    },
    supplementNameTaken: {
        color: theme.colors.success,
    },
    supplementDose: {
        fontSize: 14,
        color: theme.colors.textSecondary,
    },
    supplementStatusIcon: {
        marginLeft: 12,
    },
    supplementStatusIconTaken: {
        // Additional styling
    },
    counterEnhanced: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    counterButtonEnhanced: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 8,
    },
    counterButtonMinus: {
        backgroundColor: theme.colors.accent,
    },
    counterButtonPlus: {
        backgroundColor: theme.colors.success,
    },
    counterTextEnhanced: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.colors.text,
        minWidth: 30,
        textAlign: 'center',
    },

    // ✅ APRIMORADO: Card melhorado
    enhancedCard: {
        ...theme.shadows.medium,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },

    // ✅ MANTIDO: Estilos originais para compatibilidade
    header: { 
        backgroundColor: themeColor, 
        paddingHorizontal: 25, 
        paddingTop: 80, 
        paddingBottom: 40, 
        borderBottomLeftRadius: 30, 
        borderBottomRightRadius: 30, 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'flex-end' 
    },
    workoutCount: { 
        fontSize: 16, 
        color: 'white', 
        fontWeight: '500', 
        textAlign: 'right' 
    },
    quickStatsContainer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingVertical: 20,
        justifyContent: 'space-between',
    },
    quickStatCard: {
        flex: 1,
        marginHorizontal: 4,
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    quickStatContent: {
        alignItems: 'center',
    },
    quickStatIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    quickStatTitle: {
        fontSize: 12,
        color: '#666',
        textAlign: 'center',
        marginBottom: 4,
    },
    quickStatValueContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    quickStatValue: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    quickStatUnit: {
        fontSize: 12,
        color: '#666',
        marginLeft: 2,
    },
    progressContainer: {
        paddingHorizontal: 20,
        marginBottom: 10,
    },
    progressCard: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    progressHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    progressIconContainer: {
        marginRight: 8,
    },
    progressTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    progressBarContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    progressBarBackground: {
        flex: 1,
        height: 8,
        backgroundColor: '#e0e0e0',
        borderRadius: 4,
        marginRight: 12,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: themeColor,
        borderRadius: 4,
    },
    progressText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        minWidth: 80,
    },
    card: { 
        backgroundColor: 'white', 
        borderRadius: 20, 
        paddingHorizontal: 25, 
        marginBottom: 20, 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        shadowColor: '#000', 
        shadowOffset: { width: 0, height: 2 }, 
        shadowOpacity: 0.1, 
        shadowRadius: 4, 
        elevation: 3, 
        minHeight: 95 
    },
    cardTitle: { 
        fontSize: 22, 
        fontWeight: 'bold', 
        color: '#333' 
    },
    cardDose: { 
        fontSize: 14, 
        color: 'gray', 
        marginTop: 5 
    },
    statusIcon: { 
        fontSize: 30 
    },
    wheyCounter: { 
        flexDirection: 'row', 
        alignItems: 'center' 
    },
    wheyCountText: { 
        fontSize: 28, 
        fontWeight: 'bold', 
        color: '#333', 
        width: 40, 
        textAlign: 'center' 
    },
    wheyArrow: { 
        fontSize: 24, 
        color: 'gray' 
    },
    wheyButton: { 
        paddingHorizontal: 10 
    },
    button: { 
        backgroundColor: themeColor, 
        paddingVertical: 8, 
        paddingHorizontal: 15, 
        borderRadius: 10 
    },
    buttonText: { 
        color: 'white', 
        fontWeight: 'bold' 
    },
    supplementCard: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#f0f0f0',
    },
    supplementCardTaken: {
        backgroundColor: '#f8fff8',
        borderColor: '#4CAF50',
    },
    supplementStatus: {
        marginLeft: 12,
    },
    supplementStatusTaken: {
        // Additional styling for taken supplements
    },
    counterContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    counterButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#f5f5f5',
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 8,
    },
    counterText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        minWidth: 30,
        textAlign: 'center',
    },
    graphContainer: { 
        backgroundColor: 'white', 
        borderRadius: 20, 
        padding: 20, 
        elevation: 3, 
        shadowColor: '#000', 
        shadowOffset: { width: 0, height: 2 }, 
        shadowOpacity: 0.1, 
        shadowRadius: 4 
    },
    graphTitle: { 
        fontSize: 18, 
        fontWeight: 'bold', 
        color: '#333', 
        marginBottom: 20, 
        textAlign: 'center' 
    },
    noActivityText: { 
        textAlign: 'center', 
        color: 'gray', 
        fontSize: 16, 
        paddingVertical: 40 
    },
    barGraphContainer: { 
        flexDirection: 'row', 
        justifyContent: 'space-around', 
        alignItems: 'flex-end', 
        height: 150, 
        marginTop: 10 
    },
    barWrapper: { 
        alignItems: 'center', 
        flex: 1, 
        marginHorizontal: 5 
    },
    barItem: { 
        flex: 1, 
        width: '100%', 
        alignItems: 'center', 
        justifyContent: 'flex-end' 
    },
    bar: { 
        width: 35, 
        backgroundColor: themeColor, 
        borderRadius: 5 
    },
    barLabelCount: { 
        fontSize: 14, 
        fontWeight: 'bold', 
        color: '#333', 
        marginBottom: 5 
    },
    barLabelIcon: { 
        marginTop: 8 
    },
    caloriesDisplay: { 
        alignItems: 'flex-end' 
    },
    caloriesValue: { 
        fontSize: 28, 
        fontWeight: 'bold', 
        color: themeColor 
    },
    caloriesUnit: { 
        fontSize: 14, 
        color: 'gray' 
    },
    modalContainer: { 
        flex: 1, 
        justifyContent: 'flex-end', 
        backgroundColor: 'rgba(0,0,0,0.5)' 
    },
    modalContent: { 
        backgroundColor: 'white', 
        padding: 22, 
        paddingBottom: 20, 
        borderTopLeftRadius: 20, 
        borderTopRightRadius: 20, 
        minHeight: '40%', 
        maxHeight: '60%' 
    },
    modalTitle: { 
        fontSize: 20, 
        fontWeight: 'bold', 
        marginBottom: 20, 
        textAlign: 'center' 
    },
    activityItem: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        paddingVertical: 15, 
        borderBottomWidth: 1, 
        borderBottomColor: '#eee' 
    },
    activityName: { 
        fontSize: 16, 
        color: '#333' 
    },
    activityCalories: { 
        fontSize: 16, 
        fontWeight: 'bold', 
        color: themeColor 
    },
    noActivityTextModal: { 
        textAlign: 'center', 
        color: 'gray', 
        fontSize: 16, 
        paddingVertical: 20 
    },
    modalFooter: { 
        marginTop: 20 
    },
    shareButton: { 
        flexDirection: 'row', 
        justifyContent: 'center', 
        alignItems: 'center', 
        backgroundColor: '#f0f2f5', 
        borderRadius: 10, 
        padding: 15, 
        marginBottom: 10 
    },
    shareButtonText: { 
        color: themeColor, 
        fontSize: 16, 
        fontWeight: 'bold', 
        marginLeft: 10 
    },
    closeButton: { 
        backgroundColor: themeColor, 
        borderRadius: 10, 
        padding: 15, 
        alignItems: 'center' 
    },
    closeButtonText: { 
        color: 'white', 
        fontSize: 16, 
        fontWeight: 'bold' 
    },
});