-- Reference display names. The stable catalog and profile records carry the short name the
-- product shows; each revision keeps the OSCAL document's own title for provenance and export.
comment on column public.catalogs.title is 'The short name shown for the catalog, for example NIST SP 800-53 Rev 5. Each revision keeps the OSCAL document''s own title.';
comment on column public.catalog_revisions.title is 'The OSCAL document''s own title for this edition. The catalog record carries the short name shown in the product.';
comment on column public.profiles.title is 'The short name shown for the profile, for example NIST SP 800-53 Rev 5 Low baseline. Each revision keeps the OSCAL document''s own title.';
comment on column public.profile_revisions.title is 'The OSCAL document''s own title for this revision. The profile record carries the short name shown in the product.';

update public.catalogs set title='NIST SP 800-53 Rev 5'
  where tenant_id is null and code='NIST-SP-800-53-REV5';
update public.profiles as p set title=v.title
  from (values
    ('NIST-SP-800-53B-LOW','NIST SP 800-53 Rev 5 Low baseline'),
    ('NIST-SP-800-53B-MODERATE','NIST SP 800-53 Rev 5 Moderate baseline'),
    ('NIST-SP-800-53B-HIGH','NIST SP 800-53 Rev 5 High baseline'),
    ('NIST-SP-800-53B-PRIVACY','NIST SP 800-53 Rev 5 Privacy baseline')) as v(code,title)
  where p.tenant_id is null and p.code=v.code;
-- Program overlays authored before this change were named after their base document's title.
update public.profiles as p set title=b.title||substr(p.title,length(r.title)+1)
  from public.profile_revisions r join public.profiles b on b.id=r.profile_id
  where p.tenant_id is not null and b.tenant_id is null
    and left(p.title,length(r.title)+3)=r.title||' — ';
