import { useId } from "react"

import type { V2RendererArgs } from "@/app"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { useRevisionedDraftState } from "@/protocol/reconciliation"
import type { InputEnvelope } from "@/protocol/schema"

type InputViewProps = {
  envelope: InputEnvelope
  setStateValue: V2RendererArgs["setStateValue"]
}

export type InputControlProps = InputViewProps & {
  controlId: string
  describedBy?: string
  invalid?: boolean
}

export function InputControl({
  controlId,
  describedBy,
  envelope,
  invalid = false,
  setStateValue,
}: InputControlProps) {
  const { commitDraft, draft, setDraft } =
    useRevisionedDraftState(envelope.state, setStateValue)

  return (
    <Input
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
        if (event.key === "Enter") {
          commitDraft()
        }
      }}
      placeholder={envelope.props.placeholder}
      type={envelope.props.type}
      value={draft}
    />
  )
}

export function InputView({
  envelope,
  setStateValue,
}: InputViewProps) {
  const inputId = useId()

  return (
    <Field
      data-ssui-component="input"
      data-testid="ssui-v2-input"
    >
      <FieldLabel htmlFor={inputId}>{envelope.props.label}</FieldLabel>
      <InputControl
        controlId={inputId}
        envelope={envelope}
        setStateValue={setStateValue}
      />
    </Field>
  )
}
