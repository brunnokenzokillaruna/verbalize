import type { RoleplayScenario } from './types';

export const ROLEPLAY_SCENARIOS: RoleplayScenario[] = [
  {
    id: 'cafe',
    titlePt: 'No café',
    descriptionPt: 'Peça algo para beber e conversar com o barista.',
    characterName: 'Alex',
    characterRolePt: 'barista simpático',
    settingPt: 'um café movimentado no centro',
    openingHint: 'Greet the customer and ask what they would like.',
    levels: ['A1', 'A2', 'B1', 'B2'],
  },
  {
    id: 'hotel',
    titlePt: 'Recepção do hotel',
    descriptionPt: 'Faça check-in e tire dúvidas sobre o quarto.',
    characterName: 'Sam',
    characterRolePt: 'recepcionista do hotel',
    settingPt: 'a recepção de um hotel boutique',
    openingHint: 'Welcome the guest and offer to help with check-in.',
    levels: ['A1', 'A2', 'B1', 'B2', 'C1'],
  },
  {
    id: 'job-interview',
    titlePt: 'Entrevista de emprego',
    descriptionPt: 'Responda perguntas de uma entrevista casual.',
    characterName: 'Jordan',
    characterRolePt: 'entrevistador(a) de RH',
    settingPt: 'uma entrevista de emprego por vídeo',
    openingHint: 'Thank them for joining and ask them to introduce themselves briefly.',
    levels: ['A2', 'B1', 'B2', 'C1', 'C2'],
  },
  {
    id: 'doctor',
    titlePt: 'Consulta médica',
    descriptionPt: 'Descreva sintomas e entenda as orientações.',
    characterName: 'Dr. Lee',
    characterRolePt: 'médico(a) paciente',
    settingPt: 'um consultório médico',
    openingHint: 'Ask how they are feeling today and what brings them in.',
    levels: ['A2', 'B1', 'B2', 'C1'],
  },
  {
    id: 'friend-catchup',
    titlePt: 'Encontro com amigo',
    descriptionPt: 'Converse sobre o fim de semana e planos.',
    characterName: 'Mia',
    characterRolePt: 'amigo(a) próximo(a)',
    settingPt: 'um parque num fim de tarde',
    openingHint: 'Greet them warmly and ask what they have been up to.',
    levels: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'],
  },
  {
    id: 'travel-help',
    titlePt: 'Pedindo informações',
    descriptionPt: 'Peça direções e dicas turísticas na rua.',
    characterName: 'Chris',
    characterRolePt: 'morador(a) local prestativo(a)',
    settingPt: 'uma praça turística movimentada',
    openingHint: 'Notice they look a bit lost and offer friendly help.',
    levels: ['A1', 'A2', 'B1', 'B2'],
  },
];

export function getScenarioById(id: string): RoleplayScenario | undefined {
  return ROLEPLAY_SCENARIOS.find((s) => s.id === id);
}
