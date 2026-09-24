-- Migration: Add lot_number to auction_items
-- Purpose: Allow manual input of lot numbers instead of relying on sort index

ALTER TABLE public.auction_items ADD COLUMN IF NOT EXISTS lot_number TEXT;
