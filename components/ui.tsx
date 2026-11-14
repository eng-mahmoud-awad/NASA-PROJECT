import { cn } from "@/lib/utils";

export function Panel({
  title,
  aside,
  className,
  children,
  flush,
}: {
  title: string;
  aside?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
  flush?: boolean;
}) {
  return (
    <section className={cn("flex flex-col rounded-md border border-slate-800 bg-slate-900", className)}>
      <header className="flex items-center justify-between gap-3 border-b border-slate-800 px-4 py-2.5">
        <h2 className="text-sm font-semibold text-slate-100">{title}</h2>
        {aside && <div className="text-xs text-slate-400">{aside}</div>}
      </header>
      <div className={cn("flex-1", !flush && "p-4")}>{children}</div>
    </section>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  label?: string;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className="inline-flex flex-wrap gap-0.5 rounded-md border border-slate-800 bg-slate-950 p-0.5 text-sm"
    >
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={o.value === value}
          onClick={() => onChange(o.value)}
          className={cn(
            "rounded px-2.5 py-1 transition-colors",
            o.value === value ? "bg-slate-700 text-slate-50" : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export const button =
  "inline-flex items-center justify-center gap-1.5 rounded-md border border-slate-700 px-3 py-1.5 text-sm text-slate-200 transition-colors hover:border-slate-500 hover:bg-slate-800 disabled:opacity-50";

/** The one filled button per screen area: the action you most likely want. */
export const primaryButton =
  "inline-flex items-center justify-center gap-1.5 rounded-md bg-sky-500 px-3 py-1.5 text-sm font-medium text-slate-950 transition-colors hover:bg-sky-400";

export const field =
  "w-full rounded-md border border-slate-700 bg-slate-950 px-2.5 py-1.5 font-mono text-sm text-slate-100 focus:border-sky-400 focus:outline-none";
