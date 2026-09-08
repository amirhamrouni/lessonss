type RiveSlotProps = {
  assetPath?: string;
  label?: string;
};

export function RiveSlot({ assetPath = "/rive/english-twin-guide.riv", label = "Interactive guide" }: RiveSlotProps) {
  return (
    <section
      className="relative overflow-hidden rounded-[2rem] border border-black/10 bg-white/55 p-6"
      data-rive-src={assetPath}
      aria-label={label}
    >
      <div className="absolute inset-x-0 top-0 h-px bg-black/20" />
      <div className="grid min-h-52 place-items-center rounded-[1.5rem] border border-dashed border-black/20 bg-white/40 text-center">
        <div className="max-w-xs space-y-2 px-6">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-black/45">Rive slot</p>
          <p className="text-lg font-semibold">Interactive editorial guide</p>
          <p className="text-sm leading-6 text-black/55">
            Local asset contract is ready at <code className="rounded bg-black/5 px-1.5 py-0.5">{assetPath}</code>.
          </p>
        </div>
      </div>
    </section>
  );
}
