-- 允许服务端/管理员插入 profiles（用于注册/邀请用户）
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin can insert profiles" ON public.profiles FOR INSERT WITH CHECK (auth.role() = 'service_role' OR auth.role() = 'authenticated');
-- 允许所有用户读取 profiles
CREATE POLICY IF NOT EXISTS "Public profiles are viewable by everyone." ON public.profiles FOR SELECT USING (true);
-- 允许用户自己更新自己的 profile
CREATE POLICY IF NOT EXISTS "Users can update own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);
