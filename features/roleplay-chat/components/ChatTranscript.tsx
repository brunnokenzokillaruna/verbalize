'use client';

import { useEffect, useRef } from 'react';
import { MessageBubble } from './MessageBubble';
import type { RoleplayChatMessage } from '@/features/roleplay-chat/types';
import type { NarratedTextRange } from '@/lib/dialogueNarration';

export function ChatTranscript({
  messages,
  characterName,
  speakingMessageId = null,
  narratedRange = null,
}: {
  messages: RoleplayChatMessage[];
  characterName: string;
  speakingMessageId?: string | null;
  narratedRange?: NarratedTextRange | null;
}) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, narratedRange?.text]);

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center px-6 py-10 text-center">
        <p className="text-sm text-text-muted max-w-xs">
          Quando a sessão começar, a conversa aparece aqui com tradução e correções das suas
          falas.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-4">
      {messages.map((m) => (
        <MessageBubble
          key={m.id}
          message={m}
          characterName={characterName}
          narratedRange={
            m.role === 'assistant' && m.id === speakingMessageId
              ? narratedRange
              : null
          }
        />
      ))}
      <div ref={endRef} />
    </div>
  );
}
