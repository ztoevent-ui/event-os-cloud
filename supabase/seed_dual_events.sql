-- 1. Create Dual Tournament Scenario (Badminton & Football)

DO $$
DECLARE
    t1_id UUID;
    t2_id UUID;
    p1_id UUID; p2_id UUID; -- For Badminton
    p3_id UUID; p4_id UUID; -- For Football
BEGIN
    -- --- TOURNAMENT 1: BADMINTON ---
    INSERT INTO tournaments (name, type, status, config)
    VALUES ('ZTO Super Series Final', 'badminton', 'active', '{}')
    RETURNING id INTO t1_id;

    -- Players
    INSERT INTO players (tournament_id, name, avatar_url) VALUES 
    (t1_id, 'Lee Zii Jia', 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/Lee_Zii_Jia_at_French_Open_2024.jpg/800px-Lee_Zii_Jia_at_French_Open_2024.jpg') RETURNING id INTO p1_id;
    
    INSERT INTO players (tournament_id, name, avatar_url) VALUES 
    (t1_id, 'Viktor Axelsen', 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Viktor_Axelsen_at_French_Open_2024.jpg/600px-Viktor_Axelsen_at_French_Open_2024.jpg') RETURNING id INTO p2_id;

    -- Match
    INSERT INTO matches (tournament_id, player1_id, player2_id, round_name, court_id, status, current_score_p1, current_score_p2, sets_p1, sets_p2)
    VALUES (t1_id, p1_id, p2_id, 'Final', 'Court 1', 'ongoing', 19, 18, 1, 1);
    
    -- --- TOURNAMENT 2: FOOTBALL ---
    INSERT INTO tournaments (name, type, status, config)
    VALUES ('ZTO Premier League', 'football', 'active', '{"half_length_minutes": 45}')
    RETURNING id INTO t2_id;

    -- Teams
    INSERT INTO players (tournament_id, name, avatar_url) VALUES 
    (t2_id, 'JDT', 'https://upload.wikimedia.org/wikipedia/en/e/ee/Johor_Darul_Takzim_FC_logo.svg') RETURNING id INTO p3_id;
    
    INSERT INTO players (tournament_id, name, avatar_url) VALUES 
    (t2_id, 'Selangor', 'https://upload.wikimedia.org/wikipedia/en/8/87/Selangor_FC_logo.svg') RETURNING id INTO p4_id;

    -- Match
    INSERT INTO matches (tournament_id, player1_id, player2_id, round_name, court_id, status, current_score_p1, current_score_p2, sets_p1, sets_p2, timer_seconds, current_period, is_paused)
    VALUES (t2_id, p3_id, p4_id, 'El Clásico', 'Stadium Nasional', 'ongoing', 2, 2, 0, 0, 2750, 2, false);

END $$;
