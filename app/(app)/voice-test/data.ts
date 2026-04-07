export interface VoiceOption {
  id: string;
  name: string;
  label: string;
  gender: 'Feminina' | 'Masculina';
  type: string;
  current?: boolean;
}

export const FRENCH_VOICES: VoiceOption[] = [
  // Studio
  { id: 'fr-FR-Studio-A', name: 'fr-FR-Studio-A', label: 'Studio-A', gender: 'Feminina', type: 'Studio' },
  { id: 'fr-FR-Studio-D', name: 'fr-FR-Studio-D', label: 'Studio-D', gender: 'Masculina', type: 'Studio' },

  // Chirp-HD
  { id: 'fr-FR-Chirp-HD-D', name: 'fr-FR-Chirp-HD-D', label: 'Chirp-HD-D', gender: 'Masculina', type: 'Chirp-HD' },
  { id: 'fr-FR-Chirp-HD-F', name: 'fr-FR-Chirp-HD-F', label: 'Chirp-HD-F', gender: 'Feminina', type: 'Chirp-HD' },
  { id: 'fr-FR-Chirp-HD-O', name: 'fr-FR-Chirp-HD-O', label: 'Chirp-HD-O', gender: 'Feminina', type: 'Chirp-HD' },

  // Chirp3-HD — Female
  { id: 'fr-FR-Chirp3-HD-Achernar', name: 'fr-FR-Chirp3-HD-Achernar', label: 'Achernar', gender: 'Feminina', type: 'Chirp3-HD' },
  { id: 'fr-FR-Chirp3-HD-Aoede', name: 'fr-FR-Chirp3-HD-Aoede', label: 'Aoede', gender: 'Feminina', type: 'Chirp3-HD' },
  { id: 'fr-FR-Chirp3-HD-Autonoe', name: 'fr-FR-Chirp3-HD-Autonoe', label: 'Autonoe', gender: 'Feminina', type: 'Chirp3-HD' },
  { id: 'fr-FR-Chirp3-HD-Callirrhoe', name: 'fr-FR-Chirp3-HD-Callirrhoe', label: 'Callirrhoe', gender: 'Feminina', type: 'Chirp3-HD' },
  { id: 'fr-FR-Chirp3-HD-Despina', name: 'fr-FR-Chirp3-HD-Despina', label: 'Despina', gender: 'Feminina', type: 'Chirp3-HD' },
  { id: 'fr-FR-Chirp3-HD-Erinome', name: 'fr-FR-Chirp3-HD-Erinome', label: 'Erinome', gender: 'Feminina', type: 'Chirp3-HD' },
  { id: 'fr-FR-Chirp3-HD-Gacrux', name: 'fr-FR-Chirp3-HD-Gacrux', label: 'Gacrux', gender: 'Feminina', type: 'Chirp3-HD' },
  { id: 'fr-FR-Chirp3-HD-Kore', name: 'fr-FR-Chirp3-HD-Kore', label: 'Kore', gender: 'Feminina', type: 'Chirp3-HD' },
  { id: 'fr-FR-Chirp3-HD-Laomedeia', name: 'fr-FR-Chirp3-HD-Laomedeia', label: 'Laomedeia', gender: 'Feminina', type: 'Chirp3-HD' },
  { id: 'fr-FR-Chirp3-HD-Leda', name: 'fr-FR-Chirp3-HD-Leda', label: 'Leda', gender: 'Feminina', type: 'Chirp3-HD' },
  { id: 'fr-FR-Chirp3-HD-Pulcherrima', name: 'fr-FR-Chirp3-HD-Pulcherrima', label: 'Pulcherrima', gender: 'Feminina', type: 'Chirp3-HD' },
  { id: 'fr-FR-Chirp3-HD-Sulafat', name: 'fr-FR-Chirp3-HD-Sulafat', label: 'Sulafat', gender: 'Feminina', type: 'Chirp3-HD' },
  { id: 'fr-FR-Chirp3-HD-Vindemiatrix', name: 'fr-FR-Chirp3-HD-Vindemiatrix', label: 'Vindemiatrix', gender: 'Feminina', type: 'Chirp3-HD' },
  { id: 'fr-FR-Chirp3-HD-Zephyr', name: 'fr-FR-Chirp3-HD-Zephyr', label: 'Zephyr', gender: 'Feminina', type: 'Chirp3-HD' },

  // Chirp3-HD — Male
  { id: 'fr-FR-Chirp3-HD-Achird', name: 'fr-FR-Chirp3-HD-Achird', label: 'Achird', gender: 'Masculina', type: 'Chirp3-HD' },
  { id: 'fr-FR-Chirp3-HD-Algenib', name: 'fr-FR-Chirp3-HD-Algenib', label: 'Algenib', gender: 'Masculina', type: 'Chirp3-HD' },
  { id: 'fr-FR-Chirp3-HD-Algieba', name: 'fr-FR-Chirp3-HD-Algieba', label: 'Algieba', gender: 'Masculina', type: 'Chirp3-HD' },
  { id: 'fr-FR-Chirp3-HD-Alnilam', name: 'fr-FR-Chirp3-HD-Alnilam', label: 'Alnilam', gender: 'Masculina', type: 'Chirp3-HD' },
  { id: 'fr-FR-Chirp3-HD-Charon', name: 'fr-FR-Chirp3-HD-Charon', label: 'Charon', gender: 'Masculina', type: 'Chirp3-HD' },
  { id: 'fr-FR-Chirp3-HD-Enceladus', name: 'fr-FR-Chirp3-HD-Enceladus', label: 'Enceladus', gender: 'Masculina', type: 'Chirp3-HD' },
  { id: 'fr-FR-Chirp3-HD-Fenrir', name: 'fr-FR-Chirp3-HD-Fenrir', label: 'Fenrir', gender: 'Masculina', type: 'Chirp3-HD' },
  { id: 'fr-FR-Chirp3-HD-Iapetus', name: 'fr-FR-Chirp3-HD-Iapetus', label: 'Iapetus', gender: 'Masculina', type: 'Chirp3-HD' },
  { id: 'fr-FR-Chirp3-HD-Orus', name: 'fr-FR-Chirp3-HD-Orus', label: 'Orus', gender: 'Masculina', type: 'Chirp3-HD' },
  { id: 'fr-FR-Chirp3-HD-Puck', name: 'fr-FR-Chirp3-HD-Puck', label: 'Puck', gender: 'Masculina', type: 'Chirp3-HD' },
  { id: 'fr-FR-Chirp3-HD-Rasalgethi', name: 'fr-FR-Chirp3-HD-Rasalgethi', label: 'Rasalgethi', gender: 'Masculina', type: 'Chirp3-HD' },
  { id: 'fr-FR-Chirp3-HD-Sadachbia', name: 'fr-FR-Chirp3-HD-Sadachbia', label: 'Sadachbia', gender: 'Masculina', type: 'Chirp3-HD' },
  { id: 'fr-FR-Chirp3-HD-Sadaltager', name: 'fr-FR-Chirp3-HD-Sadaltager', label: 'Sadaltager', gender: 'Masculina', type: 'Chirp3-HD' },
  { id: 'fr-FR-Chirp3-HD-Schedar', name: 'fr-FR-Chirp3-HD-Schedar', label: 'Schedar', gender: 'Masculina', type: 'Chirp3-HD' },
  { id: 'fr-FR-Chirp3-HD-Umbriel', name: 'fr-FR-Chirp3-HD-Umbriel', label: 'Umbriel', gender: 'Masculina', type: 'Chirp3-HD' },
  { id: 'fr-FR-Chirp3-HD-Zubenelgenubi', name: 'fr-FR-Chirp3-HD-Zubenelgenubi', label: 'Zubenelgenubi', gender: 'Masculina', type: 'Chirp3-HD' },
];

export const SAMPLE_TEXTS = [
  { label: 'Saudacao', text: 'Bonjour ! Comment allez-vous aujourd\'hui ?' },
  { label: 'Pedido', text: 'Je voudrais un croissant et un cafe, s\'il vous plait.' },
  { label: 'Frase longa', text: 'La vie est belle quand on prend le temps de regarder autour de soi et d\'apprecier les petits moments.' },
  { label: 'Pergunta', text: 'Est-ce que vous pourriez me dire ou se trouve la gare, s\'il vous plait ?' },
];

export const DIALOGUE_LINES = [
  { speaker: 'Marie', text: 'Bonjour ! Vous avez choisi ?' },
  { speaker: 'Pierre', text: 'Oui, je voudrais un croissant et un cafe, s\'il vous plait.' },
  { speaker: 'Marie', text: 'Un cafe creme ou un cafe noir ?' },
  { speaker: 'Pierre', text: 'Un cafe creme, avec un peu de sucre.' },
  { speaker: 'Marie', text: 'Tres bien ! Et pour le croissant, nature ou au beurre ?' },
  { speaker: 'Pierre', text: 'Au beurre, bien sur ! C\'est toujours meilleur.' },
  { speaker: 'Marie', text: 'Excellent choix ! Ce sera tout ?' },
  { speaker: 'Pierre', text: 'Oui, merci beaucoup. L\'addition, s\'il vous plait.' },
];
