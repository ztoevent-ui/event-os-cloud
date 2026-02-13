-- 1. Deactivate existing active tournaments
UPDATE tournaments 
SET status = 'completed' 
WHERE status = 'active';

-- 2. Create New Football Tournament
DO $$
DECLARE
    new_tourney_id UUID;
    p1_id UUID;
    p2_id UUID;
BEGIN
    INSERT INTO tournaments (name, type, status, config)
    VALUES ('ZTO Premier League 2026', 'football', 'active', '{"half_length_minutes": 45, "extra_time": true}')
    RETURNING id INTO new_tourney_id;

    -- 3. Create Teams
    INSERT INTO players (tournament_id, name, avatar_url)
    VALUES (new_tourney_id, 'Man United', 'https://upload.wikimedia.org/wikipedia/en/7/7a/Manchester_United_FC_crest.svg')
    RETURNING id INTO p1_id;

    INSERT INTO players (tournament_id, name, avatar_url)
    VALUES (new_tourney_id, 'Liverpool', 'https://upload.wikimedia.org/wikipedia/en/0/0c/Liverpool_FC.svg')
    RETURNING id INTO p2_id;

    -- 4. Create Match
    INSERT INTO matches (
        tournament_id, 
        player1_id, 
        player2_id, 
        round_name, 
        court_id, 
        status, 
        current_score_p1, 
        current_score_p2, 
        sets_p1, 
        sets_p2,
        timer_seconds,
        is_paused,
        current_period
    )
    VALUES (
        new_tourney_id, 
        p1_id, 
        p2_id, 
        'Week 35', 
        'Old Trafford', 
        'ongoing', 
        2, 
        1, 
        0, 
        0,
        2845, -- 47:25 (Into 1st Half Stoppage or Early 2nd Half)
        false, -- Running
        2 -- 2nd Half
    );
    -- 5. Add Sponsor Ad
    INSERT INTO sponsor_ads (tournament_id, type, url, duration, is_active, display_location)
    VALUES (new_tourney_id, 'image', 'https://upload.wikimedia.org/wikipedia/commons/2/20/Adidas_Logo.svg', 10, true, 'banner');

END $$;
