'use client';

import { useEffect, useRef } from 'react';
import { MessageBubble } from './MessageBubble';
import type { RoleplayChatMessage } from '@/features/roleplay-chat/types';

export function ChatTranscript({
  messages,
  characterName,
}: {
  messages: RoleplayChatMessage[];
  characterName: string;
}) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages]);

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
        <MessageBubble key={m.id} message={m} characterName={characterName} />
      ))}
      <div ref={endRef} />
    </div>
  );
}
