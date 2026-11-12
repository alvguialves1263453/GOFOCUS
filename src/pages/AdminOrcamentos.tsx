import { useState, useEffect, useMemo, useRef, type MouseEvent as RMouseEvent, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useOrcamentos } from "@/hooks/useOrcamentos";
import { servicos, categorias, formatarValor, getServicoById, getServicosPorCategoria, type Servico } from "@/data/servicos";
import type { Orcamento, OrcamentoStatus, DescontoTipo } from "@/lib/orcamentosStorage";
import { previewNextNumero } from "@/lib/orcamentosStorage";

import {
  Search, Plus, X, ShoppingCart, Trash2, FileText, Eye,
  Copy, Download, MessageCircle, Mail,
  Check, Loader2, Minus,
  Clock, Save, CheckCircle2, Ban, Send,
  User, ArrowRight, MoreHorizontal,
  Camera, Film, Share2, TrendingUp, Palette, Printer, Target, Sparkles,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AdminPage, Field, StatusBadge, EmptyState, Segmented, LoadingBlock, SectionLabel, FlySwitch, CountUp } from "@/components/admin/ui";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { jsPDF } from "jspdf";

type ViewMode = "catalog" | "history";
type CartStep = "items" | "client" | "review";

const CATEGORY_ICONS: Record<string, typeof Camera> = {
  Fotografia: Camera,
  Storymaker: Film,
  "Social Media": Share2,
  "Tráfego Pago": TrendingUp,
  Branding: Palette,
  Gráfica: Printer,
  Captação: Target,
};

interface CartItem {
  servicoId: string;
  nome: string;
  categoria: string;
  descricao: string;
  quantidade: number;
  valorUnitario: number;
  observacoes: string;
}

interface ClientData {
  nome: string; empresa: string; telefone: string;
  whatsapp: string; email: string; observacoes: string;
}

const emptyClient: ClientData = {
  nome: "", empresa: "", telefone: "", whatsapp: "", email: "", observacoes: "",
};

function getEntregaInfo(item: CartItem): string {
  const map: Record<string, string> = {
    "social-media-pacote-fotos": "10 fotos",
    "captacao-1h": "1 hora de captação",
    "social-media-arte-feed": "1 arte para feed",
    "social-media-arte-story": "1 arte para story",
    "social-media-video-story": "1 vídeo para story",
    "social-media-reels": "1 reels",
    "social-media-fotos": "1 foto",
    "social-media-gerenciamento": "1 mês de gestão",
    "fotografia-1-2h": "1 hora de fotografia (15 fotos editadas)",
    "fotografia-3-5h": "1 hora de fotografia (15 fotos editadas)",
    "fotografia-5h+": "1 hora de fotografia (15 fotos editadas)",
    "storymaker-basico": "1 hora (1 story + 2 criativos)",
    "storymaker-intermediario": "1 hora (1 story + 2 criativos + 1 reels)",
    "storymaker-avancado": "1 hora (2 stories + 4 criativos + 1 reels)",
    "design-identidade-visual": "1 identidade visual completa",
    "grafica-arte-simples": "1 arte simples",
    "grafica-arte-basica": "1 arte básica",
    "grafica-arte-intermediaria": "1 arte intermediária",
    "grafica-arte-avancada": "1 arte avançada",
    "grafica-arte-premium": "1 arte premium",
    "trafego-pago-basico": "1 mês de gestão básica",
    "trafego-pago-intermediario": "1 mês de gestão intermediária",
    "trafego-pago-avancado": "1 mês de gestão avançada",
    "trafego-pago-premium": "1 mês de gestão premium",
  };
  return map[item.servicoId] || `${item.quantidade}x ${item.nome}`;
}

function getTotalEntrega(item: CartItem): string {
  const base = getEntregaInfo(item);
  const match = base.match(/^(\d+)\s(.+)/);
  if (match) {
    const qtd = parseInt(match[1]) * item.quantidade;
    return `${qtd} ${match[2]}`;
  }
  return `${item.quantidade}x ${base}`;
}

const statusTone: Record<OrcamentoStatus, "neutral" | "success" | "warning" | "danger" | "info"> = {
  rascunho: "warning",
  enviado: "info",
  aprovado: "success",
  recusado: "danger",
  expirado: "neutral",
};

const statusLabels: Record<OrcamentoStatus, string> = {
  rascunho: "Rascunho", enviado: "Enviado", aprovado: "Aprovado",
  recusado: "Recusado", expirado: "Expirado",
};

const statusActionLabels: Record<OrcamentoStatus, string> = {
  rascunho: "Marcar como rascunho", enviado: "Marcar como enviado", aprovado: "Marcar como aprovado",
  recusado: "Marcar como recusado", expirado: "Marcar como expirado",
};

const statusActions: Record<OrcamentoStatus, OrcamentoStatus[]> = {
  rascunho: ["enviado"],
  enviado: ["aprovado", "recusado"],
  aprovado: [],
  recusado: [],
  expirado: [],
};

const STEP_LABELS: Record<CartStep, string> = { items: "Itens", client: "Cliente", review: "Revisão" };
const STEPS: CartStep[] = ["items", "client", "review"];
const DESKTOP_QUERY = "(min-width: 1024px)";

export default function AdminOrcamentos() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const { orcamentos, isLoading: orcLoading, createOrcamento, updateOrcamento, deleteOrcamento } = useOrcamentos();

  const [viewMode, setViewMode] = useState<ViewMode>("catalog");
  const [cartStep, setCartStep] = useState<CartStep>("items");
  const [cartOpen, setCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState(searchParams.get("categoria") || "all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [historySearch, setHistorySearch] = useState("");

  const [cart, setCart] = useState<CartItem[]>([]);
  const [clientData, setClientData] = useState<ClientData>(emptyClient);
  const [observacoesGerais, setObservacoesGerais] = useState("");
  const [prazoEntrega, setPrazoEntrega] = useState("");
  const [validade, setValidade] = useState(30);
  const [descontoTipo, setDescontoTipo] = useState<DescontoTipo>("nenhum");
  const [descontoValor, setDescontoValor] = useState(0);

  const [selectedServico, setSelectedServico] = useState<Servico | null>(null);
  const [viewingOrcamento, setViewingOrcamento] = useState<Orcamento | null>(null);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showCustomItem, setShowCustomItem] = useState(false);
  const [customItemNome, setCustomItemNome] = useState("");
  const [customItemValor, setCustomItemValor] = useState(0);
  const [customItemQtd, setCustomItemQtd] = useState(1);

  const cartRef = useRef<HTMLDivElement>(null);
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== "undefined" && window.matchMedia(DESKTOP_QUERY).matches
  );

  useEffect(() => {
    const mq = window.matchMedia(DESKTOP_QUERY);
    const onChange = () => setIsDesktop(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (!authLoading && !user) navigate("/admin");
  }, [authLoading, user, navigate]);


  const filteredServicos = useMemo(() => {
    return servicos.filter(s => {
      const matchSearch = s.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.descricao.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCategory = filterCategory === "all" || s.categoria === filterCategory;
      return matchSearch && matchCategory;
    });
  }, [searchQuery, filterCategory]);

  const filteredCategorias = useMemo(() => {
    return [...new Set(filteredServicos.map(s => s.categoria))].sort();
  }, [filteredServicos]);

  const cartSubtotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.valorUnitario * item.quantidade, 0);
  }, [cart]);

  const cartTotalItems = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.quantidade, 0);
  }, [cart]);

  const cartValorFinal = useMemo(() => {
    if (descontoTipo === "percentual") return cartSubtotal - (cartSubtotal * descontoValor / 100);
    if (descontoTipo === "fixo") return Math.max(0, cartSubtotal - descontoValor);
    return cartSubtotal;
  }, [cartSubtotal, descontoTipo, descontoValor]);

  const hasDiscount = descontoTipo !== "nenhum" && descontoValor > 0;

  function addToCart(servico: Servico) {
    setCart(prev => {
      const existing = prev.find(item => item.servicoId === servico.id);
      if (existing) {
        return prev.map(item =>
          item.servicoId === servico.id ? { ...item, quantidade: item.quantidade + 1 } : item
        );
      }
      return [...prev, {
        servicoId: servico.id, nome: servico.nome, categoria: servico.categoria,
        descricao: servico.descricao, quantidade: 1, valorUnitario: servico.valor, observacoes: "",
      }];
    });
  }

  function addCustomItem() {
    if (!customItemNome.trim()) { toast.error("Digite um nome para o item"); return; }
    if (customItemValor <= 0) { toast.error("Digite um valor válido"); return; }
    const id = `custom-${Date.now()}`;
    setCart(prev => [...prev, {
      servicoId: id, nome: customItemNome.trim(), categoria: "Personalizado",
      descricao: "", quantidade: customItemQtd, valorUnitario: customItemValor, observacoes: "",
    }]);
    setCustomItemNome(""); setCustomItemValor(0); setCustomItemQtd(1);
    setShowCustomItem(false);
    toast.success("Item personalizado adicionado", { duration: 2000 });
  }

  function removeFromCart(servicoId: string) {
    setCart(prev => prev.filter(item => item.servicoId !== servicoId));
  }

  function updateCartItem(servicoId: string, updates: Partial<CartItem>) {
    setCart(prev => prev.map(item =>
      item.servicoId === servicoId ? { ...item, ...updates } : item
    ));
  }

  function clearCart() {
    setCart([]); setClientData(emptyClient); setObservacoesGerais("");
    setPrazoEntrega(""); setValidade(30); setDescontoTipo("nenhum");
    setDescontoValor(0); setCartStep("items"); setCartOpen(false);
  }

  function handleQuantityChange(servicoId: string, delta: number) {
    setCart(prev => prev.map(item => {
      if (item.servicoId !== servicoId) return item;
      return { ...item, quantidade: Math.max(1, item.quantidade + delta) };
    }));
  }

  function getMaxPrazo(): string {
    let max = "";
    for (const item of cart) {
      const serv = getServicoById(item.servicoId);
      if (serv?.prazo && serv.prazo.length > max.length) max = serv.prazo;
    }
    return max || prazoEntrega;
  }

  async function handleGeneratePDF(orcamentoData?: Orcamento) {
    setGeneratingPDF(true);
    try {
      const data = orcamentoData || {
        numero: previewNextNumero(), cliente_nome: clientData.nome, cliente_empresa: clientData.empresa,
        cliente_telefone: clientData.telefone, cliente_whatsapp: clientData.whatsapp,
        cliente_email: clientData.email, cliente_observacoes: clientData.observacoes,
        servicos: cart, subtotal: cartSubtotal,
        desconto_tipo: descontoTipo, desconto_valor: descontoValor,
        valor_final: cartValorFinal, observacoes: observacoesGerais,
        prazo_entrega: prazoEntrega || getMaxPrazo(), validade, status: "rascunho" as OrcamentoStatus,
      };

      const pdf = new jsPDF("p", "mm", "a4");
      const pw = pdf.internal.pageSize.getWidth();
      const ph = pdf.internal.pageSize.getHeight();
      const m = 18;
      const cw = pw - m * 2;

      const gold = "#e2a820";
      const dark = "#0a0a0a";
      const textCol = "#111111";
      const muted = "#6b7280";
      const light = "#f3f4f6";

      let y = 0;
      let page = 1;

      function header() {
        y = 0;
        pdf.setFillColor(dark);
        pdf.rect(0, 0, pw, 48, "F");
        pdf.setFillColor(gold);
        pdf.rect(0, 48, pw, 3, "F");
        pdf.setTextColor(gold);
        pdf.setFontSize(16);
        pdf.setFont("helvetica", "bold");
        pdf.text("PROPOSTA COMERCIAL", pw / 2, 22, { align: "center" });
        pdf.setFontSize(8);
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor("#aaa");
        pdf.text("GoFocus — Marketing Digital", pw / 2, 32, { align: "center" });
        y = 60;
      }

      function footer() {
        pdf.setDrawColor(gold);
        pdf.setLineWidth(0.2);
        pdf.line(m, ph - 14, pw - m, ph - 14);
        pdf.setTextColor(muted);
        pdf.setFontSize(6);
        pdf.text(`GoFocus — ${data.numero} | Página ${page}`, pw / 2, ph - 7, { align: "center" });
      }

      function checkPage(needed: number) {
        if (y + needed > ph - 20) {
          footer();
          pdf.addPage();
          page++;
          header();
        }
      }

      header();

      // Info line
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(textCol);
      pdf.text(`ORÇAMENTO ${data.numero}`, m, y);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(muted);
      pdf.setFontSize(7.5);
      pdf.text(`Emissão: ${new Date().toLocaleDateString("pt-BR")}`, pw - m, y, { align: "right" });
      y += 6;
      pdf.text(`Validade: ${data.validade} dias`, pw - m, y, { align: "right" });
      y += 10;

      // Gold bar
      pdf.setDrawColor(gold);
      pdf.setLineWidth(0.4);
      pdf.line(m, y, pw - m, y);
      y += 7;

      // CLIENT
      checkPage(22);
      pdf.setFillColor(dark);
      pdf.rect(m, y, cw, 8, "F");
      pdf.setTextColor(gold);
      pdf.setFontSize(7.5);
      pdf.setFont("helvetica", "bold");
      pdf.text("CLIENTE", m + 4, y + 5.5);
      y += 12;
      pdf.setTextColor(textCol);
      pdf.setFontSize(8.5);
      pdf.setFont("helvetica", "normal");
      const c1 = m + 2, c3 = c1 + 85;
      const writeField = (label: string, val: string, x: number, offset = 16) => {
        pdf.setFont("helvetica", "bold"); pdf.text(`${label}:`, x, y);
        pdf.setFont("helvetica", "normal"); pdf.text(val, x + offset, y);
        y += 5.5;
      };
      writeField("Cliente", data.cliente_nome, c1);
      if (data.cliente_empresa) writeField("Empresa", data.cliente_empresa, c1);
      if (data.cliente_email) { writeField("E-mail", data.cliente_email, c1); if (data.cliente_whatsapp) writeField("WhatsApp", data.cliente_whatsapp, c3); }
      else if (data.cliente_whatsapp) writeField("WhatsApp", data.cliente_whatsapp, c1);
      y += 4;

      // Gold bar
      pdf.setDrawColor(gold);
      pdf.setLineWidth(0.4);
      pdf.line(m, y, pw - m, y);
      y += 7;

      // TABLE HEADER
      checkPage(14);
      pdf.setFillColor(dark);
      pdf.rect(m, y, cw, 8, "F");
      pdf.setTextColor("#fff");
      pdf.setFontSize(7);
      pdf.setFont("helvetica", "bold");
      const colDefs = [
        { x: m + 3, w: 8, l: "#" },
        { x: m + 13, w: 70, l: "SERVIÇO" },
        { x: m + 88, w: 12, l: "QTD" },
        { x: m + 108, w: 26, l: "VALOR UNIT." },
        { x: m + 142, w: 26, l: "TOTAL" },
      ];
      colDefs.forEach(c => pdf.text(c.l, c.x, y + 5.5));
      y += 12;

      // TABLE ROWS
      pdf.setFontSize(7.5);
      pdf.setFont("helvetica", "normal");
      let ri = 0;
      for (const item of data.servicos) {
        checkPage(12);
        if (ri % 2 === 0) {
          pdf.setFillColor(245, 245, 245);
          pdf.rect(m, y - 3.5, cw, 8.5, "F");
        }
        pdf.setTextColor(muted); pdf.setFontSize(7); pdf.text(String(ri + 1), m + 3, y + 1.5);
        pdf.setTextColor(textCol); pdf.setFontSize(7.5);
        pdf.text(item.nome, m + 13, y + 1.5);
        pdf.text(String(item.quantidade), m + 88, y + 1.5);
        pdf.text(formatarValor(item.valorUnitario), m + 108, y + 1.5);
        pdf.setFont("helvetica", "bold"); pdf.text(formatarValor(item.valorUnitario * item.quantidade), m + 142, y + 1.5);
        pdf.setFont("helvetica", "normal");
        if (item.observacoes) {
          y += 4.5;
          pdf.setTextColor(muted); pdf.setFontSize(6.5);
          pdf.text(`→ ${item.observacoes}`, m + 13, y + 1.5);
          pdf.setFontSize(7.5);
        }
        y += 8.5;
        ri++;
      }

      // TOTALS
      y += 4;
      checkPage(30);
      pdf.setDrawColor(gold);
      pdf.setLineWidth(1);
      pdf.line(110, y, pw - m, y);
      y += 8;

      const tx = pw - m;
      pdf.setFontSize(8.5);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(textCol);
      pdf.text("Subtotal:", tx - 80, y, { align: "right" });
      pdf.text(formatarValor(data.subtotal), tx, y, { align: "right" });

      if (data.desconto_tipo !== "nenhum" && data.desconto_valor > 0) {
        y += 5.5;
        pdf.setTextColor("#dc2626");
        const dLabel = data.desconto_tipo === "percentual" ? `Desconto (${data.desconto_valor}%):` : "Desconto:";
        pdf.text(dLabel, tx - 80, y, { align: "right" });
        const dv = data.desconto_tipo === "percentual" ? data.subtotal * data.desconto_valor / 100 : data.desconto_valor;
        pdf.text(`− ${formatarValor(dv)}`, tx, y, { align: "right" });
      }

      y += 8;
      pdf.setDrawColor(gold);
      pdf.setLineWidth(0.4);
      pdf.line(125, y, pw - m, y);
      y += 7;

      pdf.setFontSize(12);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(dark);
      pdf.text("VALOR TOTAL:", tx - 80, y, { align: "right" });
      pdf.setTextColor(gold);
      pdf.setFontSize(14);
      pdf.text(formatarValor(data.valor_final), tx, y, { align: "right" });

      y += 14;

      // EXTRA INFO
      if (data.observacoes || data.cliente_observacoes || data.prazo_entrega) {
        checkPage(40);
        pdf.setFillColor(dark);
        pdf.rect(m, y, cw, 8, "F");
        pdf.setTextColor(gold);
        pdf.setFontSize(7.5);
        pdf.setFont("helvetica", "bold");
        pdf.text("INFORMAÇÕES COMPLEMENTARES", m + 4, y + 5.5);
        y += 13;

        pdf.setTextColor(textCol);
        pdf.setFontSize(8);
        pdf.setFont("helvetica", "normal");

        if (data.prazo_entrega) {
          pdf.setFont("helvetica", "bold"); pdf.text("Prazo de entrega:", m + 3, y);
          pdf.setFont("helvetica", "normal"); pdf.text(data.prazo_entrega, m + 32, y);
          y += 6;
        }
        pdf.setFont("helvetica", "bold"); pdf.text("Validade da proposta:", m + 3, y);
        pdf.setFont("helvetica", "normal"); pdf.text(`${data.validade} dias`, m + 40, y);
        y += 6;
        if (data.observacoes) {
          y += 2; pdf.setFont("helvetica", "bold"); pdf.text("Observações:", m + 3, y);
          y += 5; pdf.setFont("helvetica", "normal"); pdf.text(data.observacoes, m + 3, y);
          y += 6;
        }
        if (data.cliente_observacoes) {
          y += 2; pdf.setFont("helvetica", "bold"); pdf.text("Obs. do cliente:", m + 3, y);
          y += 5; pdf.setFont("helvetica", "normal"); pdf.text(data.cliente_observacoes, m + 3, y);
          y += 6;
        }
      }

      footer();
      pdf.save(`Orcamento_${data.numero}.pdf`);
      toast.success("PDF gerado com sucesso!");
    } catch (err) {
      console.error("PDF error:", err);
      toast.error("Erro ao gerar PDF");
    } finally {
      setGeneratingPDF(false);
    }
  }

  async function handleSaveOrcamento() {
    if (!clientData.nome.trim()) { toast.error("Preencha o nome do cliente"); return; }
    if (cart.length === 0) { toast.error("Adicione pelo menos um serviço"); return; }
    setSaving(true);
    try {
      const result = await createOrcamento.mutateAsync({
        cliente_nome: clientData.nome.trim(), cliente_empresa: clientData.empresa.trim() || null,
        cliente_telefone: clientData.telefone.trim() || null, cliente_whatsapp: clientData.whatsapp.trim() || null,
        cliente_email: clientData.email.trim() || null, cliente_observacoes: clientData.observacoes.trim() || null,
        servicos: cart, subtotal: cartSubtotal, desconto_tipo: descontoTipo,
        desconto_valor: descontoValor, valor_final: cartValorFinal,
        observacoes: observacoesGerais.trim() || null, prazo_entrega: prazoEntrega || getMaxPrazo() || null,
        validade, status: "rascunho",
      });
      toast.success(`Orçamento ${result?.numero} salvo!`);
      clearCart();
      setViewMode("history");
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  function handleDuplicateOrcamento(orc: Orcamento) {
    setCart(orc.servicos);
    setClientData({
      nome: orc.cliente_nome, empresa: orc.cliente_empresa || "",
      telefone: orc.cliente_telefone || "", whatsapp: orc.cliente_whatsapp || "",
      email: orc.cliente_email || "", observacoes: orc.cliente_observacoes || "",
    });
    setObservacoesGerais(orc.observacoes || "");
    setPrazoEntrega(orc.prazo_entrega || "");
    setValidade(orc.validade || 30);
    setDescontoTipo(orc.desconto_tipo);
    setDescontoValor(orc.desconto_valor || 0);
    setViewMode("catalog");
    setCartStep("review");
    setCartOpen(true);
    toast.success("Orçamento duplicado! Revise antes de salvar.");
  }

  function handleDeleteOrcamento(id: string) {
    if (confirm("Excluir este orçamento?")) deleteOrcamento.mutate(id);
  }

  function handleShareWhatsApp(orc: Orcamento) {
    const url = `https://wa.me/55${orc.cliente_whatsapp?.replace(/\D/g, "") || ""}?text=${encodeURIComponent(`Olá! Segue o orçamento ${orc.numero} da GoFocus no valor de ${formatarValor(orc.valor_final)}.`)}`;
    window.open(url, "_blank");
  }

  function handleShareEmail(orc: Orcamento) {
    window.open(`mailto:${orc.cliente_email}?subject=${encodeURIComponent(`Orçamento ${orc.numero} - GoFocus`)}&body=${encodeURIComponent(`Olá ${orc.cliente_nome},\n\nSegue o orçamento ${orc.numero} no valor de ${formatarValor(orc.valor_final)}.\n\nAtenciosamente,\nGoFocus Marketing Digital`)}`, "_blank");
  }

  function handleStatusChange(orc: Orcamento, newStatus: OrcamentoStatus) {
    updateOrcamento.mutate({ id: orc.id, status: newStatus });
  }

  const filteredOrcamentos = useMemo(() => {
    return orcamentos.filter(o => {
      const matchSearch = o.cliente_nome.toLowerCase().includes(historySearch.toLowerCase()) ||
        o.numero.toLowerCase().includes(historySearch.toLowerCase()) ||
        (o.cliente_empresa && o.cliente_empresa.toLowerCase().includes(historySearch.toLowerCase()));
      const matchStatus = filterStatus === "all" || o.status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [orcamentos, historySearch, filterStatus]);


  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: orcamentos.length };
    for (const s of Object.keys(statusLabels)) counts[s] = orcamentos.filter(o => o.status === s).length;
    return counts;
  }, [orcamentos]);

  const cartQtyById = useMemo(() => {
    const map: Record<string, number> = {};
    for (const item of cart) map[item.servicoId] = item.quantidade;
    return map;
  }, [cart]);

  /* ── New UI state (declared before any early return) ── */
  const [pendingDelete, setPendingDelete] = useState<Orcamento | null>(null);
  const [notesOpen, setNotesOpen] = useState<Record<string, boolean>>({});
  const [stepDir, setStepDir] = useState(1);
  const quoteTarget = useRef<HTMLElement | null>(null);
  const reduceMotion = useReducedMotion();

  const pipeline = useMemo(() => {
    const sum = (list: Orcamento[]) => list.reduce((n, o) => n + (o.valor_final || 0), 0);
    const aprovados = orcamentos.filter(o => o.status === "aprovado");
    const recusados = orcamentos.filter(o => o.status === "recusado");
    const abertos = orcamentos.filter(o => o.status === "enviado" || o.status === "rascunho");
    const decididos = aprovados.length + recusados.length;
    return {
      total: sum(orcamentos),
      aprovadosValor: sum(aprovados),
      aprovadosQtd: aprovados.length,
      abertosValor: sum(abertos),
      abertosQtd: abertos.length,
      taxa: decididos > 0 ? Math.round((aprovados.length / decididos) * 100) : null,
    };
  }, [orcamentos]);

  const categoryCounts = useMemo(() => {
    const map: Record<string, number> = { all: servicos.length };
    for (const s of servicos) map[s.categoria] = (map[s.categoria] || 0) + 1;
    return map;
  }, []);

  if (authLoading) return <LoadingBlock label="Autenticando…" />;

  const stepIndex = STEPS.indexOf(cartStep);
  const discountLabel = descontoTipo === "percentual" ? `${descontoValor}%` : formatarValor(descontoValor);
  const discountAmount = descontoTipo === "percentual" ? cartSubtotal * descontoValor / 100 : descontoTipo === "fixo" ? Math.min(descontoValor, cartSubtotal) : 0;
  const itemsLabel = `${cartTotalItems} ${cartTotalItems === 1 ? "item" : "itens"}`;
  const servicesLabel = `${cart.length} ${cart.length === 1 ? "serviço" : "serviços"}`;

  const goStep = (step: CartStep) => {
    setStepDir(STEPS.indexOf(step) >= stepIndex ? 1 : -1);
    setCartStep(step);
  };

  /** A "+1" chip flies from the pressed button to the quote, which gives a little bump. */
  function flyToQuote(from: HTMLElement | null) {
    const to = quoteTarget.current;
    if (!from || !to || reduceMotion) return;
    const a = from.getBoundingClientRect();
    const b = to.getBoundingClientRect();
    if (b.width === 0) return;
    const chip = document.createElement("div");
    chip.className = "quote-chip";
    chip.textContent = "+1";
    chip.style.left = `${a.left + a.width / 2}px`;
    chip.style.top = `${a.top + a.height / 2}px`;
    document.body.appendChild(chip);
    const dx = b.left + b.width / 2 - (a.left + a.width / 2);
    const dy = b.top + b.height / 2 - (a.top + a.height / 2);
    chip
      .animate(
        [
          { transform: "translate(-50%, -50%) scale(0.6)", opacity: 0 },
          { transform: "translate(-50%, -50%) scale(1.1)", opacity: 1, offset: 0.15 },
          { transform: `translate(calc(-50% + ${dx * 0.55}px), calc(-50% + ${dy * 0.55 - 70}px)) scale(1)`, opacity: 1, offset: 0.55 },
          { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(0.5)`, opacity: 0.2 },
        ],
        { duration: 720, easing: "cubic-bezier(0.45, 0, 0.25, 1)" }
      )
      .finished.then(() => {
        chip.remove();
        to.animate([{ transform: "scale(1)" }, { transform: "scale(1.14)" }, { transform: "scale(1)" }], {
          duration: 340,
          easing: "cubic-bezier(0.34, 1.56, 0.64, 1)",
        });
      }, () => chip.remove());
  }

  const add = (servico: Servico, el: HTMLElement | null) => {
    addToCart(servico);
    flyToQuote(el);
  };

  const decrease = (id: string) => {
    if ((cartQtyById[id] || 0) <= 1) removeFromCart(id);
    else handleQuantityChange(id, -1);
  };

  /* ── Quote: stepper, steps, totals (desktop panel and phone sheet share these) ── */

  const summaryStepper = cart.length > 0 && (
    <ol aria-label="Etapas do orçamento" className="mx-4 mt-4 flex items-center gap-1 rounded-full border border-white/[0.08] bg-black/25 p-1">
      {STEPS.map((step, i) => {
        const isActive = cartStep === step;
        const canGoTo = i <= stepIndex || (step === "review" && !!clientData.nome.trim()) || step === "client";
        const done = stepIndex > i;
        return (
          <li key={step} className="flex-1">
            <button
              type="button"
              onClick={() => canGoTo && goStep(step)}
              disabled={!canGoTo}
              aria-current={isActive ? "step" : undefined}
              className={cn(
                "relative flex h-9 w-full items-center justify-center gap-1.5 rounded-full px-2 text-[13px] font-medium",
                isActive ? "text-[#141318]" : canGoTo ? "text-muted-foreground hover:text-white" : "text-muted-foreground/50"
              )}
            >
              {isActive && (
                <motion.span
                  layoutId="orc-step-pill"
                  aria-hidden="true"
                  className="liquid-pill absolute inset-0 rounded-full"
                  transition={{ type: "spring", stiffness: 520, damping: 38 }}
                />
              )}
              <span className="relative grid h-5 w-5 place-items-center rounded-full text-[11px] font-semibold tabular-nums">
                {done ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : i + 1}
              </span>
              <span className="relative truncate">{STEP_LABELS[step]}</span>
            </button>
          </li>
        );
      })}
    </ol>
  );

  const itemsStep = (
    <div>
      <ul className="space-y-2 p-4">
        <AnimatePresence initial={false}>
          {cart.map((item) => {
            const showNotes = notesOpen[item.servicoId] || !!item.observacoes;
            return (
              <motion.li
                key={item.servicoId}
                layout="position"
                initial={{ opacity: 0, y: -8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: 40, transition: { duration: 0.2 } }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="rounded-[16px] border border-white/[0.08] bg-white/[0.04] p-3.5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[14px] font-medium leading-snug text-white">{item.nome}</p>
                    <p className="text-[12px] text-muted-foreground">{item.categoria} · {getTotalEntrega(item)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFromCart(item.servicoId)}
                    aria-label={`Remover ${item.nome}`}
                    className="-mr-1 -mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-destructive/15 hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <QtyStepper
                    value={item.quantidade}
                    onMinus={() => handleQuantityChange(item.servicoId, -1)}
                    onPlus={() => handleQuantityChange(item.servicoId, 1)}
                    minusDisabled={item.quantidade <= 1}
                    name={item.nome}
                  />
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <span aria-hidden="true" className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[12px] text-muted-foreground">R$</span>
                      <Input
                        type="number"
                        inputMode="decimal"
                        value={item.valorUnitario}
                        onChange={e => updateCartItem(item.servicoId, { valorUnitario: Number(e.target.value) || 0 })}
                        aria-label={`Valor unitário de ${item.nome}`}
                        className="h-9 w-[92px] rounded-full pl-8 pr-3 text-right text-[13px] tabular-nums"
                      />
                    </div>
                    <span className="min-w-[78px] text-right text-[14px] font-semibold tabular-nums text-white">
                      {formatarValor(item.valorUnitario * item.quantidade)}
                    </span>
                  </div>
                </div>
                {showNotes ? (
                  <Input
                    type="text"
                    placeholder="Observação deste item…"
                    value={item.observacoes}
                    autoFocus={notesOpen[item.servicoId] && !item.observacoes}
                    onChange={e => updateCartItem(item.servicoId, { observacoes: e.target.value })}
                    aria-label={`Observações de ${item.nome}`}
                    className="mt-2.5 h-9 rounded-full text-[13px]"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => setNotesOpen(n => ({ ...n, [item.servicoId]: true }))}
                    className="mt-2 text-[12px] font-medium text-muted-foreground underline-offset-4 hover:text-white hover:underline"
                  >
                    + Observação
                  </button>
                )}
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>
    </div>
  );

  const clientStep = (
    <div className="grid grid-cols-2 gap-3 p-4">
      {([
        ["nome", "Nome do cliente", "text", 2],
        ["empresa", "Empresa", "text", 2],
        ["telefone", "Telefone", "tel", 1],
        ["whatsapp", "WhatsApp", "tel", 1],
        ["email", "E-mail", "email", 2],
      ] as const).map(([field, label, type, span]) => (
        <Field key={field} label={field === "nome" ? `${label} *` : label} htmlFor={`orc-cliente-${field}`} className={span === 2 ? "col-span-2" : undefined}>
          <Input
            id={`orc-cliente-${field}`}
            type={type}
            value={(clientData as any)[field]}
            onChange={e => setClientData(prev => ({ ...prev, [field]: e.target.value }))}
            placeholder={field === "whatsapp" || field === "telefone" ? "(15) 99999-9999" : label}
            aria-required={field === "nome" ? true : undefined}
            autoFocus={field === "nome" && !clientData.nome}
          />
        </Field>
      ))}
      <Field label="Observações do cliente" htmlFor="orc-cliente-obs" className="col-span-2">
        <Textarea
          id="orc-cliente-obs"
          value={clientData.observacoes}
          onChange={e => setClientData(prev => ({ ...prev, observacoes: e.target.value }))}
          placeholder="O que o cliente pediu, data do evento…"
          rows={2}
          className="resize-none"
        />
      </Field>
    </div>
  );

  const reviewStep = (
    <div className="space-y-4 p-4">
      <button
        type="button"
        onClick={() => goStep("client")}
        className="flex w-full items-center gap-3 rounded-[16px] border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-left hover:bg-white/[0.07]"
      >
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-[15px] font-semibold text-[#141318]">
          {clientData.nome.trim().charAt(0).toUpperCase() || <User className="h-4 w-4" aria-hidden="true" />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[15px] font-semibold text-white">{clientData.nome}</span>
          <span className="block truncate text-[13px] text-muted-foreground">
            {[clientData.empresa, clientData.whatsapp || clientData.email].filter(Boolean).join(" · ") || "Toque para editar o cliente"}
          </span>
        </span>
        <span className="text-[12px] font-medium text-muted-foreground">Editar</span>
      </button>

      <Field label="Desconto">
        <div className="flex flex-wrap items-center gap-2">
          <Segmented<DescontoTipo>
            label="Tipo de desconto"
            value={descontoTipo}
            onChange={(v) => { setDescontoTipo(v); if (v === "nenhum") setDescontoValor(0); }}
            options={[
              { value: "nenhum", label: "Sem" },
              { value: "percentual", label: "%" },
              { value: "fixo", label: "R$" },
            ]}
          />
          {descontoTipo !== "nenhum" && (
            <Input
              type="number"
              value={descontoValor || ""}
              onChange={e => setDescontoValor(Number(e.target.value) || 0)}
              min={0}
              placeholder="0"
              autoFocus
              aria-label={descontoTipo === "percentual" ? "Desconto em %" : "Desconto em R$"}
              className="h-10 w-28 rounded-full text-right tabular-nums"
            />
          )}
        </div>
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Prazo de entrega" htmlFor="orc-prazo">
          <Input id="orc-prazo" type="text" value={prazoEntrega} onChange={e => setPrazoEntrega(e.target.value)} placeholder={getMaxPrazo() || "Ex: 15 dias"} />
        </Field>
        <Field label="Validade (dias)" htmlFor="orc-validade">
          <Input id="orc-validade" type="number" value={validade} onChange={e => setValidade(Number(e.target.value) || 30)} min={1} className="tabular-nums" />
        </Field>
      </div>
      <Field label="Condições e observações" htmlFor="orc-obs-gerais">
        <Textarea id="orc-obs-gerais" value={observacoesGerais} onChange={e => setObservacoesGerais(e.target.value)} placeholder="Ex: 50% na assinatura, 50% na entrega" rows={2} className="resize-none" />
      </Field>
    </div>
  );

  const summaryBody = cart.length === 0 ? (
    <div className="flex flex-col items-center px-6 py-12 text-center">
      <div className="mb-4 grid h-14 w-14 place-items-center rounded-full bg-white/[0.07] text-muted-foreground">
        <ShoppingCart className="h-6 w-6" aria-hidden="true" />
      </div>
      <p className="text-[16px] font-semibold text-white">Monte a proposta</p>
      <p className="mt-1 max-w-[30ch] text-[14px] text-muted-foreground">Toque em Adicionar nos serviços ao lado. Eles aparecem aqui com o total.</p>
      {!isDesktop && <Button variant="outline" className="mt-5" onClick={() => setCartOpen(false)}>Voltar ao catálogo</Button>}
    </div>
  ) : (
    <AnimatePresence mode="wait" initial={false} custom={stepDir}>
      <motion.div
        key={cartStep}
        custom={stepDir}
        initial={{ opacity: 0, x: stepDir * 28 }}
        animate={{ opacity: 1, x: 0, transition: { duration: 0.32, ease: [0.16, 1, 0.3, 1] } }}
        exit={{ opacity: 0, x: stepDir * -20, transition: { duration: 0.14, ease: [0.23, 1, 0.32, 1] } }}
      >
        {cartStep === "items" ? itemsStep : cartStep === "client" ? clientStep : reviewStep}
      </motion.div>
    </AnimatePresence>
  );

  const summaryFooter = cart.length > 0 && (
    <div className="space-y-3 border-t border-white/[0.08] px-5 py-4">
      <dl className="space-y-1 text-[14px]">
        <div className="flex items-center justify-between">
          <dt className="text-muted-foreground">Subtotal · {itemsLabel}</dt>
          <dd className="tabular-nums text-white/80"><Money value={cartSubtotal} /></dd>
        </div>
        <AnimatePresence initial={false}>
          {hasDiscount && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center justify-between overflow-hidden"
            >
              <dt className="text-muted-foreground">Desconto ({discountLabel})</dt>
              <dd className="tabular-nums text-[hsl(var(--admin-success))]">− <Money value={discountAmount} /></dd>
            </motion.div>
          )}
        </AnimatePresence>
        <div className="flex items-baseline justify-between pt-1.5">
          <dt className="text-[15px] font-medium text-white">Total</dt>
          <dd className="text-[28px] font-semibold leading-none tracking-[-0.02em] tabular-nums text-white">
            <Money value={cartValorFinal} />
          </dd>
        </div>
      </dl>
      {cartStep === "items" && (
        <Button className="h-12 w-full rounded-full text-[15px]" onClick={() => goStep("client")}>
          Continuar para o cliente <ArrowRight />
        </Button>
      )}
      {cartStep === "client" && (
        <>
          <Button className="h-12 w-full rounded-full text-[15px]" onClick={() => goStep("review")} disabled={!clientData.nome.trim()}>
            Revisar proposta <ArrowRight />
          </Button>
          {!clientData.nome.trim() && <p className="text-center text-[13px] text-muted-foreground">Falta só o nome do cliente.</p>}
        </>
      )}
      {cartStep === "review" && (
        <div className="grid grid-cols-[1fr_auto] gap-2">
          <Button className="h-12 rounded-full text-[15px]" onClick={handleSaveOrcamento} disabled={saving || !clientData.nome.trim() || cart.length === 0}>
            {saving ? <Loader2 className="animate-spin" /> : <Save />}
            {saving ? "Salvando…" : "Salvar orçamento"}
          </Button>
          <Button variant="outline" className="h-12 rounded-full" onClick={() => handleGeneratePDF()} disabled={generatingPDF} aria-label="Baixar PDF">
            {generatingPDF ? <Loader2 className="animate-spin" /> : <Download />}
            PDF
          </Button>
        </div>
      )}
    </div>
  );

  const summaryHeader = (
    <div className="flex items-start justify-between gap-3 px-5 pt-5">
      <div className="min-w-0">
        <p className="text-[13px] text-muted-foreground">Proposta {previewNextNumero()}</p>
        <h2 className="text-[20px] font-semibold tracking-[-0.01em] text-white">
          Orçamento{" "}
          <span
            ref={(el) => { if (isDesktop) quoteTarget.current = el; }}
            className="ml-1 inline-grid min-w-[26px] place-items-center rounded-full bg-white px-1.5 align-middle text-[13px] font-semibold tabular-nums text-[#141318]"
          >
            {cartTotalItems}
          </span>
        </h2>
      </div>
      {cart.length > 0 && (
        <Button variant="ghost" size="sm" onClick={clearCart} className="rounded-full text-muted-foreground hover:text-destructive">
          <Trash2 /> Limpar
        </Button>
      )}
    </div>
  );

  /* ── Saved quote actions ── */

  const renderOrcActions = (orc: Orcamento) => (
    <div className="flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
      <Button variant="ghost" size="icon" onClick={() => handleGeneratePDF(orc)} disabled={generatingPDF} aria-label={`Baixar PDF do orçamento ${orc.numero}`} className="rounded-full">
        <Download />
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label={`Mais ações do orçamento ${orc.numero}`} className="rounded-full">
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onSelect={() => setViewingOrcamento(orc)}>
            <Eye className="mr-2 h-4 w-4" /> Ver detalhes
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => handleDuplicateOrcamento(orc)}>
            <Copy className="mr-2 h-4 w-4" /> Duplicar
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => handleShareWhatsApp(orc)}>
            <MessageCircle className="mr-2 h-4 w-4" /> Enviar por WhatsApp
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => handleShareEmail(orc)}>
            <Mail className="mr-2 h-4 w-4" /> Enviar por e-mail
          </DropdownMenuItem>
          {statusActions[orc.status].length > 0 && <DropdownMenuSeparator />}
          {statusActions[orc.status].map(newStatus => (
            <DropdownMenuItem key={newStatus} onSelect={() => handleStatusChange(orc, newStatus)}>
              {newStatus === "aprovado" ? <CheckCircle2 className="mr-2 h-4 w-4" /> :
               newStatus === "recusado" ? <Ban className="mr-2 h-4 w-4" /> : <Send className="mr-2 h-4 w-4" />}
              {statusActionLabels[newStatus]}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => setPendingDelete(orc)} className="text-destructive focus:text-destructive">
            <Trash2 className="mr-2 h-4 w-4" /> Excluir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );

  const hasHistoryFilters = !!historySearch || filterStatus !== "all";
  const statusFilterOptions = (["all", "rascunho", "enviado", "aprovado", "recusado", "expirado"] as const).map(key => ({
    value: key,
    label: key === "all" ? "Todos" : statusLabels[key],
    count: statusCounts[key] ?? 0,
  }));

  const categoryOptions = [
    { value: "all", label: "Todos", count: categoryCounts.all },
    ...categorias.map(cat => {
      const Icon = CATEGORY_ICONS[cat] || Sparkles;
      return {
        value: cat,
        label: <span className="inline-flex items-center gap-1.5"><Icon className="h-3.5 w-3.5" aria-hidden="true" />{cat}</span>,
        count: categoryCounts[cat],
      };
    }),
  ];

  const pageActions = (
    <>
      <Segmented<ViewMode>
        label="Visualização"
        value={viewMode}
        onChange={setViewMode}
        options={[
          { value: "catalog", label: "Montar" },
          { value: "history", label: "Histórico", count: orcamentos.length > 0 ? orcamentos.length : undefined },
        ]}
      />
      {viewMode === "history" && (
        <Button className="rounded-full" onClick={() => { clearCart(); setViewMode("catalog"); }}>
          <Plus /> Novo orçamento
        </Button>
      )}
    </>
  );

  /* ── Catalog: one service tile ── */
  const serviceTile = (servico: Servico) => {
    const qty = cartQtyById[servico.id] || 0;
    const Icon = CATEGORY_ICONS[servico.categoria] || Sparkles;
    return (
      <li
        key={servico.id}
        className={cn(
          "glass-lift group flex flex-col rounded-[20px] border border-border bg-card p-4",
          qty > 0 && "ring-1 ring-white/35"
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/[0.08] text-white/80">
            <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
          </span>
          <span className="text-right">
            <span className="block text-[20px] font-semibold leading-none tracking-[-0.02em] tabular-nums text-white">{formatarValor(servico.valor)}</span>
            {/\/h|hora/i.test(servico.observacoes || servico.descricao) && <span className="text-[12px] text-muted-foreground">por hora</span>}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setSelectedServico(servico)}
          className="mt-4 text-left"
          aria-label={`Ver detalhes de ${servico.nome}`}
        >
          <p className="text-[15px] font-semibold leading-snug text-white group-hover:underline group-hover:decoration-white/30 group-hover:underline-offset-4">{servico.nome}</p>
          <p className="mt-1 line-clamp-2 text-[13px] text-muted-foreground">{servico.descricao}</p>
        </button>
        <div className="mt-auto flex items-center justify-between gap-2 pt-4">
          <span className="inline-flex items-center gap-1.5 text-[12px] text-muted-foreground">
            <Clock className="h-3.5 w-3.5" aria-hidden="true" /> {servico.prazo}
          </span>
          {qty > 0 ? (
            <QtyStepper
              value={qty}
              onMinus={() => decrease(servico.id)}
              onPlus={(e) => add(servico, e.currentTarget)}
              name={servico.nome}
              light
            />
          ) : (
            <Button size="sm" className="h-9 rounded-full px-4" onClick={(e) => add(servico, e.currentTarget)} aria-label={`Adicionar ${servico.nome}`}>
              <Plus /> Adicionar
            </Button>
          )}
        </div>
      </li>
    );
  };

  const shownCategories = filterCategory === "all" ? filteredCategorias : filteredCategorias.filter(c => c === filterCategory);

  return (
    <AdminPage
      title={viewMode === "catalog" ? "Orçamentos" : "Histórico de orçamentos"}
      description={
        viewMode === "catalog"
          ? "Escolha os serviços, preencha o cliente e gere a proposta em PDF."
          : "Propostas salvas, com status, PDF e envio ao cliente."
      }
      actions={pageActions}
      className={cn(viewMode === "catalog" && cart.length > 0 && !isDesktop && "pb-28")}
    >
      <FlySwitch group="Visualização" value={viewMode}>
      {viewMode === "catalog" ? (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_400px] lg:items-start">
          {/* ── CATALOG ── */}
          <div className="min-w-0 space-y-5">
            <div className="relative">
              <Search aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar serviço: reels, fotografia, identidade visual…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                aria-label="Buscar serviços"
                className="h-12 rounded-full pl-11 text-[15px]"
              />
            </div>
            <Segmented<string>
              label="Categoria"
              value={filterCategory}
              onChange={setFilterCategory}
              options={categoryOptions}
              className="max-w-full"
            />

            <FlySwitch group="Categoria" value={filterCategory} className="space-y-7">
              {shownCategories.length === 0 ? (
                <EmptyState
                  icon={<Search />}
                  title="Nenhum serviço encontrado"
                  description="Tente outro termo ou outra categoria."
                  action={
                    <Button variant="outline" onClick={() => { setSearchQuery(""); setFilterCategory("all"); }}>
                      <X /> Limpar busca
                    </Button>
                  }
                />
              ) : (
                shownCategories.map(cat => {
                  const items = filteredServicos.filter(s => s.categoria === cat);
                  return (
                    <section key={cat} aria-label={cat}>
                      {filterCategory === "all" && (
                        <h2 className="mb-3 flex items-baseline gap-2 text-[17px] font-semibold text-white">
                          {cat}
                          <span className="text-[13px] font-normal text-muted-foreground">{items.length}</span>
                        </h2>
                      )}
                      <ul data-fly className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
                        {items.map(serviceTile)}
                      </ul>
                    </section>
                  );
                })
              )}

              {/* Custom item */}
              <section aria-label="Item personalizado">
                <AnimatePresence initial={false} mode="wait">
                  {!showCustomItem ? (
                    <motion.button
                      key="open"
                      type="button"
                      onClick={() => setShowCustomItem(true)}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex w-full items-center justify-center gap-2 rounded-[20px] border border-dashed border-white/20 px-4 py-5 text-[14px] font-medium text-muted-foreground hover:border-white/40 hover:text-white"
                    >
                      <Plus className="h-4 w-4" /> Item fora do catálogo
                    </motion.button>
                  ) : (
                    <motion.div
                      key="form"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      className="lg rounded-[20px] border border-border bg-card p-5"
                    >
                      <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-[16px] font-semibold text-white">Item fora do catálogo</h2>
                        <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setShowCustomItem(false)} aria-label="Fechar item personalizado">
                          <X />
                        </Button>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_140px_96px_auto] sm:items-end">
                        <Field label="Nome do item" htmlFor="orc-custom-nome">
                          <Input id="orc-custom-nome" type="text" placeholder="Ex: Drone, 1 hora" value={customItemNome} autoFocus onChange={e => setCustomItemNome(e.target.value)} onKeyDown={e => e.key === "Enter" && addCustomItem()} />
                        </Field>
                        <Field label="Valor unitário" htmlFor="orc-custom-valor">
                          <Input id="orc-custom-valor" type="number" inputMode="decimal" placeholder="0,00" value={customItemValor || ""} onChange={e => setCustomItemValor(Number(e.target.value) || 0)} className="tabular-nums" />
                        </Field>
                        <Field label="Qtd." htmlFor="orc-custom-qtd">
                          <Input id="orc-custom-qtd" type="number" value={customItemQtd} onChange={e => setCustomItemQtd(Math.max(1, Number(e.target.value) || 1))} className="text-center tabular-nums" />
                        </Field>
                        <Button className="rounded-full" onClick={(e) => { const el = e.currentTarget; addCustomItem(); flyToQuote(el); }}>
                          <Plus /> Adicionar
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </section>
            </FlySwitch>
          </div>

          {/* ── QUOTE (desktop) ── */}
          {isDesktop && (
            <div ref={cartRef} className="sticky top-6">
              <section
                aria-label="Orçamento"
                className="lg flex max-h-[calc(100vh-3rem)] flex-col overflow-hidden rounded-[26px] border border-border bg-card"
              >
                {summaryHeader}
                {summaryStepper}
                <div className="min-h-0 flex-1 overflow-y-auto">{summaryBody}</div>
                {summaryFooter}
              </section>
            </div>
          )}
        </div>
      ) : (
        /* ── HISTORY ── */
        <div className="space-y-5">
          <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatTile label="Em propostas" value={<Money value={pipeline.total} />} hint={`${orcamentos.length} ${orcamentos.length === 1 ? "orçamento" : "orçamentos"}`} />
            <StatTile label="Aprovados" value={<Money value={pipeline.aprovadosValor} />} hint={`${pipeline.aprovadosQtd} ${pipeline.aprovadosQtd === 1 ? "proposta" : "propostas"}`} tone="success" />
            <StatTile label="Aguardando resposta" value={<Money value={pipeline.abertosValor} />} hint={`${pipeline.abertosQtd} em aberto`} tone="info" />
            <StatTile
              label="Taxa de aprovação"
              value={pipeline.taxa === null ? "—" : <><CountUp value={pipeline.taxa} />%</>}
              hint={pipeline.taxa === null ? "Nenhuma resposta ainda" : "entre as respondidas"}
            />
          </dl>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar por cliente, empresa ou nº…"
                value={historySearch}
                onChange={e => setHistorySearch(e.target.value)}
                aria-label="Buscar orçamentos"
                className="h-11 rounded-full pl-11"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger aria-label="Filtrar por status" className="h-11 rounded-full sm:hidden">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusFilterOptions.map(o => (
                  <SelectItem key={o.value} value={o.value}>{o.label} ({o.count})</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Segmented<string>
              label="Filtrar por status"
              value={filterStatus}
              onChange={setFilterStatus}
              options={statusFilterOptions}
              className="hidden sm:inline-flex"
            />
          </div>

          <FlySwitch group="Filtrar por status" value={filterStatus}>
          {orcLoading ? (
            <LoadingBlock label="Carregando orçamentos…" />
          ) : filteredOrcamentos.length === 0 ? (
            <EmptyState
              icon={<FileText />}
              title={hasHistoryFilters ? "Nenhum resultado" : "Nenhum orçamento ainda"}
              description={hasHistoryFilters ? "Nenhum orçamento corresponde à busca ou ao status escolhido." : "Monte um orçamento e salve para vê-lo aqui."}
              action={hasHistoryFilters ? (
                <Button variant="outline" onClick={() => { setHistorySearch(""); setFilterStatus("all"); }}>Limpar filtros</Button>
              ) : (
                <Button onClick={() => { clearCart(); setViewMode("catalog"); }}><Plus /> Criar primeiro orçamento</Button>
              )}
            />
          ) : (
            <ul data-fly className="space-y-2">
              {filteredOrcamentos.map(orc => (
                <li
                  key={orc.id}
                  className="glass-lift grid cursor-pointer grid-cols-[1fr_auto] items-center gap-x-4 gap-y-2 rounded-[18px] border border-border bg-card px-4 py-3.5 md:grid-cols-[92px_minmax(0,1fr)_110px_120px_140px_auto]"
                  onClick={() => setViewingOrcamento(orc)}
                >
                  <span className="hidden text-[13px] font-medium tabular-nums text-muted-foreground md:block">{orc.numero}</span>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setViewingOrcamento(orc); }}
                    className="flex min-w-0 items-center gap-3 text-left"
                  >
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/[0.08] text-[15px] font-semibold text-white">
                      {orc.cliente_nome.trim().charAt(0).toUpperCase()}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-[15px] font-semibold text-white">{orc.cliente_nome}</span>
                      <span className="block truncate text-[13px] text-muted-foreground">
                        <span className="md:hidden">{orc.numero} · </span>
                        {orc.cliente_empresa || `${orc.servicos.length} ${orc.servicos.length === 1 ? "serviço" : "serviços"}`}
                      </span>
                    </span>
                  </button>
                  <span className="hidden text-[14px] tabular-nums text-muted-foreground md:block">{new Date(orc.created_at).toLocaleDateString("pt-BR")}</span>
                  <span className="order-last col-span-2 flex items-center justify-between md:order-none md:col-span-1 md:block">
                    <StatusBadge tone={statusTone[orc.status]}>{statusLabels[orc.status]}</StatusBadge>
                    <span className="text-[13px] tabular-nums text-muted-foreground md:hidden">{new Date(orc.created_at).toLocaleDateString("pt-BR")}</span>
                  </span>
                  <span className="text-right text-[16px] font-semibold tabular-nums text-white">{formatarValor(orc.valor_final)}</span>
                  <span className="hidden md:block">{renderOrcActions(orc)}</span>
                </li>
              ))}
            </ul>
          )}
          </FlySwitch>
        </div>
      )}
      </FlySwitch>

      {/* ── PHONE: floating quote bar + sheet ── */}
      <AnimatePresence>
        {!isDesktop && viewMode === "catalog" && cart.length > 0 && (
          <motion.div
            initial={{ y: 120, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 120, opacity: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 34 }}
            className="fixed inset-x-3 bottom-3 z-40 pb-[env(safe-area-inset-bottom)]"
          >
            <div className="lg flex items-center justify-between gap-3 rounded-full border border-border bg-[#2a2930]/95 py-2 pl-5 pr-2 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.8)]">
              <div className="min-w-0" ref={(el) => { if (!isDesktop) quoteTarget.current = el; }}>
                <p className="text-[12px] text-muted-foreground">{itemsLabel} · {servicesLabel}</p>
                <p className="text-[18px] font-semibold leading-tight tabular-nums text-white"><Money value={cartValorFinal} /></p>
              </div>
              <Button className="h-11 rounded-full px-5" onClick={() => setCartOpen(true)}>
                Ver orçamento <ArrowRight />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Sheet open={!isDesktop && cartOpen} onOpenChange={setCartOpen}>
        <SheetContent
          side="bottom"
          className="flex max-h-[92dvh] flex-col gap-0 rounded-t-[26px] border-border p-0"
        >
          <SheetTitle className="sr-only">Orçamento</SheetTitle>
          <SheetDescription className="sr-only">
            {cart.length > 0 ? `${servicesLabel} · ${itemsLabel}` : "Nenhum serviço adicionado"}
          </SheetDescription>
          <div className="mx-auto mt-2 h-1.5 w-10 rounded-full bg-white/20" aria-hidden="true" />
          {summaryHeader}
          {summaryStepper}
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">{summaryBody}</div>
          {summaryFooter && <div className="pb-[env(safe-area-inset-bottom)]">{summaryFooter}</div>}
        </SheetContent>
      </Sheet>

      {/* ── SERVICE DETAIL ── */}
      <Dialog open={!!selectedServico} onOpenChange={open => !open && setSelectedServico(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="pr-6 text-[20px] font-semibold">{selectedServico?.nome}</DialogTitle>
            <DialogDescription className="sr-only">Detalhes do serviço</DialogDescription>
          </DialogHeader>
          {selectedServico && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <StatusBadge>{selectedServico.categoria}</StatusBadge>
                <span className="text-[28px] font-semibold tracking-[-0.02em] tabular-nums text-white">{formatarValor(selectedServico.valor)}</span>
              </div>
              <p className="text-[15px] leading-relaxed text-muted-foreground">{selectedServico.descricao}</p>
              <p className="flex items-center gap-2 text-[14px] text-muted-foreground">
                <Clock className="h-4 w-4" aria-hidden="true" /> Prazo: {selectedServico.prazo}
              </p>
              {selectedServico.observacoes && (
                <div className="rounded-[16px] border border-white/[0.08] bg-white/[0.04] p-4">
                  <SectionLabel className="mb-1">Observações</SectionLabel>
                  <p className="text-[14px] text-white">{selectedServico.observacoes}</p>
                </div>
              )}
              <Button
                className="h-12 w-full rounded-full text-[15px]"
                onClick={(e) => { add(selectedServico, e.currentTarget); setSelectedServico(null); }}
              >
                <Plus /> Adicionar ao orçamento
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── SAVED QUOTE ── */}
      <Dialog open={!!viewingOrcamento} onOpenChange={open => !open && setViewingOrcamento(null)}>
        <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex flex-wrap items-center gap-3 text-[20px] font-semibold">
              Proposta {viewingOrcamento?.numero}
              {viewingOrcamento && (
                <StatusBadge tone={statusTone[viewingOrcamento.status]}>{statusLabels[viewingOrcamento.status]}</StatusBadge>
              )}
            </DialogTitle>
            <DialogDescription>
              {viewingOrcamento && `Criada em ${new Date(viewingOrcamento.created_at).toLocaleDateString("pt-BR")} · válida por ${viewingOrcamento.validade} dias`}
            </DialogDescription>
          </DialogHeader>
          {viewingOrcamento && (
            <div className="space-y-5">
              <div className="flex flex-col gap-4 rounded-[18px] border border-white/[0.08] bg-white/[0.04] p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white text-[16px] font-semibold text-[#141318]">
                    {viewingOrcamento.cliente_nome.trim().charAt(0).toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[16px] font-semibold text-white">{viewingOrcamento.cliente_nome}</p>
                    <p className="truncate text-[13px] text-muted-foreground">
                      {[viewingOrcamento.cliente_empresa, viewingOrcamento.cliente_whatsapp, viewingOrcamento.cliente_email].filter(Boolean).join(" · ") || "Sem contato salvo"}
                    </p>
                  </div>
                </div>
                <div className="sm:text-right">
                  <p className="text-[13px] text-muted-foreground">Total</p>
                  <p className="text-[28px] font-semibold leading-none tracking-[-0.02em] tabular-nums text-white">{formatarValor(viewingOrcamento.valor_final)}</p>
                </div>
              </div>

              <div>
                <SectionLabel className="mb-2">Serviços</SectionLabel>
                <ul className="divide-y divide-white/[0.06] overflow-hidden rounded-[16px] border border-white/[0.08]">
                  {viewingOrcamento.servicos.map((item, i) => (
                    <li key={i} className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                      <div className="min-w-0 flex-1">
                        <p className="text-[15px] font-medium text-white">{item.nome}</p>
                        {item.observacoes && <p className="mt-0.5 text-[13px] text-muted-foreground">{item.observacoes}</p>}
                      </div>
                      <div className="flex shrink-0 items-center gap-4 text-right tabular-nums">
                        <span className="text-[14px] text-muted-foreground">×{item.quantidade}</span>
                        <span className="w-[84px] text-[14px] text-muted-foreground">{formatarValor(item.valorUnitario)}</span>
                        <span className="w-[96px] text-[15px] font-semibold text-white">{formatarValor(item.valorUnitario * item.quantidade)}</span>
                      </div>
                    </li>
                  ))}
                </ul>
                <dl className="mt-3 space-y-1 px-1 text-[14px]">
                  <div className="flex justify-between"><dt className="text-muted-foreground">Subtotal</dt><dd className="tabular-nums text-white/80">{formatarValor(viewingOrcamento.subtotal)}</dd></div>
                  {viewingOrcamento.desconto_tipo !== "nenhum" && viewingOrcamento.desconto_valor > 0 && (
                    <div className="flex justify-between"><dt className="text-muted-foreground">Desconto</dt><dd className="tabular-nums text-[hsl(var(--admin-success))]">{viewingOrcamento.desconto_tipo === "percentual" ? `${viewingOrcamento.desconto_valor}%` : formatarValor(viewingOrcamento.desconto_valor)}</dd></div>
                  )}
                  <div className="flex justify-between"><dt className="text-muted-foreground">Prazo de entrega</dt><dd className="text-white/80">{viewingOrcamento.prazo_entrega || "—"}</dd></div>
                </dl>
              </div>

              {viewingOrcamento.observacoes && (
                <div className="rounded-[16px] border border-white/[0.08] bg-white/[0.04] p-4">
                  <SectionLabel className="mb-1">Condições e observações</SectionLabel>
                  <p className="text-[14px] text-white">{viewingOrcamento.observacoes}</p>
                </div>
              )}

              {statusActions[viewingOrcamento.status].length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[13px] text-muted-foreground">Mudar status:</span>
                  {statusActions[viewingOrcamento.status].map(s => (
                    <Button
                      key={s}
                      variant="outline"
                      size="sm"
                      className="rounded-full"
                      onClick={() => { handleStatusChange(viewingOrcamento, s); setViewingOrcamento({ ...viewingOrcamento, status: s }); }}
                    >
                      {s === "aprovado" ? <CheckCircle2 /> : s === "recusado" ? <Ban /> : <Send />}
                      {statusLabels[s]}
                    </Button>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                <Button className="col-span-2 rounded-full" onClick={() => { handleGeneratePDF(viewingOrcamento); setViewingOrcamento(null); }} disabled={generatingPDF}>
                  <Download /> Baixar PDF
                </Button>
                <Button variant="outline" className="rounded-full" onClick={() => { handleDuplicateOrcamento(viewingOrcamento); setViewingOrcamento(null); }}>
                  <Copy /> Duplicar
                </Button>
                <Button variant="outline" className="rounded-full" onClick={() => handleShareWhatsApp(viewingOrcamento)}>
                  <MessageCircle /> WhatsApp
                </Button>
                <Button variant="outline" className="rounded-full" onClick={() => handleShareEmail(viewingOrcamento)}>
                  <Mail /> E-mail
                </Button>
                <Button
                  variant="ghost"
                  className="rounded-full text-destructive hover:bg-destructive/15 hover:text-destructive"
                  onClick={() => { setPendingDelete(viewingOrcamento); setViewingOrcamento(null); }}
                >
                  <Trash2 /> Excluir
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── DELETE CONFIRM ── */}
      <AlertDialog open={!!pendingDelete} onOpenChange={open => !open && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir a proposta {pendingDelete?.numero}?</AlertDialogTitle>
            <AlertDialogDescription>
              O orçamento de {pendingDelete?.cliente_nome} será apagado e não dá para desfazer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => { if (pendingDelete) deleteOrcamento.mutate(pendingDelete.id); setPendingDelete(null); }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminPage>
  );
}

/* ── Small pieces ── */

/** Money that glides to its new value. */
function Money({ value, className }: { value: number; className?: string }) {
  const reduce = useReducedMotion();
  const [shown, setShown] = useState(value);
  const shownRef = useRef(value);
  useEffect(() => {
    if (reduce) { shownRef.current = value; setShown(value); return; }
    const from = shownRef.current;
    if (from === value) return;
    const start = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / 600);
      const v = from + (value - from) * (1 - Math.pow(1 - p, 4));
      shownRef.current = v;
      setShown(v);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, reduce]);
  return <span className={className}>{formatarValor(Math.round(shown * 100) / 100)}</span>;
}

/** − qty + pill. */
function QtyStepper({ value, onMinus, onPlus, minusDisabled, name, light }: {
  value: number;
  onMinus: () => void;
  onPlus: (e: RMouseEvent<HTMLButtonElement>) => void;
  minusDisabled?: boolean;
  name: string;
  light?: boolean;
}) {
  return (
    <div className={cn("flex h-9 items-center rounded-full", light ? "liquid-pill text-[#141318]" : "border border-white/[0.12] bg-black/20 text-white")}>
      <button
        type="button"
        onClick={onMinus}
        disabled={minusDisabled}
        aria-label={`Diminuir quantidade de ${name}`}
        className="grid h-9 w-9 place-items-center rounded-full disabled:opacity-35"
      >
        <Minus className="h-4 w-4" />
      </button>
      <motion.span
        key={value}
        initial={{ y: -6, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        aria-live="polite"
        className="w-7 text-center text-[14px] font-semibold tabular-nums"
      >
        {value}
      </motion.span>
      <button
        type="button"
        onClick={onPlus}
        aria-label={`Aumentar quantidade de ${name}`}
        className="grid h-9 w-9 place-items-center rounded-full"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}

/** One figure in the history summary. */
function StatTile({ label, value, hint, tone }: {
  label: string;
  value: ReactNode;
  hint?: string;
  tone?: "success" | "info";
}) {
  return (
    <div className="lg rounded-[20px] border border-border bg-card px-4 py-4">
      <dt className="flex items-center gap-2 text-[13px] text-muted-foreground">
        {tone && (
          <span
            aria-hidden="true"
            className={cn("h-2 w-2 rounded-full", tone === "success" ? "bg-[hsl(var(--admin-success))]" : "bg-[hsl(var(--admin-info))]")}
          />
        )}
        {label}
      </dt>
      <dd className="mt-1 text-[24px] font-semibold leading-tight tracking-[-0.02em] tabular-nums text-white">{value}</dd>
      {hint && <dd className="mt-0.5 text-[13px] text-muted-foreground">{hint}</dd>}
    </div>
  );
}
