-- 興味プロファイルから未視聴ポッドキャストを除外する
-- 保存しただけのコンテンツではなく、実際に視聴を始めたコンテンツを興味の根拠にする

create or replace function public.get_profile_embedding(p_user_id uuid)
returns vector(768)
language sql
stable
as $$
  select avg(embedding)::vector(768)
  from public.podcasts
  where user_id = p_user_id
    and embedding is not null
    and status in ('watching', 'watched')
$$;
