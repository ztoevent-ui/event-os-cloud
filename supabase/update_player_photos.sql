-- [Fix] 更新球员头像为高清竖屏写真 (Lee Chong Wei & Lin Dan)

UPDATE players
SET avatar_url = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTWHbWshOgbUa-ScLqCUE9Pem-wuLanHVvHHA&s'
WHERE name = 'Lee Chong Wei';

UPDATE players
SET avatar_url = 'https://i.pinimg.com/736x/aa/6b/0c/aa6b0c6ce789fa4212d06cf458601848.jpg'
WHERE name = 'Lin Dan';
