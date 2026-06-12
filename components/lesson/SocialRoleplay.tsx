import React, { useState, useEffect } from 'react';
import { MessageSquare, CheckCircle2, XCircle, MapPin, Lightbulb } from 'lucide-react';
import { SocialRoleplayData } from '@/types';

interface SocialRoleplayProps {
  data: SocialRoleplayData;
  onAnswer: (correct: boolean) => void;
  answered: boolean;
  setIsExerciseReady: (ready: boolean) => void;
  submitTrigger: number;
}

function formatContext(text: string): string {
  if (!text) return '';
  const upperCount = (text.match(/[A-Z]/g) || []).length;
  const totalAlpha = (text.match(/[a-zA-Z]/g) || []).length;
  if (totalAlpha > 0 && (upperCount / totalAlpha) > 0.7) {
    const lower = text.toLowerCase();
    return lower.replace(/(^\s*|[.!?]\s+)([a-z])/g, (m) => m.toUpperCase());
  }
  return text;
}

function getInterlocutorRole(context: string): { label: string; avatar: string } {
  const ctx = context.toLowerCase();
  if (ctx.includes('amigo') || ctx.includes('amiga') || ctx.includes('amigos')) {
    return { label: 'Amigo / Conhecido', avatar: '👦' };
  }
  if (ctx.includes('chefe') || ctx.includes('trabalho') || ctx.includes('colega') || ctx.includes('profissional') || ctx.includes('reunião')) {
    return { label: 'Colega / Chefe', avatar: '💼' };
  }
  if (ctx.includes('garçom') || ctx.includes('garçonete') || ctx.includes('atendente') || ctx.includes('café') || ctx.includes('restaurante') || ctx.includes('caixa') || ctx.includes('barman') || ctx.includes('pedido')) {
    return { label: 'Garçom / Atendente', avatar: '🛎️' };
  }
  if (ctx.includes('recepcionista') || ctx.includes('hotel') || ctx.includes('pousada') || ctx.includes('albergue')) {
    return { label: 'Recepcionista', avatar: '🏨' };
  }
  if (ctx.includes('vendedor') || ctx.includes('vendedora') || ctx.includes('loja') || ctx.includes('compras') || ctx.includes('mercado')) {
    return { label: 'Vendedor / Atendente', avatar: '🛍️' };
  }
  if (ctx.includes('professor') || ctx.includes('professora') || ctx.includes('aula') || ctx.includes('escola')) {
    return { label: 'Professor', avatar: '👨‍🏫' };
  }
  if (ctx.includes('mãe') || ctx.includes('pai') || ctx.includes('família') || ctx.includes('irmã') || ctx.includes('irmão') || ctx.includes('filh')) {
    return { label: 'Família', avatar: '🏡' };
  }
  return { label: 'Interlocutor', avatar: '💬' };
}

export function SocialRoleplay({ data, onAnswer, answered, setIsExerciseReady, submitTrigger }: SocialRoleplayProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const shuffledOptions = React.useMemo(() => {
    const indexed = data.options.map((opt, i) => ({ text: opt, isCorrect: i === data.correctIndex }));
    for (let i = indexed.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indexed[i], indexed[j]] = [indexed[j], indexed[i]];
    }
    return indexed;
  }, [data.options, data.correctIndex]);

  useEffect(() => {
    if (!answered) {
      setIsExerciseReady(selectedIndex !== null);
    } else {
      setIsExerciseReady(false);
    }
  }, [selectedIndex, answered, setIsExerciseReady]);

  useEffect(() => {
    if (submitTrigger > 0 && !answered && selectedIndex !== null) {
      onAnswer(shuffledOptions[selectedIndex].isCorrect);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitTrigger]);

  const handleSelect = (index: number) => {
    if (answered) return;
    setSelectedIndex(index);
  };

  const formattedContext = formatContext(data.context);
  const role = getInterlocutorRole(formattedContext);

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div
        className="rounded-2xl p-4.5 border border-dashed border-[var(--color-border)] backdrop-blur-sm"
        style={{ backgroundColor: 'rgba(255, 255, 255, 0.01)' }}
      >
        <div className="flex items-center gap-2 mb-2.5 text-[var(--color-text-muted)]">
          <MapPin size={14} className="text-[var(--color-primary)]" />
          <span className="text-[10px] font-black uppercase tracking-[0.15em]">Cenário da Situação</span>
        </div>
        <p className="text-sm font-medium text-[var(--color-text-secondary)] leading-relaxed italic">
          &ldquo;{formattedContext}&rdquo;
        </p>
      </div>

      <div className="flex items-start gap-3 mt-1">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-bold text-lg shadow-md ring-2 ring-white/10"
          style={{
            background: 'linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)',
            color: '#fff',
          }}
        >
          {role.avatar}
        </div>
        <div className="flex flex-col gap-1.5 max-w-[85%]">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] ml-1">
            {role.label}
          </span>
          <div
            className="rounded-2xl rounded-tl-none px-4.5 py-3 border border-white/5 shadow-lg relative animate-slide-up-spring"
            style={{ backgroundColor: 'var(--color-surface-raised)' }}
          >
            <p className="text-base font-semibold text-[var(--color-text-primary)] leading-relaxed">
              {data.promptLine}
            </p>
          </div>
        </div>
      </div>

      <div className="relative my-2 flex items-center justify-center">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-[var(--color-border)] opacity-30" />
        </div>
        <span className="relative rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] bg-[var(--color-bg)] border border-[var(--color-border)] opacity-85">
          Escolha como responder
        </span>
      </div>

      <div className="flex flex-col items-end gap-3 w-full">
        {shuffledOptions.map((option, index) => {
          const isSelected = selectedIndex === index;
          const isCorrect = option.isCorrect;
          const letter = String.fromCharCode(65 + index);

          let stateStyles = "border border-[var(--color-primary)]/10 bg-[var(--color-primary-light)]/10 hover:bg-[var(--color-primary-light)]/20 hover:border-[var(--color-primary)]/20 text-[var(--color-text-primary)]";

          if (answered) {
            if (isCorrect) {
              stateStyles = "bg-[rgba(16,185,129,0.08)] border border-emerald-500/40 text-emerald-200 shadow-[0_0_15px_rgba(16,185,129,0.05)]";
            } else if (isSelected) {
              stateStyles = "bg-[rgba(239,68,68,0.08)] border border-red-500/40 text-red-200 shadow-[0_0_15px_rgba(239,68,68,0.05)]";
            } else {
              stateStyles = "opacity-25 scale-98 pointer-events-none border-white/5 bg-white/5";
            }
          } else if (isSelected) {
            stateStyles = "border-[var(--color-primary)] bg-[var(--color-primary-light)]/30";
          }

          return (
            <button
              key={index}
              disabled={answered}
              onClick={() => handleSelect(index)}
              className={`flex items-center justify-between w-full self-end max-w-[88%] md:max-w-[75%] p-4 rounded-2xl rounded-tr-none text-left transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] shadow-md ${stateStyles}`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`flex h-6.5 w-6.5 shrink-0 items-center justify-center rounded-lg text-xs font-black transition-colors ${
                    answered && isCorrect
                      ? 'bg-emerald-500 text-white shadow-sm'
                      : answered && isSelected
                        ? 'bg-red-500 text-white shadow-sm'
                        : isSelected && !answered
                          ? 'bg-[var(--color-primary)] text-white'
                          : 'bg-white/5 text-[var(--color-text-secondary)] border border-white/10'
                  }`}
                >
                  {letter}
                </div>
                <span className="text-sm md:text-[15px] font-semibold leading-relaxed">{option.text}</span>
              </div>
              {answered && isCorrect && <CheckCircle2 size={18} className="text-emerald-500 shrink-0 ml-3" />}
              {answered && isSelected && !isCorrect && <XCircle size={18} className="text-red-500 shrink-0 ml-3" />}
            </button>
          );
        })}
      </div>

      {answered && (
        <div
          className="mt-2 rounded-xl p-4.5 border-l-4 border-[var(--color-primary)] animate-in slide-in-from-bottom-2 duration-300"
          style={{
            backgroundColor: 'var(--color-surface-raised)',
            borderLeftColor: (selectedIndex !== null && shuffledOptions[selectedIndex].isCorrect) ? 'var(--color-success)' : 'var(--color-error)',
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb size={15} style={{ color: (selectedIndex !== null && shuffledOptions[selectedIndex].isCorrect) ? 'var(--color-success)' : 'var(--color-error)' }} />
            <span className="text-[10px] font-black uppercase tracking-wider text-[var(--color-text-muted)]">
              Dica & Explicação
            </span>
          </div>
          <p className="text-sm font-medium leading-relaxed text-[var(--color-text-secondary)]">
            {data.explanation}
          </p>
        </div>
      )}
    </div>
  );
}
