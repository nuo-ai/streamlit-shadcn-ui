import { useId } from "react"

import type { V2RendererArgs } from "@/app"
import { Field, FieldLabel } from "@/components/ui/field"
import { Switch } from "@/components/ui/switch"
import { useRevisionedState } from "@/protocol/reconciliation"
import type { SwitchEnvelope } from "@/protocol/schema"

type SwitchViewProps = {
  envelope: SwitchEnvelope
  setStateValue: V2RendererArgs["setStateValue"]
}

export type SwitchControlProps = SwitchViewProps & {
  controlId: string
  describedBy?: string
  invalid?: boolean
}

export function SwitchControl({
  controlId,
  describedBy,
  envelope,
  invalid = false,
  setStateValue,
}: SwitchControlProps) {
  const { commit, state } = useRevisionedState(
    envelope.state,
    setStateValue
  )
  return (
    <Switch
      aria-describedby={describedBy}
      aria-invalid={invalid || undefined}
      checked={state.value}
      disabled={envelope.props.disabled}
      id={controlId}
      onCheckedChange={commit}
    />
  )
}

export function SwitchView({
  envelope,
  setStateValue,
}: SwitchViewProps) {
  const switchId = useId()
  return (
    <Field
      data-disabled={envelope.props.disabled || undefined}
      data-ssui-component="switch"
      data-testid="ssui-v2-switch"
      orientation="horizontal"
    >
      <SwitchControl
        controlId={switchId}
        envelope={envelope}
        setStateValue={setStateValue}
      />
      <FieldLabel htmlFor={switchId}>{envelope.props.label}</FieldLabel>
    </Field>
  )
}
