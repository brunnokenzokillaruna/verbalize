import type { GrammarBridgeResult } from '@/types';

export type GrammarPhase = 'compreender' | 'evitar_erro' | 'estruturar' | 'aplicar' | 'fixar';

export const GRAMMAR_PHASE_LABELS: Record<GrammarPhase, string> = {
  compreender: 'Compreender',
  evitar_erro: 'Evitar erro',
  estruturar: 'Estruturar',
  aplicar: 'Aplicar',
  fixar: 'Fixar',
};

export type GrammarStepType =
  | 'regra'
  | 'cuidado'
  | 'formula'
  | 'compare'
  | 'pattern'
  | 'verb-intro'
  | 'conjugation'
  | 'idiomatic'
  | 'item'
  | 'dialogue'
  | 'transfer'
  | 'cultura'
  | 'synthesis'
  | 'quiz';

export interface GrammarStepBase {
  id: string;
  type: GrammarStepType;
  label: string;
  phase: GrammarPhase;
  phaseIndex: number;
  phaseTotal: number;
}

export interface RegraStep extends GrammarStepBase {
  type: 'regra';
  data: {
    insight: string;
    usageContext?: string;
    culturalNote?: string;
    bridge?: NonNullable<GrammarBridgeResult['bridge']>;
    explanationItems: string[];
  };
}

export interface CuidadoStep extends GrammarStepBase {
  type: 'cuidado';
  data: {
    trap: {
      wrong: string;
      right: string;
      explanation: string;
      subtitle?: string;
      wrongPortuguese?: string;
      rightPortuguese?: string;
    };
    survivalTip?: string;
  };
}

export type FormulaExample = { target: string; portuguese: string };

export interface FormulaStep extends GrammarStepBase {
  type: 'formula';
  data: {
    structureFormula?: string;
    structureFormulas?: Array<{ label: string; formula: string; example?: FormulaExample }>;
    formulaExample?: FormulaExample;
  };
}

export interface CompareStep extends GrammarStepBase {
  type: 'compare';
  data: {
    left: { label: string; target: string; portuguese: string };
    right: { label: string; target: string; portuguese: string };
    changeHint?: string;
  };
}

export interface PatternStep extends GrammarStepBase {
  type: 'pattern';
  data: { label: string; target: string; portuguese: string };
}

export interface VerbIntroStep extends GrammarStepBase {
  type: 'verb-intro';
  data: NonNullable<GrammarBridgeResult['verbSpotlight']>;
}

export interface ConjugationStep extends GrammarStepBase {
  type: 'conjugation';
  data: {
    infinitive: string;
    forms: Array<{ pronoun: string; form: string }>;
    partLabel?: string;
  };
}

export interface IdiomaticStep extends GrammarStepBase {
  type: 'idiomatic';
  data: {
    infinitive: string;
    expressions: Array<{ target: string; portuguese: string }>;
  };
}

export interface ItemStep extends GrammarStepBase {
  type: 'item';
  data: { target: string; portuguese: string; logic?: string; index: number; total: number };
}

export interface DialogueStep extends GrammarStepBase {
  type: 'dialogue';
  data: NonNullable<GrammarBridgeResult['dialogueExample']>;
}

export interface TransferStep extends GrammarStepBase {
  type: 'transfer';
  data: { target: string; portuguese: string };
}

export interface CulturaStep extends GrammarStepBase {
  type: 'cultura';
  data: { culturalNote: string };
}

export interface SynthesisStep extends GrammarStepBase {
  type: 'synthesis';
  data: {
    insight?: string;
    survivalTip?: string;
    formula?: string;
    trap?: {
      wrong: string;
      right: string;
      wrongPortuguese?: string;
      rightPortuguese?: string;
    };
  };
}

export interface QuizStep extends GrammarStepBase {
  type: 'quiz';
  data: NonNullable<GrammarBridgeResult['retentionCheck']>;
  feedback?: {
    survivalTip?: string;
    trapExplanation?: string;
  };
}

export type GrammarStep =
  | RegraStep
  | CuidadoStep
  | FormulaStep
  | CompareStep
  | PatternStep
  | VerbIntroStep
  | ConjugationStep
  | IdiomaticStep
  | ItemStep
  | DialogueStep
  | TransferStep
  | CulturaStep
  | SynthesisStep
  | QuizStep;

export type StepDraft = Omit<GrammarStep, 'phaseIndex' | 'phaseTotal'>;
