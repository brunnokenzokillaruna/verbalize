import type { ReactNode } from 'react';
import { Mic, MessageCircle, PenLine, Sparkles } from 'lucide-react';
import {
  getWeeklyProductionBreakdown,
  hasProductionWeeklyStreak,
  PRODUCTION_WEEKLY_STREAK_THRESHOLD,
  SPONTANEOUS_ORAL_WEEKLY_GOAL,
  SPONTANEOUS_SESSION_RATE_GOAL,
  ORAL_EXERCISE_COMPLETION_GOAL,
  getOralExerciseCompletionStats,
  type SpontaneousSessionStats,
} from '@/lib/productionStatsHelpers';
import {
  VOCAB_RETENTION_UPLIFT_GOAL,
  type VocabRetentionComparison,
} from '@/lib/vocabRetentionStats';
import type { UserDocument, LessonTag } from '@/types';

type DashboardProductionCardProps = {
  profile: UserDocument;
  sessionStats?: SpontaneousSessionStats;
  vocabRetention?: VocabRetentionComparison;
  nextLessonTag?: LessonTag;
  onStartNextLesson?: () => void;
};

export function DashboardProductionCard({
  profile,
  sessionStats,
  vocabRetention,
  nextLessonTag,
  onStartNextLesson,
}: DashboardProductionCardProps) {
  const breakdown = getWeeklyProductionBreakdown(profile);
  const oralCompletion = getOralExerciseCompletionStats(profile);
  const { total, oralEcho, oralSpontaneous, written } = breakdown;
  const dialogueMissionSessions = sessionStats?.dialogueMissionSessions ?? 0;
  const sessionRate = sessionStats?.ratePercent ?? null;

  if (total <= 0 && dialogueMissionSessions <= 0 && oralCompletion.total <= 0 && !vocabRetention?.producedCount) {
    return null;
  }

  const hasStreak = total > 0 && hasProductionWeeklyStreak(profile);
  const spontaneousProgress =
    total > 0
      ? Math.min(100, Math.round((oralSpontaneous / SPONTANEOUS_ORAL_WEEKLY_GOAL) * 100))
      : 0;
  const spontaneousGoalMet = oralSpontaneous >= SPONTANEOUS_ORAL_WEEKLY_GOAL;
  const sessionGoalMet = sessionRate !== null && sessionRate >= SPONTANEOUS_SESSION_RATE_GOAL;
  const oralGoalMet =
    oralCompletion.ratePercent !== null &&
    oralCompletion.ratePercent >= ORAL_EXERCISE_COMPLETION_GOAL;
  const showSessionCta =
    !sessionGoalMet &&
    dialogueMissionSessions > 0 &&
    (nextLessonTag === 'DIAL' || nextLessonTag === 'MISS') &&
    typeof onStartNextLesson === 'function';

  return (
    <div
      className="mx-4 mb-4 rounded-2xl border border-border bg-surface p-4 animate-fade-in shadow-sm"
      style={{ animationDelay: '400ms', animationFillMode: 'both' }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">
            Produção esta semana
          </p>
          <p className="text-sm font-bold text-text-primary mt-0.5">
            {total > 0
              ? `${total} ${total === 1 ? 'frase aceita' : 'frases aceitas'}`
              : 'Acompanhe sua produção espontânea'}
          </p>
        </div>
        {hasStreak && (
          <span className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-bold bg-success/10 text-success border border-success/25 shrink-0">
            <Sparkles size={12} />
            Meta {PRODUCTION_WEEKLY_STREAK_THRESHOLD}+
          </span>
        )}
      </div>

      {total > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
        {oralEcho > 0 && (
          <ModeBadge
            icon={<Mic size={12} />}
            label="Eco"
            value={oralEcho}
            className="bg-[rgba(225,29,72,0.08)] text-[#e11d48] border-[rgba(225,29,72,0.2)]"
          />
        )}
        {oralSpontaneous > 0 && (
          <ModeBadge
            icon={<MessageCircle size={12} />}
            label="Espontânea"
            value={oralSpontaneous}
            className="bg-[rgba(124,58,237,0.08)] text-[#7c3aed] border-[rgba(124,58,237,0.2)]"
          />
        )}
        {written > 0 && (
          <ModeBadge
            icon={<PenLine size={12} />}
            label="Escrita"
            value={written}
            className="bg-[rgba(13,148,136,0.08)] text-[#0d9488] border-[rgba(13,148,136,0.2)]"
          />
        )}
      </div>
      )}

      {total > 0 && (
      <div className="mt-3 pt-3 border-t border-border">
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
            Fala espontânea
          </p>
          <p className="text-xs font-bold tabular-nums text-text-primary">
            {oralSpontaneous}/{SPONTANEOUS_ORAL_WEEKLY_GOAL}
          </p>
        </div>
        <div
          className="h-2 rounded-full overflow-hidden"
          style={{ backgroundColor: 'var(--color-surface-raised)' }}
        >
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${spontaneousProgress}%`,
              background: spontaneousGoalMet
                ? 'linear-gradient(90deg, #7c3aed, #6d28d9)'
                : 'linear-gradient(90deg, var(--color-primary), var(--color-primary-dark))',
            }}
          />
        </div>
        <p className="text-[11px] text-text-muted mt-1.5 leading-snug">
          {spontaneousGoalMet
            ? 'Meta semanal de fala espontânea atingida — continue praticando situações reais.'
            : 'Roleplay, monólogos e respostas livres contam aqui — não repetição de frases.'}
        </p>
      </div>
      )}

      {dialogueMissionSessions > 0 && sessionStats && (
        <div className={`${total > 0 ? 'mt-3 pt-3 border-t border-border' : 'mt-1'}`}>
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
              Diálogo & missão (7 dias)
            </p>
            <p className="text-xs font-bold tabular-nums text-text-primary">
              {sessionStats.withSpontaneousAccepted}/{dialogueMissionSessions}
              {sessionRate !== null ? ` · ${sessionRate}%` : ''}
            </p>
          </div>
          {sessionRate !== null && (
            <div
              className="h-2 rounded-full overflow-hidden"
              style={{ backgroundColor: 'var(--color-surface-raised)' }}
            >
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${Math.min(100, sessionRate)}%`,
                  background: sessionGoalMet
                    ? 'linear-gradient(90deg, #7c3aed, #6d28d9)'
                    : 'linear-gradient(90deg, var(--color-primary), var(--color-primary-dark))',
                }}
              />
            </div>
          )}
          <p className="text-[11px] text-text-muted mt-1.5 leading-snug">
            {sessionGoalMet
              ? `Meta de ${SPONTANEOUS_SESSION_RATE_GOAL}% das lições DIAL/MISS com produção espontânea aceita — continue!`
              : `Meta: ${SPONTANEOUS_SESSION_RATE_GOAL}% das lições de diálogo e missão com fala ou escrita espontânea aceita.`}
          </p>
          {showSessionCta && (
            <button
              type="button"
              onClick={onStartNextLesson}
              className="mt-3 w-full rounded-xl px-4 py-2.5 text-xs font-bold text-white transition-all active:scale-[0.98]"
              style={{
                background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))',
                boxShadow: '0 2px 0 var(--color-primary-dark)',
              }}
            >
              Próxima lição — pratique resposta espontânea
            </button>
          )}
        </div>
      )}

      {oralCompletion.total > 0 && (
        <div
          className={`${total > 0 || dialogueMissionSessions > 0 ? 'mt-3 pt-3 border-t border-border' : 'mt-1'}`}
        >
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
              Exercícios orais concluídos
            </p>
            <p className="text-xs font-bold tabular-nums text-text-primary">
              {oralCompletion.completed}/{oralCompletion.total}
              {oralCompletion.ratePercent !== null ? ` · ${oralCompletion.ratePercent}%` : ''}
            </p>
          </div>
          {oralCompletion.ratePercent !== null && (
            <div
              className="h-2 rounded-full overflow-hidden"
              style={{ backgroundColor: 'var(--color-surface-raised)' }}
            >
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${Math.min(100, oralCompletion.ratePercent)}%`,
                  background: oralGoalMet
                    ? 'linear-gradient(90deg, #0d9488, #0f766e)'
                    : 'linear-gradient(90deg, var(--color-primary), var(--color-primary-dark))',
                }}
              />
            </div>
          )}
          <p className="text-[11px] text-text-muted mt-1.5 leading-snug">
            {oralGoalMet
              ? `Meta de ${ORAL_EXERCISE_COMPLETION_GOAL}% atingida — gravar e enviar, não pular.`
              : `Gravar e enviar conta como concluído; pular ou continuar sem áudio reduz esta taxa.`}
          </p>
        </div>
      )}

      {vocabRetention && (vocabRetention.producedCount > 0 || vocabRetention.passiveOnlyCount > 0) && (
        <div className="mt-3 pt-3 border-t border-border">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
              Retenção SRS — produzida vs passiva
            </p>
            {vocabRetention.upliftPercent !== null && (
              <p className="text-xs font-bold tabular-nums text-text-primary">
                {vocabRetention.upliftPercent > 0 ? '+' : ''}
                {vocabRetention.upliftPercent}%
              </p>
            )}
          </div>
          <p className="text-xs text-text-primary leading-snug">
            {vocabRetention.producedCount} palavra{vocabRetention.producedCount === 1 ? '' : 's'} produzida
            {vocabRetention.producedCount === 1 ? '' : 's'}
            {vocabRetention.avgIntervalProducedDays !== null &&
              ` · ~${Math.round(vocabRetention.avgIntervalProducedDays)} dias de intervalo`}
            {vocabRetention.passiveOnlyCount > 0 &&
              ` · ${vocabRetention.passiveOnlyCount} só reconhecimento`}
          </p>
          <p className="text-[11px] text-text-muted mt-1.5 leading-snug">
            {vocabRetention.hasEnoughData && vocabRetention.goalMet
              ? `Meta de +${VOCAB_RETENTION_UPLIFT_GOAL}% de intervalo médio vs MCQ/passivo — continue produzindo!`
              : vocabRetention.hasEnoughData
                ? `Meta: +${VOCAB_RETENTION_UPLIFT_GOAL}% de intervalo médio vs palavras só reconhecidas.`
                : 'Complete exercícios de produção para marcar vocabulário como ativo e comparar retenção.'}
          </p>
        </div>
      )}
    </div>
  );
}

function ModeBadge({
  icon,
  label,
  value,
  className,
}: {
  icon: ReactNode;
  label: string;
  value: number;
  className: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold border ${className}`}
    >
      {icon}
      {value} {label}
    </span>
  );
}
