// app/exercicio-modal.tsx

import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Exercise } from '../constants/workoutData';
import { useWorkouts } from '../hooks/useWorkouts';

const themeColor = '#5a4fcf';

export default function ExerciseModal() {
    const { workoutId, exerciseId } = useLocalSearchParams<{ workoutId: string, exerciseId?: string }>();
    const { workouts, addExercise, updateExercise } = useWorkouts();
    const router = useRouter();

    const [name, setName] = useState('');
    const [series, setSeries] = useState('');
    const [reps, setReps] = useState('');
    const [muscle, setMuscle] = useState('');
    const [obs, setObs] = useState('');
    // gifUrl removido - não permitimos mais inserir URLs customizadas

    const isEditing = !!exerciseId;

    useEffect(() => {
        if (isEditing && workoutId) {
            const exerciseToEdit = workouts[workoutId]?.exercises.find((ex: any) => ex.id === exerciseId);
            if (exerciseToEdit) {
                setName(exerciseToEdit.name);
                setSeries(exerciseToEdit.series.toString());
                setReps(exerciseToEdit.reps);
                setMuscle(exerciseToEdit.muscle);
                setObs(exerciseToEdit.obs);
                // gifUrl removido
            }
        }
    }, [exerciseId, workouts, workoutId, isEditing]);

    const handleSave = async () => {
        if (!workoutId || !name || !series || !reps || !muscle) {
            Alert.alert("Erro", "Por favor, preencha todos os campos obrigatórios (*).");
            return;
        }

        const exerciseData = {
            name,
            series: parseInt(series, 10) || 0,
            reps,
            muscle,
            obs,
            // gifUrl removido
        };

        if (isEditing) {
            if (!workoutId || !exerciseId) return;
            const workout = workouts[workoutId];
            const exerciseIndex = workout?.exercises.findIndex((ex: any) => ex.id === exerciseId);
            if (exerciseIndex !== undefined && exerciseIndex >= 0) {
                await updateExercise(workoutId, exerciseIndex, { ...exerciseData, id: exerciseId });
            }
        } else {
            const newExercise: Exercise = { ...exerciseData, id: `ex_${Date.now()}` };
            await addExercise(workoutId, newExercise);
        }

        router.back();
    };

    return (
        <ScrollView style={styles.container}>
            <Stack.Screen options={{ title: isEditing ? 'Editar Exercício' : 'Novo Exercício' }} />
            <Text style={styles.label}>Nome do Exercício*</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} />

            <Text style={styles.label}>Músculo*</Text>
            <TextInput style={styles.input} value={muscle} onChangeText={setMuscle} />
            
            <View style={styles.row}>
                <View style={styles.column}>
                    <Text style={styles.label}>Séries*</Text>
                    <TextInput style={styles.input} value={series} onChangeText={setSeries} keyboardType="numeric" />
                </View>
                <View style={{...styles.column, marginRight: 0}}>
                    <Text style={styles.label}>Repetições*</Text>
                    <TextInput style={styles.input} value={reps} onChangeText={setReps} />
                </View>
            </View>

            <Text style={styles.label}>Observações</Text>
            <TextInput style={styles.input} value={obs} onChangeText={setObs} />

            <Text style={styles.infoText}>ℹ️ Os vídeos dos exercícios são carregados automaticamente com base no exercício selecionado.</Text>

            <Pressable style={styles.saveButton} onPress={handleSave}>
                <Text style={styles.saveButtonText}>Salvar</Text>
            </Pressable>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: '#f0f2f5' },
    label: { fontSize: 16, marginBottom: 5, color: 'gray' },
    input: { backgroundColor: 'white', padding: 15, borderRadius: 10, marginBottom: 15, fontSize: 16 },
    row: { flexDirection: 'row', justifyContent: 'space-between' },
    column: { flex: 1, marginRight: 10 },
    infoText: { backgroundColor: '#e3f2fd', padding: 15, borderRadius: 10, marginBottom: 15, fontSize: 14, color: '#1976d2', textAlign: 'center' },
    saveButton: { backgroundColor: themeColor, padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 20 },
    saveButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
});

