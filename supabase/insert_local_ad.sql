-- [Local Ad] 插入本地广告图片 (ZERO TO ONE EVENT Logo)
-- 请注意：用户需要手动把图片保存为 /public/ads/zto_logo.jpg
INSERT INTO sponsor_ads (tournament_id, type, url, duration, is_active, display_location)
SELECT 
    id, 
    'image', 
    '/ads/zto_logo.jpg', -- 引用本地文件
    15, 
    true,
    'sidebar' -- 显示在侧边
FROM tournaments WHERE status = 'active' LIMIT 1;
