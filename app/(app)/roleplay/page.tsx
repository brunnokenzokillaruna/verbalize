import type { Metadata } from 'next';
import { RoleplayChatPage } from '@/features/roleplay-chat/components/RoleplayChatPage';

export const metadata: Metadata = {
  title: 'Roleplay ao vivo | Verbalize',
  description: 'Conversa por voz em tempo real com correção gramatical.',
};

export default function RoleplayPage() {
  return <RoleplayChatPage />;
}
