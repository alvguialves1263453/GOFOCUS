import { supabase } from "./supabase";

export interface InstagramClient {
  id: string;
  name: string;
  username: string;
  profile_picture: string;
  start_date: string;
  monthly_value: number;
  payment_day: number;
  status: 'ativo' | 'pendente' | 'pausado' | 'cancelado';
  niche: string;
  notes: string;
  contract_photos?: string[];
  contract_value?: number;
  contract_frequency?: 'único' | 'semanal' | 'quinzenal' | 'mensal';
  contract_payment_method?: string;
  contract_payment_channels?: string;
  contract_type?: string;
  contract_installments?: number;
  contract_installment_value?: number;
  contract_due_start?: string;
  contract_due_day?: number;
  contract_notes?: string;
  contract_locked?: boolean;
  created_at: string;
  updated_at: string;
}

export interface FollowerHistory {
  id: string;
  client_id: string;
  date: string;
  followers_start: number;
  followers_end: number;
}

export interface InstagramPost {
  id: string;
  client_id: string;
  date: string;
  type: 'reels' | 'story' | 'feed' | 'carrossel';
  caption: string;
  reach: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  post_link: string;
  image_url?: string;
  created_at?: string;
}

export interface InstagramPayment {
  id: string;
  client_id: string;
  date: string;
  amount: number;
  status: 'paid' | 'pending';
}

export interface InstagramTask {
  id: string;
  client_id: string;
  title: string;
  description?: string;
  due_date: string;
  priority: 'baixa' | 'média' | 'alta' | 'urgente';
  completed: boolean;
  type: 'checklist' | 'task' | 'idea' | 'pauta' | 'reminder';
}

export const getInstagramClients = async () => {
  const { data, error } = await supabase
    .from('instagram_clients')
    .select('*')
    .order('name');
  if (error) throw error;
  return data as InstagramClient[];
};

export const getInstagramClient = async (id: string) => {
  const { data, error } = await supabase
    .from('instagram_clients')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data as InstagramClient;
};

export const createInstagramClient = async (client: Omit<InstagramClient, 'id' | 'created_at' | 'updated_at'>) => {
  const { data, error } = await supabase
    .from('instagram_clients')
    .insert([client])
    .select()
    .single();
  if (error) throw error;
  return data as InstagramClient;
};

export const updateInstagramClient = async (id: string, updates: Partial<InstagramClient>) => {
  const { data, error } = await supabase
    .from('instagram_clients')
    .update(updates)
    .eq('id', id)
    .select();
  if (error) throw error;
  return (data?.[0] || null) as InstagramClient | null;
};

export const deleteInstagramClient = async (id: string) => {
  const { error } = await supabase
    .from('instagram_clients')
    .delete()
    .eq('id', id);
  if (error) throw error;
};

// Followers
export const getFollowerHistory = async (clientId: string, days?: number) => {
  let query = supabase
    .from('instagram_followers_history')
    .select('*')
    .eq('client_id', clientId);

  if (days) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    query = query.gte('date', cutoff.toISOString().split('T')[0]);
  }

  const { data, error } = await query.order('date', { ascending: false });
  if (error) throw error;
  return data as FollowerHistory[];
};

export const addFollowerEntry = async (entry: Omit<FollowerHistory, 'id'>) => {
  const { data, error } = await supabase
    .from('instagram_followers_history')
    .upsert([entry], { onConflict: 'client_id,date' })
    .select()
    .single();
  if (error) throw error;
  return data as FollowerHistory;
};

export const updateFollowerEntry = async (id: string, updates: Partial<FollowerHistory>) => {
  const { data, error } = await supabase
    .from('instagram_followers_history')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as FollowerHistory;
};

export const deleteFollowerEntry = async (id: string) => {
  const { error } = await supabase.from('instagram_followers_history').delete().eq('id', id);
  if (error) throw error;
};

// Posts
export const getInstagramPosts = async (clientId: string, days?: number) => {
  let query = supabase
    .from('instagram_posts')
    .select('*')
    .eq('client_id', clientId);

  if (days) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    query = query.gte('date', cutoff.toISOString().split('T')[0]);
  }

  const { data, error } = await query.order('date', { ascending: false });
  if (error) throw error;
  return data as InstagramPost[];
};

export const addInstagramPost = async (post: Omit<InstagramPost, 'id' | 'created_at'>) => {
  const { data, error } = await supabase
    .from('instagram_posts')
    .insert([post])
    .select()
    .single();
  if (error) throw error;
  return data as InstagramPost;
};

export const updateInstagramPost = async (id: string, updates: Partial<InstagramPost>) => {
  const { data, error } = await supabase
    .from('instagram_posts')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as InstagramPost;
};

export const deleteInstagramPost = async (id: string) => {
  const { error } = await supabase.from('instagram_posts').delete().eq('id', id);
  if (error) throw error;
};

// Payments
export const getInstagramPayments = async (clientId: string) => {
  const { data, error } = await supabase
    .from('instagram_payments')
    .select('*')
    .eq('client_id', clientId)
    .order('date', { ascending: false });
  if (error) throw error;
  return data as InstagramPayment[];
};

export const addInstagramPayment = async (payment: Omit<InstagramPayment, 'id' | 'created_at'>) => {
  const { data, error } = await supabase
    .from('instagram_payments')
    .insert([payment])
    .select()
    .single();
  if (error) throw error;
  return data as InstagramPayment;
};

export const updateInstagramPayment = async (id: string, updates: Partial<InstagramPayment>) => {
  const { data, error } = await supabase
    .from('instagram_payments')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as InstagramPayment;
};

export const deleteInstagramPayment = async (id: string) => {
  const { error } = await supabase.from('instagram_payments').delete().eq('id', id);
  if (error) throw error;
};

// Tasks
export const getInstagramTasks = async (clientId: string) => {
  const { data, error } = await supabase
    .from('instagram_tasks')
    .select('*')
    .eq('client_id', clientId)
    .order('due_date', { ascending: true });
  if (error) throw error;
  return data as InstagramTask[];
};

export const addInstagramTask = async (task: Omit<InstagramTask, 'id' | 'created_at' | 'updated_at'>) => {
  const { data, error } = await supabase
    .from('instagram_tasks')
    .insert([task])
    .select()
    .single();
  if (error) throw error;
  return data as InstagramTask;
};

export const updateInstagramTask = async (id: string, updates: Partial<InstagramTask>) => {
  const { data, error } = await supabase
    .from('instagram_tasks')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as InstagramTask;
};

export const deleteInstagramTask = async (id: string) => {
  const { error } = await supabase.from('instagram_tasks').delete().eq('id', id);
  if (error) throw error;
};
export interface InstagramExpense {
  id: string;
  client_id: string;
  description: string;
  amount: number;
  date: string;
  category: string;
}

// Expenses
export const getInstagramExpenses = async (clientId: string) => {
  const { data, error } = await supabase
    .from('instagram_expenses')
    .select('*')
    .eq('client_id', clientId)
    .order('date', { ascending: false });
  if (error) throw error;
  return data as InstagramExpense[];
};

export const addInstagramExpense = async (expense: Omit<InstagramExpense, 'id'>) => {
  const { data, error } = await supabase
    .from('instagram_expenses')
    .insert([expense])
    .select()
    .single();
  if (error) throw error;
  return data as InstagramExpense;
};

export const updateInstagramExpense = async (id: string, updates: Partial<InstagramExpense>) => {
  const { data, error } = await supabase
    .from('instagram_expenses')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as InstagramExpense;
};

export const deleteInstagramExpense = async (id: string) => {
  const { error } = await supabase.from('instagram_expenses').delete().eq('id', id);
  if (error) throw error;
};

// Scrappa API Helpers
const scrappaHeaders = () => ({
  'x-api-key': getScrappaKey(),
  'Accept': 'application/json'
});

export const fetchScrappaPosts = async (username: string, nextMaxId?: string) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  let url = `https://scrappa.co/api/instagram/user/posts?username=${username.replace('@', '')}`;
  if (nextMaxId) url += `&max_id=${nextMaxId}`;
  try {
    const response = await fetch(url, { headers: scrappaHeaders(), signal: controller.signal });
    clearTimeout(timeout);
    if (!response.ok) throw new Error(`Erro HTTP ${response.status}`);
    const data = await response.json();
    if (!data.success) throw new Error(data.message || 'Erro ao buscar posts');
    return data.posts || [];
  } catch (err: any) {
    clearTimeout(timeout);
    if (err.name === 'AbortError') throw new Error('Timeout ao buscar posts (10s)');
    throw err;
  }
};

export const fetchScrappaProfile = async (username: string, refresh?: boolean) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  const url = `https://scrappa.co/api/instagram/user?username=${username.replace('@', '')}&refresh=${refresh ? 'true' : 'false'}&_t=${Date.now()}`;
  try {
    const response = await fetch(url, { headers: scrappaHeaders(), signal: controller.signal });
    clearTimeout(timeout);
    if (!response.ok) throw new Error(`Erro HTTP ${response.status}`);
    return await response.json();
  } catch (err: any) {
    clearTimeout(timeout);
    if (err.name === 'AbortError') throw new Error('Timeout ao buscar perfil (15s)');
    throw err;
  }
};

export const getAllFollowerHistory = async (days?: number) => {
  let query = supabase
    .from('instagram_followers_history')
    .select('*');

  if (days) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    query = query.gte('date', cutoff.toISOString().split('T')[0]);
  }

  const { data, error } = await query.order('date', { ascending: false });
  if (error) throw error;
  return data as FollowerHistory[];
};

export const getAllInstagramPosts = async (days?: number) => {
  let query = supabase
    .from('instagram_posts')
    .select('*');

  if (days) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    query = query.gte('date', cutoff.toISOString().split('T')[0]);
  }

  const { data, error } = await query.order('date', { ascending: false });
  if (error) throw error;
  return data as InstagramPost[];
};

export const DEFAULT_SCRAPPA_KEY = 'eyJpdiI6IkFvZWk5dGNYOTRCajdlR1JTQm5aY1E9PSIsInZhbHVlIjoiK3hZRVpTOUQyYlIxOW1sc3c2U1VGRXZ1ZFUrSHE3cnVFdG12Q1B0aHZRNTl3NnVtd2t0QkdzMiswaUlZT0EvbTNHajUvWmQybVIwdE5lR3duZXAyUEE9PSIsIm1hYyI6IjczYmZkYWJlNjMwOTNjZWU4NTVjYWVjODg0MWY5MTA1MDBlODk3ZWM2ZDBmNTg1OWZkYzQwY2NiZDYwMTlmNzUiLCJ0YWciOiIifQ==';

export const getScrappaKey = () => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('scrappa_api_key');
    if (saved) return saved;
  }
  return DEFAULT_SCRAPPA_KEY;
};

export const setScrappaKey = (key: string) => {
  if (typeof window !== 'undefined') {
    if (key.trim() === '') {
      localStorage.removeItem('scrappa_api_key');
    } else {
      localStorage.setItem('scrappa_api_key', key.trim());
    }
  }
};

