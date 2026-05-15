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
  description: string;
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
    .select()
    .single();
  if (error) throw error;
  return data as InstagramClient;
};

export const deleteInstagramClient = async (id: string) => {
  const { error } = await supabase
    .from('instagram_clients')
    .delete()
    .eq('id', id);
  if (error) throw error;
};

// Followers
export const getFollowerHistory = async (clientId: string) => {
  const { data, error } = await supabase
    .from('instagram_followers_history')
    .select('*')
    .eq('client_id', clientId)
    .order('date', { ascending: false });
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
export const getInstagramPosts = async (clientId: string) => {
  const { data, error } = await supabase
    .from('instagram_posts')
    .select('*')
    .eq('client_id', clientId)
    .order('date', { ascending: false });
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
