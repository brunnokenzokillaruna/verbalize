'use client';

import { RegraStepView } from './steps/RegraStepView';
import { CuidadoStepView } from './steps/CuidadoStepView';
import { FormulaStepView } from './steps/FormulaStepView';
import { CompareStepView } from './steps/CompareStepView';
import { PatternStepView } from './steps/PatternStepView';
import { VerbIntroStepView } from './steps/VerbIntroStepView';
import { ConjugationStepView } from './steps/ConjugationStepView';
import { IdiomaticStepView } from './steps/IdiomaticStepView';
import { ItemStepView } from './steps/ItemStepView';
import { DialogueStepView } from './steps/DialogueStepView';
import { TransferStepView } from './steps/TransferStepView';
import { CulturaStepView } from './steps/CulturaStepView';
import { SynthesisStepView } from './steps/SynthesisStepView';
import { QuizStepView } from './steps/QuizStepView';
import type { GrammarStep } from '@/lib/grammarBridgeSteps';
import type { SupportedLanguage } from '@/types';
import type { WordClickPayload } from '../ClickableWord';

interface GrammarStepRendererProps {
  step: GrammarStep;
  language: SupportedLanguage;
  newVocabulary?: string[];
  newVerbs?: string[];
  onWordClick?: (payload: WordClickPayload) => void;
  onQuizAnswered?: (answered: boolean) => void;
  onPlaySound?: (type: 'correct' | 'incorrect') => void;
}

export function GrammarStepRenderer({
  step,
  language,
  newVocabulary = [],
  newVerbs = [],
  onWordClick,
  onQuizAnswered,
  onPlaySound,
}: GrammarStepRendererProps) {
  switch (step.type) {
    case 'regra':
      return (
        <RegraStepView
          step={step}
          language={language}
          newVocabulary={newVocabulary}
          newVerbs={newVerbs}
          onWordClick={onWordClick}
        />
      );
    case 'cuidado':
      return <CuidadoStepView step={step} />;
    case 'formula':
      return <FormulaStepView step={step} />;
    case 'compare':
      return (
        <CompareStepView
          step={step}
          language={language}
          newVocabulary={newVocabulary}
          newVerbs={newVerbs}
          onWordClick={onWordClick}
        />
      );
    case 'pattern':
      return (
        <PatternStepView
          step={step}
          language={language}
          newVocabulary={newVocabulary}
          newVerbs={newVerbs}
          onWordClick={onWordClick}
        />
      );
    case 'verb-intro':
      return <VerbIntroStepView step={step} language={language} />;
    case 'conjugation':
      return <ConjugationStepView step={step} language={language} />;
    case 'idiomatic':
      return <IdiomaticStepView step={step} language={language} />;
    case 'item':
      return <ItemStepView step={step} language={language} />;
    case 'dialogue':
      return (
        <DialogueStepView
          step={step}
          language={language}
          newVocabulary={newVocabulary}
          newVerbs={newVerbs}
          onWordClick={onWordClick}
        />
      );
    case 'transfer':
      return (
        <TransferStepView
          step={step}
          language={language}
          newVocabulary={newVocabulary}
          newVerbs={newVerbs}
          onWordClick={onWordClick}
        />
      );
    case 'cultura':
      return <CulturaStepView step={step} />;
    case 'synthesis':
      return <SynthesisStepView step={step} />;
    case 'quiz':
      return (
        <QuizStepView
          step={step}
          onAnswered={onQuizAnswered}
          onPlaySound={onPlaySound}
        />
      );
    default:
      return null;
  }
}

export { useGrammarSwipe } from './useGrammarSwipe';
