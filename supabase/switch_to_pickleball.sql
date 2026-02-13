-- 1. Deactivate existing active tournaments to avoid conflict
UPDATE tournaments 
SET status = 'completed' 
WHERE status = 'active';

-- 2. Create New Pickleball Tournament
DO $$
DECLARE
    new_tourney_id UUID;
    p1_id UUID;
    p2_id UUID;
BEGIN
    INSERT INTO tournaments (name, type, status, config)
    VALUES ('PPA Arizona Grand Slam', 'pickleball', 'active', '{"server_type": "singles", "scoring_type": "rally"}')
    RETURNING id INTO new_tourney_id;

    -- 3. Create Players (Using placeholders or generic sports URLs)
    INSERT INTO players (tournament_id, name, avatar_url, group_name)
    VALUES (new_tourney_id, 'Ben Johns', 'https://placehold.co/400x600/1e40af/ffffff?text=Ben+Johns', 'Pro')
    RETURNING id INTO p1_id;

    INSERT INTO players (tournament_id, name, avatar_url, group_name)
    VALUES (new_tourney_id, 'Tyson McGuffin', 'https://placehold.co/400x600/166534/ffffff?text=Tyson+Mc', 'Pro')
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
        serving_player_id
    )
    VALUES (
        new_tourney_id, 
        p1_id, 
        p2_id, 
        'Gold Medal', 
        'Championship Court', 
        'ongoing', 
        10, 
        8, 
        1, 
        0,
        p1_id
    );

    -- 5. Add Sponsor Ad
    INSERT INTO sponsor_ads (tournament_id, type, url, duration, is_active, display_location)
    VALUES (new_tourney_id, 'image', 'https://placehold.co/600x200/000000/FFF?text=JOOLA+Pickleball', 10, true, 'banner');

END $$;
