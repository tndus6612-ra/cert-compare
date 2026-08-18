-- 공식 데이터(entry_overrides)는 삭제 대신 "숨김" 플래그로 처리
alter table entry_overrides
  add column deleted boolean not null default false;

-- 모든 추가/수정/삭제 이력을 기록하는 로그 테이블
create table entry_history (
  id uuid primary key default gen_random_uuid(),
  entry_id text not null,
  action text not null check (action in ('add', 'edit', 'delete')),
  country text not null,
  product_class text not null,
  snapshot jsonb not null,
  changed_by text not null,
  changed_at timestamptz not null default now()
);

alter table entry_history enable row level security;

create policy "public can read history"
  on entry_history for select
  using (true);

-- insert는 PIN 검증을 통과한 Edge Function만 가능 (정책 없음 = 기본 거부)

create index entry_history_entry_id_idx on entry_history (entry_id, changed_at desc);
