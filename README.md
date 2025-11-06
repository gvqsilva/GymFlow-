# 📱 GymFlow — Diário de Treino, Nutrição e Suplementação

**Última Actualização:** 06 de Novembro de 2025
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
# 📱 GymFlow — Documentação do Projeto

GymFlow é uma aplicação móvel construída com Expo + React Native + TypeScript para gerir treinos, nutrição e suplementação. Esta documentação descreve a arquitetura, instalação, execução, principais funcionalidades, armazenamento de dados, testes e como contribuir.

---

## Índice

- [Visão Geral](#vis%C3%A3o-geral)
- [Funcionalidades Principais](#funcionalidades-principais)
- [Pré-requisitos](#pr%C3%A9-requisitos)
- [Instalação e Execução](#instala%C3%A7%C3%A3o-e-execução)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Armazenamento e Formatos de Dados](#armazenamento-e-formatos-de-dados)
- [Fluxos Principais e Arquivos Relacionados](#fluxos-principais-e-arquivos-relacionados)
- [Debugging e Resolução de Problemas Comuns](#debugging-e-resolu%C3%A7%C3%A3o-de-problemas-comuns)
- [Testes e Qualidade](#testes-e-qualidade)
- [Contribuindo](#contribuindo)
- [Roadmap & Melhorias Futuras](#roadmap--melhorias-futuras)
- [Licença](#licença)

---

## Visão Geral

O GymFlow ajuda utilizadores a planear e registar treinos (fichas de musculação e outras modalidades), acompanhar ingestão alimentar, gerir suplementos e visualizar métricas de progresso (IMC, TDEE estimado, balanço energético). O app suporta operação offline com sincronização opcional via Firebase.

## Funcionalidades Principais

- Dashboard diário com resumo de calorias consumidas vs gastas
- Registo de treinos por modalidade (ex.: Musculação, Natação, Futebol)
- Fichas de treino (CRUD) com seleção de exercícios e contabilização automática
- Cálculo de gasto calórico por atividade usando METs (`constants/metData.ts`)
- Diário alimentar com pesquisa e agrupamento por refeição (`data/foodData.json`)
- Gestão de suplementos com lembretes e histórico diário
- Perfil do utilizador (IMC, idade, TDEE) com persistência local
- Calendário com marcações por balanço energético
- Operação offline via `AsyncStorage`, com opção de sincronização com Firebase (quando autenticado)

## Pré-requisitos

- Node.js (v18+ recomendado)
- npm ou yarn
- Expo CLI (opcional): `npm install -g expo-cli`

## Instalação e Execução

1. Instalar dependências

```bash
npm install
```

2. Iniciar a aplicação (desenvolvimento)

```bash
npm run start
# ou
expo start
```

3. Executar no dispositivo / emulador

- Android: `npm run android` (ou via Metro)
- iOS: `npm run ios` (macOS necessário)
- Web: `npm run web`

Comandos úteis:

```bash
npm run lint           # lint
npm run tsc -- --noEmit  # checagem TypeScript
```

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
- Registar atividade esportiva: `app/logEsporte.tsx`
- Fichas de treino: `app/fichas/[id].tsx`, `app/musculacao.tsx`, `app/gerir-fichas.tsx`
- Criar/editar ficha: `app/ficha-modal.tsx`, `app/editar-ficha/[id].tsx`
- Perfil e cálculos: `app/perfil.tsx`, `app/perfil-modal.tsx`
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

3. Testar contabilização de treino/esporte:
   - Contabilizar um treino em `Fichas` ou registar uma atividade em `Registar Atividade`.
   - Verificar toast aparece e, após ~2s, a tela volta.

4. Verificar ordem de fichas:
   - Vá para `Fichas` e `Gerir Fichas` — observe a ordem estável (alfabética por nome).

---

