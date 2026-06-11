'use client';

/**
 * @deprecated Use GrammarBridgeFlow directly. Kept for backward compatibility.
 */
import { GrammarBridgeFlow } from './grammar-bridge/GrammarBridgeFlow';
import type { GrammarBridgeResult, SupportedLanguage } from '@/types';
import type { WordClickPayload } from './ClickableWord';

interface GrammarBridgeCardProps {
  bridge: GrammarBridgeResult;
  language: SupportedLanguage;
  newVocabulary?: string[];
  newVerbs?: string[];
  onWordClick?: (payload: WordClickPayload) => void;
  previewMode?: boolean;
}

export function GrammarBridgeCard({
  bridge,
  language,
  newVocabulary = [],
  newVerbs = [],
  onWordClick,
  previewMode = false,
}: GrammarBridgeCardProps) {
  return (
    <GrammarBridgeFlow
      bridge={bridge}
      language={language}
      newVocabulary={newVocabulary}
      newVerbs={newVerbs}
      onWordClick={onWordClick}
      previewMode={previewMode}
    />
  );
}
