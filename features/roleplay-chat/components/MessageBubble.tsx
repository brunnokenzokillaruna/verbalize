'use client';

import { ClickableSentence } from '@/components/lesson/ClickableSentence';
import { GrammarHint } from './GrammarHint';
import type { RoleplayChatMessage } from '@/features/roleplay-chat/types';

export function MessageBubble({
  message,
  characterName,
  narratedRange = null,
}: {
  message: RoleplayChatMessage;
  characterName: string;
  narratedRange?: { start: number; end: number } | null;
}) {
  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';
  const showTranslation =
    Boolean(message.translationPt) || Boolean(message.translationLoading);

  const translationStyle = {
    borderColor: isUser
      ? 'color-mix(in srgb, #fff 28%, transparent)'
      : 'var(--color-border)',
    color: isUser
      ? 'color-mix(in srgb, #fff 88%, transparent)'
      : 'var(--color-text-secondary)',
  } as const;

  return (
    <div className={`flex gap-2.5 ${isUser ? 'flex-row' : 'flex-row-reverse'}`}>
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold"
        style={
          isUser
            ? {
                backgroundColor: 'var(--color-primary)',
                color: '#fff',
              }
            : {
                backgroundColor: 'var(--color-surface-raised)',
                color: 'var(--color-text-secondary)',
                border: '1.5px solid var(--color-border)',
              }
        }
      >
        {isUser ? 'V' : characterName.charAt(0).toUpperCase()}
      </div>

      <div
        className={`flex min-w-0 max-w-[85%] flex-col sm:max-w-[80%] ${isUser ? 'items-start' : 'items-end'}`}
      >
        <div
          className={[
            'rounded-2xl px-3.5 py-2.5 w-full',
            isUser ? 'rounded-bl-md text-left' : 'rounded-br-md text-right',
          ].join(' ')}
          style={
            isUser
              ? {
                  backgroundColor: 'var(--color-primary)',
                  color: '#fff',
                  border: '1.5px solid color-mix(in srgb, var(--color-primary) 75%, black)',
                }
              : {
                  backgroundColor: 'var(--color-surface)',
                  color: 'var(--color-text-primary)',
                  border: narratedRange
                    ? '1.5px solid color-mix(in srgb, var(--color-primary) 45%, var(--color-border))'
                    : '1.5px solid var(--color-border)',
                  boxShadow: narratedRange
                    ? '0 2px 0 color-mix(in srgb, var(--color-primary) 25%, var(--color-border))'
                    : '0 2px 0 var(--color-border)',
                }
          }
        >
          <p
            className="text-[10px] font-bold uppercase tracking-wide mb-1"
            style={{
              color: isUser
                ? 'color-mix(in srgb, #fff 82%, transparent)'
                : 'var(--color-text-muted)',
            }}
          >
            {isUser ? 'Você' : characterName}
            {message.streaming ? ' …' : ''}
          </p>

          {isAssistant ? (
            <ClickableSentence
              text={message.text}
              narratedRange={narratedRange}
              className={`text-sm leading-relaxed text-left ${narratedRange ? 'font-semibold' : ''}`}
            />
          ) : (
            <p className="text-sm leading-relaxed" style={{ color: '#fff' }}>
              {message.text}
            </p>
          )}

          {showTranslation && (
            <p
              className={[
                'mt-2 pt-2 text-xs leading-relaxed border-t',
                message.translationLoading ? 'animate-pulse' : '',
              ].join(' ')}
              style={translationStyle}
            >
              {message.translationLoading || !message.translationPt
                ? 'Traduzindo…'
                : message.translationPt}
            </p>
          )}
        </div>

        {isUser && (
          <div className="mt-1.5 w-full">
            <GrammarHint
              grammar={message.grammar}
              loading={Boolean(message.grammarLoading)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
