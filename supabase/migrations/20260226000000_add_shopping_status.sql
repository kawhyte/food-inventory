ALTER TABLE public.items
  DROP CONSTRAINT items_status_check,
  ADD CONSTRAINT items_status_check
    CHECK (status IN ('available', 'low', 'expired', 'consumed', 'shopping'));
