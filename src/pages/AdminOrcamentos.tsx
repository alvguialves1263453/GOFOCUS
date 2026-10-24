import { useState, useEffect, useMemo, useRef } from "react";
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AdminPage, Panel, Field, StatusBadge, EmptyState, Segmented, LoadingBlock, SectionLabel } from "@/components/admin/ui";
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

  useEffect(() => {
    if (cart.length > 0) setCartOpen(true);
  }, [cart.length]);

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
    toast.success(`"${servico.nome}" adicionado`, { duration: 2000 });
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

  if (authLoading) return <LoadingBlock label="Autenticando…" />;

  const stepIndex = STEPS.indexOf(cartStep);
  const discountLabel = descontoTipo === "percentual" ? `${descontoValor}%` : formatarValor(descontoValor);
  const itemsLabel = `${cartTotalItems} ${cartTotalItems === 1 ? "item" : "itens"}`;
  const servicesLabel = `${cart.length} ${cart.length === 1 ? "serviço" : "serviços"}`;

  /* ── Quote summary (desktop panel / phone sheet share this) ── */

  const summaryStepper = cart.length > 0 && (
    <ol aria-label="Etapas do orçamento" className="flex items-center gap-1 border-b border-border px-3 py-2">
      {STEPS.map((step, i) => {
        const isActive = cartStep === step;
        const canGoTo = i <= stepIndex;
        return (
          <li key={step} className="flex flex-1 items-center gap-1">
            <button
              type="button"
              onClick={() => canGoTo && setCartStep(step)}
              disabled={!canGoTo}
              aria-current={isActive ? "step" : undefined}
              className={cn(
                "flex h-10 min-w-0 flex-1 items-center justify-center gap-2 rounded-lg px-2 text-[14px] font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                isActive ? "bg-secondary text-foreground" : canGoTo ? "text-muted-foreground hover:bg-accent hover:text-foreground" : "text-muted-foreground opacity-50"
              )}
            >
              <span
                className={cn(
                  "grid h-6 w-6 shrink-0 place-items-center rounded-full text-[12px] font-semibold tabular-nums",
                  isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                )}
              >
                {stepIndex > i ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : i + 1}
              </span>
              <span className="truncate">{STEP_LABELS[step]}</span>
            </button>
          </li>
        );
      })}
    </ol>
  );

  const summaryBody = cart.length === 0 ? (
    <div className="p-5">
      <EmptyState
        icon={<ShoppingCart />}
        title="Carrinho vazio"
        description="Adicione serviços do catálogo para montar o orçamento."
        action={!isDesktop ? <Button variant="outline" onClick={() => setCartOpen(false)}>Voltar ao catálogo</Button> : undefined}
        className="py-10"
      />
    </div>
  ) : (
    <>
      {cartStep === "items" && (
        <div>
          <ul className="divide-y divide-border">
            {cart.map((item) => (
              <li key={item.servicoId} className="space-y-3 px-5 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[15px] font-medium text-foreground">{item.nome}</p>
                    <p className="text-[13px] text-muted-foreground">{item.categoria}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeFromCart(item.servicoId)}
                    aria-label={`Remover ${item.nome}`}
                    className="-mr-2 -mt-1 shrink-0 text-muted-foreground hover:text-destructive"
                  >
                    <X />
                  </Button>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center rounded-lg border border-input">
                    <button
                      type="button"
                      onClick={() => handleQuantityChange(item.servicoId, -1)}
                      disabled={item.quantidade <= 1}
                      aria-label={`Diminuir quantidade de ${item.nome}`}
                      className="grid h-10 w-10 place-items-center rounded-l-lg text-muted-foreground transition-colors duration-150 hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span aria-live="polite" className="w-9 text-center text-[15px] font-semibold tabular-nums text-foreground">{item.quantidade}</span>
                    <button
                      type="button"
                      onClick={() => handleQuantityChange(item.servicoId, 1)}
                      aria-label={`Aumentar quantidade de ${item.nome}`}
                      className="grid h-10 w-10 place-items-center rounded-r-lg text-muted-foreground transition-colors duration-150 hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <span aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-muted-foreground">R$</span>
                      <Input
                        type="number"
                        inputMode="decimal"
                        value={item.valorUnitario}
                        onChange={e => updateCartItem(item.servicoId, { valorUnitario: Number(e.target.value) || 0 })}
                        aria-label={`Valor unitário de ${item.nome}`}
                        className="w-28 pl-9 text-right tabular-nums"
                      />
                    </div>
                    <span className="min-w-[84px] text-right text-[15px] font-semibold tabular-nums text-foreground">
                      {formatarValor(item.valorUnitario * item.quantidade)}
                    </span>
                  </div>
                </div>
                <Input
                  type="text"
                  placeholder="Observações do item…"
                  value={item.observacoes}
                  onChange={e => updateCartItem(item.servicoId, { observacoes: e.target.value })}
                  aria-label={`Observações de ${item.nome}`}
                />
              </li>
            ))}
          </ul>
          <div className="border-t border-border bg-muted px-5 py-4">
            <SectionLabel className="mb-2">Itens para entrega</SectionLabel>
            <ul className="space-y-1.5">
              {cart.map((item) => (
                <li key={`entrega-${item.servicoId}`} className="flex items-center justify-between gap-3 text-[14px]">
                  <span className="min-w-0 truncate text-muted-foreground">{item.nome}</span>
                  <span className="whitespace-nowrap font-medium tabular-nums text-foreground">{getTotalEntrega(item)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {cartStep === "client" && (
        <div className="space-y-4 p-5">
          {([
            ["nome", "Nome do cliente", "text"],
            ["empresa", "Empresa", "text"],
            ["telefone", "Telefone", "tel"],
            ["whatsapp", "WhatsApp", "tel"],
            ["email", "E-mail", "email"],
          ] as const).map(([field, label, type]) => (
            <Field key={field} label={label} htmlFor={`orc-cliente-${field}`}>
              <Input
                id={`orc-cliente-${field}`}
                type={type}
                value={(clientData as any)[field]}
                onChange={e => setClientData(prev => ({ ...prev, [field]: e.target.value }))}
                placeholder={label}
                aria-required={field === "nome" ? true : undefined}
              />
            </Field>
          ))}
          <Field label="Observações" htmlFor="orc-cliente-obs">
            <Textarea
              id="orc-cliente-obs"
              value={clientData.observacoes}
              onChange={e => setClientData(prev => ({ ...prev, observacoes: e.target.value }))}
              placeholder="Observações adicionais…"
              rows={2}
              className="resize-none"
            />
          </Field>
        </div>
      )}

      {cartStep === "review" && (
        <div className="space-y-4 p-5">
          <div className="flex items-center gap-3 rounded-lg border border-border bg-muted px-4 py-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-secondary text-muted-foreground">
              <User className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-[15px] font-semibold text-foreground">{clientData.nome}</p>
              {clientData.empresa && <p className="truncate text-[14px] text-muted-foreground">{clientData.empresa}</p>}
            </div>
          </div>
          <Field label="Observações gerais" htmlFor="orc-obs-gerais">
            <Textarea
              id="orc-obs-gerais"
              value={observacoesGerais}
              onChange={e => setObservacoesGerais(e.target.value)}
              placeholder="Condições de pagamento…"
              rows={2}
              className="resize-none"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Prazo" htmlFor="orc-prazo">
              <Input
                id="orc-prazo"
                type="text"
                value={prazoEntrega}
                onChange={e => setPrazoEntrega(e.target.value)}
                placeholder={getMaxPrazo() || "Ex: 15 dias"}
              />
            </Field>
            <Field label="Validade (dias)" htmlFor="orc-validade">
              <Input
                id="orc-validade"
                type="number"
                value={validade}
                onChange={e => setValidade(Number(e.target.value) || 30)}
                min={1}
                className="tabular-nums"
              />
            </Field>
          </div>
          <Field label="Desconto" htmlFor="orc-desconto-tipo">
            <div className="flex items-center gap-2">
              <Select value={descontoTipo} onValueChange={(v: DescontoTipo) => { setDescontoTipo(v); if (v === "nenhum") setDescontoValor(0); }}>
                <SelectTrigger id="orc-desconto-tipo" className="flex-1">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nenhum">Sem desconto</SelectItem>
                  <SelectItem value="percentual">Percentual (%)</SelectItem>
                  <SelectItem value="fixo">Valor fixo (R$)</SelectItem>
                </SelectContent>
              </Select>
              {descontoTipo !== "nenhum" && (
                <Input
                  type="number"
                  value={descontoValor}
                  onChange={e => setDescontoValor(Number(e.target.value) || 0)}
                  min={0}
                  aria-label={descontoTipo === "percentual" ? "Desconto em %" : "Desconto em R$"}
                  className="w-28 text-right tabular-nums"
                />
              )}
            </div>
          </Field>
        </div>
      )}
    </>
  );

  const summaryFooter = cart.length > 0 && (
    <div className="space-y-3 border-t border-border px-5 py-4">
      <dl className="space-y-1 text-[14px]">
        <div className="flex items-center justify-between">
          <dt className="text-muted-foreground">Subtotal</dt>
          <dd className="tabular-nums text-foreground">{formatarValor(cartSubtotal)}</dd>
        </div>
        {hasDiscount && (
          <div className="flex items-center justify-between">
            <dt className="text-muted-foreground">Desconto</dt>
            <dd className="tabular-nums text-muted-foreground">− {discountLabel}</dd>
          </div>
        )}
        <div className="flex items-baseline justify-between pt-1">
          <dt className="text-[15px] font-medium text-foreground">Total</dt>
          <dd className="text-[20px] font-semibold tabular-nums text-foreground">{formatarValor(cartValorFinal)}</dd>
        </div>
      </dl>
      {cartStep === "items" && (
        <Button className="w-full" size="lg" onClick={() => setCartStep("client")} disabled={cart.length === 0}>
          Dados do cliente <ArrowRight />
        </Button>
      )}
      {cartStep === "client" && (
        <Button className="w-full" size="lg" onClick={() => setCartStep("review")} disabled={!clientData.nome.trim()}>
          Revisar e finalizar <ArrowRight />
        </Button>
      )}
      {cartStep === "review" && (
        <div className="grid gap-2">
          <Button className="w-full" size="lg" onClick={handleSaveOrcamento} disabled={saving || !clientData.nome.trim() || cart.length === 0}>
            {saving ? <Loader2 className="animate-spin" /> : <Save />}
            {saving ? "Salvando…" : "Salvar orçamento"}
          </Button>
          <Button className="w-full" size="lg" variant="outline" onClick={() => handleGeneratePDF()} disabled={generatingPDF || cart.length === 0}>
            {generatingPDF ? <Loader2 className="animate-spin" /> : <Download />}
            {generatingPDF ? "Gerando…" : "Baixar PDF"}
          </Button>
        </div>
      )}
      {cartStep === "client" && !clientData.nome.trim() && (
        <p className="text-center text-[13px] text-muted-foreground">Informe o nome do cliente para continuar.</p>
      )}
    </div>
  );

  const summaryClear = cart.length > 0 && (
    <Button variant="ghost" size="sm" onClick={clearCart} className="text-muted-foreground hover:text-destructive">
      <Trash2 /> Limpar
    </Button>
  );

  /* ── Saved quote actions (table row + phone card) ── */

  const renderOrcActions = (orc: Orcamento) => (
    <div className="flex items-center justify-end gap-1">
      <Button variant="ghost" size="sm" onClick={() => setViewingOrcamento(orc)} className="h-10">
        <Eye /> Ver
      </Button>
      <Button variant="ghost" size="icon" onClick={() => handleGeneratePDF(orc)} disabled={generatingPDF} aria-label={`Baixar PDF do orçamento ${orc.numero}`}>
        <Download />
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label={`Mais ações do orçamento ${orc.numero}`}>
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onSelect={() => handleDuplicateOrcamento(orc)}>
            <Copy className="mr-2 h-4 w-4" /> Duplicar
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => handleShareWhatsApp(orc)}>
            <MessageCircle className="mr-2 h-4 w-4" /> Enviar por WhatsApp
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
          <DropdownMenuItem onSelect={() => handleDeleteOrcamento(orc.id)} className="text-destructive focus:text-destructive">
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

  const pageActions = (
    <>
      <Segmented<ViewMode>
        label="Visualização"
        value={viewMode}
        onChange={setViewMode}
        options={[
          { value: "catalog", label: "Catálogo" },
          { value: "history", label: "Histórico", count: orcamentos.length > 0 ? orcamentos.length : undefined },
        ]}
      />
      {viewMode === "history" && (
        <Button onClick={() => { clearCart(); setViewMode("catalog"); }}>
          <Plus /> Novo orçamento
        </Button>
      )}
      {viewMode === "catalog" && !isDesktop && (
        <Button variant="outline" onClick={() => setCartOpen(!cartOpen)} aria-label={`Abrir orçamento, ${itemsLabel}`}>
          <ShoppingCart /> Orçamento
          {cartTotalItems > 0 && <span className="rounded-full bg-secondary px-1.5 text-[12px] tabular-nums">{cartTotalItems}</span>}
        </Button>
      )}
    </>
  );

  return (
    <AdminPage
      title={viewMode === "catalog" ? "Novo orçamento" : "Histórico de orçamentos"}
      description={
        viewMode === "catalog"
          ? cart.length > 0 ? `${itemsLabel} no orçamento` : "Escolha serviços do catálogo para montar a proposta."
          : "Propostas salvas, com status, PDF e envio ao cliente."
      }
      actions={pageActions}
      className={cn(viewMode === "catalog" && cart.length > 0 && !isDesktop && "pb-28")}
    >
      {viewMode === "catalog" ? (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
          {/* ── CATALOG ── */}
          <div className="min-w-0 space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Buscar serviços…"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  aria-label="Buscar serviços"
                  className="pl-9"
                />
              </div>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger aria-label="Filtrar por categoria" className="sm:w-[220px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as categorias</SelectItem>
                  {categorias.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {filteredServicos.length === 0 ? (
              <EmptyState
                icon={<Search />}
                title="Nenhum serviço encontrado"
                description="Tente outro termo ou outra categoria."
                action={(searchQuery || filterCategory !== "all") ? (
                  <Button variant="outline" onClick={() => { setSearchQuery(""); setFilterCategory("all"); }}>
                    <X /> Limpar busca
                  </Button>
                ) : undefined}
              />
            ) : (
              filteredCategorias.map(cat => {
                const CatIcon = CATEGORY_ICONS[cat] || Sparkles;
                const items = filteredServicos.filter(s => s.categoria === cat);
                return (
                  <Panel
                    key={cat}
                    title={
                      <span className="flex items-center gap-3">
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-secondary text-muted-foreground">
                          <CatIcon className="h-4 w-4" aria-hidden="true" />
                        </span>
                        {cat}
                      </span>
                    }
                    actions={<span className="text-[13px] text-muted-foreground">{items.length} {items.length === 1 ? "serviço" : "serviços"}</span>}
                    bodyClassName="p-0"
                  >
                    <ul className="divide-y divide-border">
                      {items.map(servico => {
                        const inCart = cartQtyById[servico.id];
                        return (
                          <li key={servico.id} className="flex flex-col gap-3 px-5 py-4 transition-colors duration-150 hover:bg-accent/40 sm:flex-row sm:items-center sm:gap-5">
                            <div className="min-w-0 flex-1">
                              <p className="text-[15px] font-medium text-foreground">{servico.nome}</p>
                              <p className="mt-0.5 line-clamp-2 text-[14px] text-muted-foreground">{servico.descricao}</p>
                              <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-muted-foreground">
                                <span className="inline-flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" aria-hidden="true" /> {servico.prazo}</span>
                                {inCart && <StatusBadge>{inCart} no orçamento</StatusBadge>}
                              </p>
                            </div>
                            <div className="flex items-center justify-between gap-2 sm:justify-end">
                              <span className="text-[15px] font-semibold tabular-nums text-foreground sm:mr-2">{formatarValor(servico.valor)}</span>
                              <div className="flex items-center gap-1">
                                <Button variant="ghost" size="icon" onClick={() => setSelectedServico(servico)} aria-label={`Ver detalhes de ${servico.nome}`}>
                                  <Eye />
                                </Button>
                                <Button variant="secondary" onClick={() => addToCart(servico)} aria-label={`Adicionar ${servico.nome}`}>
                                  <Plus /> Adicionar
                                </Button>
                              </div>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </Panel>
                );
              })
            )}

            {/* ── CUSTOM ITEM ── */}
            {!showCustomItem ? (
              <Button variant="outline" onClick={() => setShowCustomItem(true)} className="w-full border-dashed sm:w-auto">
                <Plus /> Item personalizado
              </Button>
            ) : (
              <Panel
                title="Novo item personalizado"
                actions={
                  <Button variant="ghost" size="icon" onClick={() => setShowCustomItem(false)} aria-label="Fechar item personalizado" className="-my-2 -mr-2">
                    <X />
                  </Button>
                }
              >
                <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_140px_96px_auto] sm:items-end">
                  <Field label="Nome do item" htmlFor="orc-custom-nome">
                    <Input id="orc-custom-nome" type="text" placeholder="Nome do item" value={customItemNome} onChange={e => setCustomItemNome(e.target.value)} />
                  </Field>
                  <Field label="Valor unitário" htmlFor="orc-custom-valor">
                    <Input id="orc-custom-valor" type="number" inputMode="decimal" placeholder="0,00" value={customItemValor || ""} onChange={e => setCustomItemValor(Number(e.target.value) || 0)} className="tabular-nums" />
                  </Field>
                  <Field label="Quantidade" htmlFor="orc-custom-qtd">
                    <Input id="orc-custom-qtd" type="number" value={customItemQtd} onChange={e => setCustomItemQtd(Math.max(1, Number(e.target.value) || 1))} className="text-center tabular-nums" />
                  </Field>
                  <Button variant="secondary" onClick={addCustomItem}>Adicionar</Button>
                </div>
              </Panel>
            )}
          </div>

          {/* ── QUOTE SUMMARY (desktop) ── */}
          {isDesktop && (
            <div ref={cartRef} className="sticky top-6">
              <Panel
                title="Orçamento"
                description={cart.length > 0 ? `${servicesLabel} · ${itemsLabel}` : "Nenhum serviço adicionado"}
                actions={summaryClear}
                className="flex max-h-[calc(100vh-3rem)] flex-col"
                bodyClassName="flex min-h-0 flex-1 flex-col p-0"
              >
                {summaryStepper}
                <div className="min-h-0 flex-1 overflow-y-auto">{summaryBody}</div>
                {summaryFooter}
              </Panel>
            </div>
          )}
        </div>
      ) : (
        /* ── HISTORY ── */
        <div className="space-y-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar por cliente, empresa ou nº…"
                value={historySearch}
                onChange={e => setHistorySearch(e.target.value)}
                aria-label="Buscar orçamentos"
                className="pl-9"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger aria-label="Filtrar por status" className="sm:hidden">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusFilterOptions.map(o => (
                  <SelectItem key={o.value} value={o.value}>{o.label} ({o.count})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Segmented<string>
            label="Filtrar por status"
            value={filterStatus}
            onChange={setFilterStatus}
            options={statusFilterOptions}
            className="hidden sm:inline-flex"
          />

          {orcLoading ? (
            <LoadingBlock label="Carregando orçamentos…" />
          ) : filteredOrcamentos.length === 0 ? (
            <EmptyState
              icon={<FileText />}
              title={hasHistoryFilters ? "Nenhum resultado" : "Nenhum orçamento ainda"}
              description={hasHistoryFilters ? "Nenhum orçamento corresponde à busca ou ao status escolhido." : "Monte um orçamento no catálogo e salve para vê-lo aqui."}
              action={hasHistoryFilters ? (
                <Button variant="outline" onClick={() => { setHistorySearch(""); setFilterStatus("all"); }}>Limpar filtros</Button>
              ) : (
                <Button onClick={() => { clearCart(); setViewMode("catalog"); }}><Plus /> Criar primeiro orçamento</Button>
              )}
            />
          ) : (
            <>
              {/* Table (tablet/desktop) */}
              <div className="hidden overflow-hidden rounded-xl border border-border bg-card md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nº</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead className="text-right"><span className="sr-only">Ações</span></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrcamentos.map(orc => (
                      <TableRow key={orc.id}>
                        <TableCell className="whitespace-nowrap text-[14px] font-medium tabular-nums text-muted-foreground">{orc.numero}</TableCell>
                        <TableCell className="max-w-[260px]">
                          <p className="truncate text-[15px] font-medium text-foreground">{orc.cliente_nome}</p>
                          {orc.cliente_empresa && <p className="truncate text-[13px] text-muted-foreground">{orc.cliente_empresa}</p>}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-[14px] tabular-nums text-muted-foreground">{new Date(orc.created_at).toLocaleDateString("pt-BR")}</TableCell>
                        <TableCell><StatusBadge tone={statusTone[orc.status]}>{statusLabels[orc.status]}</StatusBadge></TableCell>
                        <TableCell className="whitespace-nowrap text-right text-[15px] font-semibold tabular-nums text-foreground">{formatarValor(orc.valor_final)}</TableCell>
                        <TableCell className="py-2">{renderOrcActions(orc)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* List (phones) */}
              <ul className="space-y-3 md:hidden">
                {filteredOrcamentos.map(orc => (
                  <li key={orc.id} className="rounded-xl border border-border bg-card p-4">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[13px] font-medium tabular-nums text-muted-foreground">{orc.numero}</span>
                      <StatusBadge tone={statusTone[orc.status]}>{statusLabels[orc.status]}</StatusBadge>
                    </div>
                    <p className="mt-2 truncate text-[15px] font-semibold text-foreground">{orc.cliente_nome}</p>
                    {orc.cliente_empresa && <p className="truncate text-[14px] text-muted-foreground">{orc.cliente_empresa}</p>}
                    <div className="mt-2 flex items-baseline justify-between gap-3">
                      <span className="text-[14px] tabular-nums text-muted-foreground">{new Date(orc.created_at).toLocaleDateString("pt-BR")}</span>
                      <span className="text-[17px] font-semibold tabular-nums text-foreground">{formatarValor(orc.valor_final)}</span>
                    </div>
                    <div className="mt-3 border-t border-border pt-2">{renderOrcActions(orc)}</div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}

      {/* ── PHONE: bottom bar + summary sheet ── */}
      {!isDesktop && viewMode === "catalog" && cart.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card pb-[env(safe-area-inset-bottom)]">
          <div className="mx-auto flex h-[72px] max-w-6xl items-center justify-between gap-3 px-4 sm:px-8">
            <div className="min-w-0">
              <p className="text-[13px] text-muted-foreground">{itemsLabel} · {servicesLabel}</p>
              <p className="text-[17px] font-semibold tabular-nums text-foreground">{formatarValor(cartValorFinal)}</p>
            </div>
            <Button onClick={() => setCartOpen(true)}>
              Ver orçamento <ArrowRight />
            </Button>
          </div>
        </div>
      )}

      <Sheet open={!isDesktop && cartOpen} onOpenChange={setCartOpen}>
        <SheetContent
          side="bottom"
          className="flex max-h-[90dvh] flex-col gap-0 rounded-t-xl border-border bg-card p-0 data-[state=closed]:duration-150 data-[state=open]:duration-200"
        >
          <div className="flex items-start justify-between gap-3 border-b border-border py-4 pl-5 pr-14">
            <div className="min-w-0">
              <SheetTitle className="text-[17px] font-semibold text-foreground">Orçamento</SheetTitle>
              <SheetDescription className="text-[14px] text-muted-foreground">
                {cart.length > 0 ? `${servicesLabel} · ${itemsLabel}` : "Nenhum serviço adicionado"}
              </SheetDescription>
            </div>
            {summaryClear}
          </div>
          {summaryStepper}
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">{summaryBody}</div>
          {summaryFooter && <div className="pb-[env(safe-area-inset-bottom)]">{summaryFooter}</div>}
        </SheetContent>
      </Sheet>

      {/* ── SERVICE DETAIL DIALOG ── */}
      <Dialog open={!!selectedServico} onOpenChange={open => !open && setSelectedServico(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[20px] font-semibold">{selectedServico?.nome}</DialogTitle>
            <DialogDescription className="sr-only">Detalhes do serviço</DialogDescription>
          </DialogHeader>
          {selectedServico && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <StatusBadge>{selectedServico.categoria}</StatusBadge>
                <span className="text-[24px] font-semibold tabular-nums text-foreground">{formatarValor(selectedServico.valor)}</span>
              </div>
              <p className="text-[15px] leading-relaxed text-muted-foreground">{selectedServico.descricao}</p>
              <p className="flex items-center gap-2 text-[14px] text-muted-foreground">
                <Clock className="h-4 w-4" aria-hidden="true" /> Prazo: {selectedServico.prazo}
              </p>
              {selectedServico.observacoes && (
                <div className="rounded-lg border border-border bg-muted p-4">
                  <SectionLabel className="mb-1">Observações</SectionLabel>
                  <p className="text-[14px] text-foreground">{selectedServico.observacoes}</p>
                </div>
              )}
              <Button size="lg" className="w-full" onClick={() => { addToCart(selectedServico); setSelectedServico(null); }}>
                <Plus /> Adicionar ao orçamento
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── VIEW ORCAMENTO DIALOG ── */}
      <Dialog open={!!viewingOrcamento} onOpenChange={open => !open && setViewingOrcamento(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex flex-wrap items-center gap-3 text-[20px] font-semibold">
              Orçamento {viewingOrcamento?.numero}
              {viewingOrcamento && (
                <StatusBadge tone={statusTone[viewingOrcamento.status]}>{statusLabels[viewingOrcamento.status]}</StatusBadge>
              )}
            </DialogTitle>
            <DialogDescription className="sr-only">Detalhes do orçamento salvo</DialogDescription>
          </DialogHeader>
          {viewingOrcamento && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-border p-4">
                  <SectionLabel className="mb-2">Dados do cliente</SectionLabel>
                  <p className="text-[15px] font-medium text-foreground">{viewingOrcamento.cliente_nome}</p>
                  {viewingOrcamento.cliente_empresa && <p className="mt-0.5 text-[14px] text-muted-foreground">{viewingOrcamento.cliente_empresa}</p>}
                  {viewingOrcamento.cliente_email && <p className="mt-2 break-all text-[14px] text-muted-foreground">{viewingOrcamento.cliente_email}</p>}
                  {viewingOrcamento.cliente_whatsapp && <p className="text-[14px] tabular-nums text-muted-foreground">{viewingOrcamento.cliente_whatsapp}</p>}
                </div>
                <div className="rounded-lg border border-border p-4">
                  <SectionLabel className="mb-2">Resumo financeiro</SectionLabel>
                  <dl className="space-y-1 text-[14px]">
                    <div className="flex justify-between"><dt className="text-muted-foreground">Subtotal</dt><dd className="tabular-nums text-foreground">{formatarValor(viewingOrcamento.subtotal)}</dd></div>
                    {viewingOrcamento.desconto_tipo !== "nenhum" && viewingOrcamento.desconto_valor > 0 && (
                      <div className="flex justify-between"><dt className="text-muted-foreground">Desconto</dt><dd className="tabular-nums text-muted-foreground">{viewingOrcamento.desconto_tipo === "percentual" ? `${viewingOrcamento.desconto_valor}%` : formatarValor(viewingOrcamento.desconto_valor)}</dd></div>
                    )}
                  </dl>
                  <p className="mt-3 text-[24px] font-semibold tabular-nums text-foreground">{formatarValor(viewingOrcamento.valor_final)}</p>
                </div>
              </div>

              <div>
                <SectionLabel className="mb-2">Serviços</SectionLabel>
                <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border">
                  {viewingOrcamento.servicos.map((item, i) => (
                    <li key={i} className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                      <div className="min-w-0 flex-1">
                        <p className="text-[15px] font-medium text-foreground">{item.nome}</p>
                        {item.observacoes && <p className="mt-0.5 text-[13px] text-muted-foreground">{item.observacoes}</p>}
                      </div>
                      <div className="flex shrink-0 items-center gap-4 text-right tabular-nums">
                        <span className="text-[14px] text-muted-foreground">×{item.quantidade}</span>
                        <span className="w-[84px] text-[14px] text-muted-foreground">{formatarValor(item.valorUnitario)}</span>
                        <span className="w-[96px] text-[15px] font-semibold text-foreground">{formatarValor(item.valorUnitario * item.quantidade)}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {viewingOrcamento.observacoes && (
                <div className="rounded-lg border border-border p-4">
                  <SectionLabel className="mb-1">Observações</SectionLabel>
                  <p className="text-[14px] text-foreground">{viewingOrcamento.observacoes}</p>
                </div>
              )}

              <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[14px] text-muted-foreground">
                <span>Prazo: {viewingOrcamento.prazo_entrega || "—"}</span>
                <span aria-hidden="true">·</span>
                <span>Validade: {viewingOrcamento.validade} dias</span>
                <span aria-hidden="true">·</span>
                <span>Criado em {new Date(viewingOrcamento.created_at).toLocaleDateString("pt-BR")}</span>
              </p>

              <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                <Button className="col-span-2" onClick={() => { handleGeneratePDF(viewingOrcamento); setViewingOrcamento(null); }} disabled={generatingPDF}>
                  <Download /> Baixar PDF
                </Button>
                <Button variant="outline" onClick={() => { handleDuplicateOrcamento(viewingOrcamento); setViewingOrcamento(null); }}>
                  <Copy /> Duplicar
                </Button>
                <Button variant="outline" onClick={() => handleShareWhatsApp(viewingOrcamento)}>
                  <MessageCircle /> WhatsApp
                </Button>
                <Button variant="outline" className="col-span-2 sm:col-span-1" onClick={() => handleShareEmail(viewingOrcamento)}>
                  <Mail /> E-mail
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminPage>
  );
}
