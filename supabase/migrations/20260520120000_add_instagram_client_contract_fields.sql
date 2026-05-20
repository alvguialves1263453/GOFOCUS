-- Add contract fields to instagram_clients
ALTER TABLE public.instagram_clients
  ADD COLUMN contract_photos TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN contract_value NUMERIC(10, 2) DEFAULT 0,
  ADD COLUMN contract_frequency TEXT DEFAULT 'mensal' CHECK (contract_frequency IN ('único', 'semanal', 'quinzenal', 'mensal')),
  ADD COLUMN contract_payment_method TEXT,
  ADD COLUMN contract_payment_channels TEXT,
  ADD COLUMN contract_type TEXT,
  ADD COLUMN contract_installments INTEGER DEFAULT 1,
  ADD COLUMN contract_installment_value NUMERIC(10, 2) DEFAULT 0,
  ADD COLUMN contract_due_start DATE,
  ADD COLUMN contract_due_day INTEGER,
  ADD COLUMN contract_notes TEXT;
