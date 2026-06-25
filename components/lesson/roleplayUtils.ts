export function formatRoleplayContext(text: string): string {
  if (!text) return '';
  const upperCount = (text.match(/[A-Z]/g) || []).length;
  const totalAlpha = (text.match(/[a-zA-Z]/g) || []).length;
  if (totalAlpha > 0 && upperCount / totalAlpha > 0.7) {
    const lower = text.toLowerCase();
    return lower.replace(/(^\s*|[.!?]\s+)([a-z])/g, (m) => m.toUpperCase());
  }
  return text;
}

export function getInterlocutorRole(context: string): { label: string; avatar: string } {
  const ctx = context.toLowerCase();
  if (ctx.includes('amigo') || ctx.includes('amiga') || ctx.includes('amigos')) {
    return { label: 'Amigo / Conhecido', avatar: '👦' };
  }
  if (
    ctx.includes('chefe') ||
    ctx.includes('trabalho') ||
    ctx.includes('colega') ||
    ctx.includes('profissional') ||
    ctx.includes('reunião')
  ) {
    return { label: 'Colega / Chefe', avatar: '💼' };
  }
  if (
    ctx.includes('garçom') ||
    ctx.includes('garçonete') ||
    ctx.includes('atendente') ||
    ctx.includes('café') ||
    ctx.includes('restaurante') ||
    ctx.includes('caixa') ||
    ctx.includes('barman') ||
    ctx.includes('pedido')
  ) {
    return { label: 'Garçom / Atendente', avatar: '🛎️' };
  }
  if (
    ctx.includes('recepcionista') ||
    ctx.includes('hotel') ||
    ctx.includes('pousada') ||
    ctx.includes('albergue')
  ) {
    return { label: 'Recepcionista', avatar: '🏨' };
  }
  if (
    ctx.includes('vendedor') ||
    ctx.includes('vendedora') ||
    ctx.includes('loja') ||
    ctx.includes('compras') ||
    ctx.includes('mercado')
  ) {
    return { label: 'Vendedor / Atendente', avatar: '🛍️' };
  }
  if (
    ctx.includes('professor') ||
    ctx.includes('professora') ||
    ctx.includes('aula') ||
    ctx.includes('escola')
  ) {
    return { label: 'Professor', avatar: '👨‍🏫' };
  }
  if (
    ctx.includes('mãe') ||
    ctx.includes('pai') ||
    ctx.includes('família') ||
    ctx.includes('irmã') ||
    ctx.includes('irmão') ||
    ctx.includes('filh')
  ) {
    return { label: 'Família', avatar: '🏡' };
  }
  return { label: 'Interlocutor', avatar: '💬' };
}
