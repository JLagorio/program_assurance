-- Run with psql -v ON_ERROR_STOP=1 after migrations. Every test row rolls back.
-- Gate criteria drawn from the security outcomes of the system life cycle processes: what the
-- command adds and skips (an outcome is the same one in every revision, by its code), what a
-- request sent again answers, what it refuses and from whom, who may say which outcome a criterion
-- was drawn from, and what the register's view derives.
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
-- The life cycle framework. Where the pinned reference data is loaded, the test reads it and
-- changes none of it; where it is not, a fixture stands in, written as the importer writes it.
-- ---------------------------------------------------------------------------------------------
do $$
declare v_framework uuid;
begin
  select f.id into v_framework from public.frameworks f
    where f.tenant_id is null and f.code = 'nist-sp800-160v1r1-processes';
  if v_framework is not null and exists (
    select 1 from public.framework_revisions r where r.framework_id = v_framework and r.state = 'published'
  ) then return; end if;
  if v_framework is null then
    insert into public.ref_sources(id, code, title, authority, source_uri, authoritative) values
      ('9c900000-0000-0000-0000-000000000001', 'test-life-cycle-transcription', 'Test life cycle transcription', 'Test', 'https://example.test/life-cycle.pdf', false);
    insert into public.frameworks(id, source_id, code, title) values
      ('9c910000-0000-0000-0000-000000000001', '9c900000-0000-0000-0000-000000000001', 'nist-sp800-160v1r1-processes', 'Test life cycle processes')
      returning id into v_framework;
  end if;
  insert into public.framework_revisions(id, framework_id, version, title, format, content_sha256, input_sha256, source_document) values
    ('9c920000-0000-0000-0000-000000000001', v_framework, 'Test', 'Test life cycle processes', 'reference-framework/1', repeat('9', 64), repeat('9', 64), '{"title":"Test source"}');
  insert into public.framework_items(id, framework_revision_id, parent_item_id, kind, code, title, ordinal, printed_in) values
    ('9c930000-0000-0000-0000-000000000001', '9c920000-0000-0000-0000-000000000001', null, 'process-group', 'group.technical-processes', 'Technical Processes', 1, 'Appendix H'),
    ('9c930000-0000-0000-0000-000000000011', '9c920000-0000-0000-0000-000000000001', '9c930000-0000-0000-0000-000000000001', 'process', 'process.BA', 'Business or Mission Analysis', 1, 'Section H.1'),
    ('9c930000-0000-0000-0000-000000000012', '9c920000-0000-0000-0000-000000000001', '9c930000-0000-0000-0000-000000000001', 'process', 'process.SN', 'Stakeholder Needs and Requirements Definition', 2, 'Section H.2'),
    ('9c930000-0000-0000-0000-000000000021', '9c920000-0000-0000-0000-000000000001', '9c930000-0000-0000-0000-000000000011', 'outcome', 'outcome.BA.1', 'The first outcome is defined.', 1, 'Section H.1.2'),
    ('9c930000-0000-0000-0000-000000000022', '9c920000-0000-0000-0000-000000000001', '9c930000-0000-0000-0000-000000000011', 'outcome', 'outcome.BA.2', 'The second outcome is characterized.', 2, 'Section H.1.2'),
    ('9c930000-0000-0000-0000-000000000023', '9c920000-0000-0000-0000-000000000001', '9c930000-0000-0000-0000-000000000012', 'outcome', 'outcome.SN.1', 'The third outcome is identified.', 1, 'Section H.2.2'),
    ('9c930000-0000-0000-0000-000000000024', '9c920000-0000-0000-0000-000000000001', '9c930000-0000-0000-0000-000000000012', 'outcome', 'outcome.SN.2', 'The fourth outcome is agreed.', 2, 'Section H.2.2');
  update public.framework_revisions set state = 'published' where id = '9c920000-0000-0000-0000-000000000001';
  update public.frameworks set current_revision_id = '9c920000-0000-0000-0000-000000000001' where id = v_framework;
end $$;

-- The first four outcomes in the order the publication prints them (its groups, each group's
-- processes, each process's outcomes), and the process that holds the first: an item that is not
-- an outcome.
do $$
declare v_item record; v_place integer := 0;
begin
  for v_item in
    select o.id, o.title, o.parent_item_id
    from public.framework_item_rows o
    join public.framework_item_rows p on p.id = o.parent_item_id
    left join public.framework_item_rows g on g.id = p.parent_item_id
    where o.framework_code = 'nist-sp800-160v1r1-processes' and o.kind = 'outcome'
    order by g.ordinal nulls last, p.ordinal, o.ordinal, o.code
    limit 4
  loop
    v_place := v_place + 1;
    perform set_config('test.outcome_' || v_place, v_item.id::text, true);
    perform set_config('test.title_' || v_place, v_item.title, true);
    if v_place = 1 then perform set_config('test.process', v_item.parent_item_id::text, true); end if;
  end loop;
  if v_place < 4 then raise exception 'The life cycle framework holds fewer than four outcomes'; end if;
end $$;

-- ---------------------------------------------------------------------------------------------
-- A workspace with two gates. The first holds a criterion somebody wrote, numbered 4.
-- ---------------------------------------------------------------------------------------------
insert into auth.users(id, email) values
  ('9c000000-0000-0000-0000-000000000001', 'gate-outcomes-owner@example.test'),
  ('9c000000-0000-0000-0000-000000000002', 'gate-outcomes-outsider@example.test'),
  ('9c000000-0000-0000-0000-000000000003', 'gate-outcomes-viewer@example.test');
select set_config('request.jwt.claim.sub', '9c000000-0000-0000-0000-000000000001', true);
set local role authenticated;
select set_config('test.tenant', public.ensure_personal_tenant()::text, true);
insert into public.programs(id, tenant_id, code, name) values
  ('9c100000-0000-0000-0000-000000000001', current_setting('test.tenant')::uuid, 'GATE-OUTCOMES-TEST', 'Rollback gate program');
insert into public.lifecycle_gates(id, tenant_id, program_id, title) values
  ('9c200000-0000-0000-0000-000000000001', current_setting('test.tenant')::uuid, '9c100000-0000-0000-0000-000000000001', 'Rollback gate'),
  ('9c200000-0000-0000-0000-000000000002', current_setting('test.tenant')::uuid, '9c100000-0000-0000-0000-000000000001', 'Second rollback gate');
insert into public.gate_criteria(id, tenant_id, gate_id, title, sequence_number) values
  ('9c300000-0000-0000-0000-000000000001', current_setting('test.tenant')::uuid, '9c200000-0000-0000-0000-000000000001', 'A criterion somebody wrote', 4);

-- A form or an API client writes criteria, but never says which outcome one was drawn from.
select pg_temp.expect_error(format($$insert into public.gate_criteria(tenant_id, gate_id, title, outcome_item_id)
  values (%L, '9c200000-0000-0000-0000-000000000001', 'A claimed outcome', %L)$$, current_setting('test.tenant'), current_setting('test.outcome_1')), '23514');
select pg_temp.expect_error(format($$update public.gate_criteria set outcome_item_id = %L, revision = 2
  where id = '9c300000-0000-0000-0000-000000000001'$$, current_setting('test.outcome_1')), '23514');

-- ---------------------------------------------------------------------------------------------
-- The command adds the chosen outcomes, in the order they are printed, after the gate's last.
-- ---------------------------------------------------------------------------------------------
select set_config('test.first', public.add_gate_security_outcomes(
  current_setting('test.tenant')::uuid, '9c200000-0000-0000-0000-000000000001', '9c400000-0000-0000-0000-000000000001',
  array[current_setting('test.outcome_2'), current_setting('test.outcome_1')]::uuid[])::text, true);
do $$
declare v_answer jsonb := current_setting('test.first')::jsonb; v_drawn record;
begin
  if (v_answer->>'added')::integer <> 2 or (v_answer->>'skipped')::integer <> 0
    or v_answer->>'gateId' <> '9c200000-0000-0000-0000-000000000001' or jsonb_array_length(v_answer->'criterionIds') <> 2 then
    raise exception 'The command did not answer with what it added: %', v_answer;
  end if;
  -- Chosen second first, added in the publication's order: the first outcome is the gate's fifth.
  select array_agg(c.outcome_item_id::text order by c.sequence_number) as outcomes,
    array_agg(c.title order by c.sequence_number) as titles,
    array_agg(c.sequence_number order by c.sequence_number) as places,
    array_agg(c.id::text order by c.sequence_number) as ids,
    bool_and(c.required) as required, bool_and(c.description is null) as undescribed,
    bool_and(c.created_by = '9c000000-0000-0000-0000-000000000001') as stamped
    into v_drawn
    from public.gate_criteria c
    where c.gate_id = '9c200000-0000-0000-0000-000000000001' and c.outcome_item_id is not null;
  if v_drawn.outcomes <> array[current_setting('test.outcome_1'), current_setting('test.outcome_2')]
    or v_drawn.titles <> array[current_setting('test.title_1'), current_setting('test.title_2')]
    or v_drawn.places <> array[5, 6] or not v_drawn.required or not v_drawn.undescribed or not v_drawn.stamped then
    raise exception 'The criteria are not the outcomes'' sentences, required, after the gate''s last in printed order: %', to_jsonb(v_drawn);
  end if;
  if (select jsonb_agg(id order by place) from unnest(v_drawn.ids) with ordinality as listed(id, place)) <> v_answer->'criterionIds' then
    raise exception 'The command did not name the criteria it added in their order';
  end if;
end $$;

-- The same request sent again, the outcomes in another order, answers as it first did and adds nothing.
do $$
declare v_answer jsonb;
begin
  v_answer := public.add_gate_security_outcomes(
    current_setting('test.tenant')::uuid, '9c200000-0000-0000-0000-000000000001', '9c400000-0000-0000-0000-000000000001',
    array[current_setting('test.outcome_1'), current_setting('test.outcome_2'), current_setting('test.outcome_1')]::uuid[]);
  if v_answer <> current_setting('test.first')::jsonb then
    raise exception 'A request sent again answered differently: %', v_answer;
  end if;
  if (select count(*) from public.gate_criteria where gate_id = '9c200000-0000-0000-0000-000000000001') <> 3 then
    raise exception 'A request sent again added criteria';
  end if;
end $$;
-- The same request with another choice, or for another gate, conflicts.
select pg_temp.expect_error(format($$select public.add_gate_security_outcomes(%L, '9c200000-0000-0000-0000-000000000001', '9c400000-0000-0000-0000-000000000001', array[%L]::uuid[])$$,
  current_setting('test.tenant'), current_setting('test.outcome_3')), 'PT409');
select pg_temp.expect_error(format($$select public.add_gate_security_outcomes(%L, '9c200000-0000-0000-0000-000000000002', '9c400000-0000-0000-0000-000000000001', array[%L, %L]::uuid[])$$,
  current_setting('test.tenant'), current_setting('test.outcome_1'), current_setting('test.outcome_2')), 'PT409');

-- A second choice skips the outcomes the gate already holds and adds the rest.
do $$
declare v_answer jsonb;
begin
  v_answer := public.add_gate_security_outcomes(
    current_setting('test.tenant')::uuid, '9c200000-0000-0000-0000-000000000001', '9c400000-0000-0000-0000-000000000002',
    array[current_setting('test.outcome_1'), current_setting('test.outcome_2'), current_setting('test.outcome_3')]::uuid[]);
  if (v_answer->>'added')::integer <> 1 or (v_answer->>'skipped')::integer <> 2 then
    raise exception 'A second choice did not skip what the gate holds: %', v_answer;
  end if;
  if (select count(*) from public.gate_criteria where gate_id = '9c200000-0000-0000-0000-000000000001') <> 4
    or (select sequence_number from public.gate_criteria
        where gate_id = '9c200000-0000-0000-0000-000000000001' and outcome_item_id = current_setting('test.outcome_3')::uuid) <> 7 then
    raise exception 'A second choice did not add the one new outcome after the gate''s last';
  end if;
end $$;

-- The same outcome read from a later revision of the publication is the same outcome: its code
-- says so, whatever its id. The later reading is a fixture, published beside the one read.
reset role;
insert into public.framework_revisions(id, framework_id, version, title, format, content_sha256, input_sha256, source_document)
  select '9c920000-0000-0000-0000-000000000002', r.framework_id, 'Test later reading', 'Test later reading', 'reference-framework/1', repeat('8', 64), repeat('8', 64), '{"title":"Test source"}'
  from public.framework_items i join public.framework_revisions r on r.id = i.framework_revision_id
  where i.id = current_setting('test.outcome_1')::uuid;
insert into public.framework_items(id, framework_revision_id, kind, code, title, ordinal, printed_in)
  select '9c930000-0000-0000-0000-000000000031', '9c920000-0000-0000-0000-000000000002', 'outcome', i.code, 'The same outcome, read again.', 1, 'A later reading'
  from public.framework_items i where i.id = current_setting('test.outcome_1')::uuid;
update public.framework_revisions set state = 'published', revision = revision + 1 where id = '9c920000-0000-0000-0000-000000000002';
set local role authenticated;
do $$
declare v_answer jsonb;
begin
  v_answer := public.add_gate_security_outcomes(
    current_setting('test.tenant')::uuid, '9c200000-0000-0000-0000-000000000001', '9c400000-0000-0000-0000-000000000007',
    array['9c930000-0000-0000-0000-000000000031']::uuid[]);
  if (v_answer->>'added')::integer <> 0 or (v_answer->>'skipped')::integer <> 1 or jsonb_array_length(v_answer->'criterionIds') <> 0 then
    raise exception 'An outcome the gate holds from another revision was added again: %', v_answer;
  end if;
  if (select count(*) from public.gate_criteria where gate_id = '9c200000-0000-0000-0000-000000000001') <> 4 then
    raise exception 'A choice of outcomes the gate already holds added criteria';
  end if;
end $$;

-- An item that is not an outcome refuses the whole choice: the outcome chosen with it is not added.
select pg_temp.expect_error(format($$select public.add_gate_security_outcomes(%L, '9c200000-0000-0000-0000-000000000001', '9c400000-0000-0000-0000-000000000003', array[%L, %L]::uuid[])$$,
  current_setting('test.tenant'), current_setting('test.outcome_4'), current_setting('test.process')), '23514');
select pg_temp.expect_error(format($$select public.add_gate_security_outcomes(%L, '9c200000-0000-0000-0000-000000000001', '9c400000-0000-0000-0000-000000000003', array['9c999999-0000-0000-0000-000000000001']::uuid[])$$,
  current_setting('test.tenant')), '23514');
-- So does a choice of nothing, or one with an empty place in it.
select pg_temp.expect_error(format($$select public.add_gate_security_outcomes(%L, '9c200000-0000-0000-0000-000000000001', '9c400000-0000-0000-0000-000000000003', '{}'::uuid[])$$,
  current_setting('test.tenant')), '23514');
select pg_temp.expect_error(format($$select public.add_gate_security_outcomes(%L, '9c200000-0000-0000-0000-000000000001', '9c400000-0000-0000-0000-000000000003', array[%L, null]::uuid[])$$,
  current_setting('test.tenant'), current_setting('test.outcome_4')), '23514');
do $$ begin
  if (select count(*) from public.gate_criteria where gate_id = '9c200000-0000-0000-0000-000000000001') <> 4
    or exists (select 1 from public.gate_criteria where outcome_item_id = current_setting('test.outcome_4')::uuid
      and gate_id = '9c200000-0000-0000-0000-000000000001') then
    raise exception 'A refused choice added a criterion';
  end if;
end $$;

-- ---------------------------------------------------------------------------------------------
-- The register's view names the process and the group an outcome belongs to; a written criterion
-- has none. A drawn criterion is edited as any other, but it keeps its outcome.
-- ---------------------------------------------------------------------------------------------
do $$
declare v_row record;
begin
  if (select count(*) from public.gate_criterion_rows where gate_id = '9c200000-0000-0000-0000-000000000001') <> 4 then
    raise exception 'gate_criterion_rows does not list the gate''s criteria';
  end if;
  select * into v_row from public.gate_criterion_rows
    where gate_id = '9c200000-0000-0000-0000-000000000001' and outcome_item_id = current_setting('test.outcome_1')::uuid;
  if v_row.outcome_code is distinct from (select code from public.framework_items where id = current_setting('test.outcome_1')::uuid)
    or v_row.process_title is distinct from (select title from public.framework_items where id = current_setting('test.process')::uuid)
    or v_row.process_code is distinct from (select code from public.framework_items where id = current_setting('test.process')::uuid)
    or v_row.group_title is null or v_row.group_code is null
    or v_row.title <> current_setting('test.title_1') or v_row.sequence_number <> 5 then
    raise exception 'gate_criterion_rows does not name the outcome, its process and its group: %', to_jsonb(v_row);
  end if;
  select * into v_row from public.gate_criterion_rows where id = '9c300000-0000-0000-0000-000000000001';
  if v_row.outcome_item_id is not null or v_row.outcome_code is not null or v_row.process_title is not null or v_row.group_title is not null then
    raise exception 'gate_criterion_rows names a source for a criterion somebody wrote';
  end if;
end $$;
update public.gate_criteria set title = 'Reworded by its gate', revision = 2
  where gate_id = '9c200000-0000-0000-0000-000000000001' and outcome_item_id = current_setting('test.outcome_1')::uuid;
select pg_temp.expect_error(format($$update public.gate_criteria set outcome_item_id = null, revision = 3
  where gate_id = '9c200000-0000-0000-0000-000000000001' and outcome_item_id = %L$$, current_setting('test.outcome_1')), '23514');
select pg_temp.expect_error(format($$update public.gate_criteria set outcome_item_id = %L, revision = 3
  where gate_id = '9c200000-0000-0000-0000-000000000001' and outcome_item_id = %L$$, current_setting('test.outcome_4'), current_setting('test.outcome_1')), '23514');
-- The receipts are the command's own.
select pg_temp.expect_error('select count(*) from public.gate_outcome_requests', '42501');

-- What the column may hold, whoever writes it: an outcome of the life cycle processes, once a gate.
reset role;
select pg_temp.expect_error(format($$insert into public.gate_criteria(tenant_id, gate_id, title, outcome_item_id)
  values (%L, '9c200000-0000-0000-0000-000000000002', 'A process is not an outcome', %L)$$, current_setting('test.tenant'), current_setting('test.process')), '23514');
insert into public.gate_criteria(tenant_id, gate_id, title, outcome_item_id)
  values (current_setting('test.tenant')::uuid, '9c200000-0000-0000-0000-000000000002', 'Written by a seed', current_setting('test.outcome_1')::uuid);
select pg_temp.expect_error(format($$insert into public.gate_criteria(tenant_id, gate_id, title, outcome_item_id)
  values (%L, '9c200000-0000-0000-0000-000000000002', 'The same outcome again', %L)$$, current_setting('test.tenant'), current_setting('test.outcome_1')), '23505');
-- One receipt for each request the command answered, the one that added nothing among them, and
-- none for a request it refused.
do $$ begin
  if (select count(*) from public.gate_outcome_requests where gate_id = '9c200000-0000-0000-0000-000000000001') <> 3
    or exists (select 1 from public.gate_outcome_requests where id = '9c400000-0000-0000-0000-000000000003') then
    raise exception 'The command did not keep one receipt per request it answered';
  end if;
end $$;

-- ---------------------------------------------------------------------------------------------
-- Who may add. A viewer of the workspace reads the criteria and adds none; a member of another
-- workspace reaches neither the gate nor its criteria; an anonymous session cannot call it.
-- ---------------------------------------------------------------------------------------------
insert into public.tenant_memberships(tenant_id, user_id, role)
  values (current_setting('test.tenant')::uuid, '9c000000-0000-0000-0000-000000000003', 'viewer');
select set_config('request.jwt.claim.sub', '9c000000-0000-0000-0000-000000000003', true);
set local role authenticated;
select pg_temp.expect_error(format($$select public.add_gate_security_outcomes(%L, '9c200000-0000-0000-0000-000000000001', '9c400000-0000-0000-0000-000000000004', array[%L]::uuid[])$$,
  current_setting('test.tenant'), current_setting('test.outcome_4')), '42501');
do $$ begin
  if (select count(*) from public.gate_criterion_rows where gate_id = '9c200000-0000-0000-0000-000000000001') <> 4 then
    raise exception 'A viewer cannot read the gate''s criteria through the view';
  end if;
end $$;

select set_config('request.jwt.claim.sub', '9c000000-0000-0000-0000-000000000002', true);
select set_config('test.other_tenant', public.ensure_personal_tenant()::text, true);
-- Named as its own workspace's, the gate is not there; named as the gate's workspace, it may not write.
select pg_temp.expect_error(format($$select public.add_gate_security_outcomes(%L, '9c200000-0000-0000-0000-000000000001', '9c400000-0000-0000-0000-000000000005', array[%L]::uuid[])$$,
  current_setting('test.other_tenant'), current_setting('test.outcome_4')), '23514');
select pg_temp.expect_error(format($$select public.add_gate_security_outcomes(%L, '9c200000-0000-0000-0000-000000000001', '9c400000-0000-0000-0000-000000000005', array[%L]::uuid[])$$,
  current_setting('test.tenant'), current_setting('test.outcome_4')), '42501');
do $$ begin
  if exists (select 1 from public.gate_criterion_rows) or exists (select 1 from public.gate_criteria) then
    raise exception 'A member of another workspace read a gate''s criteria';
  end if;
end $$;

reset role;
set local role anon;
select pg_temp.expect_error(format($$select public.add_gate_security_outcomes(%L, '9c200000-0000-0000-0000-000000000001', '9c400000-0000-0000-0000-000000000006', array[%L]::uuid[])$$,
  current_setting('test.tenant'), current_setting('test.outcome_4')), '42501');
select pg_temp.expect_error('select count(*) from public.gate_criterion_rows', '42501');
reset role;
do $$ begin
  if (select count(*) from public.gate_criteria where gate_id = '9c200000-0000-0000-0000-000000000001') <> 4 then
    raise exception 'A refused caller added a criterion';
  end if;
end $$;

-- ---------------------------------------------------------------------------------------------
-- A gate is removed as before: its criteria first, and its receipts go with it.
-- ---------------------------------------------------------------------------------------------
select set_config('request.jwt.claim.sub', '9c000000-0000-0000-0000-000000000001', true);
set local role authenticated;
delete from public.gate_criteria where gate_id = '9c200000-0000-0000-0000-000000000001';
delete from public.lifecycle_gates where id = '9c200000-0000-0000-0000-000000000001';
reset role;
do $$ begin
  if exists (select 1 from public.lifecycle_gates where id = '9c200000-0000-0000-0000-000000000001')
    or exists (select 1 from public.gate_outcome_requests where gate_id = '9c200000-0000-0000-0000-000000000001') then
    raise exception 'A gate''s receipts kept it from being removed, or outlived it';
  end if;
end $$;
rollback;
select 'Gate criteria from security outcomes: the command, its retries and refusals, the outcome guard and the register view passed.' as result;
