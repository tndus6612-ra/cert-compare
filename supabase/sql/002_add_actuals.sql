alter table team_notes
  add column actual_months numeric,
  add column actual_fee numeric;

alter table team_notes
  alter column note drop not null;

-- 테스트로 넣었던 메모 2건 정리 (실제 데이터 아님)
delete from team_notes;
