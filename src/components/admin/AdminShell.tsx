import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Calendar, ExternalLink, FolderKanban, Instagram, Link2, LogOut, Menu, Receipt, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import logo from "@/assets/logo.png";
import { cn } from "@/lib/utils";
import "./admin.css";

const NAV = [
  { to: "/admin/dashboard", label: "Projetos", icon: FolderKanban, match: ["/admin/dashboard", "/admin/projeto"] },
  { to: "/admin/eventos", label: "Eventos", icon: Calendar, match: ["/admin/eventos"] },
  { to: "/admin/orcamentos", label: "Orçamentos", icon: Receipt, match: ["/admin/orcamentos"] },
  { to: "/admin/instagram", label: "Instagram", icon: Instagram, match: ["/admin/instagram"] },
];

/** Puts the admin theme on <body> so portalled overlays (dialogs, menus, toasts) get it too. */
export function useAdminTheme() {
  useEffect(() => {
    document.body.classList.add("admin-ui");
    return () => document.body.classList.remove("admin-ui");
  }, []);
}

/**
 * Frame for every signed-in admin screen: a quiet sidebar with the four areas
 * and site links (a menu sheet on phones), and the screen itself on the right.
 */
export default function AdminShell() {
  useAdminTheme();
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, profile } = useAuth();

  useEffect(() => setOpen(false), [location.pathname]);

  const logout = async () => {
    await signOut();
    navigate("/admin");
  };

  const nav = (
    <nav aria-label="Painel" className="flex flex-1 flex-col gap-1">
      {NAV.map(({ to, label, icon: Icon, match }) => {
        const active = match.some((m) => location.pathname.startsWith(m));
        return (
          <NavLink
            key={to}
            to={to}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] font-medium transition-colors duration-150",
              active ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground"
            )}
          >
            <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
            {label}
          </NavLink>
        );
      })}

      <div className="mt-auto flex flex-col gap-1 border-t border-border pt-3">
        <a href="/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
          <ExternalLink className="h-[18px] w-[18px]" aria-hidden="true" /> Ver site
        </a>
        <a href="/links" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
          <Link2 className="h-[18px] w-[18px]" aria-hidden="true" /> Página de links
        </a>
        <button type="button" onClick={logout} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[15px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
          <LogOut className="h-[18px] w-[18px]" aria-hidden="true" /> Sair
        </button>
        {profile?.email && <p className="truncate px-3 pt-2 text-[13px] text-muted-foreground">{profile.email}</p>}
      </div>
    </nav>
  );

  const brand = (
    <div className="flex items-center gap-2.5">
      <img src={logo} alt="" width={1024} height={1024} className="h-7 w-auto" style={{ filter: "brightness(0) invert(1)" }} />
      <span className="font-marquee text-[1.35rem] font-black uppercase leading-none text-foreground">GoFocus</span>
      <span className="rounded-md bg-secondary px-1.5 py-0.5 text-[12px] font-medium text-muted-foreground">Painel</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[232px] flex-col gap-6 border-r border-border bg-[hsl(var(--admin-sidebar))] px-3 py-5 lg:flex">
        <div className="px-2">{brand}</div>
        {nav}
      </aside>

      {/* Phone / tablet top bar */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-[hsl(var(--admin-sidebar))] px-4 lg:hidden">
        {brand}
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Abrir menu"
          aria-expanded={open}
          className="grid h-10 w-10 place-items-center rounded-lg text-foreground hover:bg-accent"
        >
          <Menu className="h-5 w-5" />
        </button>
      </header>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu do painel">
          <button type="button" aria-label="Fechar menu" className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-[min(300px,85vw)] flex-col gap-6 overflow-y-auto border-r border-border bg-[hsl(var(--admin-sidebar))] px-3 py-4 overscroll-contain">
            <div className="flex items-center justify-between px-2">
              {brand}
              <button type="button" onClick={() => setOpen(false)} aria-label="Fechar menu" className="grid h-10 w-10 place-items-center rounded-lg hover:bg-accent">
                <X className="h-5 w-5" />
              </button>
            </div>
            {nav}
          </div>
        </div>
      )}

      <main className="lg:pl-[232px]">
        <Outlet />
      </main>
    </div>
  );
}
