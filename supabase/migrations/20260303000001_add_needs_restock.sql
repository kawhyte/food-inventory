ALTER TABLE public.items
  ADD COLUMN IF NOT EXISTS needs_restock boolean DEFAULT false;
