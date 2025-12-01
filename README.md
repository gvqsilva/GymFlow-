# 📱 GymFlow — Aplicação Completa de Fitness e Bem-Estar

**Versão:** 1.0.0 | **Última Atualização:** 30 de Novembro de 2025
**Status:** ✅ Funcionalidade completa — pronto para produção (iOS/Android/Web)

---

## 📋 Índice

- [🎯 Visão Geral](#-visão-geral)
- [✨ Funcionalidades Principais](#-funcionalidades-principais)
- [🔥 Dashboard Inteligente](#-dashboard-inteligente)
- [🏋️ Sistema de Treinos](#️-sistema-de-treinos)
- [💊 Gestão de Suplementos](#-gestão-de-suplementos)
- [👤 Perfil e Métricas](#-perfil-e-métricas)
- [📊 Histórico e Analytics](#-histórico-e-analytics)
- [⚙️ Configurações Avançadas](#️-configurações-avançadas)
- [🔄 Sincronização Firebase](#-sincronização-firebase)
- [🚀 Instalação e Configuração](#-instalação-e-configuração)
- [📱 Build e Distribuição](#-build-e-distribuição)
- [🛠️ Arquitetura Técnica](#️-arquitetura-técnica)
- [🔧 Desenvolvimento](#-desenvolvimento)
- [📄 Documentação Adicional](#-documentação-adicional)

---

## 🎯 Visão Geral

O **GymFlow** é uma aplicação móvel completa desenvolvida em **Expo + React Native + TypeScript** para acompanhar treinos, nutrição, suplementação e métricas de fitness. Combina uma experiência offline robusta com sincronização opcional via Firebase, proporcionando uma solução integrada para entusiastas de fitness.

### 🎁 Principais Diferenciais

- **📱 Multi-plataforma**: iOS, Android e Web
- **💾 Offline-first**: Funciona sem internet, sincroniza quando disponível
- **🔄 Sincronização automática**: Firebase com atualizações em tempo real
- **🎨 Interface moderna**: Design responsivo com animações fluidas
- **🔔 Notificações inteligentes**: Toast system centralizado para feedback
- **📊 Analytics avançados**: Métricas de progresso e conquistas
- **⚡ Performance otimizada**: Hooks customizados e gestão eficiente de estado

---

## ✨ Funcionalidades Principais

### 🏠 **Dashboard Inteligente**
- **Resumo diário** com calorias consumidas vs. gastas
- **Próximo treino** com acesso direto
- **Conquistas** e feedback motivacional
- **Suplementos diários** com check interativo
- **Métricas semanais** e progresso visual
- **Compartilhamento** de progresso nas redes sociais

### 🏋️ **Sistema de Treinos Avançado**
- **Fichas de treino** personalizáveis (A, B, C, D)
- **Catálogo de 74+ exercícios** com vídeos demonstrativos
- **Seletor inteligente** com filtros por músculo e equipamento
- **Contabilização automática** de treinos realizados
- **Cálculo de calorias** baseado em METs
- **Histórico completo** de treinos com estatísticas
- **Gestão de múltiplos esportes** (Academia, Vôlei, Futebol, Boxe, etc.)

### 🍎 **Sistema de Nutrição e Alimentação**
- **Base de dados local** com centenas de alimentos
- **Busca inteligente** com sugestões automáticas
- **Registro por refeição** (Café, Almoço, Jantar, Lanche)
- **Cálculo automático** de macronutrientes (Proteína, Carboidratos, Gordura)
- **Múltiplas unidades** (gramas, ml, fatias, unidades, colheres de sopa)
- **Histórico detalhado** com total diário de calorias
- **Análise nutricional** por refeição e dia
- **Sincronização** com Firebase para backup automático

### 💊 **Gestão de Suplementos**
- **Lista personalizada** de suplementos
- **Tipos de acompanhamento**: Check diário ou contador de doses
- **Histórico detalhado** de consumo
- **Lembretes inteligentes**
- **Configurações flexíveis** (dose, unidade, visibilidade)

### 👤 **Perfil Completo**
- **Informações pessoais**: Nome, idade, peso, altura, sexo
- **Cálculos automáticos**: IMC, TMB, TDEE
- **Objetivos personalizados**: Perda/ganho de peso, manutenção
- **Configurações de unidades** (kg/lbs, cm/ft, km/miles)
- **Preferências de interface** e notificações

### 📊 **Analytics e Histórico**
- **Calendário visual** com balanço energético
- **Estatísticas semanais/mensais**
- **Gráficos de progresso**
- **Histórico de alimentação** com busca inteligente e análise por refeição
- **Registro nutricional completo** com tracking de macronutrientes
- **Relatórios de atividades** por modalidade
- **Balanço calórico diário** (consumidas vs. gastas)

---

## 🔥 Dashboard Inteligente

O dashboard é o coração do aplicativo, oferecendo uma visão completa do progresso diário:

### 📈 **Métricas em Tempo Real**
```typescript
// Cálculo automático de calorias
const totalCaloriesToday = calculateDailyCalories(foodHistory, workoutHistory)
const caloriesBalance = totalCaloriesToday.consumed - totalCaloriesToday.burned
```

### 🏆 **Sistema de Conquistas**
- **Meta semanal** de treinos atingida
- **Balanço calórico** equilibrado
- **Consistência** de suplementação
- **Feedback háptico** e toasts motivacionais

### 🎯 **Próximo Treino Inteligente**
```typescript
// Rotação automática de fichas de treino
const nextWorkout = getNextWorkoutId(workouts, lastCompletedWorkout)
```

---

## 🏋️ Sistema de Treinos

### 📚 **Catálogo de Exercícios**
- **74+ exercícios** pré-cadastrados
- **Vídeos demonstrativos** (GIF/WebP)
- **Categorização** por grupo muscular
- **Filtros avançados** por equipamento
- **Instruções detalhadas**

### 🎛️ **Seletor de Exercícios Enhanced**
```typescript
// Componente avançado com filtros múltiplos
<ExerciseSelectorEnhanced
  onExerciseSelect={handleExerciseAdd}
  selectedExerciseIds={selectedIds}
  muscleFilter={selectedMuscle}
  equipmentFilter={selectedEquipment}
/>
```

### ⚡ **Recursos Avançados**
- **Criação rápida** de fichas
- **Edição em tempo real**
- **Reordenação** por drag-and-drop
- **Duplicação** de exercícios
- **Templates** pré-definidos

---

## 🍎 Sistema de Alimentação e Nutrição

### 📚 **Base de Dados de Alimentos**
- **Centenas de alimentos** catalogados localmente
- **Informações nutricionais completas** (calorias, proteínas, carboidratos, gorduras)
- **Medidas personalizadas** por alimento (gramas, unidades, fatias, etc.)
- **Busca inteligente** com filtros e sugestões automáticas

### 🍽️ **Registro de Refeições**
```typescript
// Estrutura de entrada alimentar
interface FoodEntry {
  id: string
  date: 'YYYY-MM-DD'
  mealType: 'Café' | 'Almoço' | 'Jantar' | 'Lanche'
  description: string // Ex: "150g de Arroz Branco"
  data: {
    calories: number
    protein: number
    carbs: number
    fat: number
  }
}
```

### 🔍 **Parser Inteligente de Alimentos**
```typescript
// Exemplos de entradas suportadas
"150g de Arroz Branco"
"2 fatias de Pão Integral"
"1 colher de sopa de Azeite"
"200ml de Leite Desnatado"
"3 unidades de Banana"
```

### 📱 **Interface de Uso**
- **Busca em tempo real** com sugestões
- **Scroll em listas** de alimentos filtradas
- **Seleção por refeição** (Café, Almoço, Jantar, Lanche)
- **Cálculo automático** de macronutrientes
- **Histórico detalhado** por dia e refeição
- **Total diário** de calorias consumidas

---

## 💊 Gestão de Suplementos

### 🎯 **Tipos de Acompanhamento**

#### ✅ **Daily Check** (Check Diário)
```typescript
// Para suplementos de dose única
{
  type: 'daily_check',
  taken: boolean // Tomou hoje?
}
```

#### 🔢 **Counter** (Contador)
```typescript
// Para múltiplas doses por dia
{
  type: 'counter',
  count: number // Quantas doses hoje?
}
```

### 📱 **Interface Interativa**
- **Toggle switches** para daily_check
- **Stepper controls** para counter
- **Visualização** na home personalizável
- **Histórico detalhado** por suplemento

---

## 👤 Perfil e Métricas

### 🧮 **Cálculos Automatizados**

#### IMC (Índice de Massa Corporal)
```typescript
const bmi = weight / Math.pow(height / 100, 2)
```

#### TMB (Taxa Metabólica Basal)
```typescript
// Fórmula de Mifflin-St Jeor
const bmr = gender === 'male' 
  ? 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age)
  : 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age)
```

#### TDEE (Total Daily Energy Expenditure)
```typescript
const multipliers = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9
}
const tdee = bmr * multipliers[activityLevel]
```

### 🎯 **Objetivos Personalizados**
- **Objetivo principal**: Perda/ganho/manutenção de peso
- **Metas semanais**: Treinos, atividades, tempo
- **Calorias diárias**: Baseado em TDEE e objetivos
- **Acompanhamento** de progresso visual

---

## 📊 Histórico e Analytics

### 📅 **Calendário Visual**
```typescript
// Marcações por balanço energético
const calendarMarkedDates = {
  '2025-11-10': { 
    marked: true, 
    dotColor: caloriesBalance > 0 ? 'red' : 'green' 
  }
}
```

### 📈 **Estatísticas Avançadas**
- **Treinos por modalidade**
- **Calorias queimadas** por semana
- **Consistência** de suplementação
- **Progresso** em direção às metas
- **Comparativos** mensais

### 🎲 **Dados Estruturados**
```typescript
// Formato de histórico de treinos
interface WorkoutHistoryEntry {
  id: string
  date: 'YYYY-MM-DD'
  workoutId: string
  workoutName: string
  category: 'Musculação' | 'Cardio' | 'Esporte'
  duration: number // minutos
  calories: number
  exercises?: Exercise[]
}
```

---

## ⚙️ Configurações Avançadas

### 🌐 **Personalização Completa**
```typescript
interface UserConfig {
  // Pessoais
  name: string
  age?: number
  weight?: number
  height?: number
  gender?: 'male' | 'female' | 'other'
  
  // Objetivos
  fitnessGoal?: 'weight_loss' | 'muscle_gain' | 'maintain'
  targetWeight?: number
  dailyCalorieGoal?: number
  
  // Preferências
  theme?: 'light' | 'dark' | 'auto'
  language?: 'pt' | 'en'
  
  // Notificações
  notifications?: {
    workoutReminders: boolean
    supplementReminders: boolean
    mealReminders: boolean
  }
  
  // Unidades
  units?: {
    weight: 'kg' | 'lbs'
    height: 'cm' | 'ft'
    distance: 'km' | 'miles'
  }
}
```

### 🎨 **Temas e Interface**
- **Modo escuro/claro** automático
- **Cores personalizáveis**
- **Animações fluidas**
- **Feedback háptico**

---

## 🔄 Sincronização Firebase

### 🔥 **Hooks Firebase Implementados**

#### ✅ **Ativos e Funcionando**
- `useWorkouts` → `workouts/{userUID}`
- `useSupplements` → `supplements/{userUID}`
- `useSports` → `sports/{userUID}`
- `useUserConfig` → `userConfig/{userUID}`
- `useWorkoutHistory` → `workoutHistory/{userUID}`
- `useSupplementsHistory` → `supplementsHistory/{userUID}`
- `useFoodHistory` → `foodHistory/{userUID}` (sistema de alimentação completo)

#### 🔄 **Hook Central**
```typescript
import { useFirebaseData } from './hooks/useFirebaseData'

const {
  workouts,
  supplements,
  userConfig,
  isAnythingSyncing,
  isAuthenticated,
  forceSync,
  clearAllData
} = useFirebaseData()
```

### ⚡ **Recursos de Sincronização**
- **Offline-first**: Funciona sem internet
- **Sync automático** quando conectado
- **Resolução de conflitos**
- **Cache local** com AsyncStorage
- **Atualizações em tempo real**

---

## 🚀 Instalação e Configuração

### 📋 **Pré-requisitos**
- Node.js 18+ 
- npm ou yarn
- Expo CLI (opcional): `npm install -g expo-cli`

### ⚡ **Instalação Rápida**
```bash
# 1. Clone o repositório
git clone https://github.com/your-username/gymflow.git
cd gymflow

# 2. Instale dependências
npm install

# 3. Inicie o projeto
npm start
# ou
expo start
```

### 🔧 **Comandos Úteis**
```bash
# Desenvolvimento
npm run android     # Android
npm run ios         # iOS (macOS required)  
npm run web         # Web browser

# Qualidade
npm run lint        # ESLint
npm run tsc -- --noEmit  # TypeScript check

# Limpeza
npx expo install --fix  # Fix dependencies
npm run reset-project   # Reset cache
```

---

## 📱 Build e Distribuição

### 🤖 **Android (Produção)**
```bash
eas build -p android --profile production --clear-cache
```
**Resultado**: APK pronto para instalação direta

### 🍎 **iOS - Simulador (Gratuito)**
```bash
eas build -p ios --profile preview --clear-cache
```
**Resultado**: Build para simulador iOS (macOS required)

### 🏪 **iOS - App Store (Requer conta paga)**
```bash
eas build -p ios --profile production --clear-cache
```
**Requisitos**: 
- Apple Developer Program ($99/ano)
- Bundle ID: `com.brainiac.gymflow`
- Export compliance configurado automaticamente

### 🚀 **Teste Rápido com Expo Go**
```bash
npx expo start --tunnel
```
**Para**: Teste imediato em dispositivos reais via QR code

### 🔐 **Configuração de Segurança iOS**
```javascript
// app.config.js
ios: {
  infoPlist: {
    ITSAppUsesNonExemptEncryption: false
  }
}
```
**Motivo**: App usa apenas criptografia padrão (HTTPS/TLS)

### 🌐 **Distribuição Universal**
Para um link único iOS/Android:
1. **Produção**: Firebase Dynamic Links ou Branch
2. **Testes**: Landing page HTML com detecção de plataforma

---

## 🛠️ Arquitetura Técnica

### 📁 **Estrutura do Projeto**
```
gymflow/
├── app/                    # Telas (Expo Router)
│   ├── (tabs)/            # Navegação principal
│   ├── fichas/            # Sistema de treinos
│   ├── _layout.tsx        # Layout root + Toast provider
│   └── *.tsx              # Telas individuais
├── components/            # Componentes reutilizáveis
│   ├── ExerciseSelector*.tsx  # Seletores avançados
│   └── ui/                # Componentes UI básicos
├── hooks/                 # Hooks customizados
│   ├── useFirebaseStorage.ts  # Base Firebase
│   ├── useWorkouts.ts     # Gestão de treinos
│   ├── useSupplements.ts  # Gestão de suplementos
│   └── useFirebaseData.ts # Hook central
├── utils/                 # Utilitários
│   ├── toastUtils.ts      # Sistema de toasts
│   └── workoutUtils.ts    # Utilitários de treino
├── constants/             # Dados e constantes
│   ├── exercisesData.ts   # Catálogo de exercícios
│   └── metData.ts         # Dados de METs
├── services/              # Serviços externos
│   ├── firebaseSync.ts    # Sincronização
│   └── authService.ts     # Autenticação
└── config/
    └── firebase.ts        # Configuração Firebase
```

### 🔔 **Sistema de Toasts Centralizado**
```typescript
// utils/toastUtils.ts
import { ToastPresets } from '@/utils/toastUtils'

ToastPresets.success('Ação concluída!', 'O treino foi registado.')
ToastPresets.error('Falha ao salvar', 'Tenta novamente mais tarde.')
ToastPresets.info('Item removido', 'O suplemento foi excluído.')
```

### 🗃️ **Gestão de Estado**
- **AsyncStorage**: Persistência local
- **Firebase**: Sincronização cloud
- **React Hooks**: Estado da aplicação
- **Context API**: Estados globais (Sports)

### 📅 **Gestão de Datas**
```typescript
// Formato padrão: YYYY-MM-DD (local timezone)
const getLocalDateString = () => {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}
```

---

## 🔧 Desenvolvimento

### 🎯 **Padrões de Código**
- **TypeScript strict**: Tipagem completa
- **ESLint + Prettier**: Código padronizado  
- **Hooks personalizados**: Lógica reutilizável
- **Componentes funcionais**: React moderno
- **Async/await**: Promises simplificadas

### 🧪 **Testes Recomendados**
```bash
# Testes manuais essenciais
# 1. Criar/editar ficha → verificar persistência
# 2. Contabilizar treino → verificar workoutHistory
# 3. Registar atividade → validar cálculo de calorias  
# 4. Sync Firebase → validar dados no Firestore
# 5. Toasts → verificar visibilidade após navegação
```

### 🐛 **Debug Common Issues**
- **Toasts não aparecem**: Verificar `<Toast />` em `_layout.tsx`
- **Calorias = 0**: Confirmar `userProfile.weight` e `MET_DATA`
- **Data errada**: Evitar `toISOString()`, usar data local
- **Notificações**: Testar em build standalone, não Expo Go

### 🔄 **Git Workflow**
```bash
git checkout -b feat/nova-funcionalidade
git commit -m "feat: adicionar sistema de conquistas"
git push origin feat/nova-funcionalidade
# Abrir Pull Request
```

---

## 📄 Documentação Adicional

### 📚 **Arquivos de Referência**
- `docs/FIREBASE_USAGE.md` - Guia completo Firebase
- `STATUS-FIREBASE.md` - Status dos hooks implementados  
- `EXERCISE_SELECTOR_README.md` - Seletor de exercícios
- `eas.json` - Configuração de builds
- `app.config.js` - Configuração do app

### 🔍 **Principais Constantes**
```typescript
// Chaves AsyncStorage
const WORKOUTS_STORAGE_KEY = 'user_workouts_storage'
const SUPPLEMENTS_STORAGE_KEY = 'user_supplements_list'  
const USER_CONFIG_STORAGE_KEY = 'userConfig'
const WORKOUT_HISTORY_STORAGE_KEY = 'workoutHistory'

// Dados iniciais
const INITIAL_SPORTS_DATA = [
  { id: 'academia', name: 'Academia', icon: 'barbell-outline' },
  { id: 'volei_quadra', name: 'Vôlei de Quadra', icon: 'volleyball' },
  // ... mais esportes
]
```

### 🎨 **Tema e Cores**
```typescript
const theme = {
  colors: {
    primary: '#5a4fcf',
    secondary: '#6c5ce7', 
    success: '#4CAF50',
    warning: '#FF9800',
    info: '#45b7d1'
  }
}
```

---

## 🎯 Roadmap & Próximas Funcionalidades

### 🚧 **Em Desenvolvimento**
- [ ] **Export/Import** de dados (JSON/CSV)
- [ ] **Modo offline avançado** com queue de sincronização
- [ ] **Analytics detalhados** com gráficos interativos
- [ ] **Planos de treino** pré-definidos
- [ ] **Integração com wearables** (Apple Health, Google Fit)

### 💡 **Futuras Melhorias**
- [ ] **IA para sugestões** de treinos
- [ ] **Sistema de badges** e gamificação
- [ ] **Comunidade** e compartilhamento
- [ ] **Nutrição avançada** com macro tracking
- [ ] **Backup automático** e restore

### 🌐 **Expansão de Plataforma**
- [ ] **Desktop app** (Electron)
- [ ] **Apple Watch** companion
- [ ] **Web dashboard** completo

---

## 📞 Suporte e Contribuições

### 🤝 **Como Contribuir**
1. Fork o repositório
2. Crie sua feature branch (`git checkout -b feat/amazing-feature`)
3. Commit suas mudanças (`git commit -m 'Add amazing feature'`)
4. Push para a branch (`git push origin feat/amazing-feature`)
5. Abra um Pull Request

### 🐛 **Report de Bugs**
- Use GitHub Issues
- Inclua passos para reproduzir
- Anexe screenshots se aplicável
- Especifique versão do OS/device

### 💬 **Comunidade**
- GitHub Discussions para dúvidas
- Pull Requests são bem-vindos
- Code reviews colaborativos

---

## 📜 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para detalhes.

---

## 🙏 Agradecimentos

Desenvolvido com ❤️ para a comunidade fitness. Obrigado a todos os contribuidores e testadores que tornaram este projeto possível.

**GymFlow** - Transforme sua jornada fitness! 💪

---

*Última atualização: 11 de Novembro de 2025*

## Estrutura do Projeto

- `app/` — telas e rotas (Expo Router)
  - `perfil.tsx`, `perfil-modal.tsx` — perfil do utilizador
  - `fichas/` — telas de musculação e detalhe de exercícios
  - `ficha-modal.tsx` — criação de fichas com `ExerciseSelectorEnhanced`
  - `editar-ficha/[id].tsx` — edição de fichas existentes
  - `(tabs)/` — navegação principal (Home, Esportes, Histórico, etc.)

- `components/` — componentes UI reutilizáveis (cards, modais, seletores)

- `constants/` — dados e constantes da app (`metData.ts`, `colors.ts`, `exercisesData.ts`)
  - `exercisesData.ts` contém um catálogo local com 74+ exercícios e referências a assets locais (GIF/WebP)

- `hooks/` — hooks personalizados (`useWorkouts`, `useSports`, `useSupplements`, etc.)

- `services/` — integração com Firebase, sincronização e auth

- `lib/` — serviços auxiliares (ex.: `notificationService.ts`)

- `utils/` — utilitários (ex.: `calorieCalculator.ts`, `workoutUtils.ts`)

- `assets/` — imagens e vídeos demonstrativos

## Armazenamento e Formatos de Dados

O app persiste dados no `AsyncStorage` com chaves bem definidas. Exemplos importantes:

- `userProfile` — objeto com { name, weight, height, birthDate, gender, activityLevel, targetWeight, goalDate }
- `foodHistory` — array com entradas alimentares: `{ id, date: 'YYYY-MM-DD', mealType, description, data: { calories, protein, carbs, fat } }`
- `workoutHistory` — array de registos: `{ id, date: 'YYYY-MM-DD', category, details }`
- `user_supplements_list` — lista de suplementos configurados pelo utilizador
- `supplements_history` — mapeamento diário de consumo `{ 'YYYY-MM-DD': { [supplementId]: boolean|number } }`

Observações sobre datas:
- Registos diários usam o formato `YYYY-MM-DD` com componentes locais para evitar deslocamentos por fuso horário.

## Sincronização com Firebase (opcional)

O projeto inclui um serviço de sincronização com Firebase para dados selecionados (workouts, histórico, e configurações do utilizador). Comportamento básico:

- Ao autenticar (via `authService`), o `useFirebaseStorage` pode sincronizar coleções e ativar realtime updates.
- Configurações de metas do utilizador são sincronizadas em `userConfig` quando o utilizador está autenticado.
- Em caso de falta de conexão ou modo anônimo, o app opera apenas com cache local (`AsyncStorage`) e sincroniza quando possível.

Arquivos relevantes: `services/firebaseSync.ts`, `hooks/useFirebaseStorage.ts`, `services/authService.ts`.

## Fluxos Principais e Onde Procurar Código

- Home / Dashboard: `app/(tabs)/index.tsx`
- **Sistema de Alimentação**: `app/(tabs)/historico.tsx` (registro e histórico nutricional)
- Registar atividade esportiva: `app/logEsporte.tsx`
- Fichas de treino: `app/fichas/[id].tsx`, `app/musculacao.tsx`, `app/gerir-fichas.tsx`
- Criar/editar ficha: `app/ficha-modal.tsx`, `app/editar-ficha/[id].tsx`
- Perfil e cálculos: `app/perfil.tsx`, `app/perfil-modal.tsx`
- Gestão de suplementos: `app/gerir-suplementos.tsx`, `app/suplemento-modal.tsx`
- Seleção de exercícios avançada: `components/ExerciseSelectorEnhanced.tsx` e `components/ExerciseSelector*.tsx`

## Debugging e Resolução de Problemas Comuns

- Toasts não aparecem
  - Verifique se `<Toast />` está renderizado em `app/_layout.tsx` (provider global).
  - Ao navegar imediatamente após exibir um toast, introduza um pequeno delay antes de `router.back()` para garantir visibilidade.

- Calorias aparecem como 0
  - Confirme que `userProfile.weight` está salvo e que `MET_DATA` contém a modalidade desejada.

- Entradas no dia errado (fuso horário)
  - Evite `toISOString()` para registos diários; use uma função que retorne `YYYY-MM-DD` a partir da data local.

- Notificações disparam imediatamente
  - Em Expo Go o agendamento pode comportar-se diferente; teste em dispositivo físico/Dev Client ou build standalone.

## Testes e Qualidade

- Execução de lint e checagem TypeScript:

```bash
npm run lint
npm run tsc -- --noEmit
```

- Testes manuais principais:
  - Criar/editar uma ficha e verificar persistência
  - Contabilizar um treino e verificar que o registo é salvo em `workoutHistory`
  - Registar atividade desportiva e validar cálculo de calorias
  - Sincronizar com Firebase (quando autenticado) e validar presença de dados na coleção correspondente

## Contribuindo

- Fork e branch por feature: `git checkout -b feat/nome-da-feature`
- Siga convenções de commit e mantenha PRs pequenos e documentados
- Abra issues para bugs e features antes de começar a trabalhar

## Roadmap & Melhorias Futuras

- Autenticação multi-usuário (melhorar experiência de login e contas)
- Export / Import de dados (JSON / CSV)
- Melhorias de UX no registo de refeições (interpretação de porções)
- Centralizar funções de data em `utils/date.ts`
- Mais testes automatizados (unit e integração)

## Licença

Incluir aqui a licença do projeto (ex.: MIT) se aplicável.

---

Se quiser, eu posso também gerar um `CHANGELOG.md` separado, limpar logs de debug temporários adicionados ao código, e adicionar testes unitários para o utilitário `utils/workoutUtils.ts`.

## 🔁 Atualizações recentes (06 de Novembro de 2025)

Estas notas documentam mudanças e adições implementadas desde a última actualização.

- Sincronização de configurações do utilizador com Firebase
  - `firebaseSyncService` foi expandido para incluir sincronização de configurações de utilizador (chave `userConfig`).
  - Tela de configuração (`app/configurar-home.tsx`) agora carrega do Firebase primeiro (quando autenticado), faz fallback para `AsyncStorage` e salva localmente como cache.
  - A sincronização é feita de forma resiliente: salva localmente primeiro e tenta enviar para a nuvem quando possível.
  - Arquivos relevantes: `services/firebaseSync.ts`, `app/configurar-home.tsx`, `app/(tabs)/index.tsx` (load/save userConfig).

- Toasters e navegação após registo de treino/atividade
  - Melhorado o comportamento ao contabilizar treinos e registar esportes: o `Toast.show()` é exibido e a navegação `router.back()` foi atrasada levemente para garantir visibilidade do toast.
  - Ajustes nas opções do toast para maior confiabilidade: `visibilityTime` e `topOffset` foram configurados quando necessário.
  - Arquivos relevantes: `app/fichas/[id].tsx`, `app/logEsporte.tsx`, `app/_layout.tsx` (provider já presente).

- Ordem estável e previsível das fichas de treino
  - Problema: `Object.values()`/`Object.keys()` não garantiam ordem consistente das fichas entre cargas/sincronizações.
  - Solução: adicionada utilidade `utils/workoutUtils.ts` com funções:
    - `sortWorkoutsByName()` — retorna workouts ordenados por nome
    - `getSortedWorkoutIds()` — IDs ordenados
    - `getNextWorkoutId()` — próximo workout ordenado
  - As telas que listam ou usam a ordem das fichas passaram a usar estas funções para garantir consistência (Home, Musculação, Gestão de Fichas, Gestão de Dados, cálculo do próximo treino).
  - Arquivos relevantes: `utils/workoutUtils.ts`, `app/musculacao.tsx`, `app/gerir-fichas.tsx`, `app/gestao-dados.tsx`, `app/fichas/[id].tsx`.

- Ajustes e melhorias menores
  - Logs de debug adicionados temporariamente ao mostrar toasts para auxiliar verificação (console.log).
  - Mesclagem de configurações existentes ao salvar (`config` é mesclado com `existingConfig` para evitar sobrescrita de outros campos).
  - Pequenas melhorias de UX e mensagens de feedback (toasts informativos, haptics ao salvar).

## 📁 Lista rápida de ficheiros modificados/novos nesta ronda

- services/firebaseSync.ts — adicionadas funções para salvar/carregar/sincronizar `userConfig`.
- app/configurar-home.tsx — agora usa Firebase quando disponível; merge/salvamento local + nuvem.
- app/(tabs)/index.tsx — load/save `userConfig` atualizado para priorizar Firebase e cache local.
- app/logEsporte.tsx — toast + delay antes de `router.back()` e configurações do toast.
- app/fichas/[id].tsx — toast + delay antes de `router.back()`; calculo do próximo treino usando utilitário ordenado.
- app/gestao-dados.tsx — usa utilitário ordenado para listar fichas no modal de adicionar atividade.
- app/musculacao.tsx — lista de fichas agora ordenada por nome (usa `utils/workoutUtils.ts`).
- app/gerir-fichas.tsx — lista ordenada por nome para consistência.
- utils/workoutUtils.ts — novo arquivo utilitário para ordenação e navegação entre fichas.

## ✅ Como testar rapidamente

1. Iniciar o app em desenvolvimento:

```bash
npm install
npm run start
```

2. Testar fluxo de configuração de metas:
   - Abrir `Configurar Home`, alterar metas e salvar.
   - Se autenticado, verifique console e Firestore (se disponível) para ver o documento `userConfig` salvo; caso contrário verifique `AsyncStorage`.

3. **Testar sistema de alimentação**:
   - Ir para `Histórico` → digitar alimento (ex: "150g arroz")
   - Verificar sugestões automáticas e scroll na lista
   - Registrar refeição e verificar cálculo de macronutrientes
   - Validar persistência no `foodHistory` e sincronização Firebase

4. Testar contabilização de treino/esporte:
   - Contabilizar um treino em `Fichas` ou registar uma atividade em `Registar Atividade`.
   - Verificar toast aparece e, após ~2s, a tela volta.

5. Verificar ordem de fichas:
   - Vá para `Fichas` e `Gerir Fichas` — observe a ordem estável (alfabética por nome).

---

