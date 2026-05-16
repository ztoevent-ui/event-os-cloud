-- ============================================================
-- MIGRATION: Miri Surname Pickleball Championship
-- 2026第一届民都鲁省姓氏匹克球锦标赛 (黄守光杯)
-- Created: 2026-05-16
-- Depends on: 20260404_tournament_architect.sql
-- ============================================================

-- ── 1. ARENA CLANS (公会/姓氏档案) ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.arena_clans (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tournament_id    UUID NOT NULL REFERENCES public.arena_tournaments(id) ON DELETE CASCADE,
    name             TEXT NOT NULL,           -- e.g. "陈氏公会"
    short_name       TEXT NOT NULL,           -- e.g. "Chan"
    logo_url         TEXT,
    primary_color    TEXT DEFAULT '#0056B3',
    secondary_color  TEXT DEFAULT '#CCFF00',
    players          JSONB NOT NULL DEFAULT '[]',
    contact_person   TEXT,
    is_active        BOOLEAN DEFAULT TRUE,
    created_at       TIMESTAMPTZ DEFAULT NOW(),
    updated_at       TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tournament_id, short_name)
);
CREATE INDEX IF NOT EXISTS idx_arena_clans_tournament ON public.arena_clans(tournament_id);

-- ── 2. MATCH CATEGORIES (MD1, WD, XD, V, MD2) ───────────────────────────────
-- Tie sequence: MD1(1) → WD(2) → XD(3) → V-Veterans(4) → MD2(5)
CREATE TABLE IF NOT EXISTS public.arena_match_categories (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tournament_id    UUID NOT NULL REFERENCES public.arena_tournaments(id) ON DELETE CASCADE,
    code             TEXT NOT NULL,   -- 'MD1','WD','XD','V','MD2'
    label_en         TEXT NOT NULL,
    label_zh         TEXT,
    sequence_order   INT NOT NULL DEFAULT 1,
    gender           TEXT DEFAULT 'MIXED',
    players_per_side INT DEFAULT 2,
    is_active        BOOLEAN DEFAULT TRUE,
    created_at       TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tournament_id, code)
);

-- ── 3. ADD CLAN REFS TO arena_matches ────────────────────────────────────────
ALTER TABLE public.arena_matches
    ADD COLUMN IF NOT EXISTS clan_a_id    UUID REFERENCES public.arena_clans(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS clan_b_id    UUID REFERENCES public.arena_clans(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS category_code TEXT; -- 'MD1','WD','XD','V','MD2'

CREATE INDEX IF NOT EXISTS idx_arena_matches_category
    ON public.arena_matches(tournament_id, category_code);

-- ── 4. PICKLEBALL SCORING FUNCTION ───────────────────────────────────────────
-- Rally Scoring 21分制; side switch when either team reaches 11 (handled client-side).
-- win_by: 2 (standard pickleball), freeze_at: NULL (pure 21-pt, no freeze cap).
CREATE OR REPLACE FUNCTION public.seed_pickleball_round_rules(p_tournament_id UUID)
RETURNS VOID AS $$
BEGIN
    INSERT INTO public.arena_round_rules (
        tournament_id, round_type, scoring_type, max_points, win_by, sets_to_win, max_sets, freeze_at
    ) VALUES
        (p_tournament_id, 'GROUP',      'RALLY', 21, 2, 1, 1, NULL),
        (p_tournament_id, 'KNOCKOUT',   'RALLY', 21, 2, 1, 1, NULL),
        (p_tournament_id, 'SEMIFINALS', 'RALLY', 21, 2, 1, 1, NULL),
        (p_tournament_id, 'FINALS',     'RALLY', 21, 2, 1, 1, NULL)
    ON CONFLICT (tournament_id, round_type) DO UPDATE
        SET scoring_type = EXCLUDED.scoring_type,
            max_points   = EXCLUDED.max_points,
            win_by       = EXCLUDED.win_by,
            sets_to_win  = EXCLUDED.sets_to_win,
            max_sets     = EXCLUDED.max_sets,
            freeze_at    = EXCLUDED.freeze_at,
            updated_at   = NOW();
END;
$$ LANGUAGE plpgsql;

-- ── 5. VIEW: Group standings with win/loss aggregated from match results ──────
CREATE OR REPLACE VIEW public.v_clan_group_standings AS
SELECT
    gs.tournament_id,
    gs.group_id,
    gs.team_name,
    gs.team_id,
    gs.played,
    gs.wins,
    gs.losses,
    gs.points_for,
    gs.points_against,
    gs.point_diff,
    gs.rank,
    c.primary_color,
    c.secondary_color,
    c.name  AS clan_name_zh
FROM public.arena_group_standings gs
LEFT JOIN public.arena_clans c ON gs.team_id = c.id
ORDER BY gs.tournament_id, gs.group_id, gs.wins DESC, gs.point_diff DESC;

-- ── 6. RLS ───────────────────────────────────────────────────────────────────
ALTER TABLE public.arena_clans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "arena_clans_read"  ON public.arena_clans FOR SELECT USING (true);
CREATE POLICY "arena_clans_write" ON public.arena_clans FOR ALL    USING (true);

ALTER TABLE public.arena_match_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "match_cat_read"  ON public.arena_match_categories FOR SELECT USING (true);
CREATE POLICY "match_cat_write" ON public.arena_match_categories FOR ALL    USING (true);

-- ── 7. updated_at trigger for clans ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.update_clans_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS arena_clans_updated_at ON public.arena_clans;
CREATE TRIGGER arena_clans_updated_at
    BEFORE UPDATE ON public.arena_clans
    FOR EACH ROW EXECUTE FUNCTION public.update_clans_updated_at();

-- ── NOTES ────────────────────────────────────────────────────────────────────
-- 9 Clans  : 陈氏, 林氏, 李氏, 黄氏, 许氏, 六桂堂, 张氏, 郑氏, 吴氏
-- 5 Events : MD1 → WD → XD → V(元老) → MD2  (Tie; first to win 3 takes the Tie)
-- Groups   : A (陈林李黄 × 4) | B (许六桂堂张郑吴 × 5)
-- Day 2    : 半决赛 A1 vs B2 | B1 vs A2 → 季军赛 + 决赛
-- Scoring  : Rally 21分制, side-switch at 11, win by 2
