-- SQL for Instagram Management System

-- 1. Clients Table
CREATE TABLE IF NOT EXISTS public.instagram_clients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    username TEXT NOT NULL, -- @instagram
    profile_picture TEXT,
    start_date DATE DEFAULT CURRENT_DATE,
    monthly_value NUMERIC(10, 2) DEFAULT 0,
    payment_day INTEGER CHECK (payment_day >= 1 AND payment_day <= 31),
    status TEXT DEFAULT 'ativo' CHECK (status IN ('ativo', 'pendente', 'pausado', 'cancelado')),
    niche TEXT,
    notes TEXT,
    contract_photos TEXT[] DEFAULT ARRAY[]::TEXT[],
    contract_value NUMERIC(10, 2) DEFAULT 0,
    contract_frequency TEXT DEFAULT 'mensal' CHECK (contract_frequency IN ('único', 'semanal', 'quinzenal', 'mensal')),
    contract_payment_method TEXT,
    contract_payment_channels TEXT,
    contract_type TEXT,
    contract_installments INTEGER DEFAULT 1,
    contract_installment_value NUMERIC(10, 2) DEFAULT 0,
    contract_due_start DATE,
    contract_due_day INTEGER,
    contract_locked BOOLEAN DEFAULT false,
    contract_notes TEXT,
    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Followers History Table
CREATE TABLE IF NOT EXISTS public.instagram_followers_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID REFERENCES public.instagram_clients(id) ON DELETE CASCADE,
    date DATE DEFAULT CURRENT_DATE,
    followers_start INTEGER DEFAULT 0,
    followers_end INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(client_id, date)
);

-- 3. Posts History Table
CREATE TABLE IF NOT EXISTS public.instagram_posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID REFERENCES public.instagram_clients(id) ON DELETE CASCADE,
    date DATE DEFAULT CURRENT_DATE,
    type TEXT CHECK (type IN ('reels', 'story', 'feed', 'carrossel')),
    caption TEXT,
    reach INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,
    comments INTEGER DEFAULT 0,
    shares INTEGER DEFAULT 0,
    saves INTEGER DEFAULT 0,
    post_link TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Payments Table
CREATE TABLE IF NOT EXISTS public.instagram_payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID REFERENCES public.instagram_clients(id) ON DELETE CASCADE,
    date DATE DEFAULT CURRENT_DATE,
    amount NUMERIC(10, 2) NOT NULL,
    status TEXT DEFAULT 'paid' CHECK (status IN ('paid', 'pending')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Tasks & Organization Table
CREATE TABLE IF NOT EXISTS public.instagram_tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID REFERENCES public.instagram_clients(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    due_date DATE,
    priority TEXT DEFAULT 'média' CHECK (priority IN ('baixa', 'média', 'alta', 'urgente')),
    completed BOOLEAN DEFAULT false,
    type TEXT DEFAULT 'task' CHECK (type IN ('checklist', 'task', 'idea', 'pauta', 'reminder')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.instagram_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instagram_followers_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instagram_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instagram_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instagram_tasks ENABLE ROW LEVEL SECURITY;

-- Policies (Public for now as requested for integration)
DROP POLICY IF EXISTS "Public full access clients" ON public.instagram_clients;
CREATE POLICY "Public full access clients" ON public.instagram_clients FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public full access followers" ON public.instagram_followers_history;
CREATE POLICY "Public full access followers" ON public.instagram_followers_history FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public full access posts" ON public.instagram_posts;
CREATE POLICY "Public full access posts" ON public.instagram_posts FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public full access payments" ON public.instagram_payments;
CREATE POLICY "Public full access payments" ON public.instagram_payments FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public full access instagram_tasks" ON public.instagram_tasks;
CREATE POLICY "Public full access instagram_tasks" ON public.instagram_tasks FOR ALL USING (true) WITH CHECK (true);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_instagram_clients_updated_at
    BEFORE UPDATE ON public.instagram_clients
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_instagram_tasks_updated_at
    BEFORE UPDATE ON public.instagram_tasks
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();
