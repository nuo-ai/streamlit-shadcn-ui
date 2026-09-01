import { useId } from "react"

import type { V2RendererArgs } from "@/app"
import { Field, FieldLabel } from "@/components/ui/field"
import { Textarea } from "@/components/ui/textarea"
import { useRevisionedDraftState } from "@/protocol/reconciliation"
import type { TextareaEnvelope } from "@/protocol/schema"

type TextareaViewProps = {
  envelope: TextareaEnvelope
  setStateValue: V2RendererArgs["setStateValue"]
}

export type TextareaControlProps = TextareaViewProps & {
  controlId: string
  describedBy?: string
  invalid?: boolean
}

export function TextareaControl({
  controlId,
  describedBy,
  envelope,
  invalid = false,
  setStateValue,
}: TextareaControlProps) {
  const { commitDraft, draft, setDraft } =
    useRevisionedDraftState(envelope.state, setStateValue)
  return (
    <Textarea
      aria-describedby={describedBy}
      aria-invalid={invalid || undefined}
      disabled={envelope.props.disabled}
      id={controlId}
      maxLength={envelope.props.maxLength ?? undefined}
      onBlur={commitDraft}
      onChange={(event) => {
        setDraft(event.currentTarget.value)
      }}
      onKeyDown={(event) => {
        if (
          event.key === "Enter" &&
          (event.ctrlKey || event.metaKey)
        ) {
          commitDraft()
        }
      }}
      placeholder={envelope.props.placeholder}
      rows={envelope.props.rows}
      value={draft}
    />
  )
}

export function TextareaView({
  envelope,
  setStateValue,
}: TextareaViewProps) {
  const textareaId = useId()

  return (
    <Field
      data-ssui-component="textarea"
      data-testid="ssui-v2-textarea"
    >
      <FieldLabel htmlFor={textareaId}>{envelope.props.label}</FieldLabel>
      <TextareaControl
        controlId={textareaId}
        envelope={envelope}
        setStateValue={setStateValue}
      />
    </Field>
  )
}
