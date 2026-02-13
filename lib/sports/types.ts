
export interface Tournament {
    id: string;
    project_id?: string;
    name: string;
    type: 'badminton' | 'pickleball' | 'basketball' | 'football' | 'tennis' | 'table_tennis' | 'volleyball';
    status: 'setup' | 'active' | 'completed';
    config: SportConfig & {
        categories?: CategoryConfig[];
        teams?: Team[]; // Roster of all teams/players
        courts?: string; // '1-10', '1-30', 'A-Z'
    };
    created_at: string;
    updated_at: string;
}

export interface CategoryConfig {
    id: string; // e.g. 'ms', 'md'
    name: string; // "Men's Singles"
    team_count: number; // e.g. 32
}

export interface Team {
    id?: string;
    name: string; // "Lee Zii Jia" or "Aaron/Soh"
    category: string; // 'ms'
    players: string[]; // ["Lee Zii Jia"] or ["Aaron Chia", "Soh Wooi Yik"]
    avatar_url?: string;
}

export type SportConfig = BadmintonConfig | PickleballConfig | BasketballConfig | FootballConfig | BaseSportConfig;

export interface BaseSportConfig {
    max_sets: number; // e.g. 3 for Bo3
    points_to_win: number;
}

export interface BadmintonConfig extends BaseSportConfig {
    type: 'badminton';
    enable_dewce: boolean; // 20-20 -> 2 points clear
}

export interface PickleballConfig extends BaseSportConfig {
    type: 'pickleball';
    scoring_type: 'rally' | 'side_out';
    server_type: 'singles' | 'doubles';
}

export interface BasketballConfig extends BaseSportConfig {
    type: 'basketball';
    period_length_minutes: number; // e.g. 10 or 12
    periods: number; // 4
}

export interface FootballConfig extends BaseSportConfig {
    type: 'football';
    half_length_minutes: number; // 45
}

export interface Player {
    id: string;
    tournament_id: string;
    name: string;
    avatar_url?: string;
    stats: {
        wins: number;
        losses: number;
        points_diff: number;
        sets_diff: number;
        played: number;
    };
    created_at: string;
}

export interface Match {
    id: string;
    tournament_id: string;
    player1_id: string | null;
    player2_id: string | null;
    round_name: string;
    court_id?: string;
    status: 'scheduled' | 'ongoing' | 'completed';

    current_score_p1: number;
    current_score_p2: number;

    // Set/Game counters
    sets_p1: number;
    sets_p2: number;

    // Detailed Stats for specific sports
    periods_scores?: { p1: number, p2: number }[]; // For Basketball/Volleyball sets
    timer_seconds?: number; // For timed sports (Basketball/Football)
    is_paused?: boolean;
    current_period?: number;
    timer_last_updated?: string;

    server_side: number;
    serving_player_id?: string;

    winner_id?: string;
    next_match_id?: string;

    created_at: string;
    updated_at: string;
}

export interface SponsorAd {
    id: string;
    tournament_id: string;
    type: 'video' | 'image';
    url: string;
    duration: number;
    is_active: boolean;
    display_location: 'sidebar' | 'fullscreen' | 'banner';
}
