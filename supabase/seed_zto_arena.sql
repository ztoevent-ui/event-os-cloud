-- [ZTO Arena] 初始化测试数据: "ZTO Cup 2026 Finals" (羽毛球)

-- 1. 创建锦标赛 (Active)
WITH new_tournament AS (
    INSERT INTO tournaments (name, type, status, config)
    VALUES ('ZTO Cup 2026 Grand Final', 'badminton', 'active', '{"points_to_win": 21}')
    RETURNING id
),
-- 2. 创建 4 名种子选手
players_inserted AS (
    INSERT INTO players (tournament_id, name, avatar_url)
    SELECT id, 'Lee Chong Wei', 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Lee_Chong_Wei_in_2016.jpg/220px-Lee_Chong_Wei_in_2016.jpg' FROM new_tournament
    UNION ALL
    SELECT id, 'Lin Dan', 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/Lin_Dan_2013.jpg/220px-Lin_Dan_2013.jpg' FROM new_tournament
    UNION ALL
    SELECT id, 'Viktor Axelsen', 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Viktor_Axelsen_2017.jpg/220px-Viktor_Axelsen_2017.jpg' FROM new_tournament
    UNION ALL
    SELECT id, 'Kento Momota', 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Kento_Momota_2018.jpg/220px-Kento_Momota_2018.jpg' FROM new_tournament
    RETURNING id, name, tournament_id
),
-- 3. 创建一场正在进行的决赛 (Live Match)
match_demo AS (
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
    SELECT 
        p1.tournament_id,
        p1.id, -- P1: Lee Chong Wei
        p2.id, -- P2: Lin Dan
        'FINAL', 
        'Center Court', 
        'ongoing', 
        19, 
        20, 
        1, 
        1, 
        p2.id -- Lin Dan serving
    FROM players_inserted p1, players_inserted p2
    WHERE p1.name = 'Lee Chong Wei' AND p2.name = 'Lin Dan'
)
-- 4. 插入一些测试广告
INSERT INTO sponsor_ads (tournament_id, type, url, duration, is_active)
SELECT id, 'image', 'https://i.pinimg.com/736x/8e/1a/0a/8e1a0a2072f534932402517866380064.jpg', 10, true FROM new_tournament;
