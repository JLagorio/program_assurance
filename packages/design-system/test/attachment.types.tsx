import { createRef } from "react";
import { Attachment } from "../src/index";

const button = createRef<HTMLButtonElement>();
const link = createRef<HTMLAnchorElement>();
const root = createRef<HTMLDivElement>();
<Attachment state="processing" size="xsmall" orientation="vertical" ref={root} />;
<Attachment.Title ref={createRef<HTMLSpanElement>()} title="Full filename" />;
<Attachment.Trigger
  ref={button}
  onClick={(event) => event.currentTarget.checkValidity()}
  aria-label="Preview"
/>;
<Attachment.Trigger asChild ref={link} onClick={(event) => event.currentTarget.focus()}>
  <a href="/file" aria-label="Download" />
</Attachment.Trigger>;
<Attachment.Action label="Remove file" icon={<svg />} ref={button} />;
// @ts-expect-error A div cannot be the native button's ref.
<Attachment.Trigger ref={root} />;
// @ts-expect-error Icon-only actions require an accessible label.
<Attachment.Action icon={<svg />} />;
// @ts-expect-error The package uses its own documented size vocabulary.
<Attachment size="sm" />;
// @ts-expect-error File operations do not belong to the presentational root.
<Attachment onUpload={() => {}} />;
