export function LanguageSwitchOverlay() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-md transition-all duration-300">
      <div className="flex flex-col items-center gap-4 p-6 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl">
        <div className="animate-spin rounded-full h-9 w-9 border-4 border-primary border-t-transparent" />
        <span className="text-[10px] font-black uppercase tracking-widest text-primary">Alterando Idioma...</span>
      </div>
    </div>
  );
}
