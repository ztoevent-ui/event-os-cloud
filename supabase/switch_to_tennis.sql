-- 1. Deactivate existing
UPDATE tournaments SET status = 'completed' WHERE status = 'active';

-- 2. Create Tennis Tournament
DO $$
DECLARE
    new_tourney_id UUID;
    p1_id UUID;
    p2_id UUID;
BEGIN
    INSERT INTO tournaments (name, type, status, config)
    VALUES ('Wimbledon 2026', 'tennis', 'active', '{"sets": 5, "tiebreak": true}')
    RETURNING id INTO new_tourney_id;

    -- 3. Create Players
    INSERT INTO players (tournament_id, name, avatar_url)
    VALUES (new_tourney_id, 'Novak Djokovic', 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/Novak_Djokovic_US_Open_2023.jpg/800px-Novak_Djokovic_US_Open_2023.jpg')
    RETURNING id INTO p1_id;

    INSERT INTO players (tournament_id, name, avatar_url)
    VALUES (new_tourney_id, 'Carlos Alcaraz', 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/Carlos_Alcaraz_Wimbledon_2023.jpg/800px-Carlos_Alcaraz_Wimbledon_2023.jpg')
    RETURNING id INTO p2_id;

    -- 4. Create Match (Djokovic vs Alcaraz: 5th Set Thriller)
    INSERT INTO matches (
        tournament_id, 
        player1_id, 
        player2_id, 
        round_name, 
        court_id, 
        status, 
        current_score_p1, -- 3 points = 40
        current_score_p2, -- 3 points = 40 (Deuce)
        sets_p1, -- Sets won
        sets_p2,
        serving_player_id
    )
    VALUES (
        new_tourney_id, 
        p1_id, 
        p2_id, 
        'Final', 
        'Centre Court', 
        'ongoing', 
        3, -- 40
        3, -- 40 (DEUCE)
        2, -- 2 sets all
        2,
        p1_id -- Djokovic Serving
    );
     -- 5. Add Rolex Ad
    INSERT INTO sponsor_ads (tournament_id, type, url, duration, is_active, display_location)
    VALUES (new_tourney_id, 'image', 'https://upload.wikimedia.org/wikipedia/en/thumb/9/95/Rolex_logo.svg/1200px-Rolex_logo.svg.png', 10, true, 'banner');
END $$;
