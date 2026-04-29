export const StiLogo = ({ withText = true }: { withText?: boolean }) => (
  <div className="flex items-center gap-3">
    <div className="bg-sti-yellow-bright text-sti-blue font-black text-xl px-2.5 py-1 rounded tracking-tighter shadow-elevated">
      STI
    </div>
    {withText && (
      <span className="font-bold text-foreground text-base sm:text-lg">
        STIerFinds
      </span>
    )}
  </div>
);
