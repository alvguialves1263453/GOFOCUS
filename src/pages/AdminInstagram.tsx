import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Instagram, Plus, Search, MoreVertical, Edit2, LayoutDashboard,
  CheckCircle2, ArrowRight, ExternalLink, Trash2, Camera,
  Eye, EyeOff, X, Settings, Plug
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { InstagramIntegrationsModal } from "@/components/instagram/InstagramIntegrationsModal";
import { AdminPage, EmptyState, Field, StatusBadge } from "@/components/admin/ui";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  getInstagramClients,
  createInstagramClient,
  updateInstagramClient,
  deleteInstagramClient,
  InstagramClient,
  getAllInstagramPosts,
  FollowerHistory,
  InstagramPost,
  getScrappaKey,
  setScrappaKey,
  getAllFollowerHistory
} from "@/lib/instagram";

const brl = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const STATUS_META: Record<string, { label: string; tone: "success" | "warning" | "info" | "danger" }> = {
  ativo: { label: "Ativo", tone: "success" },
  pendente: { label: "Pendente", tone: "warning" },
  pausado: { label: "Pausado", tone: "info" },
  cancelado: { label: "Encerrado", tone: "danger" },
};
const statusMeta = (status: string) => STATUS_META[status] ?? { label: status, tone: "danger" as const };

const AdminInstagram = () => {
  const navigate = useNavigate();
  const [clients, setClients] = useState<InstagramClient[]>([]);
  const [allFollowers, setAllFollowers] = useState<FollowerHistory[]>([]);
  const [allPosts, setAllPosts] = useState<InstagramPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'1d' | '1w' | '1m'>('1w');
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<InstagramClient | null>(null);
  const [isIntegrationsModalOpen, setIsIntegrationsModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [scrappaKeyInput, setScrappaKeyInput] = useState("");
  
  // Form State
  const [newClient, setNewClient] = useState({
    name: "",
    username: "",
    profile_picture: "",
    niche: "",
    monthly_value: 0,
    payment_day: 1,
    status: "ativo" as any,
    notes: ""
  });
  const [showRevenue, setShowRevenue] = useState(true);

  const handleSaveSettings = () => {
    setScrappaKey(scrappaKeyInput);
    setIsSettingsModalOpen(false);
    toast.success("Chave API salva com sucesso!");
  };

  // Helper to parse date string correctly in local time
  const parseLocalDate = (dateStr: string) => {
    if (!dateStr) return new Date(0);
    const parts = dateStr.split('T')[0].split('-');
    if (parts.length === 3) {
      return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    }
    return new Date(dateStr);
  };

  const consolidatedStats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);

    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);

    const filterByRange = (dateStr: string, range: '1d' | '1w' | '1m') => {
      const entryDate = parseLocalDate(dateStr);
      if (range === '1d') {
        return entryDate.getTime() >= today.getTime();
      }
      if (range === '1w') {
        return entryDate.getTime() >= sevenDaysAgo.getTime();
      }
      return entryDate.getTime() >= thirtyDaysAgo.getTime();
    };

    // Calculate Followers Gains
    const calcFollowerGains = (range: '1d' | '1w' | '1m') => {
      return allFollowers
        .filter(f => f.followers_end > 0 && filterByRange(f.date, range))
        .reduce((sum, f) => sum + (f.followers_end - f.followers_start), 0);
    };

    // Calculate Post Views (Reach)
    const calcPostViews = (range: '1d' | '1w' | '1m') => {
      return allPosts
        .filter(p => filterByRange(p.date, range))
        .reduce((sum, p) => sum + (p.reach || 0), 0);
    };

    return {
      followerGains: {
        '1d': calcFollowerGains('1d'),
        '1w': calcFollowerGains('1w'),
        '1m': calcFollowerGains('1m'),
      },
      postViews: {
        '1d': calcPostViews('1d'),
        '1w': calcPostViews('1w'),
        '1m': calcPostViews('1m'),
      }
    };
  }, [allFollowers, allPosts]);

  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    loadClients();

    return () => {
      mountedRef.current = false;
    };
  }, []);

  async function loadClients() {
    try {
      setLoading(true);
      const [clientsData, followersData, postsData] = await Promise.all([
        getInstagramClients().catch(err => {
          console.error("Erro ao carregar clientes:", err);
          throw err;
        }),
        getAllFollowerHistory(90).catch(err => {
          console.warn("Error loading follower history:", err);
          return [];
        }),
        getAllInstagramPosts(90).catch(err => {
          console.warn("Error loading posts:", err);
          return [];
        })
      ]);
      if (!mountedRef.current) return;
      setClients(clientsData);
      setAllFollowers(followersData);
      setAllPosts(postsData);
    } catch (error: any) {
      if (!mountedRef.current) return;
      const msg = error?.message || "";
      if (msg.includes("relation") && msg.includes("does not exist")) {
        toast.error("Tabelas do Instagram não encontradas. Execute o script SQL no Supabase.");
      } else {
        toast.error("Erro ao carregar clientes");
      }
      console.error(error);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }

  const handleAddClient = async () => {
    if (!newClient.name || !newClient.username) {
      toast.error("Nome e @ são obrigatórios");
      return;
    }

    try {
      await createInstagramClient({
        ...newClient,
        start_date: new Date().toISOString().split('T')[0]
      });
      toast.success("Cliente adicionado com sucesso!");
      setIsAddDialogOpen(false);
      loadClients();
      setNewClient({
        name: "",
        username: "",
        profile_picture: "",
        niche: "",
        monthly_value: 0,
        payment_day: 1,
        status: "ativo",
        notes: ""
      });
    } catch (error) {
      toast.error("Erro ao adicionar cliente");
    }
  };

  const handleEditClick = (client: InstagramClient) => {
    setEditingClient({...client});
    setIsEditDialogOpen(true);
  };

  const handleUpdateClient = async () => {
    if (!editingClient || !editingClient.name || !editingClient.username) {
      toast.error("Nome e @ são obrigatórios");
      return;
    }

    try {
      await updateInstagramClient(editingClient.id, {
        name: editingClient.name,
        username: editingClient.username,
        niche: editingClient.niche,
        monthly_value: editingClient.monthly_value,
        payment_day: editingClient.payment_day,
        status: editingClient.status,
        notes: editingClient.notes,
        profile_picture: editingClient.profile_picture
      });
      toast.success("Cliente atualizado com sucesso!");
      setIsEditDialogOpen(false);
      loadClients();
    } catch (error) {
      toast.error("Erro ao atualizar cliente");
    }
  };

  const handleDeleteClient = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este cliente?")) return;
    try {
      await deleteInstagramClient(id);
      toast.success("Cliente excluído");
      loadClients();
    } catch (error) {
      toast.error("Erro ao excluir cliente");
    }
  };

  const fetchInstagramPhoto = async (username: string, isEdit: boolean = false) => {
    if (!username) {
      toast.error("Insira o @ do Instagram primeiro");
      return;
    }
    
    const cleanUsername = username.replace('@', '').trim();
    const SCRAPPA_KEY = getScrappaKey();

    try {
      const response = await fetch(`https://scrappa.co/api/instagram/user?username=${cleanUsername}&refresh=true&_t=${Date.now()}`, {
        headers: {
          'x-api-key': SCRAPPA_KEY,
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });

      const data = await response.json();
      console.log("Scrappa response:", data);
      
      // Extraction based on Scrappa Docs: data.user.profile_pic_url_hd
      const profilePic = data?.user?.profile_pic_url_hd || 
                        data?.user?.profile_pic_url || 
                        data?.profile_pic_url ||
                        data?.data?.profile_pic_url ||
                        data?.avatar;

      if (data?.success && profilePic) {
        if (isEdit && editingClient) {
          setEditingClient({ ...editingClient, profile_picture: profilePic });
        } else {
          setNewClient({ ...newClient, profile_picture: profilePic });
        }
        toast.success("Foto do Instagram vinculada!");
      } else {
        // Fallback to DiceBear if API fails to find the photo
        const fallbackUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${cleanUsername}&backgroundColor=a855f7&fontFamily=Arial&fontWeight=600`;
        
        if (isEdit && editingClient) {
          setEditingClient({ ...editingClient, profile_picture: fallbackUrl });
        } else {
          setNewClient({ ...newClient, profile_picture: fallbackUrl });
        }
        
        if (data?.success === false) {
          toast.error(`Scrappa: ${data.message || "Erro desconhecido"}`);
        } else {
          toast.info("Não foi possível extrair a foto real, usando avatar padrão.");
        }
      }
    } catch (error) {
      console.error("Scrappa Error:", error);
      toast.error("Erro ao conectar com Scrappa");
    }
  };

  const filteredClients = useMemo(() => {
    return clients.filter(c => 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.niche?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [clients, searchQuery]);

  const stats = useMemo(() => {
    const active = clients.filter(c => c.status === 'ativo').length;
    const encerrados = clients.filter(c => c.status === 'cancelado').length;
    const totalMonthly = clients
      .filter(c => c.status !== 'cancelado')
      .reduce((acc, c) => acc + (Number(c.monthly_value) || 0), 0);
    const pendingPayments = clients.filter(c => c.status === 'pendente').length;
    
    return {
      total: clients.length,
      active,
      encerrados,
      revenue: totalMonthly,
      pending: pendingPayments
    };
  }, [clients]);


  const clientForm = (
    values: { name: string; username: string; niche?: string; monthly_value: number; payment_day: number; status: string; profile_picture?: string; notes?: string },
    update: (patch: Record<string, any>) => void,
    onFetchPhoto: () => void,
    idPrefix: string
  ) => (
    <div className="grid gap-4 py-2">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Nome" htmlFor={`${idPrefix}-name`}>
          <Input id={`${idPrefix}-name`} value={values.name} onChange={e => update({ name: e.target.value })} />
        </Field>
        <Field label="@ do Instagram" htmlFor={`${idPrefix}-username`}>
          <Input id={`${idPrefix}-username`} value={values.username} onChange={e => update({ username: e.target.value })} />
        </Field>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Nicho" htmlFor={`${idPrefix}-niche`}>
          <Input id={`${idPrefix}-niche`} value={values.niche} onChange={e => update({ niche: e.target.value })} />
        </Field>
        <Field label="Valor mensal (R$)" htmlFor={`${idPrefix}-value`}>
          <Input id={`${idPrefix}-value`} type="number" inputMode="decimal" className="tabular-nums" value={values.monthly_value || ""} onChange={e => update({ monthly_value: e.target.value === "" ? 0 : Number(e.target.value) })} />
        </Field>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Dia do pagamento" htmlFor={`${idPrefix}-day`}>
          <Input id={`${idPrefix}-day`} type="number" inputMode="numeric" min="1" max="31" className="tabular-nums" value={values.payment_day || ""} onChange={e => update({ payment_day: e.target.value === "" ? 0 : Number(e.target.value) })} />
        </Field>
        <Field label="Status" htmlFor={`${idPrefix}-status`}>
          <Select value={values.status} onValueChange={v => update({ status: v })}>
            <SelectTrigger id={`${idPrefix}-status`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ativo">Ativo</SelectItem>
              <SelectItem value="pendente">Pendente</SelectItem>
              <SelectItem value="pausado">Pausado</SelectItem>
              <SelectItem value="cancelado">Encerrado</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </div>
      <Field label="URL da foto" htmlFor={`${idPrefix}-photo`} hint="Use Buscar para puxar a foto pelo @.">
        <div className="flex gap-2">
          <Input id={`${idPrefix}-photo`} className="flex-1" value={values.profile_picture || ""} onChange={e => update({ profile_picture: e.target.value })} />
          <Button type="button" variant="outline" onClick={onFetchPhoto}>Buscar</Button>
        </div>
      </Field>
      <Field label="Observações" htmlFor={`${idPrefix}-notes`}>
        <Input id={`${idPrefix}-notes`} value={values.notes} onChange={e => update({ notes: e.target.value })} />
      </Field>
    </div>
  );

  const statTiles = [
    { label: "Total já trabalhados", value: stats.total },
    { label: "Clientes ativos", value: stats.active },
    { label: "Clientes encerrados", value: stats.encerrados },
    { label: "Faturamento mensal", value: brl(stats.revenue), eye: true },
    { label: "Pendências", value: stats.pending },
  ];

  const openClient = (id: string) => navigate(`/admin/instagram/cliente/${id}`);

  return (
    <AdminPage
      title="Clientes do Instagram"
      description={`${stats.total} cliente${stats.total !== 1 ? 's' : ''} cadastrado${stats.total !== 1 ? 's' : ''}`}
      actions={
        <>
          <Button
            variant="outline"
            onClick={() => { setIsSettingsModalOpen(true); setScrappaKeyInput(getScrappaKey()); }}
          >
            <Settings aria-hidden="true" /> API
          </Button>
          <Button variant="secondary" onClick={() => setIsIntegrationsModalOpen(true)}>
            <Plug aria-hidden="true" /> Integrações
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus aria-hidden="true" /> Novo cliente
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[520px]">
              <DialogHeader>
                <DialogTitle className="text-[20px] font-semibold">Adicionar cliente</DialogTitle>
                <DialogDescription className="text-[14px]">
                  Preencha os dados para começar a gestão.
                </DialogDescription>
              </DialogHeader>
              {clientForm(
                newClient,
                patch => setNewClient({ ...newClient, ...patch }),
                () => fetchInstagramPhoto(newClient.username),
                "new-client"
              )}
              <DialogFooter className="gap-2">
                <Button variant="ghost" onClick={() => setIsAddDialogOpen(false)}>Cancelar</Button>
                <Button onClick={handleAddClient}>Criar cliente</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      }
    >
      {/* Summary */}
      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {statTiles.map(stat => (
          <div key={stat.label} className={cn("rounded-xl border border-border bg-card p-4", stat.eye && "col-span-2 lg:col-span-1")}>
            <div className="flex min-h-[28px] items-center justify-between gap-2">
              <dt className="text-[13px] text-muted-foreground">{stat.label}</dt>
              {stat.eye && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="-my-2 -mr-2"
                  aria-label={showRevenue ? "Ocultar faturamento" : "Mostrar faturamento"}
                  aria-pressed={!showRevenue}
                  onClick={(e) => { e.stopPropagation(); setShowRevenue(!showRevenue); }}
                >
                  {showRevenue ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
                </Button>
              )}
            </div>
            <dd className="mt-1 text-[24px] font-semibold tabular-nums text-foreground">
              {loading ? <Skeleton className="h-8 w-16" /> : stat.eye && !showRevenue ? 'R$ ••••••' : stat.value}
            </dd>
          </div>
        ))}
      </dl>

      {/* Toolbar */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            type="search"
            aria-label="Buscar cliente"
            placeholder="Buscar por nome, @ ou nicho"
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        {!loading && searchQuery && (
          <p className="text-[14px] text-muted-foreground tabular-nums" aria-live="polite">
            {filteredClients.length} de {clients.length} cliente{clients.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* Clients grid */}
      <div className="mt-4">
        {loading ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3" role="status" aria-label="Carregando clientes">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-11 w-11 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                </div>
                <Skeleton className="mt-4 h-5 w-24" />
                <Skeleton className="mt-4 h-10 w-full" />
              </div>
            ))}
          </div>
        ) : filteredClients.length === 0 ? (
          clients.length === 0 ? (
            <EmptyState
              icon={<Instagram />}
              title="Nenhum cliente cadastrado"
              description="Adicione um cliente ou importe uma conta pelas integrações para começar a gestão."
              action={<Button onClick={() => setIsAddDialogOpen(true)}><Plus aria-hidden="true" /> Novo cliente</Button>}
            />
          ) : (
            <EmptyState
              icon={<Search />}
              title="Nenhum cliente encontrado"
              description={`Nada corresponde a “${searchQuery}”. Tente outro nome, @ ou nicho.`}
              action={<Button variant="outline" onClick={() => setSearchQuery("")}>Limpar busca</Button>}
            />
          )
        ) : (
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {filteredClients.map((client) => {
              const meta = statusMeta(client.status);
              const ended = client.status === 'cancelado';
              return (
                <li key={client.id}>
                  <div
                    role="link"
                    tabIndex={0}
                    aria-label={`Abrir ${client.name}`}
                    onClick={() => openClient(client.id)}
                    onKeyDown={(e) => {
                      if (e.target !== e.currentTarget) return;
                      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openClient(client.id); }
                    }}
                    className="group flex h-full cursor-pointer flex-col rounded-xl border border-border bg-card p-4 transition-colors duration-150 hover:border-input hover:bg-accent/40"
                  >
                    {/* Identity */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="relative grid h-11 w-11 flex-shrink-0 place-items-center overflow-hidden rounded-full border border-border bg-secondary">
                          <Camera className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                          {client.profile_picture && (
                            <img
                              src={client.profile_picture}
                              alt={`Foto de ${client.name}`}
                              className={cn("absolute inset-0 h-full w-full object-cover", ended && "grayscale")}
                              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                            />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className={cn("truncate text-[15px] font-semibold", ended ? "text-muted-foreground" : "text-foreground")}>{client.name}</p>
                          <p className="truncate text-[14px] text-muted-foreground">{client.username}</p>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="-mr-2 -mt-1 flex-shrink-0"
                            aria-label={`Ações de ${client.name}`}
                            onKeyDown={e => e.stopPropagation()}
                          >
                            <MoreVertical aria-hidden="true" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="min-w-[180px]">
                          <DropdownMenuItem className="gap-2"
                            onClick={e => { e.stopPropagation(); openClient(client.id); }}>
                            <LayoutDashboard className="h-4 w-4" aria-hidden="true" /> Dashboard
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2"
                            onClick={e => { e.stopPropagation(); handleEditClick(client); }}>
                            <Edit2 className="h-4 w-4" aria-hidden="true" /> Editar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className={cn("gap-2", !ended && "text-destructive focus:text-destructive")}
                            onClick={async (e) => {
                              e.stopPropagation();
                              const novoStatus = client.status === 'cancelado' ? 'ativo' : 'cancelado';
                              try {
                                await updateInstagramClient(client.id, { status: novoStatus });
                                toast.success(novoStatus === 'ativo' ? 'Contrato reativado' : 'Contrato encerrado');
                                loadClients();
                              } catch (err: any) {
                                console.error('Erro ao alterar status:', err);
                                toast.error(err?.message || 'Erro ao alterar status');
                              }
                            }}
                          >
                            {ended ? (
                              <><CheckCircle2 className="h-4 w-4" aria-hidden="true" /> Reativar contrato</>
                            ) : (
                              <><X className="h-4 w-4" aria-hidden="true" /> Encerrar contrato</>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2 text-destructive focus:text-destructive"
                            onClick={e => { e.stopPropagation(); handleDeleteClient(client.id); }}>
                            <Trash2 className="h-4 w-4" aria-hidden="true" /> Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* Status + niche */}
                    <div className="mt-3 flex min-w-0 items-center gap-2">
                      <StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>
                      <span className="truncate text-[14px] text-muted-foreground">{client.niche || 'Sem nicho'}</span>
                    </div>

                    {/* Value + payment */}
                    <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-3">
                      <div>
                        <dt className="text-[13px] text-muted-foreground">Valor mensal</dt>
                        <dd className={cn("text-[17px] font-semibold tabular-nums", ended ? "text-muted-foreground line-through" : "text-foreground")}>
                          {brl(client.monthly_value)}
                        </dd>
                      </div>
                      <div className="text-right">
                        <dt className="text-[13px] text-muted-foreground">Pagamento</dt>
                        <dd className="text-[15px] font-medium tabular-nums text-foreground">Dia {client.payment_day}</dd>
                      </div>
                    </dl>

                    {/* Footer */}
                    <div className="mt-auto pt-3">
                      <div className="flex items-center justify-between border-t border-border pt-3 text-[14px] text-muted-foreground">
                        {ended ? (
                          <span>Contrato encerrado</span>
                        ) : (
                          <>
                            <span className="transition-colors duration-150 group-hover:text-foreground">Abrir dashboard</span>
                            <ArrowRight className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-0.5" aria-hidden="true" />
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* API settings */}
      <Dialog open={isSettingsModalOpen} onOpenChange={setIsSettingsModalOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="text-[20px] font-semibold">API Scrappa</DialogTitle>
            <DialogDescription className="text-[14px]">
              Configure sua chave de API do Scrappa.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Field label="Chave de API" htmlFor="scrappa-key">
              <Input id="scrappa-key" autoComplete="off" value={scrappaKeyInput} onChange={e => setScrappaKeyInput(e.target.value)} />
            </Field>
            <a href="https://scrappa.co" target="_blank" rel="noopener noreferrer"
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-md text-[14px] text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline">
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
              Criar chave no scrappa.co
            </a>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setIsSettingsModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveSettings}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit client */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle className="text-[20px] font-semibold">Editar cliente</DialogTitle>
            <DialogDescription className="text-[14px]">Atualize os dados do cliente.</DialogDescription>
          </DialogHeader>
          {editingClient && clientForm(
            { ...editingClient, notes: editingClient.notes },
            patch => setEditingClient({ ...editingClient, ...patch } as InstagramClient),
            () => fetchInstagramPhoto(editingClient.username, true),
            "edit-client"
          )}
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setIsEditDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleUpdateClient}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <InstagramIntegrationsModal
        isOpen={isIntegrationsModalOpen}
        onClose={() => setIsIntegrationsModalOpen(false)}
        onSuccess={loadClients}
      />
    </AdminPage>
  );
};

export default AdminInstagram;
