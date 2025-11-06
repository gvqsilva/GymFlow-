// app/perfil-modal.tsx

import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Dimensions, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { authService } from '../services/authService';
import { firebaseSyncService } from '../services/firebaseSync';
import { ACTIVITY_LEVELS, ActivityLevelKey, BMRInput, calculateTDEE } from '../utils/calorieCalculator';

const { width } = Dimensions.get('window');
const themeColor = '#5a4fcf';
const PROFILE_KEY = 'userProfile';export default function PerfilModal() {
    const router = useRouter();
    const [name, setName] = useState('');
    const [weight, setWeight] = useState('');
    const [height, setHeight] = useState('');
    const [birthDate, setBirthDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [gender, setGender] = useState<'Masculino' | 'Feminino' | null>(null); 
    const [activityLevel, setActivityLevel] = useState<ActivityLevelKey>('moderado'); 
    const [targetWeight, setTargetWeight] = useState('');
    const [goalDate, setGoalDate] = useState<Date | null>(null);
    const [showGoalDatePicker, setShowGoalDatePicker] = useState(false);
    const [tdeeResult, setTdeeResult] = useState(0);
    const [profileImage, setProfileImage] = useState<string | null>(null);
    const [selectedAvatarColor, setSelectedAvatarColor] = useState('#5a4fcf');
    const [showColorPicker, setShowColorPicker] = useState(false); 
    
    const calculateAge = (date: Date) => {
        if (!date) return 0;
        const today = new Date();
        let age = today.getFullYear() - new Date(date).getFullYear();
        const m = today.getMonth() - new Date(date).getMonth();
        if (m < 0 || (m === 0 && today.getDate() < new Date(date).getDate())) {
            age--;
        }
        return age > 0 ? age : 0;
    };
    
    const getBmiClassification = (imc: number) => {
        if (imc < 18.5) return { text: 'Abaixo do peso', color: '#3498db' };
        if (imc < 25) return { text: 'Peso ideal', color: '#2ecc71' };
        if (imc < 30) return { text: 'Sobrepeso', color: '#f39c12' };
        return { text: 'Obesidade', color: '#e74c3c' };
    };

    const calculateIMC = (w: string, h: string) => {
        const weightNum = parseFloat(w.replace(',', '.'));
        const heightNum = parseInt(h, 10);
        if (weightNum > 0 && heightNum > 0) {
            const heightInMeters = heightNum / 100;
            const imc = weightNum / (heightInMeters * heightInMeters);
            const classification = getBmiClassification(imc);
            return {
                value: imc.toFixed(1),
                text: classification.text,
                color: classification.color
            };
        }
        return { value: 'N/A', text: '', color: 'gray' };
    };
    
    const performTDEECalculation = useCallback(() => {
        const w = parseFloat(weight.replace(',', '.'));
        const h = parseInt(height, 10);
        const age = calculateAge(birthDate);
        const tWeight = parseFloat(targetWeight.replace(',', '.'));

        if (w > 0 && h > 0 && age > 0 && gender) {
            const tdee = calculateTDEE({ 
                weight: w, 
                height: h, 
                age, 
                gender, 
                activityLevel,
                targetWeight: tWeight > 0 ? tWeight : undefined,
                goalDate: goalDate ? goalDate.toISOString() : undefined,
            } as BMRInput);
            setTdeeResult(tdee);
        } else {
            setTdeeResult(0);
        }
    }, [weight, height, birthDate, gender, activityLevel, targetWeight, goalDate]);

    // Função para selecionar imagem da galeria
    const avatarColors = ['#5a4fcf', '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7', '#fab1a0', '#e17055', '#6c5ce7', '#a29bfe'];

    const pickAvatarColor = () => {
        setShowColorPicker(true);
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(word => word.charAt(0))
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    useFocusEffect(
        useCallback(() => {
            const loadProfile = async () => {
                try {
                    // Tentar carregar do Firebase primeiro
                    if (firebaseSyncService && typeof firebaseSyncService.loadProfile === 'function') {
                        const firebaseProfile = await firebaseSyncService.loadProfile();
                        
                        if (firebaseProfile) {
                            console.log('✅ Carregando perfil do Firebase');
                            // Usar dados do Firebase
                            setName(firebaseProfile.name || '');
                            setWeight(firebaseProfile.weight?.toString() || '');
                            setHeight(firebaseProfile.height?.toString() || '');
                            setBirthDate(firebaseProfile.birthDate ? new Date(firebaseProfile.birthDate) : new Date());
                            setGender(firebaseProfile.gender || null); 
                            setActivityLevel(firebaseProfile.activityLevel || 'moderado'); 
                            setTargetWeight(firebaseProfile.targetWeight?.toString() || '');
                            setGoalDate(firebaseProfile.goalDate ? new Date(firebaseProfile.goalDate) : null);
                            setProfileImage(firebaseProfile.profileImage || null);
                            setSelectedAvatarColor(firebaseProfile.avatarColor || '#5a4fcf');
                            
                            // Sincronizar com AsyncStorage local
                            await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(firebaseProfile));
                            return;
                        }
                    } else {
                        console.warn('⚠️ Função loadProfile não está disponível no firebaseSyncService');
                    }
                } catch (error) {
                    console.warn('⚠️ Erro ao carregar perfil do Firebase, usando dados locais:', error);
                }
                
                // Fallback para AsyncStorage local
                const profileJSON = await AsyncStorage.getItem(PROFILE_KEY);
                if (profileJSON) {
                    console.log('📱 Carregando perfil do AsyncStorage local');
                    const profile = JSON.parse(profileJSON);
                    setName(profile.name || '');
                    setWeight(profile.weight?.toString() || '');
                    setHeight(profile.height?.toString() || '');
                    setBirthDate(profile.birthDate ? new Date(profile.birthDate) : new Date());
                    setGender(profile.gender || null); 
                    setActivityLevel(profile.activityLevel || 'moderado'); 
                    setTargetWeight(profile.targetWeight?.toString() || '');
                    setGoalDate(profile.goalDate ? new Date(profile.goalDate) : null);
                    setProfileImage(profile.profileImage || null);
                    setSelectedAvatarColor(profile.avatarColor || '#5a4fcf');
                }
            };
            loadProfile();
        }, [])
    );
    
    useEffect(() => {
        performTDEECalculation();
    }, [performTDEECalculation]);

    const handleSave = async () => {
        if (!name || !weight || !height || !birthDate || !gender) {
            Alert.alert("Erro", "Por favor, preencha todos os campos obrigatórios.");
            return;
        }

        try {
            const profileData = {
                name,
                weight: parseFloat(weight.replace(',', '.')),
                height: parseInt(height, 10),
                birthDate: birthDate.toISOString(),
                gender, 
                activityLevel,
                targetWeight: parseFloat(targetWeight.replace(',', '.')) || null,
                goalDate: goalDate ? goalDate.toISOString() : null,
                profileImage: profileImage, // Salvar URI da imagem
                avatarColor: selectedAvatarColor, // Salvar cor do avatar
            };
            
            // Salvar localmente primeiro
            await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profileData));
            
            // Sincronizar com Firebase se o usuário estiver autenticado
            try {
                if (firebaseSyncService && typeof firebaseSyncService.syncProfile === 'function') {
                    await firebaseSyncService.syncProfile(profileData);
                    console.log('✅ Perfil sincronizado com Firebase');
                    
                    // Debug: Verificar se foi salvo
                    setTimeout(async () => {
                        if (firebaseSyncService && typeof firebaseSyncService.loadProfile === 'function') {
                            const firebaseData = await firebaseSyncService.loadProfile();
                            if (firebaseData) {
                                console.log('🔍 VERIFICAÇÃO: Dados encontrados no Firebase:', {
                                    nome: firebaseData.name,
                                    avatarColor: firebaseData.avatarColor,
                                    ultimaAtualizacao: new Date().toLocaleString()
                                });
                            }
                        }
                    }, 2000);
                } else {
                    console.warn('⚠️ Função syncProfile não está disponível no firebaseSyncService');
                }
            } catch (firebaseError) {
                console.warn('⚠️ Erro ao sincronizar perfil com Firebase:', firebaseError);
                // Continuar mesmo se o Firebase falhar - dados estão salvos localmente
            }
            
            // Marcar primeiro login como completo
            await authService.markFirstLoginCompleted();
            
            Alert.alert("Sucesso!", "O seu perfil foi atualizado.", [
                {
                    text: "OK",
                    onPress: () => {
                        // Se é primeiro login, redirecionar para home
                        router.replace('/(tabs)');
                    }
                }
            ]);
        } catch (e) {
            Alert.alert("Erro", "Não foi possível guardar o perfil.");
        }
    };

    const onChangeBirthDate = (event: DateTimePickerEvent, selectedDate?: Date) => {
        setShowDatePicker(Platform.OS === 'ios');
        if (selectedDate) {
            setBirthDate(selectedDate);
        }
    };
    
    const onChangeGoalDate = (event: DateTimePickerEvent, selectedDate?: Date) => {
        setShowGoalDatePicker(Platform.OS === 'ios');
        if (selectedDate) {
            setGoalDate(selectedDate);
        }
    };

    const age = calculateAge(birthDate);
    const imcData = calculateIMC(weight, height);
    const currentGoal = parseFloat(targetWeight) < parseFloat(weight) ? 'Déficit' : parseFloat(targetWeight) > parseFloat(weight) ? 'Superávit' : 'Manutenção';

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ 
                title: 'Criar Perfil',
                headerStyle: { backgroundColor: themeColor },
                headerTintColor: '#fff',
                headerTitleStyle: { fontWeight: 'bold' },
            }} />
            
            <ScrollView 
                style={styles.scrollView} 
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Header Welcome */}
                <View style={styles.welcomeHeader}>
                    {/* Profile Avatar Section */}
                    <Pressable style={styles.profilePhotoContainer} onPress={pickAvatarColor}>
                        <View style={[styles.profileAvatar, { backgroundColor: selectedAvatarColor }]}>
                            <Text style={styles.avatarText}>
                                {name ? getInitials(name) : 'US'}
                            </Text>
                            <View style={styles.addPhotoIcon}>
                                <Ionicons name="color-palette" size={20} color="white" />
                            </View>
                        </View>
                    </Pressable>
                    
                    <Text style={styles.welcomeTitle}>Vamos criar seu perfil!</Text>
                    <Text style={styles.welcomeSubtitle}>
                        Preencha as informações abaixo para personalizar sua experiência
                    </Text>
                </View>

                {/* Seção de Informações Pessoais */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="person" size={20} color={themeColor} />
                        <Text style={styles.sectionTitle}>Informações Pessoais</Text>
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Nome </Text>
                        <TextInput 
                            style={styles.input} 
                            value={name} 
                            onChangeText={setName} 
                            placeholder="Digite seu nome" 
                            placeholderTextColor="#999"
                        />
                    </View>

                    <View style={styles.row}>
                        <View style={[styles.inputContainer, { flex: 1, marginRight: 10 }]}>
                            <Text style={styles.label}>Peso (kg) </Text>
                            <TextInput 
                                style={styles.input} 
                                value={weight} 
                                onChangeText={setWeight} 
                                placeholder="75.5" 
                                keyboardType="numeric"
                                placeholderTextColor="#999"
                            />
                        </View>
                        <View style={[styles.inputContainer, { flex: 1, marginLeft: 10 }]}>
                            <Text style={styles.label}>Altura (cm)</Text>
                            <TextInput 
                                style={styles.input} 
                                value={height} 
                                onChangeText={setHeight} 
                                placeholder="180" 
                                keyboardType="number-pad"
                                placeholderTextColor="#999"
                            />
                        </View>
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Data de Nascimento</Text>
                        <Pressable style={styles.dateInput} onPress={() => setShowDatePicker(true)}>
                            <Text style={styles.dateText}>{birthDate.toLocaleDateString('pt-BR')} </Text>
                            <Ionicons name="calendar" size={20} color={themeColor} />
                        </Pressable>
                    </View>
                    
                    {showDatePicker && (
                        <DateTimePicker
                            value={birthDate}
                            mode="date"
                            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                            onChange={onChangeBirthDate}
                        />
                    )}

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Gênero</Text>
                        <View style={styles.genderContainer}>
                            <Pressable
                                style={[styles.genderButton, gender === 'Masculino' && styles.genderSelected]}
                                onPress={() => setGender('Masculino')}
                            >
                                <Ionicons 
                                    name="man" 
                                    size={24} 
                                    color={gender === 'Masculino' ? 'white' : themeColor} 
                                />
                                <Text style={[styles.genderText, gender === 'Masculino' && styles.genderTextSelected]}>
                                    Masculino
                                </Text>
                            </Pressable>
                            <Pressable
                                style={[styles.genderButton, gender === 'Feminino' && styles.genderSelected]}
                                onPress={() => setGender('Feminino')}
                            >
                                <Ionicons 
                                    name="woman" 
                                    size={24} 
                                    color={gender === 'Feminino' ? 'white' : themeColor} 
                                />
                                <Text style={[styles.genderText, gender === 'Feminino' && styles.genderTextSelected]}>
                                    Feminino
                                </Text>
                            </Pressable>
                        </View>
                    </View>
                </View>

                {/* Seção de Atividade Física */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="fitness" size={20} color={themeColor} />
                        <Text style={styles.sectionTitle}>Nível de Atividade</Text>
                    </View>
                    
                    <View style={styles.activityContainer}>
                        {Object.entries(ACTIVITY_LEVELS).map(([key, item]) => (
                            <Pressable
                                key={key}
                                style={[styles.activityButton, activityLevel === key && styles.activitySelected]}
                                onPress={() => setActivityLevel(key as ActivityLevelKey)}
                            >
                                <View style={styles.activityContent}>
                                    <View style={styles.activityIcon}>
                                        <Ionicons 
                                            name="barbell" 
                                            size={18} 
                                            color={activityLevel === key ? 'white' : themeColor} 
                                        />
                                    </View>
                                    <View style={styles.activityTextContainer}>
                                        <Text style={[styles.activityTitle, activityLevel === key && styles.activityTitleSelected]}>
                                            {item.label}
                                        </Text>
                                        <Text style={[styles.activityDescription, activityLevel === key && styles.activityDescriptionSelected]}>
                                            Atividade semanal
                                        </Text>
                                    </View>
                                </View>
                            </Pressable>
                        ))}
                    </View>
                </View>

                {/* Seção de Objetivos */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="flag" size={20} color={themeColor} />
                        <Text style={styles.sectionTitle}>Objetivos (Opcional)</Text>
                    </View>
                    
                    <View style={styles.row}>
                        <View style={[styles.inputContainer, { flex: 1, marginRight: 10 }]}>
                            <Text style={styles.label}>Peso Meta (kg)</Text>
                            <TextInput 
                                style={styles.input} 
                                value={targetWeight} 
                                onChangeText={setTargetWeight} 
                                placeholder="80" 
                                keyboardType="numeric"
                                placeholderTextColor="#999"
                            />
                        </View>
                        <View style={[styles.inputContainer, { flex: 1, marginLeft: 10 }]}>
                            <Text style={styles.label}>Prazo para Meta</Text>
                            <Pressable style={styles.dateInput} onPress={() => setShowGoalDatePicker(true)}>
                                <Text style={[styles.dateText, !goalDate && { color: '#999' }]}>
                                    {goalDate ? goalDate.toLocaleDateString('pt-BR') : 'Selecionar'} </Text>
                                <Ionicons name="calendar" size={20} color={themeColor} />
                            </Pressable>
                        </View>
                    </View>
                    
                    {showGoalDatePicker && (
                        <DateTimePicker
                            value={goalDate || new Date()}
                            mode="date"
                            display="default"
                            onChange={onChangeGoalDate}
                            minimumDate={new Date()}
                        />
                    )}
                </View>

                {/* Resumo dos Dados */}
                {weight && height && age > 0 && gender && (
                    <View style={styles.summaryCard}>
                        <View style={styles.summaryHeader}>
                            <Ionicons name="analytics" size={20} color={themeColor} />
                            <Text style={styles.summaryTitle}>Seu Resumo</Text>
                        </View>
                        
                        <View style={styles.summaryGrid}>
                            <View style={styles.summaryItem}>
                                <Text style={styles.summaryLabel}>Idade </Text>
                                <Text style={styles.summaryValue}>{age} anos </Text>
                            </View>
                            <View style={styles.summaryItem}>
                                <Text style={styles.summaryLabel}>IMC </Text>
                                <Text style={[styles.summaryValue, { color: imcData.color }]}>
                                    {imcData.value} </Text>
                                <Text style={[styles.summarySubtext, { color: imcData.color }]}>
                                    {imcData.text} </Text>
                            </View>
                            <View style={styles.summaryItem}>
                                <Text style={styles.summaryLabel}>Meta Diária </Text>
                                <Text style={[styles.summaryValue, { color: themeColor }]}>
                                    {tdeeResult > 0 ? tdeeResult : '---'} </Text>
                                <Text style={styles.summarySubtext}>Kcal ({currentGoal})</Text>
                            </View>
                        </View>
                    </View>
                )}

                {/* Botão de Salvar */}
                <Pressable style={styles.saveButton} onPress={handleSave}>
                    <Ionicons name="checkmark-circle" size={24} color="white" />
                    <Text style={styles.saveButtonText}>Criar Meu Perfil</Text>
                </Pressable>
            </ScrollView>

            {/* Modal de Seleção de Cores */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={showColorPicker}
                onRequestClose={() => setShowColorPicker(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.colorPickerModal}>
                        <Text style={styles.colorPickerTitle}>Escolha a cor do seu avatar</Text>
                        
                        <View style={styles.colorGrid}>
                            {avatarColors.map((color, index) => (
                                <Pressable
                                    key={index}
                                    style={[
                                        styles.colorOption,
                                        { backgroundColor: color },
                                        selectedAvatarColor === color && styles.selectedColor
                                    ]}
                                    onPress={() => {
                                        setSelectedAvatarColor(color);
                                        setShowColorPicker(false);
                                    }}
                                >
                                    {selectedAvatarColor === color && (
                                        <Ionicons name="checkmark" size={24} color="white" />
                                    )}
                                </Pressable>
                            ))}
                        </View>
                        
                        <Pressable 
                            style={styles.cancelButton}
                            onPress={() => setShowColorPicker(false)}
                        >
                            <Text style={styles.cancelButtonText}>Cancelar</Text>
                        </Pressable>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        backgroundColor: '#f8f9fa',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 40,
    },
    
    // Welcome Header
    welcomeHeader: {
        alignItems: 'center',
        paddingVertical: 30,
        paddingHorizontal: 20,
        backgroundColor: 'white',
        marginBottom: 20,
    },
    welcomeTitle: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 15,
        textAlign: 'center',
    },
    welcomeSubtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginTop: 8,
        lineHeight: 22,
    },
    
    // Sections
    section: {
        backgroundColor: 'white',
        marginHorizontal: 20,
        marginBottom: 20,
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginLeft: 10,
    },
    
    // Inputs
    inputContainer: {
        marginBottom: 20,
    },
    label: { 
        fontSize: 14, 
        marginBottom: 8, 
        color: '#555', 
        fontWeight: '600',
    },
    input: { 
        backgroundColor: '#f8f9fa', 
        padding: 15, 
        borderRadius: 12, 
        fontSize: 16, 
        color: '#333',
        borderWidth: 1,
        borderColor: '#e9ecef',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'flex-end',
    },
    
    // Date Input
    dateInput: {
        backgroundColor: '#f8f9fa',
        padding: 15,
        borderRadius: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e9ecef',
    },
    dateText: {
        fontSize: 16,
        color: '#333',
    },
    
    // Gender Selection
    genderContainer: { 
        flexDirection: 'row', 
        gap: 15,
    },
    genderButton: { 
        flex: 1, 
        padding: 16, 
        borderRadius: 12, 
        borderWidth: 2, 
        borderColor: '#e9ecef', 
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
    },
    genderSelected: { 
        backgroundColor: themeColor, 
        borderColor: themeColor,
    },
    genderText: { 
        fontSize: 16, 
        color: '#333',
        fontWeight: '600',
    },
    genderTextSelected: { 
        color: 'white', 
        fontWeight: 'bold',
    },
    
    // Activity Level
    activityContainer: { 
        gap: 12,
    },
    activityButton: {
        padding: 16,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#e9ecef',
        backgroundColor: '#f8f9fa',
    },
    activitySelected: {
        backgroundColor: themeColor,
        borderColor: themeColor,
    },
    activityContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    activityIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(90, 79, 207, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    activityTextContainer: {
        flex: 1,
    },
    activityTitle: {
        fontSize: 16,
        color: '#333',
        fontWeight: '600',
    },
    activityTitleSelected: {
        color: 'white',
        fontWeight: 'bold',
    },
    activityDescription: {
        fontSize: 14,
        color: '#666',
        marginTop: 2,
    },
    activityDescriptionSelected: {
        color: 'rgba(255, 255, 255, 0.8)',
    },
    
    // Summary Card
    summaryCard: {
        backgroundColor: 'white',
        marginHorizontal: 20,
        marginBottom: 20,
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    summaryHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    summaryTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginLeft: 10,
    },
    summaryGrid: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    summaryItem: {
        alignItems: 'center',
        flex: 1,
    },
    summaryLabel: {
        fontSize: 14,
        color: '#666',
        marginBottom: 5,
    },
    summaryValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    summarySubtext: {
        fontSize: 12,
        color: '#666',
        marginTop: 2,
    },
    
    // Save Button
    saveButton: { 
        backgroundColor: themeColor, 
        padding: 18, 
        borderRadius: 16, 
        alignItems: 'center',
        marginHorizontal: 20,
        marginTop: 10,
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 10,
        shadowColor: themeColor,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    saveButtonText: { 
        color: 'white', 
        fontSize: 18, 
        fontWeight: 'bold',
    },
    
    // Profile Photo Styles
    profilePhotoContainer: {
        marginBottom: 15,
        alignItems: 'center',
    },
    profilePhoto: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 3,
        borderColor: themeColor,
    },
    profilePhotoPlaceholder: {
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
    },
    profileAvatar: {
        width: 120,
        height: 120,
        borderRadius: 60,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    avatarText: {
        fontSize: 36,
        fontWeight: 'bold',
        color: 'white',
        textShadowColor: 'rgba(0,0,0,0.3)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 3,
    },
    addPhotoIcon: {
        position: 'absolute',
        bottom: 5,
        right: 5,
        backgroundColor: themeColor,
        borderRadius: 15,
        width: 30,
        height: 30,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: 'white',
    },
    // Estilos para o Modal de Cores
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    colorPickerModal: {
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 25,
        margin: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
        minWidth: 280,
    },
    colorPickerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'center',
        marginBottom: 20,
    },
    colorGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 15,
        marginBottom: 25,
    },
    colorOption: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
    },
    selectedColor: {
        borderWidth: 3,
        borderColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 8,
    },
    cancelButton: {
        backgroundColor: '#f0f0f0',
        paddingVertical: 12,
        paddingHorizontal: 25,
        borderRadius: 10,
        alignItems: 'center',
    },
    cancelButtonText: {
        fontSize: 16,
        color: '#666',
        fontWeight: '500',
    },
});