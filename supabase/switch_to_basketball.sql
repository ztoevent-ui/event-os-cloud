-- 1. Deactivate existing active tournaments to avoid conflict
UPDATE tournaments 
SET status = 'completed' 
WHERE status = 'active';

-- 2. Create New Basketball Tournament
DO $$
DECLARE
    new_tourney_id UUID;
    p1_id UUID;
    p2_id UUID;
BEGIN
    INSERT INTO tournaments (name, type, status, config)
    VALUES ('ZTO NBA Finals 2026', 'basketball', 'active', '{"periods": 4, "period_length_minutes": 12}')
    RETURNING id INTO new_tourney_id;

    -- 3. Create Teams/Players (Using placeholders - we use players table for teams in this simple model)
    INSERT INTO players (tournament_id, name, avatar_url)
    VALUES (new_tourney_id, 'Lakers', 'https://upload.wikimedia.org/wikipedia/commons/3/3c/Los_Angeles_Lakers_logo.svg')
    RETURNING id INTO p1_id;

    INSERT INTO players (tournament_id, name, avatar_url)
    VALUES (new_tourney_id, 'Celtics', 'https://upload.wikimedia.org/wikipedia/en/8/8f/Boston_Celtics.svg')
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
        'Game 7', 
        'Center Court', 
        'ongoing', 
        86, 
        84, 
        4, -- Fouls
        3, -- Fouls
        124, -- 2:04 left
        true,
        4 -- Q4
    );
    -- 5. Add Sponsor Ad
    INSERT INTO sponsor_ads (tournament_id, type, url, duration, is_active, display_location)
    VALUES (new_tourney_id, 'image', 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Samsung_Logo.svg/2560px-Samsung_Logo.svg.png', 10, true, 'banner');

END $$;
