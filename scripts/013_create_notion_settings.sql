CREATE TABLE IF NOT EXISTS public.notion_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  encrypted_access_token TEXT NOT NULL,
  workspace_name TEXT,
  database_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.notion_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own notion settings"
  ON public.notion_settings FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
