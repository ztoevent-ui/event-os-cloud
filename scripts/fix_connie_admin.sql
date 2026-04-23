-- =====================================================
-- STEP 1: 删除刚刚失败的账号
-- =====================================================
DELETE FROM auth.users WHERE email = 'conniewongconnie@hotmail.com';
DELETE FROM public.profiles WHERE email = 'conniewongconnie@hotmail.com';

-- （执行完上面的代码后，前往 Authentication -> Users 界面手动新增账号）

-- =====================================================
-- STEP 2: 将新账号升级为 Admin
-- =====================================================
UPDATE public.profiles 
SET role = 'admin' 
WHERE email = 'conniewongconnie@hotmail.com';
