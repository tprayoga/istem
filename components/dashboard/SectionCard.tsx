import { ReactNode } from "react";

type SectionCardProps = {
  title: string;
  subtitle?: string;
  rightNode?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function SectionCard({ title, subtitle, rightNode, children, className }: SectionCardProps) {
  return (
    <section
      className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_20px_rgba(15,23,42,0.06)] ${className ?? ""}`}
    >
      <header className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="font-heading text-lg font-semibold text-slate-900">{title}</h3>
          {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
        </div>
        {rightNode}
      </header>
      {children}
    </section>
  );
}
