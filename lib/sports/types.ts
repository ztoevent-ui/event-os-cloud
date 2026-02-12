
export interface Tournament {
    id: string;
    project_id?: string;
    name: string;
    type: 'badminton' | 'pickleball' | 'other';
    status: 'setup' | 'active' | 'completed';
    config: Record<string, any>;
    created_at: string;
    updated_at: string;
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
    sets_p1: number;
    sets_p2: number;

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
