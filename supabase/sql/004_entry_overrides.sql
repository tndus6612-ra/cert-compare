-- 공개자료(cert_data.json, 정적 파일) 항목은 브라우저에서 직접 못 고치니,
-- "이 id는 이렇게 바뀌었다"는 덮어쓰기 값을 여기 저장해두고 화면에서 원본 위에 얹어서 보여준다.
create table entry_overrides (
  id text primary key,
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
  edited_by text not null,
  edited_at timestamptz not null default now()
);

alter table entry_overrides enable row level security;

create policy "public can read overrides"
  on entry_overrides for select
  using (true);

-- insert/update는 PIN 검증을 통과한 Edge Function(edit-entry)만 가능 (정책 없음 = 기본 거부)
