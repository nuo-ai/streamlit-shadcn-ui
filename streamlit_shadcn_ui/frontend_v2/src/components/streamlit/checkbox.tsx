import { useId } from "react"

import { Checkbox } from "@/components/ui/checkbox"
import { Field, FieldLabel } from "@/components/ui/field"
import { useRevisionedState } from "@/protocol/reconciliation"
import type { CheckboxEnvelope } from "@/protocol/schema"
import type { V2RendererArgs } from "@/app"

type CheckboxViewProps = {
  envelope: CheckboxEnvelope
  setStateValue: V2RendererArgs["setStateValue"]
}

export type CheckboxControlProps = CheckboxViewProps & {
  controlId: string
  describedBy?: string
  invalid?: boolean
}

export function CheckboxControl({
  controlId,
  describedBy,
  envelope,
  invalid = false,
  setStateValue,
}: CheckboxControlProps) {
  const { commit, state } = useRevisionedState(
    envelope.state,
    setStateValue
  )
  return (
    <Checkbox
      aria-describedby={describedBy}
      aria-invalid={invalid || undefined}
      checked={state.value}
      disabled={envelope.props.disabled}
      id={controlId}
      onCheckedChange={(checked) => commit(checked)}
    />
  )
}

export function CheckboxView({
  envelope,
  setStateValue,
}: CheckboxViewProps) {
  const checkboxId = useId()
  return (
    <Field
      data-disabled={envelope.props.disabled || undefined}
      data-ssui-component="checkbox"
      data-testid="ssui-v2-checkbox"
      orientation="horizontal"
    >
      <CheckboxControl
        controlId={checkboxId}
        envelope={envelope}
        setStateValue={setStateValue}
      />
      <FieldLabel htmlFor={checkboxId}>{envelope.props.label}</FieldLabel>
    </Field>
  )
}
