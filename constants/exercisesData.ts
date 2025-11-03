// Catálogo de exercícios para seleção durante criação/edição de fichas
// Estrutura: agrupado por grupo muscular, cada exercício com id, name, muscle e videoUrl

export const exercisesData = {
  "version": "2025-11-03",
  "schemaVersion": 1,
  "updatedAt": "2025-11-03T00:00:00Z",
  "exercises": {
    "Quadríceps": [
      { "id": "ex_0101", "name": "Agachamento Livre", "muscle": "Quadríceps", "videoUrl": require("../assets/videos/ex_0101.gif") },
      { "id": "ex_0102", "name": "Agachamento Maquina", "muscle": "Quadríceps", "videoUrl": require("../assets/videos/ex_0102.gif") },
      { "id": "ex_0103", "name": "Agachamento no Hack", "muscle": "Quadríceps", "videoUrl": require("../assets/videos/ex_0103.gif") },
      { "id": "ex_0104", "name": "Agachamento Smith", "muscle": "Quadríceps", "videoUrl": require("../assets/videos/ex_0104.gif") },
      { "id": "ex_0105", "name": "Agachamento sumô", "muscle": "Quadríceps", "videoUrl": require("../assets/videos/ex_0105.gif") },
      { "id": "ex_0106", "name": "Leg Press Horizontal", "muscle": "Quadríceps", "videoUrl": require("../assets/videos/ex_0106.gif") },
      { "id": "ex_0107", "name": "Leg Press Horizontal Unilateral", "muscle": "Quadríceps", "videoUrl": require("../assets/videos/ex_0107.gif") },
      { "id": "ex_0108", "name": "Leg Press 45°", "muscle": "Quadríceps", "videoUrl": require("../assets/videos/ex_0108.gif") },
      { "id": "ex_0109", "name": "Afundo", "muscle": "Quadríceps", "videoUrl": require("../assets/videos/ex_0109.gif") },
      { "id": "ex_0110", "name": "Cadeira Extensora", "muscle": "Quadríceps", "videoUrl": require("../assets/videos/ex_0110.gif") },
      { "id": "ex_0111", "name": "Cadeira Extensora Unilateral", "muscle": "Quadríceps", "videoUrl": require("../assets/videos/ex_0111.gif") }
    ],
    "Posterior": [
      { "id": "ex_0112", "name": "Stiff", "muscle": "Posterior de Coxa", "videoUrl": require("../assets/videos/ex_0112.gif") },
      { "id": "ex_0113", "name": "Cadeira Flexora", "muscle": "Posterior de Coxa", "videoUrl": require("../assets/videos/ex_0113.gif") },
      { "id": "ex_0114", "name": "Mesa Flexora", "muscle": "Posterior de Coxa", "videoUrl": require("../assets/videos/ex_0114.gif") },
      { "id": "ex_0115", "name": "Mesa Flexora Unilateral", "muscle": "Posterior de Coxa", "videoUrl": require("../assets/videos/ex_0115.gif") }
    ],
    "Glúteos": [
      { "id": "ex_0116", "name": "Cadeira abdutora", "muscle": "Glúteo", "videoUrl": require("../assets/videos/ex_0116.gif") },
      { "id": "ex_0117", "name": "Cadeira adutora", "muscle": "Glúteo", "videoUrl": require("../assets/videos/ex_0117.gif") },
      { "id": "ex_0118", "name": "Elevação Pélvica", "muscle": "Glúteo", "videoUrl": require("../assets/videos/ex_0118.webp") }
    ],
    "Peitoral": [
      { "id": "ex_0201", "name": "Supino Reto com Barra", "muscle": "Peitoral", "videoUrl": require("../assets/videos/ex_0201.gif") },
      { "id": "ex_0202", "name": "Supino Inclinado com Halteres", "muscle": "Peitoral", "videoUrl": require("../assets/videos/ex_0202.gif") },
      { "id": "ex_0203", "name": "Supino Declinado", "muscle": "Peitoral", "videoUrl": require("../assets/videos/ex_0203.gif") },
      { "id": "ex_0204", "name": "Supino com Halteres", "muscle": "Peitoral", "videoUrl": require("../assets/videos/ex_0204.gif") },
      { "id": "ex_0205", "name": "Crossover", "muscle": "Peitoral", "videoUrl": require("../assets/videos/ex_0205.webp") },
      { "id": "ex_0206", "name": "Peck Deck (Fly)", "muscle": "Peitoral", "videoUrl": require("../assets/videos/ex_0206.gif") },
      { "id": "ex_0207", "name": "Flexão de Braço", "muscle": "Peitoral", "videoUrl": require("../assets/videos/ex_0207.gif") },
      { "id": "ex_0208", "name": "Fly com Halteres", "muscle": "Peitoral", "videoUrl": require("../assets/videos/ex_0208.gif") },
      { "id": "ex_0209", "name": "Pullover com Halter", "muscle": "Peitoral", "videoUrl": require("../assets/videos/ex_0209.gif") },
      { "id": "ex_0210", "name": "Mergulho Entre Paralelas", "muscle": "Peitoral", "videoUrl": require("../assets/videos/ex_0210.gif") },
      { "id": "ex_0211", "name": "Fly Inclinado no Cabo", "muscle": "Peitoral", "videoUrl": require("../assets/videos/ex_0211.gif") },
      { "id": "ex_0212", "name": "Supino Articulado Declinado", "muscle": "Peitoral", "videoUrl": require("../assets/videos/ex_0212.gif") },
      { "id": "ex_0213", "name": "Crucifixo Máquina", "muscle": "Peitoral", "videoUrl": require("../assets/videos/ex_0213.gif") },
      { "id": "ex_0214", "name": "Supino Máquina", "muscle": "Peitoral", "videoUrl": require("../assets/videos/ex_0214.gif") }
    ],
    "Costas": [
      { "id": "ex_0301", "name": "Puxada Frontal", "muscle": "Dorsal", "videoUrl": require("../assets/videos/ex_0301.gif") },
      { "id": "ex_0302", "name": "Barra Fixa", "muscle": "Dorsal", "videoUrl": require("../assets/videos/ex_0302.gif") },
      { "id": "ex_0303", "name": "Remada Curvada com Barra", "muscle": "Dorsal", "videoUrl": require("../assets/videos/ex_0303.gif") },
      { "id": "ex_0304", "name": "Remada Unilateral com Halter", "muscle": "Dorsal", "videoUrl": require("../assets/videos/ex_0304.gif") },
      { "id": "ex_0305", "name": "Remada Baixa no Cabo", "muscle": "Dorsal", "videoUrl": require("../assets/videos/ex_0305.gif") },
      { "id": "ex_0306", "name": "Puxada com Pegada Neutra", "muscle": "Dorsal", "videoUrl": require("../assets/videos/ex_0306.gif") },
      { "id": "ex_0307", "name": "Remada Cavalinho", "muscle": "Dorsal", "videoUrl": require("../assets/videos/ex_0307.gif") },
      { "id": "ex_0308", "name": "Pullover na Polia Alta", "muscle": "Dorsal", "videoUrl": require("../assets/videos/ex_0308.gif") },
      { "id": "ex_0309", "name": "Remada na Máquina", "muscle": "Dorsal", "videoUrl": require("../assets/videos/ex_0309.gif") },
      { "id": "ex_0310", "name": "Levantamento Terra", "muscle": "Dorsal", "videoUrl": require("../assets/videos/ex_0310.gif") },
      { "id": "ex_0311", "name": "Remada Seal", "muscle": "Dorsal", "videoUrl": require("../assets/videos/ex_0311.gif") },
      { "id": "ex_0312", "name": "Encolhimento de Ombros", "muscle": "Trapézio", "videoUrl": require("../assets/videos/ex_0312.gif") },
      { "id": "ex_0313", "name": "Remada Alta", "muscle": "Trapézio", "videoUrl": require("../assets/videos/ex_0313.gif") },
      { "id": "ex_0314", "name": "Crucifixo Invertido Máquina", "muscle": "Trapézio", "videoUrl": require("../assets/videos/ex_0314.gif") },
      { "id": "ex_0315", "name": "Face Pull", "muscle": "Trapézio", "videoUrl": require("../assets/videos/ex_0315.gif") },
      { "id": "ex_0316", "name": "Extensão Lombar 45°", "muscle": "Lombar", "videoUrl": require("../assets/videos/ex_0316.gif") }
    ],
    "Bíceps": [
      { "id": "ex_0401", "name": "Rosca Direta", "muscle": "Bíceps", "videoUrl": require("../assets/videos/ex_0401.gif") },
      { "id": "ex_0402", "name": "Rosca Direta Polia", "muscle": "Bíceps", "videoUrl": require("../assets/videos/ex_0402.gif") },
      { "id": "ex_0403", "name": "Rosca Alternada com Halteres", "muscle": "Bíceps", "videoUrl": require("../assets/videos/ex_0403.gif") },
      { "id": "ex_0404", "name": "Rosca Martelo", "muscle": "Bíceps", "videoUrl": require("../assets/videos/ex_0404.gif") },
      { "id": "ex_0405", "name": "Rosca Martelo Polia", "muscle": "Bíceps", "videoUrl": require("../assets/videos/ex_0405.gif") },
      { "id": "ex_0406", "name": "Rosca Inclinada com Halteres", "muscle": "Bíceps", "videoUrl": require("../assets/videos/ex_0406.gif") },
      { "id": "ex_0407", "name": "Rosca com Barra W", "muscle": "Bíceps", "videoUrl": require("../assets/videos/ex_0407.gif") },
      { "id": "ex_0408", "name": "Rosca no Banco Scott", "muscle": "Bíceps", "videoUrl": require("../assets/videos/ex_0408.gif") }
    ],
    "Tríceps": [
      { "id": "ex_0501", "name": "Tríceps na Polia com Corda", "muscle": "Tríceps", "videoUrl": require("../assets/videos/ex_0501.gif") },
      { "id": "ex_0502", "name": "Tríceps na Polia com Barra", "muscle": "Tríceps", "videoUrl": require("../assets/videos/ex_0502.gif") },
      { "id": "ex_0504", "name": "Tríceps Francês Polia", "muscle": "Tríceps", "videoUrl": require("../assets/videos/ex_0504.gif") },
      { "id": "ex_0503", "name": "Tríceps Francês Halter", "muscle": "Tríceps", "videoUrl": require("../assets/videos/ex_0503.gif") },
      { "id": "ex_0505", "name": "Tríceps Testa", "muscle": "Tríceps", "videoUrl": require("../assets/videos/ex_0505.gif") },
      { "id": "ex_0506", "name": "Tríceps Coice Polia", "muscle": "Tríceps", "videoUrl": require("../assets/videos/ex_0506.gif") },
      { "id": "ex_0507", "name": "Tríceps Invertido Polia", "muscle": "Tríceps", "videoUrl": require("../assets/videos/ex_0507.gif") }
    ],
    "Ombros": [
      { "id": "ex_0601", "name": "Elevação Lateral Polia", "muscle": "Ombros", "videoUrl": require("../assets/videos/ex_0601.gif") },
      { "id": "ex_0602", "name": "Elevação Lateral Halter", "muscle": "Ombros", "videoUrl": require("../assets/videos/ex_0602.webp") },
      { "id": "ex_0603", "name": "Elevação Lateral Maquina", "muscle": "Ombros", "videoUrl": require("../assets/videos/ex_0603.gif") },
      { "id": "ex_0604", "name": "Elevação Frontal Polia", "muscle": "Ombros", "videoUrl": require("../assets/videos/ex_0604.gif") },
      { "id": "ex_0605", "name": "Elevação Frontal Halter", "muscle": "Ombros", "videoUrl": require("../assets/videos/ex_0605.webp") },
      { "id": "ex_0606", "name": "Desenvolvimento Halter", "muscle": "Ombros", "videoUrl": require("../assets/videos/ex_0606.gif") },
      { "id": "ex_0607", "name": "Desenvolvimento Maquina", "muscle": "Ombros", "videoUrl": require("../assets/videos/ex_0607.gif") },
      { "id": "ex_0608", "name": "Desenvolvimento Arnold", "muscle": "Ombros", "videoUrl": require("../assets/videos/ex_0608.gif") }
    ],
    "Abdômen": [
      { "id": "ex_0701", "name": "Abdominal em V Maquina", "muscle": "Abdômen", "videoUrl": require("../assets/videos/ex_0701.gif") },
      { "id": "ex_0703", "name": "Abdominal Infra", "muscle": "Abdômen", "videoUrl": require("../assets/videos/ex_0703.gif") },
      { "id": "ex_0702", "name": "Abdominal Cruzado (Bicicleta)", "muscle": "Abdômen", "videoUrl": require("../assets/videos/ex_0702.gif") },
      { "id": "ex_0704", "name": "Prancha", "muscle": "Abdômen", "videoUrl": require("../assets/videos/ex_0704.gif") },
      { "id": "ex_0705", "name": "Giro Russo", "muscle": "Abdômen", "videoUrl": require("../assets/videos/ex_0705.gif") },
      { "id": "ex_0706", "name": "Abdominal Escalador", "muscle": "Abdômen", "videoUrl": require("../assets/videos/ex_0706.gif") },
      { "id": "ex_0707", "name": "Prancha Alternada", "muscle": "Abdômen", "videoUrl": require("../assets/videos/ex_0707.gif") }
    ],
    "Panturrilha": [
      { "id": "ex_0801", "name": "Gemeos em Pé no Step", "muscle": "Panturrilha", "videoUrl": require("../assets/videos/ex_0801.gif") },
      { "id": "ex_0802", "name": "Gemeos em Pé Maquina", "muscle": "Panturrilha", "videoUrl": require("../assets/videos/ex_0802.gif") },
      { "id": "ex_0803", "name": "Gemeos Sentado", "muscle": "Panturrilha", "videoUrl": require("../assets/videos/ex_0803.gif") },
      { "id": "ex_0804", "name": "Gemeos no Leg Press 45°", "muscle": "Panturrilha", "videoUrl": require("../assets/videos/ex_0804.gif") }
    ]
  }
};

// Tipos TypeScript para melhor type safety
export type ExerciseGroup = keyof typeof exercisesData.exercises;
export type Exercise = {
  id: string;
  name: string;
  muscle: string;
  videoUrl: any; // `require()` retorna any no React Native
};

// Função utilitária para obter todos os exercícios como array plano
export const getAllExercises = (): Exercise[] => {
  return Object.values(exercisesData.exercises).flat();
};

// Função utilitária para obter exercícios por grupo muscular
export const getExercisesByGroup = (group: ExerciseGroup): Exercise[] => {
  return exercisesData.exercises[group];
};

// Função utilitária para buscar exercício por ID
export const getExerciseById = (id: string): Exercise | undefined => {
  return getAllExercises().find(exercise => exercise.id === id);
};