'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { VisualVocabCard } from '@/components/lesson/VisualVocabCard';
import { SentenceBuilder } from '@/components/lesson/SentenceBuilder';
import { AudioPlayerButton } from '@/components/lesson/AudioPlayerButton';
import { LessonInfoModal } from '@/components/ui/LessonInfoModal';
import { LessonProgressHeader } from '@/components/lesson/LessonProgressHeader';
import { CheckButton, type CheckButtonState } from '@/components/lesson/CheckButton';
import { Mail, Search, Bell, Settings, Play } from 'lucide-react';
import type { LessonDefinition, SentenceBuilderData } from '@/types';

import { LessonCompleteScreen } from '@/components/lesson/LessonCompleteScreen';
import { ClickableWord } from '@/components/lesson/ClickableWord';
import { Trophy, ChevronRight } from 'lucide-react';

export default function TestUIPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [completeOpen, setCompleteOpen] = useState(false);
  const [checkState, setCheckState] = useState<CheckButtonState>('idle');
  const [isExerciseReady, setIsExerciseReady] = useState(false);
  
  // Mock data for SentenceBuilder
  const sentenceData: SentenceBuilderData = {
    words: ['Eu', 'gosto', 'de', 'comer', 'maçã'],
    correctOrder: ['Eu', 'gosto', 'de', 'comer', 'maçã'],
    translation: 'Eu gosto de comer maçã (I like to eat apple)',
  };

  // Mock lesson for Modal
  const mockLesson: LessonDefinition = {
    id: 'test-lesson',
    language: 'fr',
    level: 'A1',
    tag: 'GRAM',
    grammarFocus: 'Présent de l’Indicatif — Verbes en -ER',
    theme: 'Cotidiano',
    uiTitle: 'Primeiros Passos',
  };

  if (completeOpen) {
    return (
      <LessonCompleteScreen 
        totalExercises={10} 
        correctExercises={9} 
        newVocabulary={['Pomme', 'Manger', 'Rouge', 'Élégant']} 
        onExit={() => setCompleteOpen(false)} 
      />
    );
  }

  return (
    <div className="p-8 pb-32 max-w-5xl mx-auto space-y-16">
      <header className="space-y-2 border-b border-[var(--color-border)] pb-8">
        <h1 className="text-4xl font-black tracking-tight text-[var(--color-text-primary)]">
          Laboratório de UI
        </h1>
        <p className="text-lg text-[var(--color-text-muted)] font-medium">
          Explore e teste todos os componentes visuais do Verbalize.
        </p>
      </header>

      {/* Atomic Components */}
      <section className="space-y-8">
        <div className="flex items-center gap-3">
          <div className="h-8 w-1 bg-[var(--color-primary)] rounded-full" />
          <h2 className="text-2xl font-bold">Componentes Atômicos</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="space-y-6">
            <h3 className="text-sm font-black uppercase tracking-widest text-[var(--color-text-muted)]">Botões</h3>
            <div className="flex flex-wrap gap-4">
              <Button variant="primary">Principal</Button>
              <Button variant="secondary">Secundário</Button>
              <Button variant="ghost">Fantasma</Button>
              <Button variant="danger">Perigo</Button>
              <Button variant="google">Google</Button>
            </div>
            <div className="flex flex-wrap gap-4 items-center">
              <Button size="sm">Pequeno</Button>
              <Button size="md">Médio</Button>
              <Button size="lg">Grande</Button>
              <Button loading>Carregando</Button>
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-sm font-black uppercase tracking-widest text-[var(--color-text-muted)]">Inputs</h3>
            <div className="space-y-4">
              <Input label="Email" placeholder="seu@email.com" icon={Mail} />
              <Input label="Pesquisar" placeholder="Buscar..." icon={Search} />
              <Input label="Com Erro" error="Este campo é obrigatório" defaultValue="Valor inválido" />
            </div>
          </div>
        </div>
      </section>

      {/* Lesson Components */}
      <section className="space-y-8">
        <div className="flex items-center gap-3">
          <div className="h-8 w-1 bg-[var(--color-vocab)] rounded-full" />
          <h2 className="text-2xl font-bold">Componentes de Lição</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="space-y-6">
            <h3 className="text-sm font-black uppercase tracking-widest text-[var(--color-text-muted)]">Visual Vocab Card</h3>
            <div className="max-w-[300px]">
              <VisualVocabCard 
                word="Pomme" 
                translation="Maçã" 
                language="fr" 
                imageUrl="https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=400&auto=format&fit=crop&q=60" 
                exampleSentence="Je mange une pomme rouge."
              />
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-sm font-black uppercase tracking-widest text-[var(--color-text-muted)]">Interactive Elements</h3>
            <div className="p-6 rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] space-y-8">
              <div className="space-y-2">
                <p className="text-xs font-bold text-muted uppercase">Word interaction:</p>
                <div className="flex gap-2">
                  <ClickableWord word="Bonjour" />
                  <ClickableWord word="Merci" />
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-bold text-muted uppercase">Sentence Builder (mini):</p>
                <SentenceBuilder 
                  data={sentenceData} 
                  onAnswer={(correct) => console.log('Answered:', correct)} 
                  answered={false}
                  setIsExerciseReady={setIsExerciseReady}
                  submitTrigger={0}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Modals & Overlays */}
      <section className="space-y-8">
        <div className="flex items-center gap-3">
          <div className="h-8 w-1 bg-[#9333ea] rounded-full" />
          <h2 className="text-2xl font-bold">Overlays & Headers</h2>
        </div>

        <div className="grid grid-cols-1 gap-12">
          <div className="space-y-6">
            <h3 className="text-sm font-black uppercase tracking-widest text-[var(--color-text-muted)]">Lesson Progress Headers</h3>
            <div className="p-4 rounded-2xl border border-[var(--color-border)] space-y-8 overflow-hidden">
               <div className="relative h-20">
                 <LessonProgressHeader currentStage="vocabulary" tag="GRAM" onExit={() => {}} />
               </div>
               <div className="relative h-20">
                 <LessonProgressHeader currentStage="grammar" tag="GRAM" onExit={() => {}} />
               </div>
               <div className="relative h-20">
                 <LessonProgressHeader currentStage="practice" tag="MISS" onExit={() => {}} />
               </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 items-center">
            <div className="space-y-2 flex-1 min-w-[200px]">
              <h3 className="text-sm font-black uppercase tracking-widest text-[var(--color-text-muted)]">Modals & Screens</h3>
              <div className="flex flex-wrap gap-3">
                <Button onClick={() => setModalOpen(true)} className="flex items-center gap-2">
                  <Play size={18} fill="currentColor" /> Modal de Lição
                </Button>
                <Button variant="secondary" onClick={() => setCompleteOpen(true)} className="flex items-center gap-2">
                  <Trophy size={18} /> Tela de Conclusão
                </Button>
              </div>
            </div>
            
            <LessonInfoModal 
              isOpen={modalOpen} 
              onClose={() => setModalOpen(false)} 
              onStart={() => alert('Start!')} 
              lesson={mockLesson}
              isCompleted={false}
              isCurrent={true}
              isLocked={false}
              tagLabel="GRAMÁTICA"
            />
          </div>
        </div>
      </section>

      {/* Check Button States */}
      <section className="space-y-8 pb-32">
        <div className="flex items-center gap-3">
          <div className="h-8 w-1 bg-[var(--color-success)] rounded-full" />
          <h2 className="text-2xl font-bold">Botão de Verificação (CheckButton)</h2>
        </div>

        <div className="p-12 rounded-[2.5rem] border-2 border-dashed border-[var(--color-border)] flex flex-col items-center gap-8">
          <div className="flex flex-wrap justify-center gap-4">
            <Button variant={checkState === 'idle' ? 'primary' : 'secondary'} onClick={() => setCheckState('idle')}>Idle</Button>
            <Button variant={checkState === 'disabled' ? 'primary' : 'secondary'} onClick={() => setCheckState('disabled')}>Disabled</Button>
            <Button variant={checkState === 'correct' ? 'primary' : 'secondary'} onClick={() => setCheckState('correct')}>Correct</Button>
            <Button variant={checkState === 'incorrect' ? 'primary' : 'secondary'} onClick={() => setCheckState('incorrect')}>Incorrect</Button>
          </div>
          
          <div className="w-full max-w-md bg-[var(--color-surface-raised)] h-32 rounded-3xl flex items-center justify-center p-8 text-center relative overflow-hidden">
             <p className="text-[var(--color-text-muted)] font-medium">
               O botão de verificação fixo aparecerá no rodapé da página ao selecionar um estado.
             </p>
             
             <CheckButton 
               state={checkState} 
               onCheck={() => setCheckState('correct')} 
               onContinue={() => setCheckState('idle')}
               correctAnswer="La pomme est rouge"
               hint="Use o artigo definido feminino 'la'."
             />
          </div>
        </div>
      </section>

      <footer className="pt-16 text-center text-[var(--color-text-muted)] text-sm font-medium">
        Verbalize Design System Lab • {new Date().getFullYear()}
      </footer>
    </div>
  );
}
