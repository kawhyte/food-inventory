-- ============================================================
-- Food Inventory App — Add barcode column to items
-- Run this in the Supabase SQL Editor AFTER schema.sql
-- ============================================================

alter table public.items add column if not exists barcode text;
