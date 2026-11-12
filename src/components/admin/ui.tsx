import { forwardRef, useEffect, useId, useLayoutEffect, useRef, useState, type ComponentPropsWithoutRef, type ReactNode } from "react";
import { AnimatePresence, motion, usePresence, useReducedMotion } from "framer-motion";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { Check, Copy, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CSS_EASE_OUT } from "@/lib/motion";

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
    <div className={cn("mx-auto w-full max-w-6xl px-4 pb-16 pt-6 sm:px-8 sm:pt-9", className)}>
      {back && <div className="reveal mb-3">{back}</div>}
      <div className="reveal flex flex-col gap-4 pb-7 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-[28px] font-semibold tracking-[-0.02em] text-white"><TitleReveal>{title}</TitleReveal></h1>
          {description && <p className="mt-1 max-w-[70ch] text-[15px] text-muted-foreground">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
      <div className="stagger">{children}</div>
    </div>
  );
}

/** Page titles rise word by word out of a mask; non-text titles render as they are. */
function TitleReveal({ children }: { children: ReactNode }) {
  if (typeof children !== "string") return <>{children}</>;
  const words = children.split(" ");
  return (
    <span aria-label={children}>
      {words.map((w, i) => (
        <span key={i} aria-hidden="true" className="inline-block overflow-hidden pb-[0.08em] align-bottom">
          <span className="title-word inline-block" style={{ animationDelay: `${60 + i * 45}ms` }}>
            {w}
            {i < words.length - 1 ? "\u00a0" : ""}
          </span>
        </span>
      ))}
    </span>
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
    <section className={cn("lg reveal rounded-[20px] border border-border bg-card", className)}>
      {(title || actions) && (
        <header className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-5 py-4 sm:px-6">
          <div className="min-w-0">
            {title && <h2 className="text-[17px] font-semibold text-foreground">{title}</h2>}
            {description && <p className="mt-0.5 text-[14px] text-muted-foreground">{description}</p>}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className={cn("p-5 sm:p-6", bodyClassName)}>{children}</div>
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
    <div className={cn("lg reveal flex flex-col items-center rounded-[20px] border border-dashed border-input bg-white/[0.03] px-6 py-14 text-center", className)}>
      {icon && <div className="empty-float mb-4 grid h-12 w-12 place-items-center rounded-full bg-secondary text-muted-foreground [&_svg]:h-5 [&_svg]:w-5">{icon}</div>}
      <p className="text-[17px] font-semibold text-foreground">{title}</p>
      {description && <p className="mt-1 max-w-[46ch] text-[15px] text-muted-foreground">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/* Where each tab button sits, so a tab's content can fly out of / back into it. */
const tabOrigins = new Map<string, HTMLElement>();
const lastSwitch = new Map<string, number>();
// Exits are quick and never ease-in (the eye is on them); arrivals decelerate hard.
const FLY_EASE_OUT = CSS_EASE_OUT;

function flyTargets(root: HTMLElement) {
  const list = Array.from(
    root.querySelectorAll<HTMLElement>(":scope > :not([data-fly]), :scope [data-fly] > *")
  ).filter((el) => !el.querySelector("[data-fly]") && !el.closest('[data-no-fly], [aria-busy="true"], [role="status"]'));
  const vh = window.innerHeight;
  return list.filter((el) => {
    const r = el.getBoundingClientRect();
    return r.bottom > -40 && r.top < vh + 40 && r.width > 0;
  });
}

function vectorTo(el: HTMLElement, origin: HTMLElement) {
  const a = el.getBoundingClientRect();
  const b = origin.getBoundingClientRect();
  return {
    dx: b.left + b.width / 2 - (a.left + a.width / 2),
    dy: b.top + b.height / 2 - (a.top + a.height / 2),
  };
}

/** An origin we can fly to: on screen and actually laid out (not a hidden duplicate control). */
export function usable(origin?: HTMLElement | null): origin is HTMLElement {
  if (!origin || !origin.isConnected) return false;
  const r = origin.getBoundingClientRect();
  return r.width > 0 && r.height > 0;
}

/** Where cards hide: just behind the black sidebar (or off the left edge on phones). */
function hideOffset(el: HTMLElement) {
  const rail = document.querySelector<HTMLElement>("aside.lg");
  const rr = rail?.getBoundingClientRect();
  const edge = rr && rr.width > 0 ? rr.left + 12 : -24;
  const r = el.getBoundingClientRect();
  return Math.min(-40, edge - r.right);
}

/** Left to right, top to bottom: the order cards slide in and out. */
function byPosition(items: HTMLElement[]) {
  return items
    .map((el) => ({ el, r: el.getBoundingClientRect() }))
    .sort((a, b) => a.r.left - b.r.left || a.r.top - b.r.top)
    .map((x) => x.el);
}

/** Cards slide back in from behind the sidebar, left ones first. */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function flyIn(items: HTMLElement[], _origin?: HTMLElement | null) {
  return byPosition(items).map((el, i) => {
    const dx = hideOffset(el);
    return el.animate(
      [
        { transform: `translate3d(${dx}px, 0, 0)`, opacity: 0 },
        { opacity: 1, offset: 0.3 },
        { transform: "translate3d(0, 0, 0)", opacity: 1 },
      ],
      { duration: 460, delay: Math.min(i, 8) * 30, easing: FLY_EASE_OUT, fill: "backwards" }
    );
  });
}

/** Cards slide left and hide behind the sidebar, left ones first. */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function flyOut(items: HTMLElement[], _origin?: HTMLElement | null) {
  return byPosition(items).map((el, i) => {
    const dx = hideOffset(el);
    return el.animate(
      [
        { transform: "translate3d(0, 0, 0)", opacity: 1 },
        { transform: `translate3d(${dx * 0.35}px, 0, 0)`, opacity: 0 },
      ],
      { duration: 200, delay: Math.min(i, 8) * 12, easing: FLY_EASE_OUT, fill: "forwards" }
    );
  });
}

export const settled = (anims: Animation[]) => Promise.all(anims.map((a) => a.finished.catch(() => undefined)));

/**
 * Content of one tab of a <Segmented>. Use inside <AnimatePresence mode="wait" initial={false}>
 * with a key per tab (or just use <FlySwitch>). On switch, the old tab's items shrink back into
 * their tab button and the new tab's items spring out of theirs. Items are the panel's direct
 * children, or the children of any element marked data-fly (a grid or list).
 */
export function TabPanel({ group, value, children, className }: {
  group: string;
  value: string;
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [isPresent, safeToRemove] = usePresence();
  const reduce = useReducedMotion();
  const recent = () => performance.now() - (lastSwitch.get(group) ?? -1e9) < 1500;

  useLayoutEffect(() => {
    const root = ref.current;
    const origin = tabOrigins.get(`${group}:${value}`);
    if (!root || reduce || !recent()) return;
    if (usable(origin)) flyIn(flyTargets(root), origin);
    else root.animate([{ opacity: 0, transform: "translateY(10px)" }, { opacity: 1, transform: "none" }], { duration: 380, easing: FLY_EASE_OUT });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isPresent) return;
    const root = ref.current;
    const origin = tabOrigins.get(`${group}:${value}`);
    if (!root || reduce || !recent() || !usable(origin)) {
      safeToRemove?.();
      return;
    }
    settled(flyOut(flyTargets(root), origin)).then(() => safeToRemove?.());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPresent]);

  return (
    <div ref={ref} className={className} style={{ animation: "none" }}>
      {children}
    </div>
  );
}

/**
 * Swaps content when a <Segmented> changes, flying items into/out of its buttons.
 * `group` is the Segmented's label, `value` its current value.
 */
export function FlySwitch({ group, value, children, className }: {
  group: string;
  value: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      <TabPanel key={value} group={group} value={value} className={className}>
        {children}
      </TabPanel>
    </AnimatePresence>
  );
}

/**
 * Drop-in for shadcn <Tabs>: the active panel's blocks shrink into the old tab trigger,
 * then the new panel's blocks spring out of the new trigger. Works controlled or not.
 */
export const FlyTabs = forwardRef<HTMLDivElement, ComponentPropsWithoutRef<typeof TabsPrimitive.Root>>(
  function FlyTabs({ value: controlled, defaultValue, onValueChange, ...rest }, fwd) {
    const [inner, setInner] = useState(defaultValue);
    const value = controlled ?? inner;
    const root = useRef<HTMLDivElement | null>(null);
    const pending = useRef<string | null>(null);
    const running = useRef<Animation[]>([]);
    const reduce = useReducedMotion();

    const own = (sel: string) =>
      Array.from(root.current?.querySelectorAll<HTMLElement>(sel) ?? []).find(
        (el) => el.closest("[data-fly-tabs]") === root.current
      );

    const commit = (next: string) => {
      pending.current = next;
      if (controlled === undefined) setInner(next);
      onValueChange?.(next);
    };

    const target = useRef<string | null>(null);
    const token = useRef(0);

    const change = (next: string) => {
      // Radix fires on both mousedown and focus: ignore the repeat of a switch in flight.
      if (next === value || next === target.current) return;
      const panel = own('[role="tabpanel"][data-state="active"]');
      const trigger = own('[role="tab"][data-state="active"]');
      const my = ++token.current;
      target.current = next;
      if (reduce || !panel || !usable(trigger)) {
        target.current = null;
        return commit(next);
      }
      // A new pick mid-flight keeps flying out from where things are, then goes to the latest pick.
      if (running.current.length === 0) running.current = flyOut(flyTargets(panel), trigger);
      settled(running.current).then(() => {
        if (my !== token.current) return;
        running.current = [];
        target.current = null;
        commit(next);
      });
    };

    useLayoutEffect(() => {
      if (pending.current !== value) return;
      pending.current = null;
      if (reduce) return;
      // Radix mounts the new panel's content in a follow-up sync render; catch it before paint.
      queueMicrotask(() => {
        const panel = own('[role="tabpanel"][data-state="active"]');
        const trigger = own('[role="tab"][data-state="active"]');
        if (panel && usable(trigger)) flyIn(flyTargets(panel), trigger);
      });
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value]);

    return (
      <TabsPrimitive.Root
        {...rest}
        data-fly-tabs=""
        value={value}
        onValueChange={change}
        ref={(el) => {
          root.current = el;
          if (typeof fwd === "function") fwd(el);
          else if (fwd) fwd.current = el;
        }}
      />
    );
  }
);

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
  const id = useId();
  return (
    <div role="tablist" aria-label={label} className={cn("admin-seg lg relative inline-flex max-w-full overflow-x-auto rounded-full border border-white/[0.08] bg-black/25 p-1", className)}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="tab"
            aria-selected={on}
            ref={(el) => {
              const k = `${label}:${o.value}`;
              if (el) tabOrigins.set(k, el);
              else if (tabOrigins.get(k) && !tabOrigins.get(k)!.isConnected) tabOrigins.delete(k);
            }}
            onClick={() => {
              if (o.value !== value) lastSwitch.set(label, performance.now());
              onChange(o.value);
            }}
            className={cn(
              "relative z-[4] inline-flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-1.5 text-[14px] font-medium",
              on ? "text-[#141318]" : "text-muted-foreground hover:text-white"
            )}
          >
            {on && (
              <motion.span
                layoutId={`seg-${id}`}
                aria-hidden="true"
                className="liquid-pill absolute inset-0 rounded-full"
                transition={{ type: "spring", stiffness: 520, damping: 38, mass: 0.8 }}
              />
            )}
            <span className="relative">{o.label}</span>
            {typeof o.count === "number" && (
              <span className={cn("relative rounded-full px-1.5 text-[12px]", on ? "bg-black/10" : "bg-white/10")}>{o.count}</span>
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

/** A number that counts up from 0 when it first appears (and to each new value). */
export function CountUp({ value, className }: { value: number; className?: string }) {
  const reduce = useReducedMotion();
  const [shown, setShown] = useState(reduce ? value : 0);
  const from = useRef(0);
  useEffect(() => {
    if (reduce) { setShown(value); return; }
    const start = performance.now();
    const a = from.current;
    const dur = 900;
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      const e = 1 - Math.pow(1 - p, 4);
      setShown(Math.round(a + (value - a) * e));
      if (p < 1) raf = requestAnimationFrame(tick);
      else from.current = value;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, reduce]);
  return <span className={className}>{shown.toLocaleString("pt-BR")}</span>;
}

/** Shown while a tab's data lives only in this browser: one SQL step makes it sync everywhere. */
export function LocalOnlyNotice({ sql, what }: { sql: string; what: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="lg mb-4 flex flex-col gap-3 rounded-[18px] border border-border bg-card px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="text-[14px] font-medium text-white">{what}</p>
        <p className="text-[13px] text-muted-foreground">
          Para ver no celular também, cole o comando no Supabase (SQL Editor) e clique em Run, uma vez. O que já existe aqui sobe sozinho.
        </p>
      </div>
      <Button
        variant="outline"
        size="sm"
        className="shrink-0 rounded-full"
        onClick={() => {
          navigator.clipboard?.writeText(sql);
          setCopied(true);
          toast.success("Comando copiado. Cole no SQL Editor do Supabase e clique em Run.");
        }}
      >
        {copied ? <Check /> : <Copy />} {copied ? "Copiado" : "Copiar comando"}
      </Button>
    </div>
  );
}
