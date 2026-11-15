-- A campaign record's Procedures, read a page at a time on the server. A program holds hundreds of
-- procedures (WS-X90's 420), and the record once read every one of them and every revision as its
-- Procedures tab opened. Each row is a procedure with how many revisions it has, counted as the
-- reader may read them, so the register sorts by the count without reading the revisions.
create view public.procedure_rows with (security_invoker = true) as
select p.id, p.tenant_id, p.program_id, p.title, p.description, p.owner_party_id, p.revision,
  p.created_at, p.updated_at, p.created_by, p.updated_by,
  (select count(*) from public.procedure_revisions r
    where r.tenant_id = p.tenant_id and r.procedure_id = p.id)::integer as versions
from public.procedures p;

grant select on public.procedure_rows to authenticated;
revoke all on public.procedure_rows from public, anon;
comment on view public.procedure_rows is 'A campaign record''s Procedures, one row per procedure: its own columns and how many revisions it has (versions).';
