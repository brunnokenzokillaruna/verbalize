# Redesign curricular FR — regras congeladas

Versão: 1 · Idioma: francês · Escopo: `lib/curriculum/french.ts`

## Estrutura

1. **1 tema único a cada 6 lições** (ordem do array = ordem pedagógica).
2. **75 temas** para 450 lições (`450 ÷ 6 = 75`). Nenhum tema se repete.
3. **Subtema** = `uiTitle` (situação) + `grammarFocus` (objetivo linguístico).
4. **IDs das lições não mudam** (progresso do aluno / `CURRICULUM_VERSION` intactos).
5. **Nível CEFR** permanece o do ID (`fr-a1-…`). **Etapa 4 (rebalancear níveis): adiada de propósito.** Mudar nível exigiria renumerar IDs + bump de `CURRICULUM_VERSION` + migração de progresso. Um bloco pode tocar a fronteira A1→A2. Revisitar só se quisermos múltiplos de 6 por nível.

## Tags (por bloco de 6)

| Regra | Detalhe |
|--------|---------|
| Forma | Máx. 4 entre `GRAM` + `VERB`; máx. 2 formas seguidas (ex.: GRAM→VERB ok; GRAM→VERB→GRAM não) |
| Preservação | Manter tags `GRAM`/`VERB` legadas; só demover para cumprir as regras acima |
| Reorder | Dentro do bloco de 6, reordenar lições para proteger forma do slot REVIEW e intercalá-las |
| Repetição | Nunca a mesma tag em slots consecutivos |
| Produção | ≥1 `DIAL` ou `MISS` por bloco (exceto se o slot 6 for o único “leve” e já houver produção) |
| Léxico/contexto | Preferir ≥1 `VOC` / `EXPR` / `CULT` |
| REVIEW | Exatamente 1 nos blocos pares (posição herdada do checkpoint legado, para não partir pares como aller→futur proche) → **37** checkpoints |

## Templates (rodízio)

Blocos com REVIEW (pares):

- `VOC → GRAM → DIAL → VERB → MISS → REVIEW`
- `DIAL → VOC → GRAM → DIAL → EXPR → REVIEW`
- `VOC → DIAL → GRAM → MISS → PRON → REVIEW`
- `DIAL → VOC → VERB → MISS → GRAM → REVIEW`
- `VOC → GRAM → DIAL → MISS → CULT → REVIEW`
- `DIAL → VOC → MISS → GRAM → DIAL → REVIEW`

Blocos sem REVIEW (ímpares):

- `VOC → GRAM → DIAL → VERB → MISS → EXPR`
- `DIAL → VOC → GRAM → DIAL → MISS → CULT`
- `VOC → DIAL → GRAM → MISS → PRON → EXPR`
- `DIAL → VOC → MISS → VERB → DIAL → CULT`
- `VOC → GRAM → DIAL → MISS → VERB → EXPR`
- `CULT → VOC → GRAM → DIAL → MISS → VERB`

O aplicador escolhe o template que melhor respeita as cotas restantes.

## Cotas (resultado típico do aplicador)

`REVIEW 37` fixo · demais tags variam com afinidade ao conteúdo (~GRAM 90–100, VERB ~45, VOC/DIAL ~65–75, MISS ~60, PRON ~25–30, EXPR/CULT ~20).

Prioridade: misturar tags e casar PRON/VERB/GRAM com o `grammarFocus` legado — não clonar o inventário antigo (que empilhava GRAM).

## Preservação de conteúdo

- Manter `grammarFocus` sempre que a lição **não** virar / deixar de ser `REVIEW`.
- Ao virar `REVIEW`: `uiTitle` / `grammarFocus` = checkpoint do intervalo de 12 lições (2 blocos).
- Ao deixar de ser `REVIEW`: novo `grammarFocus` derivado do subtítulo do slot.
- `topicKey` / `lessonRole` preservados se existirem.
- `arcSummary` / `arcCharacters` atualizados por tema.

## Inglês

Fora de escopo até o FR estar validado.
