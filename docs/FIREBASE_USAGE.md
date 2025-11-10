// docs/FIREBASE_USAGE.md

# 🔥 Como Usar os Hooks do Firebase

## 📊 **Hooks Disponíveis**

### 🏋️‍♂️ **useWorkouts** - Treinos
```typescript
import { useWorkouts } from '../hooks/useWorkouts';

const { 
  workouts, 
  isLoading, 
  isSyncing, 
  addWorkout, 
  updateWorkout,
  deleteWorkout 
} = useWorkouts();
```

### 💊 **useSupplements** - Suplementos  
```typescript
import { useSupplements } from '../hooks/useSupplements';

const { 
  supplements, 
  isLoading, 
  isSyncing, 
  addSupplement, 
  updateSupplement,
  deleteSupplement 
} = useSupplements();
```

### 🍎 **useFoodHistory** - Histórico de Alimentação
```typescript
import { useFoodHistory } from '../hooks/useFoodHistory';

const { 
  foodHistory, 
  isLoading, 
  isSyncing, 
  addFoodEntry, 
  getFoodEntriesByDate,
  clearHistory 
} = useFoodHistory();

// Adicionar entrada de comida
await addFoodEntry({
  date: '2025-11-09',
  foodName: 'Peito de Frango',
  calories: 300,
  protein: 55,
  carbs: 0,
  fat: 7,
  quantity: 150,
  unit: 'g'
});
```

### 📊 **useSupplementsHistory** - Histórico de Suplementos
```typescript
import { useSupplementsHistory } from '../hooks/useSupplementsHistory';

const { 
  supplementsHistory, 
  isLoading, 
  markSupplementTaken, 
  getSupplementStatus 
} = useSupplementsHistory();

// Marcar suplemento como tomado
await markSupplementTaken('supp_creatine', 'Creatina', '2025-11-09', 6);

// Verificar se foi tomado hoje
const status = getSupplementStatus('supp_creatine', '2025-11-09');
```

### 🏃‍♂️ **useWorkoutHistory** - Histórico de Treinos
```typescript
import { useWorkoutHistory } from '../hooks/useWorkoutHistory';

const { 
  workoutHistory, 
  addWorkoutEntry, 
  getWorkoutStats,
  getWorkoutEntriesByDate 
} = useWorkoutHistory();

// Adicionar treino concluído
await addWorkoutEntry({
  date: '2025-11-09',
  workoutId: 'A',
  workoutName: 'Treino A',
  category: 'Musculação',
  duration: 60,
  calories: 350
});

// Ver estatísticas
const stats = getWorkoutStats();
console.log(`Total de treinos: ${stats.totalWorkouts}`);
```

### ⚙️ **useUserConfig** - Configurações do Usuário
```typescript
import { useUserConfig } from '../hooks/useUserConfig';

const { 
  userConfig, 
  updatePersonalInfo, 
  updateFitnessGoals,
  calculateBMI,
  calculateTDEE 
} = useUserConfig();

// Atualizar dados pessoais
await updatePersonalInfo({
  name: 'João Silva',
  age: 25,
  weight: 75,
  height: 180,
  gender: 'male'
});

// Calcular BMI
const bmi = calculateBMI();
const tdee = calculateTDEE(); // Gasto calórico diário
```

### 🔄 **useFirebaseData** - Hook Central (RECOMENDADO)
```typescript
import { useFirebaseData } from '../hooks/useFirebaseData';

const { 
  workouts,
  supplements,
  foodHistory,
  userConfig,
  isAnythingSyncing,
  isAuthenticated,
  forceSync 
} = useFirebaseData();

// Força sincronização de todos os dados
await forceSync();
```

## 💾 **O que é Salvo no Firebase**

### 📊 **Coleções no Firestore**
1. **workouts** - Fichas de treino personalizadas
2. **supplements** - Lista de suplementos do usuário  
3. **foodHistory** - Histórico de refeições e calorias
4. **supplementsHistory** - Registro diário de suplementos
5. **workoutHistory** - Histórico de treinos realizados
6. **userConfig** - Configurações e dados pessoais
7. **sports** - Esportes cadastrados pelo usuário

### 🔄 **Sincronização Automática**
- ✅ **Online**: Dados salvos automaticamente no Firebase
- ✅ **Offline**: Dados salvos localmente no AsyncStorage  
- ✅ **Recuperação**: Sincronização automática quando volta online
- ✅ **Cache**: Dados locais são usados instantaneamente

### 🎯 **Exemplo Prático - Tela Home**
```typescript
// Substituir este código antigo:
const [supplementsHistory, setSupplementsHistory] = useState({});

// Por este novo:
const { supplementsHistory, userConfig, workoutHistory } = useFirebaseData();

// Os dados são automaticamente sincronizados! 🎉
```

### 🛡️ **Benefícios**
- 📱 **Backup na Nuvem** - Nunca perca seus dados
- 🔄 **Sync Automático** - Dados sempre atualizados
- ⚡ **Performance** - Cache local para acesso rápido
- 🔒 **Segurança** - Dados pessoais protegidos no Firebase