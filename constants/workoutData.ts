// constants/workoutData.ts

export interface Exercise {
  id: string;
  name: string;
  muscle: string;
  series: number;
  reps: string;
  obs: string;
  // gifUrl removido - usará automaticamente os GIFs do exercisesData
}

export interface Workout {
  id: string;
  name: string;
  groups: string;
  exercises: Exercise[];
}

export const WORKOUT_DATA: Record<string, Workout> = {
  A: {
    id: 'A',
    name: 'Treino A',
    groups: 'Peito/Ombro/Tríceps ',
    exercises: [
      {
        id: 'ex_0202',
        name: 'Supino Inclinado com Halteres',
        muscle: 'Peitoral',
        series: 4,
        reps: '12/10/10/8',
        obs: 'Banco 45°',
      },
      {
        id: 'ex_0204',
        name: 'Supino com Halteres',
        muscle: 'Peitoral',
        series: 3,
        reps: '12/10/8',
        obs: 'Banco 30°',
      },
      {
        id: 'ex_0212',
        name: 'Supino Articulado Declinado',
        muscle: 'Peitoral',
        series: 4,
        reps: '12/10/10/8',
        obs: '',
      },
      {
        id: 'ex_0213',
        name: 'Crucifixo Máquina',
        muscle: 'Peitoral',
        series: 3,
        reps: '12/10/8',
        obs: '',
      },
       {
        id: 'ex_0607',
        name: 'Desenvolvimento Maquina',
        muscle: 'Ombros',
        series: 4,
        reps: '12/10/10/8',
        obs: '',
      },
      {
        id: 'ex_0602',
        name: 'Elevação Lateral Halter',
        muscle: 'Ombros',
        series: 3,
        reps: '12/10/8',
        obs: '',
      },
      {
        id: 'ex_0505',
        name: 'Tríceps Testa',
        muscle: 'Tríceps',
        series: 3,
        reps: '12/10/8',
        obs: 'Barra W',
      },
      {
        id: 'ex_0503',
        name: 'Tríceps Francês Halter',
        muscle: 'Tríceps',
        series: 3,
        reps: '12/10/8',
        obs: '',
      },
    ],
  },
  B: {
    id: 'B',
    name: 'Treino B',
    groups: 'Costas/Bíceps ',
    exercises: [
       {
        id: 'ex_0301',
        name: 'Puxada Frontal',
        muscle: 'Dorsal',
        series: 4,
        reps: '12/10/8/6',
        obs: 'Mapfit 1',
      },
      {
        id: 'ex_0304',
        name: 'Remada Unilateral com Halter',
        muscle: 'Dorsal',
        series: 4,
        reps: '12/10/8/6',
        obs: '"Serrote"',
      },
      {
        id: 'ex_0309',
        name: 'Remada na Máquina',
        muscle: 'Dorsal',
        series: 3,
        reps: '12/10/8',
        obs: '',
      },
      {
        id: 'ex_0316',
        name: 'Extensão Lombar 45°',
        muscle: 'Lombar',
        series: 3,
        reps: '12/10/8',
        obs: '',
      },
      {
        id: 'ex_0313',
        name: 'Remada Alta',
        muscle: 'Trapézio',
        series: 4,
        reps: '12/10/10/8',
        obs: '',
      },
      {
        id: 'ex_0403',
        name: 'Rosca Alternada com Halteres',
        muscle: 'Bíceps',
        series: 3,
        reps: '12/10/8',
        obs: 'Banco 45°',
      },
      {
        id: 'ex_0404',
        name: 'Rosca Martelo',
        muscle: 'Bíceps',
        series: 3,
        reps: '12/10/8',
        obs: 'Cross Corda',
      },
    ],
  },
  C: {
    id: 'C',
    name: 'Treino C',
    groups: 'Perna completo ',
    exercises: [
      {
        id: 'ex_0802',
        name: 'Gemeos em Pé Maquina',
        muscle: 'Panturrilha',
        series: 4,
        reps: '12/10/10/8',
        obs: 'Maquina',
      },
      {
        id: 'ex_0104',
        name: 'Agachamento Smith',
        muscle: 'Quadríceps',
        series: 4,
        reps: '12/10/10/8',
        obs: '',
      },
      {
        id: 'ex_0106',
        name: 'Leg Press Horizontal',
        muscle: 'Quadríceps',
        series: 3,
        reps: '8',
        obs: 'Unilateral',
      },
      {
        id: 'ex_0110',
        name: 'Cadeira Extensora',
        muscle: 'Quadríceps',
        series: 4,
        reps: '11/10/8/6',
        obs: '',
      },
      {
        id: 'ex_0114',
        name: 'Mesa Flexora',
        muscle: 'Posterior de Coxa',
        series: 3,
        reps: '12/10/8',
        obs: '',
      },
      {
        id: 'ex_0113',
        name: 'Cadeira Flexora',
        muscle: 'Posterior de Coxa',
        series: 4,
        reps: '12/10/8/6',
        obs: '',
      },
      {
        id: 'ex_0116',
        name: 'Cadeira abdutora',
        muscle: 'Glúteo',
        series: 4,
        reps: '12/10/10/8',
        obs: '',
      },
      {
        id: 'ex_0117',
        name: 'Cadeira adutora',
        muscle: 'Glúteo',
        series: 4,
        reps: '12/10/10/8',
        obs: '',
      },
    ],
  },
};