import { createRef } from "react";
import {
  Alert,
  AlertTitle,
  AlertDescription,
  AlertAction,
  Button,
  ButtonGroup,
  ButtonGroupText,
  ButtonGroupSeparator,
  buttonGroupVariants,
  Field,
  FieldLabel,
  FieldDescription,
  FieldError,
  FieldSet,
  FieldLegend,
  FieldGroup,
  FieldContent,
  FieldTitle,
  FieldSeparator,
  Input,
} from "../src/index";

<FieldSet ref={createRef<HTMLFieldSetElement>()} disabled form="review">
  <FieldLegend ref={createRef<HTMLLegendElement>()} variant="label">
    Review
  </FieldLegend>
  <FieldGroup ref={createRef<HTMLDivElement>()}>
    <Field ref={createRef<HTMLDivElement>()} orientation="responsive" data-invalid>
      <FieldContent ref={createRef<HTMLDivElement>()}>
        <FieldLabel ref={createRef<HTMLLabelElement>()} htmlFor="owner">
          Owner
        </FieldLabel>
        <FieldDescription ref={createRef<HTMLParagraphElement>()} id="help">
          Full name.
        </FieldDescription>
      </FieldContent>
      <Input id="owner" aria-describedby="help" />
      <FieldError
        ref={createRef<HTMLDivElement>()}
        errors={[undefined, { message: "Required." }]}
      />
    </Field>
    <FieldSeparator ref={createRef<HTMLDivElement>()}>Options</FieldSeparator>
    <FieldTitle ref={createRef<HTMLDivElement>()}>Review options</FieldTitle>
  </FieldGroup>
</FieldSet>;
<Alert
  ref={createRef<HTMLDivElement>()}
  variant="destructive"
  tone="warning"
  role="status"
  title="Native title"
>
  <AlertTitle ref={createRef<HTMLDivElement>()}>Review failed</AlertTitle>
  <AlertDescription ref={createRef<HTMLDivElement>()}>Choose an owner.</AlertDescription>
  <AlertAction ref={createRef<HTMLDivElement>()}>
    <Button>Retry</Button>
  </AlertAction>
</Alert>;
<ButtonGroup ref={createRef<HTMLDivElement>()} orientation="vertical" aria-label="Actions">
  <ButtonGroupText ref={createRef<HTMLDivElement>()}>Actions</ButtonGroupText>
  <ButtonGroupText render={<label ref={createRef<HTMLLabelElement>()} htmlFor="owner" />}>
    Owner
  </ButtonGroupText>
  <ButtonGroupSeparator ref={createRef<HTMLDivElement>()} orientation="horizontal" isDecorative />
  <Button>Save</Button>
</ButtonGroup>;
buttonGroupVariants({ orientation: "vertical", className: "w-full" });
// @ts-expect-error The configured Field API was removed.
<Field label="Owner" />;
// @ts-expect-error Groups use FieldSet/FieldLegend.
<Field isGroup />;
// @ts-expect-error Field labels target labels, not input refs.
<FieldLabel ref={createRef<HTMLInputElement>()} />;
// @ts-expect-error Alert actions are explicit children.
<Alert action={<Button>Save</Button>} />;
// @ts-expect-error Flat exports replace compound properties.
<Alert.Title />;
// @ts-expect-error Native aria-label replaces the label shorthand.
<ButtonGroup label="Actions" />;
// @ts-expect-error Orientation follows shadcn's public contract.
<ButtonGroup orientation="diagonal" />;
