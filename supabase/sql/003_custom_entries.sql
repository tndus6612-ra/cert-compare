create table custom_entries (
  id uuid primary key default gen_random_uuid(),
  region text not null,
  country text not null,
  authority text not null,
  application_type text not null,
  product_class text not null,
  months_approx numeric,
  period_description text not null,
  government_fee_local text not null,
  validity text not null,
  notes text,
  source text not null,
  author text not null,
  created_at timestamptz not null default now()
);

alter table custom_entries enable row level security;

-- 누구나 읽을 수 있음
create policy "public can read custom entries"
  on custom_entries for select
  using (true);

-- insert는 PIN 검증을 통과한 Edge Function(add-entry)만 가능 (정책 없음 = 기본 거부)
