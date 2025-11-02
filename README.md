# 📱 GymFlow — Diário de Treino, Nutrição e Suplementação

**Última Actualização:** 02 de Novembro de 2025
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

---

## Estrutura do projeto (resumo)

- `app/` — telas e rotas (Expo Router)
  - `perfil.tsx`, `perfil-modal.tsx` — perfil do utilizador
  - `fichas/` — telas de musculação e exercícios
  - `(tabs)/` — telas de navegação principal (Home, Esportes, Historico, etc.)
- `components/` — componentes reaproveitáveis (cards, modais, etc.)
- `constants/` — constantes da app (`metData.ts`, `colors.ts`, etc.)
- `data/` — base local de alimentos (`foodData.json`)
- `hooks/` — hooks customizados (`useWorkouts`, `useSports`, etc.)
- `utils/` — utilitários como `calorieCalculator.ts`

---

## Armazenamento de dados e chaves importantes

A aplicação guarda todos os dados no AsyncStorage. Principais chaves:

- `userProfile` — objeto com informações do utilizador (name, weight, height, birthDate, gender, activityLevel, targetWeight, goalDate)
- `foodHistory` — array de entradas alimentares. Cada item geralmente tem a forma:
  - `{ id, date: 'YYYY-MM-DD', mealType, description, data: { calories, protein, carbs, fat } }`
- `workoutHistory` — array de registos de treino. Estrutura típica:
  - `{ id, date: 'YYYY-MM-DD', category: 'Musculação'|'Natação'|..., details: { duration, calories, performance?, notes? } }`
- `supplements_history` — histórico/agenda de suplementos por data

OBS: Todas as datas são gravadas/consultadas no formato `YYYY-MM-DD` usando data local (não UTC) para evitar problemas de fuso horário.

---

## Resolução de problemas comuns

- Calorias de musculação aparecem como 0:
  - Verifique se existe `MET_DATA['Musculação']` (foi adicionada por padrão) e se o `userProfile.weight` está salvo (o cálculo usa o peso do perfil). Se o peso for 0 ou indefinido, o resultado será 0.

- Entradas aparecem no dia seguinte (problema de fuso horário):
  - O app grava datas no formato `YYYY-MM-DD` usando componentes de data locais. Contudo, se um dispositivo alterar o timezone ou se houver gravação usando `toISOString()` em algum fluxo, pode empurrar a data para o dia seguinte em fusos como Brasilia. Caso encontre esse comportamento, verifique os arquivos que usam `toISOString()` (ex.: `perfil-modal.tsx` salva `birthDate` e `goalDate` usando `toISOString()` — isso é intencional para campos que precisam do timestamp; para registros por dia usamos a função `getLocalDateString`).

- Spinner infinito na tela de Perfil:
  - Se não houver `userProfile` salvo, a tela de perfil agora mostra um botão "Criar Perfil" em vez de ficar em loading.

---

## Desenvolvimento e contribuições

- Recomenda-se criar uma branch por feature: `git checkout -b feat/nome-da-feature`
- Mantenha as alterações pequenas e escreva mensagens de commit descritivas
- Para contribuir:
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

---

## Roadmap & melhorias futuras

- Sincronização na nuvem (Firebase / Sync service)
- Autenticação multi-usuário
- Export / Import de dados (JSON / CSV)
- Melhoria de UX no registo de refeições (interpretação de porções mais avançada)
- Centralizar utilitários de data em `utils/date.ts` para garantir consistência

---

Se quiser, eu posso:
- Rodar o linter/TypeScript localmente e reportar erros
- Centralizar a função `getLocalDateString` em `utils/date.ts` e atualizar os usos
- Adicionar uma pequena seção de exemplos de payload (JSON) no README

Obrigado — diga o que quer que eu faça a seguir.
