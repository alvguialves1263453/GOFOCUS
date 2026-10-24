import { supabase } from './supabase';
import { v4 as uuidv4 } from 'uuid';

export type OrcamentoStatus = 'rascunho' | 'enviado' | 'aprovado' | 'recusado' | 'expirado';
export type DescontoTipo = 'nenhum' | 'percentual' | 'fixo';

export interface OrcamentoServico {
  servicoId: string;
  nome: string;
  categoria: string;
  descricao: string;
  quantidade: number;
  valorUnitario: number;
  observacoes: string;
}

export interface Orcamento {
  id: string;
  created_at: string;
  updated_at: string;
  numero: string;
  cliente_nome: string;
  cliente_empresa: string | null;
  cliente_telefone: string | null;
  cliente_whatsapp: string | null;
  cliente_email: string | null;
  cliente_observacoes: string | null;
  servicos: OrcamentoServico[];
  subtotal: number;
  desconto_tipo: DescontoTipo;
  desconto_valor: number;
  valor_final: number;
  observacoes: string | null;
  prazo_entrega: string | null;
  validade: number;
  status: OrcamentoStatus;
}

export type NewOrcamento = Omit<Orcamento, 'id' | 'created_at' | 'updated_at' | 'numero'> & { numero?: string };

const STORAGE_KEY = 'gofocus_orcamentos';
const COUNTER_KEY = 'gofocus_orcamento_counter';

function getNextNumero(): string {
  const counter = parseInt(localStorage.getItem(COUNTER_KEY) || '0', 10);
  const next = counter + 1;
  localStorage.setItem(COUNTER_KEY, String(next));
  return `GOF-${String(next).padStart(4, '0')}`;
}

export function previewNextNumero(): string {
  const counter = parseInt(localStorage.getItem(COUNTER_KEY) || '0', 10);
  return `GOF-${String(counter + 1).padStart(4, '0')}`;
}

// ─── SUPABASE ───

export async function getOrcamentosAsync(): Promise<Orcamento[]> {
  try {
    const { data, error } = await supabase
      .from('orcamentos')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching orcamentos from Supabase:', error);
      return getOrcamentosLocal();
    }

    return (data || []).map(mapRowToOrcamento);
  } catch (err) {
    console.error('Critical failure in getOrcamentosAsync:', err);
    return getOrcamentosLocal();
  }
}

export async function getOrcamentoByIdAsync(id: string): Promise<Orcamento | null> {
  try {
    const { data, error } = await supabase
      .from('orcamentos')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching orcamento:', error);
      return getOrcamentoLocalById(id);
    }

    return data ? mapRowToOrcamento(data) : null;
  } catch {
    return getOrcamentoLocalById(id);
  }
}

export async function saveOrcamentoAsync(orcamento: NewOrcamento): Promise<{ remote: boolean; data?: Orcamento; error?: string }> {
  const id = orcamento.id || uuidv4();
  const numero = orcamento.numero || getNextNumero();

  const dbRow = {
    id,
    numero,
    cliente_nome: orcamento.cliente_nome,
    cliente_empresa: orcamento.cliente_empresa || null,
    cliente_telefone: orcamento.cliente_telefone || null,
    cliente_whatsapp: orcamento.cliente_whatsapp || null,
    cliente_email: orcamento.cliente_email || null,
    cliente_observacoes: orcamento.cliente_observacoes || null,
    servicos: JSON.stringify(orcamento.servicos),
    subtotal: orcamento.subtotal,
    desconto_tipo: orcamento.desconto_tipo || 'nenhum',
    desconto_valor: orcamento.desconto_valor || 0,
    valor_final: orcamento.valor_final,
    observacoes: orcamento.observacoes || null,
    prazo_entrega: orcamento.prazo_entrega || null,
    validade: orcamento.validade || 30,
    status: orcamento.status || 'rascunho',
  };

  let remoteSuccess = false;
  let remoteError = '';

  try {
    const { error } = await supabase.from('orcamentos').insert([dbRow]);
    if (error) {
      console.warn('Falha ao salvar orçamento no Supabase:', error);
      remoteError = error.message;
    } else {
      remoteSuccess = true;
    }
  } catch (err: any) {
    console.error('Erro ao persistir no Supabase:', err);
    remoteError = err.message || String(err);
  }

  const mapped: Orcamento = {
    id,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    numero,
    ...orcamento,
  };

  saveOrcamentoLocal(mapped);

  return {
    remote: remoteSuccess,
    data: mapped,
    error: !remoteSuccess ? (remoteError || 'Erro desconhecido') : undefined,
  };
}

export async function updateOrcamentoAsync(id: string, updates: Partial<Orcamento>): Promise<void> {
  const dbUpdates: any = {};
  if (updates.cliente_nome !== undefined) dbUpdates.cliente_nome = updates.cliente_nome;
  if (updates.cliente_empresa !== undefined) dbUpdates.cliente_empresa = updates.cliente_empresa;
  if (updates.cliente_telefone !== undefined) dbUpdates.cliente_telefone = updates.cliente_telefone;
  if (updates.cliente_whatsapp !== undefined) dbUpdates.cliente_whatsapp = updates.cliente_whatsapp;
  if (updates.cliente_email !== undefined) dbUpdates.cliente_email = updates.cliente_email;
  if (updates.cliente_observacoes !== undefined) dbUpdates.cliente_observacoes = updates.cliente_observacoes;
  if (updates.servicos !== undefined) dbUpdates.servicos = JSON.stringify(updates.servicos);
  if (updates.subtotal !== undefined) dbUpdates.subtotal = updates.subtotal;
  if (updates.desconto_tipo !== undefined) dbUpdates.desconto_tipo = updates.desconto_tipo;
  if (updates.desconto_valor !== undefined) dbUpdates.desconto_valor = updates.desconto_valor;
  if (updates.valor_final !== undefined) dbUpdates.valor_final = updates.valor_final;
  if (updates.observacoes !== undefined) dbUpdates.observacoes = updates.observacoes;
  if (updates.prazo_entrega !== undefined) dbUpdates.prazo_entrega = updates.prazo_entrega;
  if (updates.validade !== undefined) dbUpdates.validade = updates.validade;
  if (updates.status !== undefined) dbUpdates.status = updates.status;

  try {
    const { error } = await supabase
      .from('orcamentos')
      .update(dbUpdates)
      .eq('id', id);

    if (error) console.warn('Falha ao atualizar orçamento no Supabase:', error);
  } catch (err: any) {
    console.error('Erro crítico na atualização remota:', err);
  }

  updateOrcamentoLocal(id, updates);
}

export async function deleteOrcamentoAsync(id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('orcamentos')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (err) {
    console.error('Erro ao excluir orçamento:', err);
  }

  deleteOrcamentoLocal(id);
}

// ─── LOCAL STORAGE FALLBACK ───

function getOrcamentosLocal(): Orcamento[] {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) return [];
  return JSON.parse(data);
}

function saveOrcamentoLocal(orcamento: Orcamento): void {
  const list = getOrcamentosLocal();
  list.unshift(orcamento);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function updateOrcamentoLocal(id: string, updates: Partial<Orcamento>): void {
  const list = getOrcamentosLocal().map(o =>
    o.id === id ? { ...o, ...updates, updated_at: new Date().toISOString() } : o
  );
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function deleteOrcamentoLocal(id: string): void {
  const list = getOrcamentosLocal().filter(o => o.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function getOrcamentoLocalById(id: string): Orcamento | null {
  return getOrcamentosLocal().find(o => o.id === id) || null;
}

// ─── HELPERS ───

function mapRowToOrcamento(row: any): Orcamento {
  return {
    id: row.id,
    created_at: row.created_at,
    updated_at: row.updated_at || row.created_at,
    numero: row.numero,
    cliente_nome: row.cliente_nome,
    cliente_empresa: row.cliente_empresa,
    cliente_telefone: row.cliente_telefone,
    cliente_whatsapp: row.cliente_whatsapp,
    cliente_email: row.cliente_email,
    cliente_observacoes: row.cliente_observacoes,
    servicos: typeof row.servicos === 'string' ? JSON.parse(row.servicos) : (row.servicos || []),
    subtotal: row.subtotal,
    desconto_tipo: row.desconto_tipo || 'nenhum',
    desconto_valor: row.desconto_valor || 0,
    valor_final: row.valor_final,
    observacoes: row.observacoes,
    prazo_entrega: row.prazo_entrega,
    validade: row.validade || 30,
    status: row.status || 'rascunho',
  };
}
