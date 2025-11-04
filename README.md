# 📱 GymFlow — Diário de Treino, Nutrição e Suplementação

**Última Actualização:** 03 de Novembro de 2025
**Estado:** Funcionalidade local completa — pronto para testes no Expo (iOS/Android/Web)

---

## 📑 Sumário

- [Visão geral](#visão-geral)
- [Funcionalidades principais](#funcionalidades-principais)
- [Instalação e execução](#instalação-e-execução)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Armazenamento de dados e chaves importantes](#armazenamento-de-dados-e-chaves-importantes)
- [Resolução de problemas comuns](#resolução-de-problemas-comuns)
- [Desenvolvimento e contribuições](#desenvolvimento-e-contribuições)
- [Roadmap & melhorias futuras](#roadmap--melhorias-futuras)

---

## Visão geral

GymFlow é uma aplicação móvel (Expo/React Native + TypeScript) desenhada para acompanhar treinos, nutrição e suplementação do utilizador.

Principais objetivos:
- Gerir fichas de musculação e outras modalidades
- Registar alimentos e acompanhar o balanço energético diário
- Agendar e gerir suplementos e lembretes
- Fornecer métricas simples (IMC, TDEE estimado, calorias gastas)

---

## Funcionalidades principais

- Dashboard diário com resumo de calorias consumidas e gastas
- Registro de treinos por desporto (inclui fluxos dedicados para Musculação e Natação)
- Fichas de treino (Musculação) com contabilização automática do treino do dia
- Cálculo de gasto calórico por atividade usando METs (arquivo: `constants/metData.ts`)
- Diário alimentar com busca inteligente e agrupamento por refeição
- Perfil do utilizador com cálculo de IMC, idade e TDEE estimado (`perfil.tsx`, `perfil-modal.tsx`)
- Calendário com marcações por balanço energético (verde/vermelho)
- Gestão completa (CRUD) para: suplementos, fichas, desportos
- Operação offline: todos os dados guardados localmente em AsyncStorage

---

## Instalação e execução

Pré-requisitos:
- Node.js (v18+ recomendado)
- npm ou yarn
- Expo CLI (opcional, mas recomendado): `npm install -g expo-cli`

Passos:

1. Instalar dependências

```bash
npm install
```

2. Iniciar a aplicação (modo desenvolvimento)

```bash
npm run start
# ou
expo start
```

3. Executar no dispositivo / emulador

- Android: selecione `Run on Android device/emulator` no Metro ou `npm run android`
- iOS: selecione `Run on iOS simulator` ou `npm run ios` (macOS necessário)
- Web: `npm run web`

Lint e checagens rápidas:

```bash
npm run lint
```

Verificação TypeScript (recomendado antes de commits):

```bash
npm run tsc -- --noEmit
```

---

## Estrutura do projeto (resumo)

- `app/` — telas e rotas (Expo Router)
  - `perfil.tsx`, `perfil-modal.tsx` — perfil do utilizador
  - `fichas/` — telas de musculação e exercícios
  - `ficha-modal.tsx` — criação de novas fichas com seletor avançado de exercícios
  - `editar-ficha/[id].tsx` — edição de fichas existentes
  - `(tabs)/` — telas de navegação principal (Home, Esportes, Historico, etc.)
- `components/` — componentes reaproveitáveis (cards, modais, etc.)
  - `ExerciseSelectorEnhanced.tsx` — seletor avançado de exercícios com animações e favoritos
- `constants/` — constantes da app (`metData.ts`, `colors.ts`, `exercisesData.ts`, etc.)
  - `exercisesData.ts` — banco de dados interno com 74+ exercícios categorizados
- `data/` — base local de alimentos (`foodData.json`)
- `hooks/` — hooks customizados (`useWorkouts`, `useSports`, etc.)
- `utils/` — utilitários como `calorieCalculator.ts`
- `assets/videos/` — vídeos demonstrativos dos exercícios (GIFs/WebP)

---

## Armazenamento de dados e chaves importantes

A aplicação guarda todos os dados no AsyncStorage. Principais chaves:

- `userProfile` — objeto com informações do utilizador (name, weight, height, birthDate, gender, activityLevel, targetWeight, goalDate)
- `foodHistory` — array de entradas alimentares. Cada item geralmente tem a forma:
  - `{ id, date: 'YYYY-MM-DD', mealType, description, data: { calories, protein, carbs, fat } }`
- `workoutHistory` — array de registos de treino. Estrutura típica:
  - `{ id, date: 'YYYY-MM-DD', category: 'Musculação'|'Natação'|..., details: { duration, calories, performance?, notes? } }`
- `supplements_history` — histórico/valores de suplementos por dia (formato: `{ 'YYYY-MM-DD': { [supplementId]: boolean|number } }`)
- `user_supplements_list` — lista de suplementos do utilizador (shape atualizado com `showOnHome?: boolean`)
- `all_supplement_reminders` — objeto com lembretes configurados pelo utilizador (horário + enabled)
- `scheduled_notification_ids` — mapa persistido de ids retornados pelo agendador de notificações (usado para cancelar / re-agendar)

OBS: As datas do diário (registos por dia) são gravadas/consultadas no formato `YYYY-MM-DD` usando data local (não UTC) para evitar problemas de fuso horário. Campos que precisam de timestamp (ex.: `birthDate`, `goalDate`) podem ser salvos com `toISOString()` intencionalmente.

---

## Resolução de problemas comuns

- Calorias de musculação aparecem como 0:
  - Verifique se existe `MET_DATA['Musculação']` (foi adicionada por padrão) e se o `userProfile.weight` está salvo (o cálculo usa o peso do perfil). Se o peso for 0 ou indefinido, o resultado será 0.

- Entradas aparecem no dia seguinte (problema de fuso horário):
  - O app grava datas no formato `YYYY-MM-DD` usando componentes de data locais. Contudo, se um fluxo usar `toISOString()` por engano para registos diários, isso pode deslocar a data em alguns fusos (ex.: Brasilia). Se encontrar esse comportamento, procure usos de `toISOString()` e prefira a função utilitária local `getLocalDateString` (pode ser centralizada em `utils/date.ts`).

- Spinner infinito na tela de Perfil:
  - Se não houver `userProfile` salvo, a tela de perfil agora mostra um botão "Criar Perfil" em vez de ficar em loading.

- Notificações disparam imediatamente ao ativar um lembrete:
  - Observado especialmente no Expo Go / simulador: o agendamento do sistema pode não se comportar exatamente como num build standalone. Para testes confiáveis, use um dispositivo físico com Dev Client ou um build de teste.
  - A implementação atual usa `scheduleNotificationAsync` (com trigger por timestamp quando possível) e persiste os ids no AsyncStorage. Há helpers no arquivo `lib/notificationService.ts` para listar e cancelar agendamentos antigos e para re-agendar todos os lembretes.
  - Debug rápido: cancele agendamentos antigos (helper), execute `scheduleAllReminders()` e verifique os timestamps agendados. Se continuar a disparar imediatamente, verifique o ambiente (Expo Go vs Dev Client) e reinicie o app.

---

## Desenvolvimento e contribuições

- Recomenda-se criar uma branch por feature: `git checkout -b feat/nome-da-feature`
- Mantenha as alterações pequenas e escreva mensagens de commit descritivas

Para contribuir:

1. Fork o projeto
2. Crie uma branch
3. Abra um Pull Request descrevendo a mudança e os passos para testar

Testes locais e verificação rápida:

```bash
# Instalar dependências
npm install

# Lint
npm run lint

# Rodar app
npm run start
```

Verificação TypeScript recomendada:

```bash
npm run tsc -- --noEmit
```

---

## Roadmap & melhorias futuras

- Sincronização na nuvem (Firebase / Sync service)
- Autenticação multi-usuário
- Export / Import de dados (JSON / CSV)
- Melhoria de UX no registo de refeições (interpretação de porções mais avançada)
- Centralizar utilitários de data em `utils/date.ts` para garantir consistência

---

## 🚀 Funcionalidades Recentes (Novembro 2025)

### Sistema Avançado de Seleção de Exercícios
- **Banco de dados interno completo**: 74+ exercícios organizados em 11 grupos musculares
- **Interface otimizada para mobile**: Chips de filtro maiores e mais legíveis para melhor usabilidade
- **Sistema de favoritos**: Marque exercícios preferidos com estrela e filtre rapidamente
- **Preview inteligente**: Toque longo em qualquer exercício para ver detalhes e vídeo demonstrativo
- **Animações fluidas**: Efeitos de bounce na seleção e transições suaves
- **Contador em tempo real**: Badge no header mostra quantos exercícios foram selecionados
- **Busca inteligente**: Encontre exercícios rapidamente por nome
- **Carregamento otimizado**: Estados de loading e feedback visual aprimorado

### Melhorias Técnicas
- **Assets locais**: Vídeos demonstrativos integrados com `require()` para melhor performance
- **TypeScript aprimorado**: Tipagem mais robusta para exercícios e componentes
- **Arquitetura componentizada**: `ExerciseSelectorEnhanced` reutilizável em criação e edição de fichas
- **Performance otimizada**: useMemo e useCallback para renderização eficiente

### Compatibilidade de Vídeos
- **Formatos suportados**: GIF e WebP para demonstrações visuais
- **Carregamento inteligente**: Fallback para ícones quando vídeo não disponível
- **Otimização mobile**: Compressão adequada para dispositivos móveis

---

## Notas do desenvolvedor (mudanças recentes importantes)

### Sistema de Exercícios (Novembro 2025)
- **ExerciseSelectorEnhanced**: Componente principal para seleção de exercícios com funcionalidades avançadas
  - Integrado em `ficha-modal.tsx` (criação) e `editar-ficha/[id].tsx` (edição)
  - Sistema de favoritos persistente no estado local
  - Animações implementadas com Animated API do React Native
  - Filtros otimizados por grupo muscular + busca + favoritos
- **exercisesData.ts**: Base de dados estruturada com 74+ exercícios
  - Formato: `{ id, name, muscle, videoUrl: require(...) }`
  - Organizados por 11 grupos musculares em português
  - Assets de vídeo carregados com `require()` para melhor performance no React Native
- **Tipagem TypeScript**: Interface `Exercise` e `ExerciseGroup` para type safety

### Otimizações de UX
- **Filter chips responsivos**: Tamanhos otimizados para touch targets móveis
- **Loading states**: Feedback visual durante carregamento de exercícios
- **Bounce animations**: Micro-interações para seleção de exercícios
- **Modal preview**: Visualização rápida com long press gesture

- Suplementos
  - `useSupplements` normaliza e inclui `showOnHome?: boolean` para controlar se um suplemento aparece no Home.
  - `app/gerir-suplementos.tsx` foi estendido com controles para marcar se tomou (`daily_check`) ou ajustar contadores (`counter`) e persiste em `supplements_history`.

- Notificações
  - O serviço de notificações (`lib/notificationService.ts`) usa `scheduleNotificationAsync` e persiste IDs para permitir cancelamento e re-agendamento.
  - Se as notificações estiverem a disparar imediatamente ao activar um lembrete, verifique agendamentos antigos e o ambiente (Expo Go vs Dev Client / standalone).

