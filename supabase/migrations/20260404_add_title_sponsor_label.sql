-- Migration: Add customizable title_sponsor_label column to tournament_settings
-- Date: 2026-04-04

ALTER TABLE public.tournament_settings 
ADD COLUMN IF NOT EXISTS title_sponsor_label TEXT DEFAULT 'Title Sponsor / 冠名商';
