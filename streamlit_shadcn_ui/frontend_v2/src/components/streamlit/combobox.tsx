import { useEffect, useId, useState } from "react"

import type { V2RendererArgs } from "@/app"
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor,
} from "@/components/ui/combobox"
import { Field, FieldLabel } from "@/components/ui/field"
import { useRevisionedState } from "@/protocol/reconciliation"
import type { ComboboxEnvelope } from "@/protocol/schema"

type ComboboxViewProps = {
  envelope: ComboboxEnvelope
  setStateValue: V2RendererArgs["setStateValue"]
}

export type ComboboxControlProps = ComboboxViewProps & {
  controlId: string
  describedBy?: string
  invalid?: boolean
}

export function ComboboxControl({
  controlId,
  describedBy,
  envelope,
  invalid = false,
  setStateValue,
}: ComboboxControlProps) {
  const { commit, state } = useRevisionedState(
    envelope.state,
    setStateValue
  )
  const anchor = useComboboxAnchor()
  const [inputElement, setInputElement] =
    useState<HTMLInputElement | null>(null)
  const itemValues = envelope.props.options.map((option) => option.value)
  const optionByValue = new Map(
    envelope.props.options.map((option) => [option.value, option])
  )
  const itemToStringLabel = (item: string) =>
    optionByValue.get(item)?.label ?? ""
  const disabled = envelope.props.disabled || itemValues.length === 0
  useEffect(() => {
    const containingRoot = inputElement?.getRootNode()
    const controlById =
      containingRoot instanceof Document ||
      containingRoot instanceof ShadowRoot
        ? containingRoot.getElementById(controlId)
        : document.getElementById(controlId)
    const root = inputElement?.closest(
      "[data-slot='input-group'],[data-slot='combobox-chips']"
    ) ?? controlById?.closest(
      "[data-slot='input-group'],[data-slot='combobox-chips']"
    )
    if (!root) return

    const setAccessibleName = (
      element: HTMLElement | null | undefined,
      name: string
    ) => {
      if (element?.getAttribute("aria-label") !== name) {
        element?.setAttribute("aria-label", name)
      }
    }
    const nameActions = () => {
      setAccessibleName(
        root.querySelector<HTMLElement>("[data-slot='combobox-clear']"),
        `Clear ${envelope.props.label}`
      )
      setAccessibleName(
        root.querySelector<HTMLElement>(
          "[data-slot='input-group-button'][aria-haspopup='listbox']"
        ),
        `Open ${envelope.props.label}`
      )

      const selected = Array.isArray(state.value) ? state.value : []
      root
        .querySelectorAll<HTMLElement>("[data-slot='combobox-chip']")
        .forEach((chip, index) => {
          const label = itemToStringLabel(selected[index] ?? "")
          setAccessibleName(
            chip.querySelector<HTMLElement>(
              "[data-slot='combobox-chip-remove']"
            ),
            label ? `Remove ${label}` : "Remove selection"
          )
        })
    }
    const observer = new MutationObserver(nameActions)
    observer.observe(root, {
      attributeFilter: ["aria-label"],
      attributes: true,
      childList: true,
      subtree: true,
    })
    nameActions()
    return () => observer.disconnect()
  }, [controlId, envelope.props.label, inputElement, state.value])
  const commonInputProps = {
    "aria-describedby": describedBy,
    "aria-invalid": invalid || undefined,
    disabled,
    id: controlId,
    placeholder:
      itemValues.length === 0
        ? envelope.props.emptyMessage
        : envelope.props.placeholder,
  }

  const items = (
    <>
      <ComboboxEmpty>{envelope.props.emptyMessage}</ComboboxEmpty>
      <ComboboxList>
        {itemValues.map((item) => {
          const option = optionByValue.get(item)!
          return (
            <ComboboxItem
              disabled={option.disabled}
              key={item}
              value={item}
            >
              {option.label}
            </ComboboxItem>
          )
        })}
      </ComboboxList>
    </>
  )

  if (envelope.props.selectionMode === "multiple") {
    const selected = Array.isArray(state.value) ? state.value : []
    return (
      <Combobox
        disabled={disabled}
        itemToStringLabel={itemToStringLabel}
        items={itemValues}
        multiple
        onValueChange={(value) => {
          commit(
            Array.isArray(value)
              ? value.filter(
                  (item): item is string =>
                    typeof item === "string" && optionByValue.has(item)
                )
              : []
          )
        }}
        value={selected}
      >
        <ComboboxChips ref={anchor}>
          <ComboboxValue>
            {selected.map((item) => (
              <ComboboxChip key={item}>{itemToStringLabel(item)}</ComboboxChip>
            ))}
          </ComboboxValue>
          <ComboboxChipsInput
            {...commonInputProps}
            ref={setInputElement}
          />
        </ComboboxChips>
        <ComboboxContent anchor={anchor}>{items}</ComboboxContent>
      </Combobox>
    )
  }

  const selected = typeof state.value === "string" ? state.value : null
  return (
    <Combobox
      disabled={disabled}
      itemToStringLabel={itemToStringLabel}
      items={itemValues}
      onValueChange={(value) => {
        commit(typeof value === "string" ? value : null)
      }}
      value={selected}
    >
      <ComboboxInput
        {...commonInputProps}
        ref={setInputElement}
        showClear={envelope.props.clearable}
      />
      <ComboboxContent>{items}</ComboboxContent>
    </Combobox>
  )
}

export function ComboboxView({
  envelope,
  setStateValue,
}: ComboboxViewProps) {
  const controlId = useId()
  return (
    <Field
      data-ssui-component="combobox"
      data-testid="ssui-v2-combobox"
    >
      <FieldLabel htmlFor={controlId}>{envelope.props.label}</FieldLabel>
      <ComboboxControl
        controlId={controlId}
        envelope={envelope}
        setStateValue={setStateValue}
      />
    </Field>
  )
}
