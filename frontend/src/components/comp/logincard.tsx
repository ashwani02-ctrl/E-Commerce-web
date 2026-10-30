type LoginCardProps = {
  className?: string;
};

export function LoginCard({ className = "" }: LoginCardProps) {
  return (
    <aside
      className={[
        "flex min-h-screen w-full flex-col justify-between bg-brand-navy px-8 py-10 text-white sm:px-12 lg:px-16",
        className,
      ].join(" ")}
    >
      <div className="flex items-center justify-center pt-2 sm:justify-start">
        <div className="flex items-center gap-3">
          <div className="logo-bounce flex h-20 w-20 items-center justify-center rounded-xl bg-white shadow-sm">
            <img src="/bazzar-logo.svg" alt="Bazaar logo" className="h-32 w-32" />
          </div>
          <span className="text-3xl font-bold tracking-tight text-white">Bazaar</span>
        </div>
      </div>

      <div className="space-y-8 pb-12 pt-12">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/75">
          Your colourful corner of the internet
        </p>

        <h1 className="max-w-[720px] text-[clamp(3.3rem,7vw,7rem)] font-black leading-[0.9] tracking-[-0.07em] text-white">
          <span className="block -translate-x-10 leading-[1.2] opacity-0 animate-[slideInLeft_0.7s_ease-out_forwards]">
            Good finds.
          </span>
          <span className="block -translate-x-10 leading-[1.2] opacity-0 animate-[slideInLeft_0.8s_ease-out_0.15s_forwards]">
            Good people.
          </span>
          <span className="block -translate-x-10 leading-[1.2] text-brand-orange opacity-0 animate-[slideInLeft_0.9s_ease-out_0.3s_forwards]">
            Good days.
          </span>
        </h1>
      </div>

      <p className="max-w-[520px] text-base leading-relaxed text-white/80 sm:text-xl">
        Discover small labels, useful things and pieces with personality.
      </p>
    </aside>
  );
}
