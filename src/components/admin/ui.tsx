import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/*
 * Admin building blocks. Use these with the stock shadcn/ui components
 * (Button, Input, Textarea, Select, Dialog, DropdownMenu, Tabs, Switch, Badge),
 * which take the admin look from admin.css. Type scale (fixed): 12, 13, 14, 15, 17, 20, 24px.
 */

/** Page title row: title, one-line description, actions on the right. Sits at the top of every admin screen. */
export function AdminPage({
  title,
  description,
  actions,
  back,
  children,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  /** Optional back link/button rendered above the title. */
  back?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mx-auto w-full max-w-6xl px-4 pb-16 pt-6 sm:px-8 sm:pt-8", className)}>
      {back && <div className="mb-3">{back}</div>}
      <div className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-[24px] font-semibold tracking-[-0.01em] text-foreground">{title}</h1>
          {description && <p className="mt-1 max-w-[70ch] text-[15px] text-muted-foreground">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
      <div className="mt-6">{children}</div>
    </div>
  );
}

/** A grouped surface for related content or a form section. */
export function Panel({
  title,
  description,
  actions,
  children,
  className,
  bodyClassName,
}: {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={cn("rounded-xl border border-border bg-card", className)}>
      {(title || actions) && (
        <header className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div className="min-w-0">
            {title && <h2 className="text-[17px] font-semibold text-foreground">{title}</h2>}
            {description && <p className="mt-0.5 text-[14px] text-muted-foreground">{description}</p>}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className={cn("p-5", bodyClassName)}>{children}</div>
    </section>
  );
}

/** Label + control + hint/error, stacked. Pass `htmlFor` matching the control's id. */
export function Field({
  label,
  htmlFor,
  hint,
  error,
  children,
  className,
}: {
  label: ReactNode;
  htmlFor?: string;
  hint?: ReactNode;
  error?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={htmlFor} className="text-[14px] font-medium text-foreground">
        {label}
      </label>
      {children}
      {error ? (
        <p className="text-[13px] text-destructive">{error}</p>
      ) : hint ? (
        <p className="text-[13px] text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

type Tone = "neutral" | "success" | "warning" | "danger" | "info";
const TONES: Record<Tone, string> = {
  neutral: "bg-secondary text-foreground",
  success: "bg-[hsl(var(--admin-success)/0.15)] text-[hsl(var(--admin-success))]",
  warning: "bg-[hsl(var(--admin-warning)/0.15)] text-[hsl(var(--admin-warning))]",
  danger: "bg-destructive/15 text-destructive",
  info: "bg-[hsl(var(--admin-info)/0.15)] text-[hsl(var(--admin-info))]",
};

/** Status pill: published/draft, paid/pending, active/inactive. Colour is status only. */
export function StatusBadge({ tone = "neutral", children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[13px] font-medium", TONES[tone], className)}>
      {tone !== "neutral" && <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

/** Empty state that tells the user what to do next. */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center rounded-xl border border-dashed border-input px-6 py-14 text-center", className)}>
      {icon && <div className="mb-4 grid h-12 w-12 place-items-center rounded-full bg-secondary text-muted-foreground [&_svg]:h-5 [&_svg]:w-5">{icon}</div>}
      <p className="text-[17px] font-semibold text-foreground">{title}</p>
      {description && <p className="mt-1 max-w-[46ch] text-[15px] text-muted-foreground">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/** Segmented control for switching views within a screen (not for site navigation). */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
  className,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: ReactNode; count?: number }[];
  label: string;
  className?: string;
}) {
  return (
    <div role="tablist" aria-label={label} className={cn("inline-flex max-w-full overflow-x-auto rounded-lg border border-border bg-muted p-1", className)}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => onChange(o.value)}
            className={cn(
              "inline-flex items-center gap-2 whitespace-nowrap rounded-md px-3.5 py-1.5 text-[14px] font-medium transition-colors duration-150",
              on ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground"
            )}
          >
            {o.label}
            {typeof o.count === "number" && (
              <span className={cn("rounded-full px-1.5 text-[12px]", on ? "bg-black/10" : "bg-secondary")}>{o.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/** Inline loading state for a region (use Skeleton for lists and grids). */
export function LoadingBlock({ label = "Carregando…" }: { label?: string }) {
  return (
    <div role="status" className="flex items-center justify-center gap-2 py-16 text-[15px] text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> {label}
    </div>
  );
}

/** Small uppercase-free section label inside panels and lists. */
export function SectionLabel({ children, className }: { children: ReactNode; className?: string }) {
  return <h3 className={cn("text-[13px] font-semibold text-muted-foreground", className)}>{children}</h3>;
}
