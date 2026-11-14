-- Run with psql -v ON_ERROR_STOP=1 after migrations. Every test row rolls back.
-- Reference frameworks: who reads and writes them, what a published revision refuses, what a
-- control link must say, and which revision the read views answer for. The catalog and the
-- frameworks here are fixtures of the test, so it needs no reference data and disturbs none.
begin;
create function pg_temp.expect_error(statement text, expected_state text) returns void language plpgsql as $$
begin
  begin
    execute statement;
  exception when others then
    if sqlstate = expected_state then return; end if;
    raise exception 'Expected SQLSTATE %, got %: %', expected_state, sqlstate, sqlerrm;
  end;
  raise exception 'Statement unexpectedly succeeded: %', statement;
end;
$$;
grant execute on function pg_temp.expect_error(text, text) to authenticated, anon;

-- ---------------------------------------------------------------------------------------------
-- Fixtures, written as the importer writes them: shared rows with no tenant.
-- Two editions of one catalog, each with AC-2(6) and SI-4; the first also has a withdrawn control.
-- ---------------------------------------------------------------------------------------------
insert into public.ref_sources(id, code, title, authority, source_uri, authoritative) values
  ('fa000000-0000-0000-0000-000000000001', 'test-framework-catalog', 'Test catalog', 'Test', 'https://example.test/catalog.json', false),
  ('fa000000-0000-0000-0000-000000000002', 'test-framework-transcription', 'Test transcription', 'Test', 'https://example.test/source.pdf', false);
insert into public.oscal_documents(id, source_id, model, title, code) values
  ('fa100000-0000-0000-0000-000000000001', 'fa000000-0000-0000-0000-000000000001', 'catalog', 'Test catalog', 'test-framework-catalog');
insert into public.oscal_document_revisions(id, document_id, source_uuid, document_version, oscal_version, title, last_modified, content_sha256, original_content) values
  ('fa200000-0000-0000-0000-000000000001', 'fa100000-0000-0000-0000-000000000001', 'fa210000-0000-0000-0000-000000000001', '1', '1.1.2', 'Test catalog', now(), repeat('1', 64), '{"catalog":{"uuid":"fa210000-0000-0000-0000-000000000001"}}'),
  ('fa200000-0000-0000-0000-000000000002', 'fa100000-0000-0000-0000-000000000001', 'fa210000-0000-0000-0000-000000000002', '2', '1.1.2', 'Test catalog', now(), repeat('2', 64), '{"catalog":{"uuid":"fa210000-0000-0000-0000-000000000002"}}');
insert into public.catalogs(id, source_id, code, title) values
  ('fa300000-0000-0000-0000-000000000001', 'fa000000-0000-0000-0000-000000000001', 'TEST-FRAMEWORK-CATALOG', 'Test catalog');
insert into public.catalog_revisions(id, catalog_id, document_revision_id, version, title) values
  ('fa400000-0000-0000-0000-000000000001', 'fa300000-0000-0000-0000-000000000001', 'fa200000-0000-0000-0000-000000000001', '1', 'Test catalog'),
  ('fa400000-0000-0000-0000-000000000002', 'fa300000-0000-0000-0000-000000000001', 'fa200000-0000-0000-0000-000000000002', '2', 'Test catalog');
insert into public.controls(id, catalog_revision_id, source_id, code, title, status, ordinal) values
  ('fa500000-0000-0000-0000-000000000001', 'fa400000-0000-0000-0000-000000000001', 'ac-2.6', 'AC-2(6)', 'Dynamic Privilege Management', 'active', 0),
  ('fa500000-0000-0000-0000-000000000002', 'fa400000-0000-0000-0000-000000000001', 'si-4', 'SI-4', 'System Monitoring', 'active', 1),
  ('fa500000-0000-0000-0000-000000000003', 'fa400000-0000-0000-0000-000000000001', 'ac-2.10', 'AC-2(10)', 'Shared and Group Account Credential Change', 'withdrawn', 2),
  ('fa500000-0000-0000-0000-000000000011', 'fa400000-0000-0000-0000-000000000002', 'ac-2.6', 'AC-2(6)', 'Dynamic Privilege Management', 'active', 0),
  ('fa500000-0000-0000-0000-000000000012', 'fa400000-0000-0000-0000-000000000002', 'si-4', 'SI-4', 'System Monitoring', 'active', 1);
update public.oscal_document_revisions set state = 'published', published_at = now() where id in ('fa200000-0000-0000-0000-000000000001', 'fa200000-0000-0000-0000-000000000002');
update public.catalog_revisions set state = 'published' where id = 'fa400000-0000-0000-0000-000000000001';

-- A vocabulary and the controls that support it, read against the first edition; a second
-- framework whose links name the first one's items, and a third that does too, as Appendices F and
-- G of NIST SP 800-160 Vol. 2 both name the cyber resiliency approaches.
insert into public.frameworks(id, source_id, code, title) values
  ('fb000000-0000-0000-0000-000000000001', 'fa000000-0000-0000-0000-000000000002', 'test-resiliency', 'Test resiliency'),
  ('fb000000-0000-0000-0000-000000000002', 'fa000000-0000-0000-0000-000000000002', 'test-attack', 'Test attack analysis'),
  ('fb000000-0000-0000-0000-000000000003', 'fa000000-0000-0000-0000-000000000002', 'test-attack-ics', 'Test attack analysis for control systems');
insert into public.framework_revisions(id, framework_id, version, title, format, content_sha256, input_sha256, catalog_revision_id, source_document) values
  ('fc000000-0000-0000-0000-000000000001', 'fb000000-0000-0000-0000-000000000001', 'Rev. 1', 'Test resiliency', 'reference-framework/1', repeat('a', 64), repeat('a', 64), 'fa400000-0000-0000-0000-000000000001', '{"title":"Test source"}'),
  ('fc000000-0000-0000-0000-000000000002', 'fb000000-0000-0000-0000-000000000002', 'Rev. 1', 'Test attack analysis', 'reference-framework/1', repeat('b', 64), repeat('b', 64), 'fa400000-0000-0000-0000-000000000001', '{"title":"Test source"}'),
  ('fc000000-0000-0000-0000-000000000005', 'fb000000-0000-0000-0000-000000000003', 'Rev. 1', 'Test attack analysis for control systems', 'reference-framework/1', repeat('5', 64), repeat('5', 64), 'fa400000-0000-0000-0000-000000000001', '{"title":"Test source"}');
-- A child may be written in the same statement as its parent, in either order.
insert into public.framework_items(id, framework_revision_id, parent_item_id, kind, code, title, ordinal, printed_in) values
  ('fd000000-0000-0000-0000-000000000002', 'fc000000-0000-0000-0000-000000000001', 'fd000000-0000-0000-0000-000000000001', 'approach', 'approach.dynamic-privileges', 'Dynamic Privileges', 1, 'Table 1'),
  ('fd000000-0000-0000-0000-000000000001', 'fc000000-0000-0000-0000-000000000001', null, 'technique', 'technique.privilege-restriction', 'Privilege Restriction', 1, 'Table 1'),
  ('fd000000-0000-0000-0000-000000000003', 'fc000000-0000-0000-0000-000000000001', null, 'objective', 'objective.constrain', 'Constrain', 1, 'Table 1'),
  ('fd000000-0000-0000-0000-000000000011', 'fc000000-0000-0000-0000-000000000002', null, 'attack-technique', 'T1595', 'Active Scanning', 1, 'Table 2'),
  -- A layer an approach can be used at, as Table D-5 names them: an item no table defines.
  ('fd000000-0000-0000-0000-000000000004', 'fc000000-0000-0000-0000-000000000001', null, 'architectural-layer', 'layer.operations', 'Operations', 1, 'Table D-5'),
  -- The third framework's technique and its tactic, whose code the second framework could print too.
  ('fd000000-0000-0000-0000-000000000051', 'fc000000-0000-0000-0000-000000000005', null, 'attack-technique', 'T0819', 'Exploit Public-Facing Application', 1, 'Table G-1'),
  ('fd000000-0000-0000-0000-000000000052', 'fc000000-0000-0000-0000-000000000005', null, 'tactic', 'tactic.initial-access', 'Initial Access', 1, 'Table G-1');
-- A discussion is a property beside the definition, as Tables 2 and 3 print one for an objective.
update public.framework_items set prose = 'Limit damage from adversity.',
  props = '{"discussion":"This objective specifically applies to critical or high-value assets."}'
  where id = 'fd000000-0000-0000-0000-000000000003';
insert into public.framework_item_links(id, framework_revision_id, source_item_id, target_item_id, relation, source_identifier, printed_in) values
  ('fe000000-0000-0000-0000-000000000001', 'fc000000-0000-0000-0000-000000000001', 'fd000000-0000-0000-0000-000000000001', 'fd000000-0000-0000-0000-000000000003', 'supports', 'T1:1', 'Table 1'),
  ('fe000000-0000-0000-0000-000000000011', 'fc000000-0000-0000-0000-000000000002', 'fd000000-0000-0000-0000-000000000011', 'fd000000-0000-0000-0000-000000000002', 'affected-by', 'T2:1', 'Table 2'),
  ('fe000000-0000-0000-0000-000000000002', 'fc000000-0000-0000-0000-000000000001', 'fd000000-0000-0000-0000-000000000002', 'fd000000-0000-0000-0000-000000000004', 'used-at', 'D-5:approach.dynamic-privileges:layer.operations', 'Table D-5'),
  ('fe000000-0000-0000-0000-000000000051', 'fc000000-0000-0000-0000-000000000005', 'fd000000-0000-0000-0000-000000000051', 'fd000000-0000-0000-0000-000000000052', 'tactic', 'G-1:T0819', 'Table G-1'),
  ('fe000000-0000-0000-0000-000000000052', 'fc000000-0000-0000-0000-000000000005', 'fd000000-0000-0000-0000-000000000051', 'fd000000-0000-0000-0000-000000000002', 'affected-by', 'G-1:T0819:M0926:1', 'Table G-1');
insert into public.framework_control_links(id, framework_revision_id, item_id, control_label, control_id, catalog_revision_id, resolution_status, relation, ordinal, props, source_identifier, printed_in) values
  ('ff000000-0000-0000-0000-000000000001', 'fc000000-0000-0000-0000-000000000001', 'fd000000-0000-0000-0000-000000000002', 'AC-2(6)', 'fa500000-0000-0000-0000-000000000001', 'fa400000-0000-0000-0000-000000000001', 'resolved', 'supports', 1, '{"technique":"technique.privilege-restriction"}', 'E-1:AC-2(6):1:1', 'Table E-1'),
  ('ff000000-0000-0000-0000-000000000011', 'fc000000-0000-0000-0000-000000000002', 'fd000000-0000-0000-0000-000000000011', 'SI-4', 'fa500000-0000-0000-0000-000000000002', 'fa400000-0000-0000-0000-000000000001', 'resolved', 'mitigates', null, '{"effects":["Detect"]}', 'F:T1595:1:SI-4', 'Table 2'),
  -- A control printed in bold keeps it, as Appendix G prints a control that diverges from ATT&CK for ICS's mapping.
  ('ff000000-0000-0000-0000-000000000051', 'fc000000-0000-0000-0000-000000000005', 'fd000000-0000-0000-0000-000000000051', 'SI-4', 'fa500000-0000-0000-0000-000000000002', 'fa400000-0000-0000-0000-000000000001', 'resolved', 'mitigates', 1, '{"tactic":"tactic.initial-access","mitigation":"M0926","effects":["Negate","Exert"],"bold":true}', 'G-1:T0819:M0926:1:SI-4', 'Table G-1');

-- ---------------------------------------------------------------------------------------------
-- What a control link must say.
-- ---------------------------------------------------------------------------------------------
-- A resolved link names its control as the catalog labels it.
select pg_temp.expect_error($$insert into public.framework_control_links(framework_revision_id, item_id, control_label, control_id, catalog_revision_id, resolution_status, relation, source_identifier, printed_in)
  values ('fc000000-0000-0000-0000-000000000001', 'fd000000-0000-0000-0000-000000000002', 'SI-4', 'fa500000-0000-0000-0000-000000000001', 'fa400000-0000-0000-0000-000000000001', 'resolved', 'supports', 'wrong-label', 'Table E-1')$$, '23514');
-- It resolves against the catalog revision its framework revision names, not another edition.
select pg_temp.expect_error($$insert into public.framework_control_links(framework_revision_id, item_id, control_label, control_id, catalog_revision_id, resolution_status, relation, source_identifier, printed_in)
  values ('fc000000-0000-0000-0000-000000000001', 'fd000000-0000-0000-0000-000000000002', 'AC-2(6)', 'fa500000-0000-0000-0000-000000000011', 'fa400000-0000-0000-0000-000000000002', 'resolved', 'supports', 'other-edition', 'Table E-1')$$, '23514');
-- The control belongs to the catalog revision the link names.
select pg_temp.expect_error($$insert into public.framework_control_links(framework_revision_id, item_id, control_label, control_id, catalog_revision_id, resolution_status, relation, source_identifier, printed_in)
  values ('fc000000-0000-0000-0000-000000000001', 'fd000000-0000-0000-0000-000000000002', 'AC-2(6)', 'fa500000-0000-0000-0000-000000000011', 'fa400000-0000-0000-0000-000000000001', 'resolved', 'supports', 'mixed-edition', 'Table E-1')$$, '23503');
-- Resolved means a control is named; a label is a control label; an identifier is used once.
select pg_temp.expect_error($$insert into public.framework_control_links(framework_revision_id, item_id, control_label, resolution_status, relation, source_identifier, printed_in)
  values ('fc000000-0000-0000-0000-000000000001', 'fd000000-0000-0000-0000-000000000002', 'AC-2(6)', 'resolved', 'supports', 'no-control', 'Table E-1')$$, '23514');
select pg_temp.expect_error($$insert into public.framework_control_links(framework_revision_id, item_id, control_label, resolution_status, relation, source_identifier, printed_in)
  values ('fc000000-0000-0000-0000-000000000001', 'fd000000-0000-0000-0000-000000000002', 'ac-2.6', 'unresolved', 'supports', 'not-a-label', 'Table E-1')$$, '23514');
select pg_temp.expect_error($$insert into public.framework_control_links(framework_revision_id, item_id, control_label, resolution_status, relation, source_identifier, printed_in)
  values ('fc000000-0000-0000-0000-000000000001', 'fd000000-0000-0000-0000-000000000002', 'AC-99', 'unresolved', 'supports', 'E-1:AC-2(6):1:1', 'Table E-1')$$, '23505');
-- A label that names no control can be recorded as unresolved in a draft; the importer never does.
insert into public.framework_control_links(id, framework_revision_id, item_id, control_label, resolution_status, relation, source_identifier, printed_in)
  values ('ff000000-0000-0000-0000-000000000002', 'fc000000-0000-0000-0000-000000000001', 'fd000000-0000-0000-0000-000000000002', 'AC-99', 'unresolved', 'supports', 'E-1:AC-99:1:1', 'Table E-1');
delete from public.framework_control_links where id = 'ff000000-0000-0000-0000-000000000002';
-- A revision with resolved links keeps its catalog revision.
select pg_temp.expect_error($$update public.framework_revisions set catalog_revision_id = null where id = 'fc000000-0000-0000-0000-000000000001'$$, '23514');
-- An item cannot hold itself, directly or through its children, or a parent of another revision.
select pg_temp.expect_error($$update public.framework_items set parent_item_id = 'fd000000-0000-0000-0000-000000000002' where id = 'fd000000-0000-0000-0000-000000000001'$$, '23514');
select pg_temp.expect_error($$update public.framework_items set parent_item_id = 'fd000000-0000-0000-0000-000000000001' where id = 'fd000000-0000-0000-0000-000000000011'$$, '23503');
select pg_temp.expect_error($$insert into public.framework_items(framework_revision_id, kind, code, title, ordinal, printed_in)
  values ('fc000000-0000-0000-0000-000000000001', 'technique', 'technique.privilege-restriction', 'Again', 2, 'Table 1')$$, '23505');

-- ---------------------------------------------------------------------------------------------
-- Publication. A revision is published after what its links name.
-- ---------------------------------------------------------------------------------------------
-- A framework's current revision is one of its own published revisions.
select pg_temp.expect_error($$update public.frameworks set current_revision_id = 'fc000000-0000-0000-0000-000000000001' where id = 'fb000000-0000-0000-0000-000000000001'$$, '23514');
-- The attack analyses name an approach of the resiliency revision, which is still a draft.
select pg_temp.expect_error($$update public.framework_revisions set state = 'published' where id = 'fc000000-0000-0000-0000-000000000002'$$, '23514');
select pg_temp.expect_error($$update public.framework_revisions set state = 'published' where id = 'fc000000-0000-0000-0000-000000000005'$$, '23514');
update public.framework_revisions set state = 'published' where id = 'fc000000-0000-0000-0000-000000000001';
update public.framework_revisions set state = 'published' where id = 'fc000000-0000-0000-0000-000000000002';
update public.framework_revisions set state = 'published' where id = 'fc000000-0000-0000-0000-000000000005';
select pg_temp.expect_error($$update public.frameworks set current_revision_id = 'fc000000-0000-0000-0000-000000000002' where id = 'fb000000-0000-0000-0000-000000000001'$$, '23514');
update public.frameworks set current_revision_id = 'fc000000-0000-0000-0000-000000000001' where id = 'fb000000-0000-0000-0000-000000000001';
update public.frameworks set current_revision_id = 'fc000000-0000-0000-0000-000000000002' where id = 'fb000000-0000-0000-0000-000000000002';
update public.frameworks set current_revision_id = 'fc000000-0000-0000-0000-000000000005' where id = 'fb000000-0000-0000-0000-000000000003';

-- A published revision, its items and its links reject change, as the importer's own role too.
select pg_temp.expect_error($$update public.framework_revisions set corrections = '[{"printed":"x"}]' where id = 'fc000000-0000-0000-0000-000000000001'$$, '23514');
select pg_temp.expect_error($$update public.framework_revisions set state = 'draft' where id = 'fc000000-0000-0000-0000-000000000001'$$, '23514');
select pg_temp.expect_error($$delete from public.framework_revisions where id = 'fc000000-0000-0000-0000-000000000001'$$, '23514');
select pg_temp.expect_error($$insert into public.framework_items(framework_revision_id, kind, code, title, ordinal, printed_in)
  values ('fc000000-0000-0000-0000-000000000001', 'technique', 'technique.added-later', 'Added later', 9, 'Table 1')$$, '23514');
select pg_temp.expect_error($$update public.framework_items set title = 'Changed' where id = 'fd000000-0000-0000-0000-000000000001'$$, '23514');
select pg_temp.expect_error($$delete from public.framework_items where id = 'fd000000-0000-0000-0000-000000000002'$$, '23514');
select pg_temp.expect_error($$insert into public.framework_item_links(framework_revision_id, source_item_id, target_item_id, relation, source_identifier, printed_in)
  values ('fc000000-0000-0000-0000-000000000001', 'fd000000-0000-0000-0000-000000000002', 'fd000000-0000-0000-0000-000000000003', 'supports', 'T1:2', 'Table 1')$$, '23514');
select pg_temp.expect_error($$update public.framework_item_links set relation = 'changed' where id = 'fe000000-0000-0000-0000-000000000001'$$, '23514');
select pg_temp.expect_error($$delete from public.framework_item_links where id = 'fe000000-0000-0000-0000-000000000011'$$, '23514');
select pg_temp.expect_error($$insert into public.framework_control_links(framework_revision_id, item_id, control_label, control_id, catalog_revision_id, resolution_status, relation, source_identifier, printed_in)
  values ('fc000000-0000-0000-0000-000000000001', 'fd000000-0000-0000-0000-000000000002', 'SI-4', 'fa500000-0000-0000-0000-000000000002', 'fa400000-0000-0000-0000-000000000001', 'resolved', 'supports', 'E-1:SI-4:1:1', 'Table E-1')$$, '23514');
select pg_temp.expect_error($$update public.framework_control_links set ordinal = 2 where id = 'ff000000-0000-0000-0000-000000000001'$$, '23514');
select pg_temp.expect_error($$delete from public.framework_control_links where id = 'ff000000-0000-0000-0000-000000000011'$$, '23514');
-- A draft cannot be published against a catalog revision that is still a draft.
insert into public.framework_revisions(id, framework_id, version, title, format, content_sha256, input_sha256, catalog_revision_id, source_document) values
  ('fc000000-0000-0000-0000-000000000003', 'fb000000-0000-0000-0000-000000000001', 'Rev. 1', 'Test resiliency', 'reference-framework/1', repeat('a', 64), repeat('c', 64), 'fa400000-0000-0000-0000-000000000002', '{"title":"Test source"}');
select pg_temp.expect_error($$update public.framework_revisions set state = 'published' where id = 'fc000000-0000-0000-0000-000000000003'$$, '23514');
-- The same inputs are one revision.
select pg_temp.expect_error($$insert into public.framework_revisions(framework_id, version, title, format, content_sha256, input_sha256, source_document)
  values ('fb000000-0000-0000-0000-000000000001', 'Rev. 1', 'Test resiliency', 'reference-framework/1', repeat('a', 64), repeat('a', 64), '{"title":"Test source"}')$$, '23505');

-- ---------------------------------------------------------------------------------------------
-- The views answer for the revision the product reads.
-- ---------------------------------------------------------------------------------------------
do $$
declare found record;
begin
  select * into found from public.framework_rows where code = 'test-resiliency';
  if found.framework_revision_id <> 'fc000000-0000-0000-0000-000000000001' or found.version <> 'Rev. 1'
    or found.catalog_revision_id <> 'fa400000-0000-0000-0000-000000000001' or found.content_sha256 <> repeat('a', 64)
    or found.source_document->>'title' <> 'Test source' or found.corrections <> '[]'::jsonb
    or found.authority <> 'Test' or found.authoritative then
    raise exception 'framework_rows does not name the framework''s current revision and its source';
  end if;
  if (select count(*) from public.framework_item_rows where framework_code = 'test-resiliency') <> 4 then
    raise exception 'framework_item_rows does not list the current revision''s items';
  end if;
  -- A discussion stands in the item's properties beside its definition, through the view.
  select * into found from public.framework_item_rows where framework_code = 'test-resiliency' and code = 'objective.constrain';
  if found.prose <> 'Limit damage from adversity.'
    or found.props->>'discussion' <> 'This objective specifically applies to critical or high-value assets.' then
    raise exception 'framework_item_rows does not keep an item''s discussion beside its definition';
  end if;
  -- An approach is linked to the layers it can be used at, a relation of its own beside supports.
  select * into found from public.framework_item_link_rows where framework_code = 'test-resiliency' and relation = 'used-at';
  if found.source_code <> 'approach.dynamic-privileges' or found.source_kind <> 'approach'
    or found.target_code <> 'layer.operations' or found.target_kind <> 'architectural-layer'
    or found.target_framework_code <> 'test-resiliency' or found.printed_in <> 'Table D-5' then
    raise exception 'framework_item_link_rows does not name an approach''s layer';
  end if;
  if (select count(*) from public.framework_item_link_rows where framework_code = 'test-resiliency') <> 2
    or (select count(*) from public.framework_item_link_rows where framework_code = 'test-resiliency' and relation = 'supports') <> 1 then
    raise exception 'framework_item_link_rows does not tell a layer link from a link of what supports what';
  end if;
  -- A second analysis names the same approaches: each framework's links are its own, and its
  -- tactic is told from another framework's by the framework it belongs to.
  select * into found from public.framework_item_link_rows where framework_code = 'test-attack-ics' and relation = 'affected-by';
  if found.source_code <> 'T0819' or found.source_framework_code <> 'test-attack-ics'
    or found.target_code <> 'approach.dynamic-privileges' or found.target_framework_code <> 'test-resiliency' then
    raise exception 'framework_item_link_rows does not name a second analysis''s link to the approaches';
  end if;
  if (select target_framework_code from public.framework_item_link_rows where framework_code = 'test-attack-ics' and relation = 'tactic')
      <> 'test-attack-ics'
    or (select count(*) from public.framework_item_link_rows where framework_code in ('test-attack', 'test-attack-ics')) <> 3
    or (select count(*) from public.framework_item_rows where framework_code in ('test-attack', 'test-attack-ics')) <> 3 then
    raise exception 'The views do not read two analyses side by side';
  end if;
  select * into found from public.framework_control_link_rows where framework_code = 'test-attack-ics';
  if found.control_code <> 'SI-4' or found.item_code <> 'T0819' or found.props->'bold' <> 'true'::jsonb
    or found.props->'effects' <> '["Negate", "Exert"]'::jsonb or found.technique_code is not null then
    raise exception 'framework_control_link_rows does not keep a control printed in bold';
  end if;
  select * into found from public.framework_item_rows where framework_code = 'test-resiliency' and code = 'approach.dynamic-privileges';
  if found.kind <> 'approach' or found.parent_code <> 'technique.privilege-restriction' or found.parent_kind <> 'technique'
    or found.parent_title <> 'Privilege Restriction' or found.revision_version <> 'Rev. 1'
    or found.framework_revision_id <> 'fc000000-0000-0000-0000-000000000001' then
    raise exception 'framework_item_rows does not name an item''s framework, revision and parent';
  end if;
  select * into found from public.framework_item_link_rows where framework_code = 'test-attack';
  if found.relation <> 'affected-by' or found.source_code <> 'T1595' or found.source_framework_code <> 'test-attack'
    or found.target_code <> 'approach.dynamic-privileges' or found.target_kind <> 'approach'
    or found.target_framework_code <> 'test-resiliency' then
    raise exception 'framework_item_link_rows does not name both items and their frameworks';
  end if;
  select * into found from public.framework_control_link_rows where framework_code = 'test-resiliency';
  if found.control_label <> 'AC-2(6)' or found.control_code <> 'AC-2(6)' or found.control_title <> 'Dynamic Privilege Management'
    or found.control_id <> 'fa500000-0000-0000-0000-000000000001' or found.catalog_revision_id <> 'fa400000-0000-0000-0000-000000000001'
    or found.item_code <> 'approach.dynamic-privileges' or found.item_kind <> 'approach'
    or found.parent_item_code <> 'technique.privilege-restriction' or found.parent_item_title <> 'Privilege Restriction'
    or found.relation <> 'supports' or found.ordinal <> 1 or found.props->>'technique' <> 'technique.privilege-restriction'
    or found.source_identifier <> 'E-1:AC-2(6):1:1' or found.resolution_status <> 'resolved' then
    raise exception 'framework_control_link_rows does not name the link''s item, parent and control';
  end if;
  -- The technique a link is printed under is the one its row names, in the link's own revision.
  if found.technique_item_id <> 'fd000000-0000-0000-0000-000000000001' or found.technique_code <> 'technique.privilege-restriction'
    or found.technique_title <> 'Privilege Restriction' then
    raise exception 'framework_control_link_rows does not name the technique a link is printed under';
  end if;
  -- A link that names none has none, whatever its item's parent is.
  select * into found from public.framework_control_link_rows where framework_code = 'test-attack';
  if found.technique_item_id is not null or found.technique_code is not null or found.technique_title is not null then
    raise exception 'framework_control_link_rows names a technique for a link that prints none';
  end if;
end $$;

-- A second reading of the same framework against the second edition: a new revision, published
-- beside the first. The framework names which one the product reads.
update public.catalog_revisions set state = 'published' where id = 'fa400000-0000-0000-0000-000000000002';
insert into public.framework_items(id, framework_revision_id, parent_item_id, kind, code, title, ordinal, printed_in) values
  ('fd000000-0000-0000-0000-000000000021', 'fc000000-0000-0000-0000-000000000003', null, 'technique', 'technique.privilege-restriction', 'Privilege Restriction', 1, 'Table 1'),
  ('fd000000-0000-0000-0000-000000000022', 'fc000000-0000-0000-0000-000000000003', 'fd000000-0000-0000-0000-000000000021', 'approach', 'approach.dynamic-privileges', 'Dynamic Privileges', 1, 'Table 1');
insert into public.framework_items(id, framework_revision_id, parent_item_id, kind, code, title, ordinal, printed_in) values
  ('fd000000-0000-0000-0000-000000000023', 'fc000000-0000-0000-0000-000000000003', null, 'technique', 'technique.deception', 'Deception', 2, 'Table 1');
-- The second reading prints the approach in a group that is not its own technique, as Table E-1
-- prints Self-Challenge under Deception.
insert into public.framework_control_links(id, framework_revision_id, item_id, control_label, control_id, catalog_revision_id, resolution_status, relation, ordinal, props, source_identifier, printed_in) values
  ('ff000000-0000-0000-0000-000000000021', 'fc000000-0000-0000-0000-000000000003', 'fd000000-0000-0000-0000-000000000022', 'AC-2(6)', 'fa500000-0000-0000-0000-000000000011', 'fa400000-0000-0000-0000-000000000002', 'resolved', 'supports', 1, '{"technique":"technique.deception"}', 'E-1:AC-2(6):1:1', 'Table E-1');
update public.framework_revisions set state = 'published' where id = 'fc000000-0000-0000-0000-000000000003';
do $$ begin
  if (select technique_code || ' / ' || parent_item_code from public.framework_control_link_rows where id = 'ff000000-0000-0000-0000-000000000021')
    <> 'technique.deception / technique.privilege-restriction'
    or (select technique_item_id from public.framework_control_link_rows where id = 'ff000000-0000-0000-0000-000000000021') <> 'fd000000-0000-0000-0000-000000000023' then
    raise exception 'framework_control_link_rows reads a link''s technique from its item''s parent, not from the group it is printed in';
  end if;
  -- The framework still names the first revision, so its items are the ones listed.
  if (select count(*) from public.framework_item_rows where framework_code = 'test-resiliency') <> 4
    or exists (select 1 from public.framework_item_rows where framework_code = 'test-resiliency' and framework_revision_id <> 'fc000000-0000-0000-0000-000000000001') then
    raise exception 'framework_item_rows left the revision its framework names as current';
  end if;
  -- Each edition's controls keep the links of the revision read against that edition.
  if (select count(*) from public.framework_control_link_rows where framework_code = 'test-resiliency') <> 2
    or (select framework_revision_id from public.framework_control_link_rows where control_id = 'fa500000-0000-0000-0000-000000000001') <> 'fc000000-0000-0000-0000-000000000001'
    or (select framework_revision_id from public.framework_control_link_rows where control_id = 'fa500000-0000-0000-0000-000000000011') <> 'fc000000-0000-0000-0000-000000000003' then
    raise exception 'framework_control_link_rows does not keep each catalog revision''s links';
  end if;
end $$;
update public.frameworks set current_revision_id = 'fc000000-0000-0000-0000-000000000003' where id = 'fb000000-0000-0000-0000-000000000001';
do $$ begin
  if (select count(*) from public.framework_item_rows where framework_code = 'test-resiliency') <> 3
    or (select count(*) from public.framework_item_rows where framework_code = 'test-resiliency' and code = 'technique.deception') <> 1
    or exists (select 1 from public.framework_item_rows where framework_code = 'test-resiliency' and framework_revision_id <> 'fc000000-0000-0000-0000-000000000003')
    or (select framework_revision_id from public.framework_rows where code = 'test-resiliency') <> 'fc000000-0000-0000-0000-000000000003' then
    raise exception 'framework_rows and framework_item_rows did not follow the framework to the revision it now names';
  end if;
  if (select count(*) from public.framework_control_link_rows where framework_code = 'test-resiliency') <> 2 then
    raise exception 'framework_control_link_rows lost an edition''s links when the current revision moved';
  end if;
end $$;
-- With no revision named, the views read one published revision, never two at once.
update public.frameworks set current_revision_id = null where id = 'fb000000-0000-0000-0000-000000000001';
do $$ begin
  if (select count(distinct framework_revision_id) from public.framework_item_rows where framework_code = 'test-resiliency') <> 1
    or (select count(*) from public.framework_rows where code = 'test-resiliency') <> 1
    or (select framework_revision_id from public.framework_rows where code = 'test-resiliency')
      <> (select distinct framework_revision_id from public.framework_item_rows where framework_code = 'test-resiliency') then
    raise exception 'The views read more than one revision when the framework names none';
  end if;
end $$;
update public.frameworks set current_revision_id = 'fc000000-0000-0000-0000-000000000001' where id = 'fb000000-0000-0000-0000-000000000001';

-- ---------------------------------------------------------------------------------------------
-- Who reads and who writes.
-- ---------------------------------------------------------------------------------------------
insert into auth.users(id, email, raw_user_meta_data) values
  ('f9000000-0000-0000-0000-000000000001', 'framework-member@example.test', '{"name":"Framework test member"}'),
  ('f9000000-0000-0000-0000-000000000002', 'framework-outsider@example.test', '{"name":"Framework test outsider"}');
-- A shared draft, so that what refuses a member below is the row policy and not the publication.
insert into public.framework_revisions(id, framework_id, version, title, format, content_sha256, input_sha256, source_document) values
  ('fc000000-0000-0000-0000-000000000004', 'fb000000-0000-0000-0000-000000000001', 'Draft', 'Test resiliency', 'reference-framework/1', repeat('a', 64), repeat('9', 64), '{"title":"Test source"}');
insert into public.framework_items(id, framework_revision_id, kind, code, title, ordinal, printed_in) values
  ('fd000000-0000-0000-0000-000000000041', 'fc000000-0000-0000-0000-000000000004', 'technique', 'technique.draft', 'Draft technique', 1, 'Table 1'),
  ('fd000000-0000-0000-0000-000000000042', 'fc000000-0000-0000-0000-000000000004', 'objective', 'objective.draft', 'Draft objective', 1, 'Table 1');
insert into public.framework_item_links(id, framework_revision_id, source_item_id, target_item_id, relation, source_identifier, printed_in) values
  ('fe000000-0000-0000-0000-000000000041', 'fc000000-0000-0000-0000-000000000004', 'fd000000-0000-0000-0000-000000000041', 'fd000000-0000-0000-0000-000000000042', 'supports', 'T1:1', 'Table 1');
insert into public.framework_control_links(id, framework_revision_id, item_id, control_label, resolution_status, relation, source_identifier, printed_in) values
  ('ff000000-0000-0000-0000-000000000041', 'fc000000-0000-0000-0000-000000000004', 'fd000000-0000-0000-0000-000000000041', 'AC-99', 'unresolved', 'supports', 'E-1:AC-99:1:1', 'Table E-1');

-- An anonymous session reads none of it.
set local role anon;
select pg_temp.expect_error('select count(*) from public.frameworks', '42501');
select pg_temp.expect_error('select count(*) from public.framework_revisions', '42501');
select pg_temp.expect_error('select count(*) from public.framework_items', '42501');
select pg_temp.expect_error('select count(*) from public.framework_item_links', '42501');
select pg_temp.expect_error('select count(*) from public.framework_control_links', '42501');
select pg_temp.expect_error('select count(*) from public.framework_rows', '42501');
select pg_temp.expect_error('select count(*) from public.framework_item_rows', '42501');
select pg_temp.expect_error('select count(*) from public.framework_item_link_rows', '42501');
select pg_temp.expect_error('select count(*) from public.framework_control_link_rows', '42501');
reset role;

-- A signed-in member reads the shared rows, through the tables and the views.
select set_config('request.jwt.claim.sub', 'f9000000-0000-0000-0000-000000000001', true);
set local role authenticated;
select set_config('test.tenant', public.ensure_personal_tenant()::text, true);
do $$ begin
  if (select count(*) from public.frameworks where code in ('test-resiliency', 'test-attack')) <> 2
    or (select count(*) from public.framework_revisions where framework_id = 'fb000000-0000-0000-0000-000000000001') <> 3
    or (select count(*) from public.framework_items where framework_revision_id = 'fc000000-0000-0000-0000-000000000001') <> 4
    or (select count(*) from public.framework_item_links where framework_revision_id = 'fc000000-0000-0000-0000-000000000002') <> 1
    or (select count(*) from public.framework_control_links where framework_revision_id = 'fc000000-0000-0000-0000-000000000001') <> 1 then
    raise exception 'A member cannot read the shared framework tables';
  end if;
  if (select count(*) from public.framework_rows where code in ('test-resiliency', 'test-attack')) <> 2
    or (select count(*) from public.framework_item_rows where framework_code = 'test-resiliency') <> 4
    or (select count(*) from public.framework_item_link_rows where framework_code = 'test-attack') <> 1
    or (select count(*) from public.framework_control_link_rows where framework_code = 'test-attack' and control_code = 'SI-4') <> 1 then
    raise exception 'A member cannot read the shared frameworks through the views';
  end if;
end $$;

-- A member writes no shared row, a draft's included: an insert is refused, and an update or a
-- delete finds nothing to change.
select pg_temp.expect_error($$insert into public.frameworks(source_id, code, title) values ('fa000000-0000-0000-0000-000000000002', 'test-member-shared', 'Must reject')$$, '42501');
select pg_temp.expect_error($$insert into public.framework_revisions(framework_id, version, title, format, content_sha256, input_sha256, source_document)
  values ('fb000000-0000-0000-0000-000000000001', 'Rev. 9', 'Must reject', 'reference-framework/1', repeat('d', 64), repeat('d', 64), '{}')$$, '42501');
select pg_temp.expect_error($$insert into public.framework_items(framework_revision_id, kind, code, title, ordinal, printed_in)
  values ('fc000000-0000-0000-0000-000000000004', 'technique', 'technique.member', 'Must reject', 9, 'Table 1')$$, '42501');
select pg_temp.expect_error($$insert into public.framework_item_links(framework_revision_id, source_item_id, target_item_id, relation, source_identifier, printed_in)
  values ('fc000000-0000-0000-0000-000000000004', 'fd000000-0000-0000-0000-000000000042', 'fd000000-0000-0000-0000-000000000041', 'supports', 'member', 'Table 1')$$, '42501');
select pg_temp.expect_error($$insert into public.framework_control_links(framework_revision_id, item_id, control_label, resolution_status, relation, source_identifier, printed_in)
  values ('fc000000-0000-0000-0000-000000000004', 'fd000000-0000-0000-0000-000000000041', 'AC-98', 'unresolved', 'supports', 'member', 'Table E-1')$$, '42501');
do $$
declare v text;
begin
  foreach v in array array['framework_rows', 'framework_item_rows', 'framework_item_link_rows', 'framework_control_link_rows'] loop
    if not has_table_privilege(format('public.%I', v), 'select')
      or has_table_privilege(format('public.%I', v), 'insert, update, delete, truncate') then
      raise exception 'A member holds more than select on %', v;
    end if;
  end loop;
end $$;
update public.frameworks set title = 'Changed by a member', revision = revision + 1 where code = 'test-resiliency';
update public.framework_revisions set title = 'Changed by a member', revision = revision + 1 where framework_id = 'fb000000-0000-0000-0000-000000000001';
update public.framework_items set title = 'Changed by a member', revision = revision + 1 where framework_revision_id = 'fc000000-0000-0000-0000-000000000004';
update public.framework_item_links set relation = 'changed', revision = revision + 1 where framework_revision_id = 'fc000000-0000-0000-0000-000000000004';
update public.framework_control_links set relation = 'changed', revision = revision + 1 where framework_revision_id = 'fc000000-0000-0000-0000-000000000004';
delete from public.framework_control_links where framework_revision_id = 'fc000000-0000-0000-0000-000000000004';
delete from public.framework_item_links where framework_revision_id = 'fc000000-0000-0000-0000-000000000004';
delete from public.framework_items where framework_revision_id = 'fc000000-0000-0000-0000-000000000004';
delete from public.framework_revisions where id = 'fc000000-0000-0000-0000-000000000004';
delete from public.frameworks where code = 'test-resiliency';
do $$ begin
  if (select title from public.frameworks where code = 'test-resiliency') <> 'Test resiliency'
    or exists (select 1 from public.framework_revisions where title = 'Changed by a member')
    or exists (select 1 from public.framework_items where title = 'Changed by a member')
    or exists (select 1 from public.framework_item_links where relation = 'changed')
    or exists (select 1 from public.framework_control_links where relation = 'changed')
    or (select count(*) from public.framework_revisions where framework_id = 'fb000000-0000-0000-0000-000000000001') <> 3
    or (select count(*) from public.framework_items where framework_revision_id = 'fc000000-0000-0000-0000-000000000004') <> 2
    or (select count(*) from public.framework_item_links where framework_revision_id = 'fc000000-0000-0000-0000-000000000004') <> 1
    or (select count(*) from public.framework_control_links where framework_revision_id = 'fc000000-0000-0000-0000-000000000004') <> 1 then
    raise exception 'A member changed or removed a shared framework row';
  end if;
end $$;

-- A tenant writer may author its own framework, as it may any reference document; a member of
-- another workspace does not see it, and it cannot take a shared revision's items as its own.
insert into public.ref_sources(id, tenant_id, code, title, authority, source_uri, authoritative) values
  ('fa000000-0000-0000-0000-000000000009', current_setting('test.tenant')::uuid, 'test-tenant-source', 'Workspace source', 'Workspace', 'https://example.test/own.pdf', false);
insert into public.frameworks(id, tenant_id, source_id, code, title) values
  ('fb000000-0000-0000-0000-000000000009', current_setting('test.tenant')::uuid, 'fa000000-0000-0000-0000-000000000009', 'test-workspace-framework', 'Workspace framework');
insert into public.framework_revisions(id, tenant_id, framework_id, version, title, format, content_sha256, input_sha256, source_document) values
  ('fc000000-0000-0000-0000-000000000009', current_setting('test.tenant')::uuid, 'fb000000-0000-0000-0000-000000000009', '1', 'Workspace framework', 'reference-framework/1', repeat('e', 64), repeat('e', 64), '{}');
insert into public.framework_items(id, tenant_id, framework_revision_id, kind, code, title, ordinal, printed_in) values
  ('fd000000-0000-0000-0000-000000000091', current_setting('test.tenant')::uuid, 'fc000000-0000-0000-0000-000000000009', 'practice', 'practice.one', 'A workspace practice', 1, 'Internal standard');
-- A workspace row cannot hang under a shared revision.
select pg_temp.expect_error(format($$insert into public.framework_items(tenant_id, framework_revision_id, kind, code, title, ordinal, printed_in)
  values (%L, 'fc000000-0000-0000-0000-000000000003', 'practice', 'practice.two', 'Must reject', 2, 'Internal standard')$$, current_setting('test.tenant')), '23514');
select set_config('request.jwt.claim.sub', 'f9000000-0000-0000-0000-000000000002', true);
select set_config('test.other_tenant', public.ensure_personal_tenant()::text, true);
do $$ begin
  if exists (select 1 from public.frameworks where code = 'test-workspace-framework')
    or exists (select 1 from public.framework_items where code = 'practice.one')
    or exists (select 1 from public.framework_rows where code = 'test-workspace-framework')
    or exists (select 1 from public.framework_item_rows where framework_code = 'test-workspace-framework') then
    raise exception 'A member of another workspace read a workspace''s framework';
  end if;
  if (select count(*) from public.framework_item_rows where framework_code = 'test-resiliency') <> 4 then
    raise exception 'A member of another workspace cannot read the shared frameworks';
  end if;
end $$;
-- Nor can it link its own row to another workspace's item.
insert into public.ref_sources(id, tenant_id, code, title, authority, source_uri, authoritative) values
  ('fa000000-0000-0000-0000-000000000008', current_setting('test.other_tenant')::uuid, 'test-other-source', 'Other source', 'Workspace', 'https://example.test/other.pdf', false);
insert into public.frameworks(id, tenant_id, source_id, code, title) values
  ('fb000000-0000-0000-0000-000000000008', current_setting('test.other_tenant')::uuid, 'fa000000-0000-0000-0000-000000000008', 'test-other-framework', 'Other framework');
insert into public.framework_revisions(id, tenant_id, framework_id, version, title, format, content_sha256, input_sha256, source_document) values
  ('fc000000-0000-0000-0000-000000000008', current_setting('test.other_tenant')::uuid, 'fb000000-0000-0000-0000-000000000008', '1', 'Other framework', 'reference-framework/1', repeat('f', 64), repeat('f', 64), '{}');
insert into public.framework_items(id, tenant_id, framework_revision_id, kind, code, title, ordinal, printed_in) values
  ('fd000000-0000-0000-0000-000000000081', current_setting('test.other_tenant')::uuid, 'fc000000-0000-0000-0000-000000000008', 'practice', 'practice.other', 'Another practice', 1, 'Internal standard');
select pg_temp.expect_error(format($$insert into public.framework_item_links(tenant_id, framework_revision_id, source_item_id, target_item_id, relation, source_identifier, printed_in)
  values (%L, 'fc000000-0000-0000-0000-000000000008', 'fd000000-0000-0000-0000-000000000081', 'fd000000-0000-0000-0000-000000000091', 'relates', 'cross', 'Internal standard')$$, current_setting('test.other_tenant')), '23514');
reset role;
rollback;
select 'Reference framework access, publication immutability, control link rules and read views passed.' as result;
