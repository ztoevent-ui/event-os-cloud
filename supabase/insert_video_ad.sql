-- [Ad] 替换全屏广告为高清运动视频 (动态效果)
-- 这是一个高质量的运动慢动作素材（无版权），效果非常接近 Nike/Victor 广告
INSERT INTO sponsor_ads (tournament_id, type, url, duration, is_active, display_location)
SELECT 
    id, 
    'video', 
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4', -- (慢动作的高清运动样片)
    20, 
    true, 
    'pip' -- 画中画模式
FROM tournaments WHERE status = 'active'
LIMIT 1;
