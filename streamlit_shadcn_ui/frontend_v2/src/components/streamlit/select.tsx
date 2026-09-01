import { useId } from "react"

import { Field, FieldLabel } from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useRevisionedState } from "@/protocol/reconciliation"
import type { SelectEnvelope } from "@/protocol/schema"
import type { V2RendererArgs } from "@/app"

type SelectViewProps = {
  envelope: SelectEnvelope
  setStateValue: V2RendererArgs["setStateValue"]
}

export type SelectControlProps = SelectViewProps & {
  controlId: string
  describedBy?: string
  invalid?: boolean
}

export function SelectControl({
  controlId,
  describedBy,
  envelope,
  invalid = false,
  setStateValue,
}: SelectControlProps) {
  const { commit, state } = useRevisionedState(
    envelope.state,
    setStateValue
  )
  const isDisabled =
    envelope.props.disabled || envelope.props.options.length === 0

  return (
    <Select
      disabled={isDisabled}
      items={envelope.props.options}
      modal={false}
      onValueChange={(value) => {
        commit(typeof value === "string" ? value : null)
      }}
      value={state.value}
    >
      <SelectTrigger
        aria-describedby={describedBy}
        aria-invalid={invalid || undefined}
        className="w-full"
        id={controlId}
        data-testid="ssui-v2-select-trigger"
      >
        <SelectValue
          placeholder={
            envelope.props.options.length === 0
              ? "No options"
              : envelope.props.placeholder
          }
        />
      </SelectTrigger>
      <SelectContent
        align="start"
        alignItemWithTrigger={false}
        data-testid="ssui-v2-select-content"
      >
        {envelope.props.options.map((option) => (
          <SelectItem
            disabled={option.disabled}
            key={option.value}
            value={option.value}
          >
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export function SelectView({
  envelope,
  setStateValue,
}: SelectViewProps) {
  const controlId = useId()

  return (
    <Field
      data-ssui-component="select"
      data-testid="ssui-v2-select"
    >
      <FieldLabel htmlFor={controlId}>{envelope.props.label}</FieldLabel>
      <SelectControl
        controlId={controlId}
        envelope={envelope}
        setStateValue={setStateValue}
      />
    </Field>
  )
}
