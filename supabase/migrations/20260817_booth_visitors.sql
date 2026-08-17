CREATE TABLE IF NOT EXISTS public.booth_visitors (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_title VARCHAR(255),
    visitor_name VARCHAR(255) NOT NULL,
    phone VARCHAR(255) NOT NULL,
    company VARCHAR(255),
    interest VARCHAR(255)[],
    registered_at TIMESTAMPTZ DEFAULT NOW()
);

-- Allow anonymous inserts for the frontend form
ALTER TABLE public.booth_visitors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public insert on booth_visitors" 
ON public.booth_visitors 
FOR INSERT 
TO public
WITH CHECK (true);
