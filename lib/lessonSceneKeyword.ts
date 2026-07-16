/**
 * Builds a deterministic English Pexels search query from lesson theme / title.
 * No Gemini — keeps scene/cover image fetches token-free.
 *
 * Prefer uiTitle over theme: titles are lesson-specific ("As Risadas Mútuas"),
 * while themes are shared across many lessons ("Contando o Final de Semana").
 */

/** Ordered longest-first PT phrase → English scene keyword. */
const PT_SCENE_PHRASES: Array<[RegExp, string]> = [
  [/risad|rindo|rir\b|riso|engra[cç]|humor|piada/i, 'friends laughing together'],
  [/final de semana|fim de semana|weekend/i, 'weekend friends hanging out'],
  [/a bordo do avi[aã]o|bordo do avi[aã]o/i, 'airplane cabin travel'],
  [/aeroporto|despachando|bagagem|placa.?s? de voo|chegando no aeroporto/i, 'airport terminal'],
  [/hotel|check.?in|quarto de hotel|recep[cç][aã]o/i, 'hotel lobby'],
  [/caf[eé]|padaria|boulangerie|espresso/i, 'cafe coffee shop'],
  [/restaurante|jantar|almo[cç]o|card[aá]pio|gar[cç]om/i, 'restaurant dining'],
  [/mercado|supermercado|feira/i, 'grocery market'],
  [/farm[aá]cia|m[eé]dico|hospital|consulta/i, 'pharmacy clinic'],
  [/esta[cç][aã]o|metr[oô]|trem|transporte/i, 'train metro station'],
  [/praia|mar|ver[aã]o|f[eé]rias/i, 'beach vacation'],
  [/parque|jardim|natureza/i, 'city park nature'],
  [/museu|arte|exposi[cç][aã]o|galeria/i, 'museum art gallery'],
  [/cinema|teatro|espet[aá]culo/i, 'cinema theater'],
  [/escola|universidade|aula|sala de aula/i, 'classroom school'],
  [/trabalho|escrit[oó]rio|reuni[aã]o/i, 'office workplace'],
  [/fam[ií]lia|casa|apartamento|cozinha/i, 'home living room'],
  [/festa|anivers[aá]rio|celebra[cç][aã]o/i, 'party celebration'],
  [/esporte|futebol|academia|corrida/i, 'sports gym'],
  [/compras|loja|shopping|roupa/i, 'shopping store'],
  [/banco|dinheiro|pagamento/i, 'bank finance'],
  [/correio|correios|encomenda/i, 'post office package'],
  [/biblioteca|livro|leitura/i, 'library books'],
  [/amigo|amizade|conversa|bate.?papo|contando/i, 'friends talking outdoors'],
  [/rua|cidade|passeio|caminhada|bairro/i, 'city street walk'],
  [/Paris|Fran[cç]a/i, 'Paris France street'],
  [/Londres|Inglaterra/i, 'London city street'],
];

/** Single PT tokens → English for fallback keyword assembly. */
const PT_WORD_EN: Record<string, string> = {
  risadas: 'laughing',
  risada: 'laughing',
  mutuas: 'together',
  mútuas: 'together',
  amigos: 'friends',
  amigo: 'friends',
  amizade: 'friendship',
  conversa: 'conversation',
  contando: 'storytelling',
  final: 'weekend',
  semana: 'weekend',
  ferias: 'vacation',
  férias: 'vacation',
  praia: 'beach',
  cafe: 'cafe',
  café: 'cafe',
  aeroporto: 'airport',
  hotel: 'hotel',
  restaurante: 'restaurant',
  cidade: 'city',
  parque: 'park',
  familia: 'family',
  família: 'family',
  festa: 'party',
  trabalho: 'office',
  escola: 'school',
  mercado: 'market',
  compras: 'shopping',
};

function stripThemePrefix(theme: string): string {
  return theme.replace(/^Tema\s*\d+\s*:\s*/i, '').trim();
}

function matchScenePhrase(text: string): string | null {
  for (const [pattern, keyword] of PT_SCENE_PHRASES) {
    if (pattern.test(text)) return keyword;
  }
  return null;
}

function translateTitleFallback(title: string): string | null {
  const rawTokens = title
    .toLowerCase()
    .replace(/[^\p{L}\s]/gu, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 2);

  const words = [
    ...new Set(
      rawTokens
        .flatMap((token) => {
          const stripped = token.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
          return [PT_WORD_EN[token], PT_WORD_EN[stripped]].filter(Boolean) as string[];
        }),
    ),
  ];

  if (words.length === 0) return null;
  return `${words.join(' ')} people lifestyle`;
}

/**
 * Returns an English landscape-scene query for Pexels.
 */
export function buildLessonSceneKeyword(theme: string, uiTitle?: string): string {
  const cleanedTheme = stripThemePrefix(theme);
  const title = uiTitle?.trim() ?? '';

  // 1) Title first — specific to this lesson
  if (title) {
    const fromTitle = matchScenePhrase(title);
    if (fromTitle) return `${fromTitle} lifestyle`;

    const titleFallback = translateTitleFallback(title);
    if (titleFallback) return titleFallback;
  }

  // 2) Theme place/activity
  const fromTheme = matchScenePhrase(cleanedTheme);
  if (fromTheme) return `${fromTheme} lifestyle`;

  // 3) Combined
  const combined = `${cleanedTheme} ${title}`.trim();
  const fromCombined = matchScenePhrase(combined);
  if (fromCombined) return `${fromCombined} lifestyle`;

  // 4) Last resort — avoid dumping raw PT into Pexels
  return 'friends everyday lifestyle scene';
}

export function lessonSceneCacheKey(lessonId: string): string {
  return `scene_${lessonId}`;
}
