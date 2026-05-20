-- Criação da tabela de Demandas
CREATE TABLE IF NOT EXISTS public.demandas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    nome_cliente TEXT NOT NULL,
    empresa TEXT,
    instagram TEXT,
    whatsapp TEXT,
    titulo TEXT NOT NULL,
    descricao TEXT,
    categoria TEXT NOT NULL,
    prioridade TEXT NOT NULL CHECK (prioridade IN ('baixa', 'média', 'alta', 'urgente')),
    status TEXT NOT NULL CHECK (status IN ('novo', 'orçamento', 'em produção', 'revisão', 'entregue', 'cancelado')),
    valor NUMERIC(10, 2) DEFAULT 0,
    pago BOOLEAN DEFAULT false,
    prazo_entrega DATE,
    observacoes TEXT
);

-- Desabilitando RLS para facilitar integração inicial
ALTER TABLE public.demandas DISABLE ROW LEVEL SECURITY;

-- Índices para buscas e filtros otimizados
CREATE INDEX IF NOT EXISTS idx_demandas_nome_cliente ON public.demandas(nome_cliente);
CREATE INDEX IF NOT EXISTS idx_demandas_empresa ON public.demandas(empresa);
CREATE INDEX IF NOT EXISTS idx_demandas_status ON public.demandas(status);
CREATE INDEX IF NOT EXISTS idx_demandas_prioridade ON public.demandas(prioridade);
CREATE INDEX IF NOT EXISTS idx_demandas_created_at ON public.demandas(created_at DESC);
