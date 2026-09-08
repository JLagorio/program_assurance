import { createRef } from "react";
import { Attachment, buttonVariants } from "../src/index";

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
<Attachment.Trigger render={<button />} ref={button} aria-label="Preview composed button" />;
<a
  href="/file"
  ref={link}
  className={buttonVariants({
    variant: "subtle",
    className:
      "absolute inset-0 z-10 h-full w-full rounded-medium bg-transparent p-0 hover:bg-transparent active:bg-transparent",
  })}
  aria-label="Download"
  onClick={(event) => event.currentTarget.href}
/>;
<Attachment.Action label="Remove file" icon={<svg />} ref={button} />;
// @ts-expect-error Attachment actions use render; navigation is a styled native link.
<Attachment.Trigger asChild />;
// @ts-expect-error A div cannot be the native button's ref.
<Attachment.Trigger ref={root} />;
// @ts-expect-error Icon-only actions require an accessible label.
<Attachment.Action icon={<svg />} />;
// @ts-expect-error The package uses its own documented size vocabulary.
<Attachment size="sm" />;
// @ts-expect-error File operations do not belong to the presentational root.
<Attachment onUpload={() => {}} />;
