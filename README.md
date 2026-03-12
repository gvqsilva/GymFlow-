<div align="center">

# GymFlow

**Aplicativo mobile completo de fitness e bem-estar**

[![React Native](https://img.shields.io/badge/React_Native-0.81-61DAFB?style=flat-square&logo=react)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-54-000020?style=flat-square&logo=expo)](https://expo.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Firebase](https://img.shields.io/badge/Firebase-12-FFCA28?style=flat-square&logo=firebase)](https://firebase.google.com/)

*Disponível para iOS · Android · Web*

</div>

---

## Índice

- [Sobre o projeto](#-sobre-o-projeto)
- [Por que foi criado](#-por-que-foi-criado)
- [Funcionalidades](#-funcionalidades)
  - [Dashboard](#-dashboard-home)
  - [Treinos](#-treinos-musculação)
  - [Esportes](#-esportes)
  - [Alimentação](#-alimentação)
  - [Suplementos](#-suplementos)
  - [Planejamento Semanal](#-planejamento-semanal)
  - [Perfil e Métricas](#-perfil-e-métricas)
  - [Modo Treinador](#-modo-treinador)
  - [Gestão de Dados](#-gestão-de-dados)
- [Arquitetura](#-arquitetura)
  - [Estrutura de pastas](#estrutura-de-pastas)
  - [Hooks principais](#hooks-principais)
  - [Coleções no Firestore](#coleções-no-firestore)
- [Stack](#-stack)
- [Como rodar](#-como-rodar)
- [Plataformas suportadas](#-plataformas-suportadas)

---

## Sobre o projeto

GymFlow é uma aplicação mobile desenvolvida em **React Native + Expo + TypeScript** para acompanhar treinos, alimentação, suplementação e métricas de fitness. Combina uma experiência **offline-first** robusta com sincronização opcional via Firebase.

---

## Por que foi criado

A ideia surgiu de uma necessidade prática: não existe um app simples que reúna treino, alimentação, suplementação e planejamento semanal em um lugar só. A maioria dos apps existentes é focada demais em apenas uma área, ou então é complexa demais para o uso diário.

O GymFlow foi criado para ser direto ao ponto — você abre, registra o que treinou, o que comeu, toma o suplemento, e fecha. Sem burocracia.

O app também foi desenvolvido pensando que nem sempre há internet disponível: os dados ficam salvos localmente primeiro e sincronizam com a nuvem quando possível.

---

## ✨ Funcionalidades

### Dashboard (Home)

- Visão geral do dia: calorias consumidas vs. gastas
- Suplementos do dia com ação rápida (check ou contador)
- Plano do dia: atividades planejadas por período (manhã, tarde, noite)
- Atalhos de ações rápidas configuráveis (até 4)
- Status de sincronização em tempo real
- Compartilhamento do treino do dia

###️ Treinos (Musculação)

- Criação de fichas personalizadas (A, B, C, D, etc.)
- Catálogo com mais de 70 exercícios catalogados
- Seletor de exercícios com filtros por grupo muscular e equipamento
- Vídeos e imagens demonstrativas por exercício
- Registro de séries, repetições e carga
- Histórico completo com duração, calorias e anotações
- Gráficos de frequência mensal por tipo de treino
- Reordenação de exercícios por arrastar

### ⚽ Esportes

- Registro de sessões de esportes variados (vôlei, futebol, boxe, corrida, etc.)
- Categorias totalmente personalizáveis com ícones e emojis
- Cálculo de calorias por MET (equivalente metabólico da atividade)

### Alimentação

- Base de dados local com centenas de alimentos
- Registro por refeição: café da manhã, almoço, jantar e lanche
- Múltiplas unidades de medida (gramas, ml, fatias, colheres, unidades)
- Cálculo automático de calorias, proteínas, carboidratos e gorduras
- Histórico detalhado com análise por refeição e por dia

### Suplementos

- Lista personalizada de suplementos
- Dois modos de rastreamento: **check diário** (tomou/não tomou) ou **contador de doses**
- Histórico de consumo por data
- Configuração de dose, unidade e visibilidade na tela inicial

### Planejamento Semanal

- Planner de 7 dias com 3 períodos por dia (manhã, tarde, noite)
- Adicione atividades com nome, emoji e anotações em cada período

### Perfil e Métricas

- Dados pessoais: nome, idade, peso, altura, sexo
- Cálculo automático de **IMC**, **TMB** (Taxa Metabólica Basal) e **TDEE** (Gasto Calórico Total)
- Metas personalizadas: emagrecimento, ganho de massa ou manutenção
- Suporte a diferentes unidades (kg/lbs, cm/ft, km/mi)
- Histórico de medidas corporais

### Modo Treinador

- Interface especial para personal trainers gerenciarem alunos

### Gestão de Dados

- Exportação e importação de dados locais
- Backup automático no Firebase
- Sincronização em segundo plano a cada 5 minutos

---

##️ Arquitetura

O app segue uma arquitetura **offline-first**: o AsyncStorage é a fonte primária de dados, e o Firebase Firestore funciona como backup em nuvem. As duas camadas ficam sincronizadas de forma automática e transparente para o usuário.

```
AsyncStorage (local)  <-->  Firebase Firestore (nuvem)
        |                           |
    Hooks personalizados       Listeners em tempo real
        |                           |
              React Context API
                     |
              Telas (Expo Router)
```

### Estrutura de pastas

```
app/              # Telas e rotas (Expo Router)
  (tabs)/         # Navegação por abas (Home, Esportes, Histórico, Suplementos, Perfil)
  editar-ficha/   # Edição de ficha por ID
  fichas/         # Visualização de ficha e exercício
components/       # Componentes reutilizáveis
config/           # Configuração do Firebase
constants/        # Dados estáticos (temas, exercícios, METs, ícones)
context/          # React Context (SportsProvider)
data/             # Banco de dados local (alimentos, suplementos)
hooks/            # Hooks customizados de estado e sincronização
lib/              # Serviços auxiliares (notificações)
services/         # Serviços principais (auth, sincronização Firebase)
utils/            # Funções utilitárias (cálculo de calorias, toasts, etc.)
```

### Hooks principais

| Hook | Responsabilidade |
|------|-----------------|
| `useWorkouts` | CRUD de fichas de treino com sync Firebase |
| `useWorkoutHistory` | Histórico de treinos realizados |
| `useSupplements` | Inventário de suplementos |
| `useSupplementsHistory` | Histórico de consumo de suplementos |
| `useSports` | Categorias de esportes customizadas |
| `useWeeklyPlan` | Planejamento semanal por período |
| `useFirebaseStorage` | Sincronização AsyncStorage ↔ Firestore |
| `useFoodHistory` | Histórico de alimentação |
| `useBodyMeasurements` | Medidas corporais |
| `useUserConfig` | Preferências e configurações do usuário |

### Coleções no Firestore

| Coleção | Conteúdo |
|---------|---------|
| `workouts` | Fichas de treino |
| `workoutHistory` | Treinos realizados |
| `sports` | Categorias de esportes |
| `supplements` | Lista de suplementos |
| `supplements_history` | Histórico de consumo |
| `weeklyPlan` | Planejamento semanal |
| `foodHistory` | Registro alimentar |
| `bodyMeasurements` | Medidas corporais |
| `userConfig` | Configurações do usuário |

---

##️ Stack

| Camada | Tecnologia |
|--------|-----------|
| Framework | React Native + Expo ~54 |
| Linguagem | TypeScript 5.9 |
| Navegação | Expo Router (file-based) |
| Backend | Firebase (Auth, Firestore, Storage) |
| Storage local | AsyncStorage |
| Gerenciamento de estado | React Context API + Hooks |
| Gráficos | react-native-chart-kit |
| Calendário | react-native-calendars |
| Animações | react-native-reanimated |
| Gestures | react-native-gesture-handler |
| Notificações | expo-notifications |
| Ícones | @expo/vector-icons (Ionicons, MaterialCommunityIcons) |

---

## Como rodar

### Pré-requisitos

- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- Conta no Firebase com projeto configurado

### Instalação

```bash
# Instalar dependências
npm install

# Iniciar o servidor de desenvolvimento
npx expo start
```

### Firebase

O app usa o arquivo `config/firebase.ts` com as credenciais do projeto. Substitua com as credenciais do seu projeto Firebase:

```ts
const firebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "...",
};
```

### Build

```bash
# Android
npx expo run:android

# iOS
npx expo run:ios

# Web
npx expo start --web

# Build com EAS
eas build --platform android
eas build --platform ios
```

---

## Plataformas suportadas

| Plataforma | Suporte |
|------------|---------|
| Android | ✅ |
| iOS | ✅ |
| Web | ✅ (via react-native-web) |
