create table team_notes (
  id uuid primary key default gen_random_uuid(),
  cert_id text not null,
  author text not null,
  note text not null,
  created_at timestamptz not null default now()
);

alter table team_notes enable row level security;

-- 누구나 메모를 읽을 수 있음 (사이트가 공개 사이트라서)
create policy "public can read notes"
  on team_notes for select
  using (true);

-- insert(쓰기)는 일부러 허용 정책을 안 만듦.
-- PIN 검증을 통과한 Edge Function만 service_role 키로 직접 쓸 수 있음.
