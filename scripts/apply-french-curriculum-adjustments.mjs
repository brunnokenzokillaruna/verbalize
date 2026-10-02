/**
 * One-shot French curriculum adjustment.
 * Keeps every existing lesson id and the relative order of those ids.
 * New lessons are inserted with fresh ids (901+). Re-running is a no-op
 * once fr-a1-901 exists.
 *
 * Run: node scripts/apply-french-curriculum-adjustments.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

// Register a tiny TS loader via tsx if available by spawning is unnecessary:
// the curriculum file is JSON-like. Parse it by evaluating the array.
const srcPath = path.join(root, 'lib', 'curriculum', 'french.ts');
const raw = fs.readFileSync(srcPath, 'utf8');
if (raw.includes('"id": "fr-a1-901"')) {
  console.log('Already applied (fr-a1-901 present). Nothing to do.');
  process.exit(0);
}

const arrayStart = raw.indexOf('export const FRENCH_LESSONS');
const bracket = raw.indexOf('= [', arrayStart) + 2;
const arrayEnd = raw.lastIndexOf(']');
const lessons = JSON.parse(raw.slice(bracket, arrayEnd + 1));
const originalIds = lessons.map((l) => l.id);

const THEME_RENAME = {
  'Tema 6: Passeando e Explorando': 'Tema 6: Passeio, família e o que é meu',
  'Tema 7: Novas Amizades e A Família': 'Tema 7: Pedidos, gentilezas e novos contatos',
  'Tema 13: Clima, Natureza e Passeios': 'Tema 13: Situações do dia a dia',
  'Tema 18: Sonhos, Hipóteses e O Futuro': 'Tema 18: Situações, gramática e redação',
};

const THEME_BY_ID = {
  'fr-a2-186': 'Tema 9: Minha Casa, Minha Rotina',
  'fr-a2-187': 'Tema 9: Minha Casa, Minha Rotina',
  'fr-a2-188': 'Tema 14: Rotina do Escritório e da Cidade',
  'fr-a2-189': 'Tema 15: Saúde e Farmácia',
  'fr-a2-203': 'Tema 14: Banco e documentos',
  'fr-a2-211': 'Ponte A2 > B1: Descrição e passado',
  'fr-a2-212': 'Ponte A2 > B1: Descrição e passado',
  'fr-a2-213': 'Ponte A2 > B1: Descrição e passado',
};

/** In-place focus changes. Id stays. Tag may change so the path icon matches the new job. */
const CONTENT_BY_ID = {
  'fr-a2-205': {
    tag: 'VERB',
    uiTitle: 'O Remédio na Dose Certa',
    grammarFocus: 'Prendre um medicamento: dose e horário',
  },
  'fr-b1-276': {
    tag: 'GRAM',
    uiTitle: 'O que Foi Dito na Reunião',
    grammarFocus: "Reportar o que disseram: dire que, on m'a dit que",
  },
  'fr-b1-279': {
    tag: 'DIAL',
    uiTitle: 'O E-mail Profissional',
    grammarFocus: 'E-mail profissional: assunto, pedido e fechamento',
  },
  'fr-b1-281': {
    tag: 'DIAL',
    uiTitle: 'Lendo o Anúncio',
    grammarFocus: 'Ler um anúncio de emprego ou uma mensagem de trabalho',
  },
  'fr-b1-283': {
    tag: 'DIAL',
    uiTitle: 'Respondendo ao Recrutador',
    grammarFocus: 'Responder numa entrevista: trajetória e exemplo concreto',
  },
  'fr-b1-284': {
    tag: 'DIAL',
    uiTitle: 'O que Eu Faço no Trabalho',
    grammarFocus: 'Falar do que você faz no trabalho',
  },
  'fr-b1-285': {
    tag: 'DIAL',
    uiTitle: 'Marcando a Próxima Etapa',
    grammarFocus: 'Marcar um horário e aceitar uma proposta',
  },
  'fr-b1-286': {
    tag: 'GRAM',
    uiTitle: 'Colocando a Tarefa de Pé',
    grammarFocus: 'Organizar uma tarefa: mettre en place e prazo',
  },
  'fr-b1-288': {
    tag: 'DIAL',
    uiTitle: 'O que Eu Quero no Cargo',
    grammarFocus: 'Dizer o que você quer no cargo',
  },
  'fr-b1-289': {
    tag: 'DIAL',
    uiTitle: 'O que Dá para Fazer',
    grammarFocus: 'Negociar o que é possível: je peux e je ne peux pas',
  },
  'fr-b1-291': {
    tag: 'GRAM',
    uiTitle: 'A Obrigação do Trabalho',
    grammarFocus: 'Obrigação no trabalho: il faut e devoir',
  },
  'fr-b1-292': {
    tag: 'DIAL',
    uiTitle: 'O que Você Sabe Fazer',
    grammarFocus: 'Savoir numa conversa: o que você sabe fazer',
  },
  'fr-b1-295': {
    tag: 'DIAL',
    uiTitle: 'Reagindo ao Comentário',
    grammarFocus: 'Reagir a um comentário: je crois que',
  },
  'fr-b1-298': {
    tag: 'DIAL',
    uiTitle: 'Gente e Lugar que Você Conhece',
    grammarFocus: 'Connaître numa conversa: pessoas e lugares',
  },
  'fr-b1-302': {
    tag: 'EXPR',
    uiTitle: 'Reações na Rede',
    grammarFocus: 'Reagir numa rede: plaire, servir e rire',
  },
  'fr-b1-303': {
    tag: 'GRAM',
    uiTitle: 'Na Minha Opinião',
    grammarFocus: 'Dar opinião: à mon avis e je trouve que',
  },
  'fr-b1-304': {
    tag: 'GRAM',
    uiTitle: 'Eu Acho que Não',
    grammarFocus: 'Dar opinião: je pense que e je ne pense pas que',
  },
  'fr-b1-305': {
    tag: 'GRAM',
    uiTitle: 'De Onde Veio a Notícia',
    grammarFocus: 'Contar de onde veio a ideia ou a notícia',
  },
  'fr-b1-306': {
    tag: 'GRAM',
    uiTitle: 'Sair, Partir ou Deixar',
    grammarFocus: 'Usar sortir, partir, quitter e laisser numa saída',
  },
  'fr-b1-307': {
    tag: 'VERB',
    uiTitle: 'O Plano da Semana',
    grammarFocus: 'Contar um plano com o futuro próximo',
  },
  'fr-b1-308': {
    tag: 'DIAL',
    uiTitle: 'O Imprevisto',
    grammarFocus: 'Contar um imprevisto no passado recente',
  },
  'fr-c1-387': {
    tag: 'VERB',
    uiTitle: 'Formas que Só se Reconhece',
    grammarFocus:
      'Reconhecimento literário: subjuntivo imperfeito, plus-que-parfait do subjuntivo, segunda forma do condicional e verbos arcaicos',
  },
  'fr-c1-392': {
    tag: 'DIAL',
    uiTitle: 'A Reunião Formal',
    grammarFocus: 'Reunião formal: abrir, discordar e fechar',
  },
  'fr-c1-395': {
    tag: 'CULT',
    uiTitle: 'A Manchete do Dia',
    grammarFocus: 'Leitura de imprensa: manchete, fato e viés',
  },
  'fr-c2-419': {
    tag: 'CULT',
    uiTitle: 'Comentário de uma Cena',
    grammarFocus: 'Comentário oral de uma cena literária',
  },
};

function makeLesson(spec) {
  return {
    id: spec.id,
    language: 'fr',
    level: spec.level,
    tag: spec.tag,
    uiTitle: spec.uiTitle,
    grammarFocus: spec.grammarFocus,
    theme: spec.theme,
  };
}

const NEW_LESSONS = [
  {
    id: 'fr-a1-901',
    insertAfterId: 'fr-a1-009',
    level: 'A1',
    tag: 'PRON',
    uiTitle: 'Tu ou Tout',
    grammarFocus: 'Pronúncia: u fechado versus ou (tu / tout)',
  },
  {
    id: 'fr-a1-902',
    insertAfterId: 'fr-a1-901',
    level: 'A1',
    tag: 'PRON',
    uiTitle: 'Feu, Soeur e o E que Some',
    grammarFocus: 'Pronúncia: eu, œu e o e mudo',
  },
  {
    id: 'fr-a1-903',
    insertAfterId: 'fr-a1-016',
    level: 'A1',
    tag: 'VOC',
    uiTitle: 'Metrô ou Ônibus',
    grammarFocus: 'Metrô e ônibus em Paris: linha, estação e baldeação',
  },
  {
    id: 'fr-a1-904',
    insertAfterId: 'fr-a1-021',
    level: 'A1',
    tag: 'VERB',
    uiTitle: 'O que Você Vai Fazer',
    grammarFocus: 'Futuro próximo: aller + infinitivo',
  },
  {
    id: 'fr-a1-905',
    insertAfterId: 'fr-a1-904',
    level: 'A1',
    tag: 'VERB',
    uiTitle: 'Eu Posso',
    grammarFocus: 'Pouvoir no presente: je peux e je ne peux pas',
  },
  {
    id: 'fr-a1-906',
    insertAfterId: 'fr-a1-905',
    level: 'A1',
    tag: 'DIAL',
    uiTitle: 'Eu Gostaria',
    grammarFocus: 'Pedido educado: je voudrais',
  },
  {
    id: 'fr-a1-907',
    insertAfterId: 'fr-a1-046',
    level: 'A1',
    tag: 'GRAM',
    uiTitle: 'Um Café ou Café',
    grammarFocus: 'No café: un café ou du café (partitivos de uso)',
  },
  {
    id: 'fr-a1-908',
    insertAfterId: 'fr-a1-071',
    level: 'A1',
    tag: 'GRAM',
    uiTitle: 'Ao Lado e na Frente',
    grammarFocus: 'Preposições de lugar: chez, à côté de, en face de',
  },
  {
    id: 'fr-a1-909',
    insertAfterId: 'fr-a1-908',
    level: 'A1',
    tag: 'VOC',
    uiTitle: 'De Que País',
    grammarFocus: 'Países e nacionalidades: en France, au Brésil, aux États-Unis',
  },
  {
    id: 'fr-a1-910',
    insertAfterId: 'fr-a1-081',
    level: 'A1',
    tag: 'GRAM',
    uiTitle: 'O Meu, a Minha',
    grammarFocus: 'Possessivos da primeira pessoa: mon, ma, mes',
  },
  {
    id: 'fr-a1-911',
    insertAfterId: 'fr-a1-910',
    level: 'A1',
    tag: 'GRAM',
    uiTitle: 'Este e Esta',
    grammarFocus: 'Demonstrativos: ce, cet, cette, ces',
  },
  {
    id: 'fr-a2-912',
    insertAfterId: 'fr-a2-127',
    level: 'A2',
    tag: 'GRAM',
    uiTitle: 'Já Estou Lá',
    grammarFocus: "Pronome y: j'y vais e il y a",
  },
  {
    id: 'fr-a2-913',
    insertAfterId: 'fr-a2-134',
    level: 'A2',
    tag: 'GRAM',
    uiTitle: 'É Isso ou Ele É',
    grammarFocus: "C'est versus il est no uso do dia a dia",
  },
  {
    id: 'fr-a2-914',
    insertAfterId: 'fr-a2-176',
    level: 'A2',
    tag: 'VERB',
    uiTitle: 'Eu Peço',
    grammarFocus: 'Prendre para pedir: je prends no restaurante',
  },
  {
    id: 'fr-a2-915',
    insertAfterId: 'fr-a2-174',
    level: 'A2',
    tag: 'VOC',
    uiTitle: 'Que Tempo Faz',
    grammarFocus: 'Clima: quel temps fait-il e o vocabulário do tempo',
  },
  {
    id: 'fr-a2-916',
    insertAfterId: 'fr-a2-196',
    level: 'A2',
    tag: 'DIAL',
    uiTitle: 'Ligo de Volta',
    grammarFocus: 'Telefone e mensagem curta: marcar, desmarcar e rappeler',
  },
  {
    id: 'fr-b1-917',
    insertAfterId: 'fr-b1-243',
    level: 'B1',
    tag: 'VOC',
    uiTitle: 'Palavras que Parecem Iguais',
    grammarFocus:
      'Falsos amigos com o português: actuellement, demander, attendre, assister, sensible',
  },
  {
    id: 'fr-b1-918',
    insertAfterId: 'fr-b1-293',
    level: 'B1',
    tag: 'GRAM',
    uiTitle: 'Eu Acho que',
    grammarFocus: 'Dar opinião antes do subjuntivo: je trouve que, à mon avis, je pense que',
  },
  {
    id: 'fr-b1-919',
    insertAfterId: 'fr-b1-309',
    level: 'B1',
    tag: 'VERB',
    uiTitle: 'Vou Fazer Isso',
    grammarFocus: 'Futuro próximo na vida real: o que você vai fazer',
  },
  {
    id: 'fr-b2-920',
    insertAfterId: 'fr-b2-340',
    level: 'B2',
    tag: 'GRAM',
    uiTitle: 'Por Outro Lado',
    grammarFocus: 'Conectores de oposição: cependant, en revanche, toutefois, néanmoins',
  },
];

const reviewBefore = new Map(
  lessons.filter((l) => l.tag === 'REVIEW').map((l) => [l.id, l.grammarFocus]),
);

for (const lesson of lessons) {
  if (THEME_RENAME[lesson.theme]) lesson.theme = THEME_RENAME[lesson.theme];
  if (THEME_BY_ID[lesson.id]) lesson.theme = THEME_BY_ID[lesson.id];
  const content = CONTENT_BY_ID[lesson.id];
  if (!content) continue;
  if (lesson.tag === 'REVIEW') throw new Error(`Refusing to rewrite checkpoint ${lesson.id}`);
  lesson.tag = content.tag;
  lesson.uiTitle = content.uiTitle;
  lesson.grammarFocus = content.grammarFocus;
}

const byId = new Map(lessons.map((l) => [l.id, l]));
const pending = [...NEW_LESSONS];
let guard = 0;
while (pending.length) {
  guard += 1;
  if (guard > 50) throw new Error('Could not place new lessons: ' + pending.map((l) => l.id).join(','));
  const still = [];
  for (const spec of pending) {
    const anchor = byId.get(spec.insertAfterId);
    if (!anchor) {
      still.push(spec);
      continue;
    }
    const lesson = makeLesson({ ...spec, theme: anchor.theme });
    const index = lessons.findIndex((l) => l.id === spec.insertAfterId);
    lessons.splice(index + 1, 0, lesson);
    byId.set(lesson.id, lesson);
  }
  if (still.length === pending.length) {
    throw new Error('Anchor missing for ' + still.map((l) => `${l.id}->${l.insertAfterId}`).join(', '));
  }
  pending.length = 0;
  pending.push(...still);
}

// ── Safety checks ────────────────────────────────────────────────────────────
const ids = lessons.map((l) => l.id);
if (new Set(ids).size !== ids.length) throw new Error('Duplicate lesson ids');

const kept = ids.filter((id) => originalIds.includes(id));
if (kept.join('|') !== originalIds.join('|')) {
  throw new Error('Relative order of existing lesson ids changed');
}

const idRe = /^fr-(a1|a2|b1|b2|c1|c2)-\d{3}$/;
for (const lesson of lessons) {
  if (!idRe.test(lesson.id)) throw new Error('Bad id ' + lesson.id);
  if (lesson.language !== 'fr') throw new Error('Bad language ' + lesson.id);
  const levelFromId = lesson.id.split('-')[1].toUpperCase();
  if (lesson.level !== levelFromId) throw new Error(`Level mismatch ${lesson.id} ${lesson.level}`);
  if (!lesson.grammarFocus || !lesson.theme || !lesson.tag || !lesson.uiTitle) {
    throw new Error('Missing fields ' + lesson.id);
  }
}

for (const [id, focus] of reviewBefore) {
  const lesson = byId.get(id);
  if (!lesson || lesson.tag !== 'REVIEW' || lesson.grammarFocus !== focus) {
    throw new Error('Checkpoint mutated ' + id);
  }
}

const out = `import type { LessonDefinition } from "@/types";

export const FRENCH_LESSONS: LessonDefinition[] = ${JSON.stringify(lessons, null, 2)};
`;
fs.writeFileSync(srcPath, out);
console.log(`Wrote ${lessons.length} lessons (was ${originalIds.length}, +${lessons.length - originalIds.length})`);
