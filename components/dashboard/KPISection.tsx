type KPICard = {
  label: string;
  value: string;
  trend: string;
};

type KPISectionProps = {
  cards: KPICard[];
};

export default function KPISection({ cards }: KPISectionProps) {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((stat) => (
        <article
          key={stat.label}
          className="rounded-3xl border border-white/5 bg-white/[0.04] p-5 shadow-lg shadow-black/20 backdrop-blur"
        >
          <p className="text-sm uppercase tracking-[0.2em] text-slate-400">{stat.label}</p>
          <p className="mt-3 text-3xl font-semibold text-white">{stat.value}</p>
          <p className="mt-1 text-sm text-slate-400">{stat.trend}</p>
        </article>
      ))}
    </section>
  );
}
