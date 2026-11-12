import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { NavLink, useLocation, useNavigate, useOutlet } from "react-router-dom";
import { AnimatePresence, motion, MotionConfig, usePresence, useReducedMotion } from "framer-motion";
import { BarChart3, NotebookPen, CalendarClock, Wallet, MessageSquareText, Calendar, ExternalLink, FolderKanban, Instagram, Link2, LogOut, Menu, Receipt, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import logo from "@/assets/logo.png";
import { cn } from "@/lib/utils";
import { getProjectsAsync } from "@/lib/storage";
import { getOptimizedUrl } from "@/lib/imagekit";
import { flyIn, flyOut, settled } from "./ui";
import { toast } from "sonner";
import { prefersReducedMotion } from "@/lib/motion";
import "./admin.css";

const NAV = [
  { to: "/admin/dashboard", label: "Projetos", icon: FolderKanban, match: ["/admin/dashboard", "/admin/projeto"] },
  { to: "/admin/eventos", label: "Eventos", icon: Calendar, match: ["/admin/eventos"] },
  { to: "/admin/agenda", label: "Agenda", icon: CalendarClock, match: ["/admin/agenda"] },
  { to: "/admin/orcamentos", label: "Orçamentos", icon: Receipt, match: ["/admin/orcamentos"] },
  { to: "/admin/financeiro", label: "Financeiro", icon: Wallet, match: ["/admin/financeiro"] },
  { to: "/admin/instagram", label: "Instagram", icon: Instagram, match: ["/admin/instagram"] },
  { to: "/admin/mensagens", label: "Mensagens", icon: MessageSquareText, match: ["/admin/mensagens"] },
  { to: "/admin/notas", label: "Anotações", icon: NotebookPen, match: ["/admin/notas"] },
  { to: "/admin/metricas", label: "Métricas", icon: BarChart3, match: ["/admin/metricas"] },
];

const EASE = [0.16, 1, 0.3, 1] as const;

/** Puts the admin theme on <body> so portalled overlays (dialogs, menus, toasts) get it too. */
export function useAdminTheme() {
  useEffect(() => {
    document.body.classList.add("admin-ui");
    return () => document.body.classList.remove("admin-ui");
  }, []);
}

/** A soft light blooms where any control is pressed. Transform + opacity only. */
function useTapBloom() {
  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      const el = (e.target as HTMLElement | null)?.closest(
        'button:not(:disabled), a, [role="tab"], [role="menuitem"], [role="option"], [role="checkbox"], [role="switch"]'
      );
      if (!el) return;
      const dot = document.createElement("span");
      dot.className = "admin-tap";
      dot.style.left = `${e.clientX}px`;
      dot.style.top = `${e.clientY}px`;
      dot.addEventListener("animationend", () => dot.remove(), { once: true });
      document.body.appendChild(dot);
      window.setTimeout(() => dot.remove(), 900);
    };
    document.addEventListener("pointerdown", onDown, { passive: true });
    return () => document.removeEventListener("pointerdown", onDown);
  }, []);
}

/** Every success toast fires the studio strobe: the "photo taken" moment. */
let flashPatched = false;
function useCameraFlash() {
  useEffect(() => {
    if (flashPatched) return;
    flashPatched = true;
    const original = toast.success;
    const fire = () => {
      if (!document.body.classList.contains("admin-ui")) return;
      const el = document.createElement("div");
      el.className = "admin-flash";
      el.addEventListener("animationend", () => el.remove(), { once: true });
      document.body.appendChild(el);
      window.setTimeout(() => el.remove(), 900);
    };
    (toast as unknown as { success: typeof toast.success }).success = ((...args: Parameters<typeof toast.success>) => {
      fire();
      return original(...args);
    }) as typeof toast.success;
  }, []);
}

/** Cards below the fold wait unseen, then rise as they scroll in (once). */
const REVEAL = ".glass-lift, [data-fly] > *, section.lg, .lg.rounded-\\[20px\\]";
function useScrollReveal(path: string) {
  useEffect(() => {
    if (prefersReducedMotion() || typeof IntersectionObserver === "undefined") return;
    const main = document.querySelector("main");
    if (!main) return;
    let batch = 0;
    let batchTimer = 0;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          const el = e.target as HTMLElement;
          io.unobserve(el);
          const delay = Math.min(batch++, 6) * 45;
          window.clearTimeout(batchTimer);
          batchTimer = window.setTimeout(() => (batch = 0), 120);
          window.setTimeout(() => {
            el.classList.add("sr-in");
            el.classList.remove("sr-wait");
            window.setTimeout(() => el.classList.remove("sr-in"), 640);
          }, delay);
        });
      },
      { rootMargin: "0px 0px -6% 0px", threshold: 0.08 }
    );
    const scan = () => {
      const vh = window.innerHeight;
      main.querySelectorAll<HTMLElement>(REVEAL).forEach((el) => {
        if (el.dataset.sr || el.closest('[role="dialog"], [aria-busy="true"], [role="status"], [data-no-fly]')) return;
        el.dataset.sr = "1";
        if (el.getBoundingClientRect().top > vh) {
          el.classList.add("sr-wait");
          io.observe(el);
        }
      });
    };
    const t = window.setTimeout(scan, 700);
    const mo = new MutationObserver(() => scan());
    mo.observe(main, { childList: true, subtree: true });
    // Safety net: if the observer ever stays silent, scrolling still reveals; nothing stays hidden.
    let lastCheck = 0;
    const onScroll = () => {
      const now = performance.now();
      if (now - lastCheck < 120) return;
      lastCheck = now;
      const vh = window.innerHeight;
      main.querySelectorAll<HTMLElement>(".sr-wait").forEach((el) => {
        if (el.getBoundingClientRect().top < vh * 0.94) {
          io.unobserve(el);
          el.classList.add("sr-in");
          el.classList.remove("sr-wait");
          window.setTimeout(() => el.classList.remove("sr-in"), 640);
        }
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("scroll", onScroll);
      mo.disconnect();
      io.disconnect();
      main.querySelectorAll(".sr-wait").forEach((el) => el.classList.remove("sr-wait"));
    };
  }, [path]);
}

/** Glass sheen follows the pointer: sets --mx/--my on the glass under it (one write per frame). */
function usePointerSheen() {
  useEffect(() => {
    if (!window.matchMedia("(hover: hover)").matches) return;
    let raf = 0;
    let last: PointerEvent | null = null;
    let tilted: HTMLElement | null = null;
    const reduce = prefersReducedMotion();
    const apply = () => {
      raf = 0;
      if (!last) return;
      const el = (last.target as HTMLElement | null)?.closest<HTMLElement>(".lg, .glass-lift");
      // Tilt: the glass card under the pointer leans toward it (max 5deg).
      const card = el?.classList.contains("glass-lift") ? el : null;
      if (tilted && tilted !== card) {
        tilted.classList.remove("is-tilting");
        tilted = null;
      }
      if (!el) return;
      const r = el.getBoundingClientRect();
      el.style.setProperty("--mx", `${last.clientX - r.left}px`);
      el.style.setProperty("--my", `${last.clientY - r.top}px`);
      if (card && !reduce && r.width < 700) {
        const px = (last.clientX - r.left) / r.width - 0.5;
        const py = (last.clientY - r.top) / r.height - 0.5;
        card.style.setProperty("--ry", `${(px * 10).toFixed(2)}deg`);
        card.style.setProperty("--rx", `${(-py * 8).toFixed(2)}deg`);
        card.classList.add("is-tilting");
        tilted = card;
      }
    };
    const onMove = (e: PointerEvent) => {
      last = e;
      if (!raf) raf = requestAnimationFrame(apply);
    };
    const onLeave = () => { tilted?.classList.remove("is-tilting"); tilted = null; };
    document.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    return () => {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
      cancelAnimationFrame(raf);
      onLeave();
    };
  }, []);
}

/** The newest album's cover, blurred once, is the light behind all the glass. */
function Backdrop() {
  const [src, setSrc] = useState<string | null>(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    let alive = true;
    getProjectsAsync()
      .then((ps) => {
        const latest = [...ps]
          .filter((p) => (p.photos?.length || 0) > 0)
          .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))[0];
        const photo = latest?.photos?.[latest.coverIndex || 0] ?? latest?.photos?.[0];
        if (alive && photo) setSrc(getOptimizedUrl(photo.url, 480));
      })
      .catch(() => {});
    return () => { alive = false; };
  }, []);
  return (
    <div className="admin-backdrop" aria-hidden="true">
      {src && <img src={src} alt="" onLoad={() => setOn(true)} className={on ? "is-on" : undefined} />}
    </div>
  );
}

/* ── Page switch: a screen's cards fold back into its sidebar item, the next screen's cards
   unfold out of theirs. ── */
const routeFly = { from: null as string | null, to: null as string | null, at: 0 };
const sectionOf = (path: string) => NAV.find((n) => n.match.some((m) => path.startsWith(m)))?.to ?? null;
const navItem = (section: string | null) =>
  section ? document.querySelector<HTMLElement>(`aside [data-nav="${section}"]`) : null;

const CARD = ".lg, .glass-lift, .bg-card, [data-fly] > *";
/** Loading placeholders and opted-out blocks never slide: only real content does. */
const NOT_FLYING = '[data-no-fly], [aria-busy="true"], [role="status"]';
/**
 * The screen's cards: outermost card-like blocks, except that a grid/list marked data-fly
 * gives its items one by one (and the block holding them is left out). Only those on screen.
 */
function pageCards(root: HTMLElement) {
  const all = Array.from(root.querySelectorAll<HTMLElement>(CARD)).filter((el) => !el.closest(NOT_FLYING));
  const isItem = (el: HTMLElement) => !!el.parentElement?.hasAttribute("data-fly");
  let keep = all.filter((el) => {
    if (isItem(el)) return true;
    const up = el.parentElement?.closest(CARD);
    return !(up && root.contains(up));
  });
  keep = keep.filter((el) => !keep.some((o) => o !== el && el.contains(o)));
  const vh = window.innerHeight;
  return keep.filter((el) => {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.bottom > -40 && r.top < vh + 40;
  });
}

function RoutePanel({ section, children }: { section: string | null; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [isPresent, safeToRemove] = usePresence();
  const reduce = useReducedMotion();

  // Enter: cards (also ones that arrive while data loads) unfold out of this section's item.
  useLayoutEffect(() => {
    const root = ref.current;
    if (!root || reduce || !routeFly.at) return;
    const origin = navItem(section);
    const flying = routeFly.to === section && routeFly.from !== section && performance.now() - routeFly.at < 2500;
    if (!flying) {
      root.animate([{ opacity: 0, transform: "translateY(12px)" }, { opacity: 1, transform: "none" }], {
        duration: 420, easing: "cubic-bezier(0.16, 1, 0.3, 1)",
      });
      return;
    }
    root.classList.add("no-rise");
    root.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 280, easing: "ease-out" });
    const seen = new WeakSet<Element>();
    const launch = () => {
      const fresh = pageCards(root).filter((el) => !seen.has(el));
      fresh.forEach((el) => seen.add(el));
      if (fresh.length) flyIn(fresh, origin);
    };
    launch();
    const mo = new MutationObserver(launch);
    mo.observe(root, { childList: true, subtree: true });
    const stop = window.setTimeout(() => mo.disconnect(), 4000);
    return () => { mo.disconnect(); window.clearTimeout(stop); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Exit: cards fold back into this section's item, the rest fades.
  useEffect(() => {
    if (isPresent) return;
    const root = ref.current;
    const origin = navItem(section);
    const flying = routeFly.from === section && routeFly.to !== section;
    if (!root || reduce) { safeToRemove?.(); return; }
    if (!flying) {
      root.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 140, fill: "forwards" })
        .finished.then(() => safeToRemove?.(), () => safeToRemove?.());
      return;
    }
    const anims = flyOut(pageCards(root), origin);
    anims.push(root.animate([{ opacity: 1 }, { opacity: 1, offset: 0.6 }, { opacity: 0 }], { duration: 420, fill: "forwards" }));
    settled(anims).then(() => safeToRemove?.());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPresent]);

  return <div ref={ref}>{children}</div>;
}

/** Keeps the outgoing screen on stage while it animates out. */
function FrozenOutlet() {
  const outlet = useOutlet();
  const [frozen] = useState(outlet);
  return frozen;
}

/**
 * Frame for every signed-in admin screen: a floating black rail with the four
 * areas and site links (a sliding sheet on phones), and the screen on the right.
 */
export default function AdminShell() {
  useAdminTheme();
  useTapBloom();
  usePointerSheen();
  useCameraFlash();
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, profile } = useAuth();

  const lastPath = useRef(location.pathname);
  if (lastPath.current !== location.pathname) {
    routeFly.from = sectionOf(lastPath.current);
    routeFly.to = sectionOf(location.pathname);
    routeFly.at = performance.now();
    lastPath.current = location.pathname;
  }

  useEffect(() => setOpen(false), [location.pathname]);
  useScrollReveal(location.pathname);

  const logout = async () => {
    await signOut();
    navigate("/admin");
  };

  const nav = (layoutId: string) => (
    <nav aria-label="Painel" className="flex flex-1 flex-col gap-1">
      {NAV.map(({ to, label, icon: Icon, match }) => {
        const active = match.some((m) => location.pathname.startsWith(m));
        return (
          <NavLink
            key={to}
            to={to}
            data-nav={to}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-medium",
              active ? "text-white" : "text-white/55 hover:text-white"
            )}
          >
            {active && (
              <motion.span
                layoutId={layoutId}
                aria-hidden="true"
                className="liquid-pill-dark absolute inset-0 rounded-xl"
                transition={{ type: "spring", stiffness: 520, damping: 40, mass: 0.8 }}
              />
            )}
            <Icon className="relative h-[18px] w-[18px]" aria-hidden="true" />
            <span className="relative">{label}</span>
          </NavLink>
        );
      })}

      <div className="mt-auto flex flex-col gap-1 border-t border-white/[0.08] pt-3">
        <a href="/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] text-white/55 hover:bg-white/[0.06] hover:text-white">
          <ExternalLink className="h-[18px] w-[18px]" aria-hidden="true" /> Ver site
        </a>
        <NavLink
          to="/admin/links"
          className={({ isActive }) => cn(
            "flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] hover:bg-white/[0.06] hover:text-white",
            isActive ? "bg-white/[0.1] text-white" : "text-white/55"
          )}
        >
          <Link2 className="h-[18px] w-[18px]" aria-hidden="true" /> Página de links
        </NavLink>
        <button type="button" onClick={logout} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[15px] text-white/55 hover:bg-white/[0.06] hover:text-white">
          <LogOut className="h-[18px] w-[18px]" aria-hidden="true" /> Sair
        </button>
        {profile?.email && <p className="truncate px-3 pt-2 text-[13px] text-white/45">{profile.email}</p>}
      </div>
    </nav>
  );

  const brand = (
    <div className="flex items-center gap-2.5">
      <img src={logo} alt="" width={1024} height={1024} className="h-7 w-auto" style={{ filter: "brightness(0) invert(1)" }} />
      <span className="font-marquee text-[1.35rem] font-black uppercase leading-none text-white">GoFocus</span>
    </div>
  );

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen text-foreground">
        <Backdrop />
        {/* Desktop: floating black rail */}
        <aside className="lg lg-dark fixed bottom-3 left-3 top-3 z-30 hidden w-[232px] flex-col gap-7 rounded-[24px] bg-black px-3 py-5 shadow-[0_30px_60px_-30px_rgba(0,0,0,0.8)] lg:flex">
          <div className="px-2">{brand}</div>
          {nav("rail-active")}
        </aside>

        {/* Phone / tablet top bar */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between bg-black px-4 lg:hidden">
          {brand}
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Abrir menu"
            aria-expanded={open}
            className="grid h-10 w-10 place-items-center rounded-xl text-white hover:bg-white/10"
          >
            <Menu className="h-5 w-5" />
          </button>
        </header>

        <AnimatePresence>
          {open && (
            <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu do painel">
              <motion.button
                type="button"
                aria-label="Fechar menu"
                className="absolute inset-0 bg-black/60"
                onClick={() => setOpen(false)}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
              />
              <motion.div
                className="absolute inset-y-2 left-2 flex w-[min(300px,85vw)] flex-col gap-6 overflow-y-auto overscroll-contain rounded-[22px] bg-black px-3 py-4"
                initial={{ x: "-105%" }}
                animate={{ x: 0 }}
                exit={{ x: "-105%" }}
                transition={{ duration: 0.42, ease: EASE }}
              >
                <div className="flex items-center justify-between px-2">
                  {brand}
                  <button type="button" onClick={() => setOpen(false)} aria-label="Fechar menu" className="grid h-10 w-10 place-items-center rounded-xl text-white hover:bg-white/10">
                    <X className="h-5 w-5" />
                  </button>
                </div>
                {nav("sheet-active")}
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <main className="lg:pl-[256px]">
          <AnimatePresence mode="wait" initial={false}>
            <RoutePanel key={location.pathname} section={sectionOf(location.pathname)}>
              <FrozenOutlet />
            </RoutePanel>
          </AnimatePresence>
        </main>
      </div>
    </MotionConfig>
  );
}
