-- Add contract lock flag to instagram_clients
ALTER TABLE public.instagram_clients
  ADD COLUMN IF NOT EXISTS contract_locked BOOLEAN DEFAULT false;
