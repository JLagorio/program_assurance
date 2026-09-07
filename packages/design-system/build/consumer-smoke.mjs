// A real tarball installed outside the workspace: no aliases, symlinks, or development conditions.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repo = path.resolve(root, "../..");
const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ledger-consumer-"));
const run = (cmd, args, cwd = dir) =>
  execFileSync(cmd, args, { cwd, stdio: "inherit", env: { ...process.env, NODE_OPTIONS: "" } });
try {
  const packed = JSON.parse(
    execFileSync("npm", ["pack", "--ignore-scripts", "--json", "--pack-destination", dir], {
      cwd: root,
      encoding: "utf8",
    }),
  )[0];
  const version = (name) =>
    JSON.parse(fs.readFileSync(path.join(repo, "node_modules", name, "package.json"), "utf8"))
      .version;
  const deps = Object.fromEntries(
    [
      "react",
      "react-dom",
      "tailwindcss",
      "typescript",
      "@types/react",
      "@types/react-dom",
      "vite",
      "@tailwindcss/vite",
    ].map((name) => [name, version(name)]),
  );
  fs.writeFileSync(
    path.join(dir, "package.json"),
    JSON.stringify({
      private: true,
      type: "module",
      dependencies: { ...deps, "@ledger/design-system": `file:./${packed.filename}` },
    }),
  );
  run("npm", [
    "install",
    "--ignore-scripts",
    "--no-audit",
    "--no-fund",
    ...(process.argv.includes("--offline") ? ["--offline"] : []),
  ]);
  fs.writeFileSync(
    path.join(dir, "ssr.mjs"),
    `import assert from 'node:assert/strict';\nimport {createElement} from 'react';\nimport {renderToString} from 'react-dom/server';\nimport {Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator, BreadcrumbEllipsis, Avatar, Combobox, Attachment, Alert, Accordion, Collapsible, Button, Composer, TaskRow, Item, LedgerProvider, toast} from '@ledger/design-system';\nimport * as ledger from '@ledger/design-system';\nfor (const name of ['Activity','Task','parseMentions']) assert.equal(name in ledger, false, name + ' must remain application-owned');\nimport {cn} from '@ledger/design-system/cn';\nassert.equal(typeof Composer,'function'); assert.equal(typeof TaskRow,'function'); assert.equal(typeof toast.promise,'function'); assert.equal(cn('flex','block'),'block');\nconst breadcrumbHtml=renderToString(createElement(Breadcrumb,{'aria-label':'Packed breadcrumb'},createElement(BreadcrumbList,null,createElement(BreadcrumbItem,null,createElement(BreadcrumbLink,{render:createElement('a',{href:'/records','data-consumer-render':'anchor'})},'Records')),createElement(BreadcrumbSeparator,null),createElement(BreadcrumbItem,null,createElement('button',{'aria-label':'More parent pages'},createElement(BreadcrumbEllipsis,null))),createElement(BreadcrumbSeparator,null),createElement(BreadcrumbItem,null,createElement(BreadcrumbPage,null,'Packed record')))));\nassert.match(breadcrumbHtml,/<nav [^>]*aria-label="Packed breadcrumb"/); assert.match(breadcrumbHtml,/<ol [^>]*data-slot="breadcrumb-list"/); assert.match(breadcrumbHtml,/<li [^>]*data-slot="breadcrumb-item"/);\nconst packedBreadcrumbLink=breadcrumbHtml.match(/<a [^>]*>/)?.[0]; assert.ok(packedBreadcrumbLink); assert.match(packedBreadcrumbLink,/data-slot="breadcrumb-link"/); assert.ok(packedBreadcrumbLink.includes('href="/records"')); assert.match(packedBreadcrumbLink,/data-consumer-render="anchor"/); assert.match(breadcrumbHtml,/>Records<[/]a>/);\nconst packedBreadcrumbPage=breadcrumbHtml.match(/<span [^>]*data-slot="breadcrumb-page"[^>]*>/)?.[0]; assert.ok(packedBreadcrumbPage); assert.match(packedBreadcrumbPage,/role="link"/); assert.match(packedBreadcrumbPage,/aria-disabled="true"/); assert.match(packedBreadcrumbPage,/aria-current="page"/); assert.doesNotMatch(packedBreadcrumbPage,/tabindex=/); assert.match(breadcrumbHtml,/>Packed record<[/]span>/);\nfor (const slot of ['breadcrumb-separator','breadcrumb-ellipsis']) { const tag=breadcrumbHtml.match(new RegExp('<(?:li|span) [^>]*data-slot="'+slot+'"[^>]*>'))?.[0]; assert.ok(tag); assert.match(tag,/role="presentation"/); assert.match(tag,/aria-hidden="true"/); } assert.match(breadcrumbHtml,/aria-label="More parent pages"/);\nconst comboHtml=renderToString(createElement(Combobox.Root,{items:["React","Vue"],defaultValue:"React",name:"framework"},createElement(Combobox.Input,{"aria-label":"Framework"}))); assert.match(comboHtml,/role="combobox"/); assert.match(comboHtml,/name="framework"/); assert.match(comboHtml,/value="React"/);\nconst avatarHtml=renderToString(createElement(Avatar.Stack,{'aria-label':'Packed reviewers'},createElement(Avatar,{name:'Dana Whitlock',size:'medium','aria-label':'Dana Whitlock, online'},createElement(Avatar.Image,{src:'/dana.png'}),createElement(Avatar.Fallback,null),createElement(Avatar.Badge,{tone:'success'})),createElement(Avatar.Count,null,'+2'))); assert.match(avatarHtml,/role="group"/); assert.match(avatarHtml,/data-slot="avatar-fallback"/); assert.match(avatarHtml,/>DW</); assert.doesNotMatch(avatarHtml,/<img/); assert.match(avatarHtml,/data-slot="avatar-count"/); assert.match(avatarHtml,/data-slot="avatar-badge"/); assert.match(avatarHtml,/data-tone="success"/);\nconst attachmentHtml=renderToString(createElement(Attachment,{state:'uploading'},createElement(Attachment.Content,null,createElement(Attachment.Title,null,'packed-file.pdf')),createElement(Attachment.Trigger,{'aria-label':'Preview packed file'}))); assert.match(attachmentHtml,/aria-busy="true"/); assert.match(attachmentHtml,/packed-file.pdf/); assert.match(attachmentHtml,/data-slot="attachment-trigger"/);\nconst html=renderToString(createElement(LedgerProvider,{locale:'en-US'},createElement('div',null,createElement(Alert,{role:'note','aria-labelledby':'packed-alert-title'},createElement(Alert.Title,{id:'packed-alert-title'},'Packed callout'),createElement(Alert.Description,null,'Packed description'),createElement(Alert.Action,null,createElement(Button,null,'Review'))),createElement(Accordion,{type:'single',defaultValue:'stable'},createElement(Accordion.Item,{value:'stable'},createElement(Accordion.Header,null,createElement(Accordion.Trigger,null,'Packed accordion')),createElement(Accordion.Content,null,'Packed panel'))),createElement(Collapsible,{defaultOpen:true},createElement(Collapsible.Trigger,null,'Packed disclosure'),createElement(Collapsible.Content,null,'Packed detail')),createElement(Button,null,'Save'),createElement(Composer,{label:'Message',onSubmit:()=>{}}),createElement(Item.Group,null,createElement(TaskRow,{title:'Review draft'}))))); assert.match(html,/<button/); assert.match(html,/Save/); assert.match(html,/<textarea/); assert.match(html,/Review draft/); assert.match(html,/Packed callout/); assert.match(html,/data-slot="alert-action"/); assert.match(html,/Packed accordion/); assert.match(html,/Packed panel/); assert.match(html,/Packed disclosure/); console.log('Packed ESM import and SSR passed');`,
  );
  fs.appendFileSync(
    path.join(dir, "ssr.mjs"),
    `
import {Badge, badgeVariants, tones} from '@ledger/design-system';
for (const variant of ['default', 'secondary', 'destructive', 'outline', 'ghost', 'link']) {
  const badgeHtml = renderToString(createElement(Badge, {variant, title: variant}, variant));
  assert.match(badgeHtml, /<span /);
  assert.ok(badgeHtml.includes('data-slot="badge"'));
  assert.ok(badgeHtml.includes('data-variant="' + variant + '"'));
  assert.equal(typeof badgeVariants({variant}), 'string');
}
const defaultBadgeHtml = renderToString(createElement(Badge, null, 'Brand'));
assert.match(defaultBadgeHtml, /data-variant="default"/);
assert.match(defaultBadgeHtml, /bg-brand-bold/);
const badgeLinkHtml = renderToString(createElement(Badge, {
  variant: 'outline', id: 'packed-badge', style: {paddingInline: 'var(--ds-space-100)'},
  render: createElement('a', {href: '/records', 'data-consumer-render': 'anchor', style: {color: 'var(--ds-color-text-brand)'}})
}, createElement('svg', {'data-icon': 'inline-start', 'aria-hidden': true}), 'Open record'));
const packedBadgeLink = badgeLinkHtml.match(/<a [^>]*>/)?.[0];
assert.ok(packedBadgeLink);
for (const attribute of ['href="/records"', 'data-slot="badge"', 'data-variant="outline"', 'id="packed-badge"', 'data-consumer-render="anchor"']) assert.ok(packedBadgeLink.includes(attribute), attribute);
assert.match(packedBadgeLink, /padding-inline:/);
assert.match(packedBadgeLink, /color:/);
assert.match(badgeLinkHtml, /data-icon="inline-start"/);
assert.match(badgeLinkHtml, /Open record/);
for (const tone of tones) {
  for (const appearance of ['subtle', 'bold']) {
    const statusHtml = renderToString(createElement(Badge, {variant: 'secondary', tone, appearance, size: 'xsmall', icon: createElement('svg', {'aria-hidden': true})}, 'Status'));
    assert.match(statusHtml, /<span /);
    assert.match(statusHtml, /data-slot="badge"/);
    assert.ok(statusHtml.includes('data-tone="' + tone + '"'));
    assert.match(statusHtml, /rounded-full/);
    assert.match(statusHtml, /h-200/);
    assert.ok(statusHtml.includes('bg-' + tone + (appearance === 'bold' ? '-bold' : '')));
    assert.doesNotMatch(statusHtml, / (?:tone|appearance|size|icon)=/);
  }
}
const renderedContent = renderToString(createElement(Badge, {
  variant: 'secondary', tone: 'success', icon: createElement('svg', {'aria-hidden': true}),
  render: createElement('a', {href: '/review'}, 'Review status')
}));
assert.match(renderedContent, /Review status/);
assert.match(renderedContent, /data-icon="inline-start"/);
assert.ok(renderedContent.includes('href="/review"'));
for (const icon of [undefined, false, true]) {
  const content = renderToString(createElement(Badge, {icon, render: createElement('a', {href: '/review'}, 'Rendered label')}));
  assert.match(content, /Rendered label/);
}
const neutralStatusHtml = renderToString(createElement(Badge, {variant: 'secondary', tone: 'neutral'}, 'Category'));
assert.match(neutralStatusHtml, /bg-neutral/);
assert.doesNotMatch(neutralStatusHtml, /bg-brand-bold/);
console.log('Packed Badge variants, native/render composition and semantic Badge SSR passed');
`,
  );
  run(process.execPath, ["ssr.mjs"]);
  fs.writeFileSync(
    path.join(dir, "consumer.tsx"),
    `import {createRef} from 'react';\nimport {Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator, BreadcrumbEllipsis, Avatar, Person, Combobox, Attachment, Alert, Accordion, Collapsible, Button, Composer, TaskRow, Item, Text, Input, Tabs, ToggleGroup, DropdownMenu, ScrollArea, toast, type ToastOptions, LedgerProvider} from '@ledger/design-system';\nconst breadcrumbRefs={nav:createRef<HTMLElement>(),list:createRef<HTMLOListElement>(),item:createRef<HTMLLIElement>(),link:createRef<HTMLAnchorElement>(),page:createRef<HTMLSpanElement>(),separator:createRef<HTMLLIElement>(),ellipsis:createRef<HTMLSpanElement>()};\nconst breadcrumb=<Breadcrumb ref={breadcrumbRefs.nav} aria-label="Packed breadcrumb"><BreadcrumbList ref={breadcrumbRefs.list} start={1}><BreadcrumbItem ref={breadcrumbRefs.item} value={1}><BreadcrumbLink ref={breadcrumbRefs.link} render={<a href="/records" data-consumer-render="anchor" />} onClick={event => { const anchor:HTMLAnchorElement=event.currentTarget; void anchor.href; }}>Records</BreadcrumbLink></BreadcrumbItem><BreadcrumbSeparator ref={breadcrumbRefs.separator} /><BreadcrumbItem><button aria-label="More parent pages"><BreadcrumbEllipsis ref={breadcrumbRefs.ellipsis} /></button></BreadcrumbItem><BreadcrumbSeparator /><BreadcrumbItem><BreadcrumbPage ref={breadcrumbRefs.page} id="packed-record-page">Packed record</BreadcrumbPage></BreadcrumbItem></BreadcrumbList></Breadcrumb>; void breadcrumb;\nconst avatars=<Avatar.Stack size="medium" aria-label="Reviewers" ref={node => node?.focus()}><Avatar name="Dana Whitlock" shape="square" hue="teal"><Avatar.Image src="/dana.png" onLoadingStatusChange={status => status === 'loaded'} /><Avatar.Fallback delay={200} /><Avatar.Badge tone=\"success\" ref={node => node?.focus()} /></Avatar><Avatar.Count>+2</Avatar.Count></Avatar.Stack>; void avatars; const owner=<Person name="Dana Whitlock" title="Owner" />; void owner;\nconst combo=<Combobox.Root<string,true> multiple items={["React","Vue"]} defaultValue={["React"]} onValueChange={values => values.map(value => value.toUpperCase())}><Combobox.Input render={<input aria-label="Framework" />} className={state => state.open ? "text-brand" : "text-default"} /><Combobox.Content><Combobox.List>{(item:string) => <Combobox.Item key={item} value={item}>{item}</Combobox.Item>}</Combobox.List></Combobox.Content></Combobox.Root>; void combo;\nconst compatibleCombo=<Combobox ref={input => { input?.select(); }} options={[{value:"react",label:"React"}]} value="react" onChange={value => value.toUpperCase()} />; void compatibleCombo;\nconst attachment=<Attachment.Group><Attachment size="small" orientation="vertical"><Attachment.Media variant="image"><img src="/file.png" alt="Preview" /></Attachment.Media><Attachment.Content><Attachment.Title>file.png</Attachment.Title><Attachment.Description>PNG</Attachment.Description></Attachment.Content><Attachment.Trigger asChild><a href="/file.png" aria-label="Download file" /></Attachment.Trigger><Attachment.Actions><Attachment.Action label="Remove file" icon={<svg />} /></Attachment.Actions></Attachment></Attachment.Group>; void attachment;\nconst alert=<Alert role="note" data-testid="packed-alert"><Alert.Title id="packed-title">Import ready</Alert.Title><Alert.Description>Review records.</Alert.Description><Alert.Action><Button>Review</Button></Alert.Action></Alert>; void alert;\nconst disclosures=<><Accordion type="multiple" defaultValue={["stable"]} onValueChange={values => values.map(String)}><Accordion.Item value="stable"><Accordion.Header><Accordion.Trigger>Details</Accordion.Trigger></Accordion.Header><Accordion.Content forceMount>Retained</Accordion.Content></Accordion.Item></Accordion><Collapsible defaultOpen><Collapsible.Trigger>More</Collapsible.Trigger><Collapsible.Content>Content</Collapsible.Content></Collapsible></>; void disclosures;\nconst options:ToastOptions={description:'Saved'};\nconst result=toast.promise(Promise.resolve({id:42}),{loading:'Saving',success:record=>String(record.id),error:'Failed'});\nvoid result; void options; export const app=<LedgerProvider><Button name="save">Save</Button><Composer label="Message" onSubmit={async () => {}} /><Item.Group><TaskRow title="Review draft" completed onCompletedChange={() => {}} /></Item.Group><Text as="label" htmlFor="consumer-name">Name</Text><Input id="consumer-name" /><Tabs dir="rtl">{null}</Tabs><ToggleGroup dir="ltr" items={[{ value: "table", label: "Table" }]} value="table" onChange={() => {}} /><DropdownMenu dir="rtl" trigger={<Button>Actions</Button>}>{null}</DropdownMenu><ScrollArea dir="ltr">Content</ScrollArea></LedgerProvider>;`,
  );
  fs.writeFileSync(
    path.join(dir, "tsconfig.json"),
    JSON.stringify({
      compilerOptions: {
        target: "ES2022",
        module: "NodeNext",
        moduleResolution: "NodeNext",
        jsx: "react-jsx",
        strict: true,
        noEmit: true,
        skipLibCheck: false,
      },
      include: ["consumer.tsx"],
    }),
  );
  fs.appendFileSync(
    path.join(dir, "consumer.tsx"),
    `
import {Badge, badgeVariants, type BadgeProps} from '@ledger/design-system';
import type {ComponentProps} from 'react';
const badgeRef = createRef<HTMLSpanElement>();
const badgeAnchorRef = createRef<HTMLAnchorElement>();
const badgeVariant: ComponentProps<typeof Badge>['variant'] = 'ghost';
const badge = <Badge ref={badgeRef} variant={badgeVariant} id="packed-badge" title="Native title" aria-invalid onClick={event => { const span: HTMLSpanElement = event.currentTarget; void span; }}>Native</Badge>;
const badgeLink = <Badge variant="link" render={<a ref={badgeAnchorRef} href="/records" rel="bookmark" />}><svg data-icon="inline-end" aria-hidden />Record</Badge>;
const badgeCallback = <Badge render={(props) => <span {...props} data-consumer-render="callback" />} />;
const nullVariant = <Badge variant={null} />;
const classes: string = badgeVariants({variant: 'destructive', className: 'w-fit'});
const semanticClasses: string = badgeVariants({variant: 'secondary', tone: 'success', appearance: 'subtle', size: 'xsmall'});
const statusProps: BadgeProps = {variant: 'secondary', tone: 'warning', appearance: 'bold', size: 'xsmall', icon: <svg aria-hidden />, children: 'Needs review'};
const statusBadge = <Badge {...statusProps} ref={badgeRef} title="Review needed" />;
const semanticOutline = <Badge variant="outline" tone="success" size="xsmall" icon={<svg aria-hidden />}>Verified</Badge>;
const semanticLink = <Badge variant="link" tone="warning" render={<a href="/review" />}>Review</Badge>;
const brandBadge = <Badge tone="brand" appearance="subtle">Preview</Badge>;
// @ts-expect-error Tone uses the documented palette.
const unknownTone = <Badge tone="purple" />;
// @ts-expect-error Badge supports the two documented densities.
const unknownSize = <Badge size="large" />;
// @ts-expect-error A badge always has a documented density.
const nullSize = <Badge size={null} />;
// @ts-expect-error Emphasis is subtle or bold.
const unknownAppearance = <Badge appearance="outline" />;
// @ts-expect-error Badge preserves the six reference variants.
const unknownVariant = <Badge variant="success" />;
// @ts-expect-error Anchor attributes belong on the element passed through render.
const spanHref = <Badge href="/records" />;
void [badge, badgeLink, badgeCallback, nullVariant, classes, semanticClasses, statusBadge, semanticOutline, semanticLink, brandBadge, unknownTone, unknownSize, nullSize, unknownAppearance, unknownVariant, spanHref];
`,
  );
  run(process.execPath, ["node_modules/typescript/bin/tsc", "-p", "tsconfig.json"]);
  fs.writeFileSync(
    path.join(dir, "index.html"),
    '<div id="root"></div><script type="module" src="/main.js"></script>',
  );
  fs.writeFileSync(
    path.join(dir, "main.js"),
    `import {createElement} from 'react'; import {createRoot} from 'react-dom/client'; import {Button, Badge} from '@ledger/design-system'; import './style.css'; createRoot(document.getElementById('root')).render(createElement('div',null,createElement(Button,null,'Save'),createElement(Badge,{variant:'outline',render:createElement('a',{href:'#record'})},'Record'),createElement(Badge,{variant:'secondary',tone:'success'},'Ready')));`,
  );
  fs.writeFileSync(
    path.join(dir, "style.css"),
    '@import "tailwindcss";\n@import "@ledger/design-system/reset.css";\n@import "@ledger/design-system/ledger.css";\n@import "@ledger/design-system/base.css";',
  );
  fs.writeFileSync(
    path.join(dir, "vite.config.js"),
    `import {defineConfig} from 'vite';import tailwindcss from '@tailwindcss/vite'; export default defineConfig({plugins:[tailwindcss()]});`,
  );
  run(process.execPath, ["node_modules/vite/bin/vite.js", "build"]);
  const css = fs
    .readdirSync(path.join(dir, "dist/assets"))
    .filter((f) => f.endsWith(".css"))
    .map((f) => fs.readFileSync(path.join(dir, "dist/assets", f), "utf8"))
    .join("\n");
  if (!css.includes("--ds-") || !css.includes(".bg-brand-bold"))
    throw new Error("Consumer CSS is missing Ledger tokens or component utilities");
  if (!css.includes("outline-danger") || !css.includes("data-icon"))
    throw new Error("Consumer CSS is missing Badge danger outlines or icon selectors");
  console.log("Packed consumer declarations, Vite bundle and Tailwind CSS passed");
} finally {
  if (process.argv.includes("--keep")) console.log(`Consumer fixture: ${dir}`);
  else fs.rmSync(dir, { recursive: true, force: true });
}
