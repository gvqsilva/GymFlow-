# Sistema de Seleção de Exercícios - GymFlow

Este documento explica como usar o sistema de seleção de exercícios implementado no app GymFlow.

## Componentes Criados

### 1. `constants/exercisesData.ts`
- **Propósito**: Armazena catálogo local de exercícios organizados por grupo muscular
- **Estrutura**: 
  - 11 grupos: Quadríceps, Posterior, Glúteos, Peitoral, Costas, Bíceps, Tríceps, Ombros, Abdômen, Panturrilha
  - 74 exercícios total com nome em português, grupo muscular e videoUrl (GIF/WebP)
- **Funções utilitárias**:
  - `getAllExercises()` - retorna array plano de todos exercícios
  - `getExercisesByGroup(group)` - filtra exercícios por grupo
  - `getExerciseById(id)` - busca exercício específico

### 2. `components/ExerciseSelector.tsx`
- **Propósito**: Modal para navegar e selecionar exercícios do catálogo
- **Recursos**:
  - Busca por nome/grupo muscular
  - Filtros por grupo muscular (chips horizontais)
  - Lista com imagem, nome e grupo de cada exercício
  - Indicação visual de exercícios já selecionados
  - Previne seleção duplicada

### 3. `hooks/useWorkoutExercises.ts`
- **Propósito**: Hook para gerenciar exercícios em uma ficha de treino
- **Interface `WorkoutExercise`**: Estende `Exercise` com:
  - `series: number` - número de séries
  - `reps: string` - repetições (ex: "12-15", "até falha")
  - `obs: string` - observações do exercício
  - `order: number` - ordem na ficha
- **Métodos**:
  - `addExercise(exercise)` - adiciona com valores padrão (3 séries, 12 reps)
  - `updateExercise(id, updates)` - atualiza séries/reps/obs
  - `removeExercise(id)` - remove e reordena
  - `reorderExercises(exercises)` - para drag & drop
  - `getSelectedIds()` - lista IDs selecionados

### 4. `components/WorkoutExerciseItem.tsx`
- **Propósito**: Componente para exibir/editar exercício em uma ficha
- **Recursos**:
  - Header compacto com imagem, nome, grupo e resumo (3x12)
  - Expansível para editar séries, reps e observações
  - Botão de remoção com confirmação
  - Modo somente leitura (`canEdit={false}`)

### 5. `app/ficha-modal.tsx` (atualizado)
- **Integração completa**:
  - Formulário básico (nome da ficha, grupos)
  - Seção de exercícios com contador
  - Botão "Adicionar" que abre `ExerciseSelector`
  - Lista de exercícios selecionados (editáveis)
  - Estado vazio com mensagem motivacional
  - Validação: exige pelo menos 1 exercício

## Como Usar

### 1. Selecionando Exercícios em Nova Ficha
```typescript
// No ficha-modal.tsx
const {
  exercises,           // Lista de exercícios na ficha
  addExercise,        // Adiciona exercício do catálogo
  updateExercise,     // Atualiza séries/reps/obs
  removeExercise,     // Remove exercício
  getSelectedIds      // IDs dos selecionados
} = useWorkoutExercises();

// Ao selecionar exercício no modal
const handleSelectExercise = (exercise: Exercise) => {
  addExercise(exercise);  // Adiciona com 3 séries, 12 reps
  setShowExerciseSelector(false);
};
```

### 2. Editando Exercícios na Ficha
```typescript
// Usuário pode alterar séries, reps e observações
updateExercise('ex_0101', { 
  series: 4, 
  reps: '8-10', 
  obs: 'Carga progressiva' 
});
```

### 3. Salvando Ficha Completa
```typescript
// addWorkout foi atualizado para aceitar exercícios
await addWorkout(name, groups, exercises);
```

## Fluxo de Uso

1. **Usuário cria nova ficha**: Nome + grupos musculares
2. **Adiciona exercícios**: Toca "Adicionar" → abre seletor
3. **Navega catálogo**: Busca ou filtra por grupo
4. **Seleciona exercícios**: Toca no exercício desejado
5. **Personaliza detalhes**: Expande item para editar séries/reps/obs
6. **Salva ficha**: Validação exige pelo menos 1 exercício

## Extensões Futuras

- **Drag & Drop**: Reordenar exercícios na ficha
- **Templates**: Copiar exercícios de fichas existentes  
- **Favoritos**: Marcar exercícios mais usados
- **Histórico**: Sugerir exercícios baseado em fichas anteriores
- **Vídeos**: Substituir GIFs por vídeos locais em `assets/videos/`

## Estrutura de Dados

```typescript
// Exercício no catálogo
interface Exercise {
  id: string;           // "ex_0101"
  name: string;         // "Agachamento Livre"
  muscle: string;       // "Quadríceps"
  videoUrl: string;     // "/exercises-catalog/videos/ex_0101.gif"
}

// Exercício em uma ficha
interface WorkoutExercise extends Exercise {
  series: number;       // 3
  reps: string;         // "12"
  obs: string;          // ""
  order: number;        // 1
}
```

## Performance

- **Cache local**: Todos exercícios carregados na inicialização
- **Busca otimizada**: Filtros aplicados em tempo real
- **Lazy loading**: Imagens carregadas conforme necessário
- **Validação mínima**: Previne duplicatas, exige pelo menos 1 exercício

O sistema está pronto para uso e pode ser facilmente estendido conforme necessidades futuras!