import { MinusIcon, PlusIcon } from "lucide-react"
import { useEffect, useId, useState } from "react"

import type { V2RendererArgs } from "@/app"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  clampNumberInput,
  parseNumberDraft,
  stepNumberInput,
} from "@/lib/number-input"
import { useRevisionedState } from "@/protocol/reconciliation"
import type { NumberInputEnvelope } from "@/protocol/schema"

type NumberInputViewProps = {
  envelope: NumberInputEnvelope
  setStateValue: V2RendererArgs["setStateValue"]
}

export function NumberInputView({ envelope, setStateValue }: NumberInputViewProps) {
  const inputId = useId()
  const { state, commit } = useRevisionedState(envelope.state, setStateValue)
  const { label, min, max, step, integer, disabled } = envelope.props
  const [draft, setDraft] = useState(String(state.value))

  useEffect(() => {
    setDraft(String(state.value))
  }, [state.value, state.serverRevision, min, max, step, integer])

  const parsedDraft = parseNumberDraft(draft, integer)
  const current = clampNumberInput(parsedDraft ?? state.value, envelope.props)
  const decreased = stepNumberInput(current, -1, envelope.props)
  const increased = stepNumberInput(current, 1, envelope.props)

  function commitValue(value: number) {
    if (disabled) return
    setDraft(String(value))
    commit(value)
  }

  function commitDraft() {
    commitValue(parsedDraft === null ? state.value : current)
  }

  return (
    <div
      className="grid min-w-0 gap-1.5 p-px"
      data-ssui-component="number-input"
      data-testid="ssui-v2-number-input"
    >
      <label className="text-sm font-medium leading-none" htmlFor={inputId}>
        {label}
      </label>
      <div className="flex min-w-0 items-center gap-2">
        <Button
          aria-controls={inputId}
          aria-label={`Decrease ${label}`}
          className="touch-manipulation"
          disabled={disabled || decreased === current}
          onClick={() => commitValue(decreased)}
          onPointerDown={(event) => {
            // Keep a pointer click from blurring and committing the draft
            // before the button applies its step.
            if (event.button === 0) event.preventDefault()
          }}
          size="icon"
          type="button"
          variant="outline"
        >
          <MinusIcon aria-hidden="true" />
        </Button>
        <Input
          aria-valuemax={max ?? undefined}
          aria-valuemin={min ?? undefined}
          aria-valuenow={parsedDraft ?? state.value}
          autoComplete="off"
          className="text-center tabular-nums"
          disabled={disabled}
          id={inputId}
          inputMode={integer ? "numeric" : "decimal"}
          maxLength={128}
          onBlur={commitDraft}
          onChange={(event) => setDraft(event.currentTarget.value)}
          onKeyDown={(event) => {
            if (event.nativeEvent.isComposing || event.altKey || event.ctrlKey || event.metaKey) return
            switch (event.key) {
              case "Enter":
                event.preventDefault()
                commitDraft()
                break
              case "Escape":
                event.preventDefault()
                setDraft(String(state.value))
                break
              case "ArrowUp":
                event.preventDefault()
                commitValue(increased)
                break
              case "ArrowDown":
                event.preventDefault()
                commitValue(decreased)
                break
              case "Home":
                if (min !== null && !event.shiftKey) {
                  event.preventDefault()
                  commitValue(min)
                }
                break
              case "End":
                if (max !== null && !event.shiftKey) {
                  event.preventDefault()
                  commitValue(max)
                }
                break
            }
          }}
          role="spinbutton"
          type="text"
          value={draft}
        />
        <Button
          aria-controls={inputId}
          aria-label={`Increase ${label}`}
          className="touch-manipulation"
          disabled={disabled || increased === current}
          onClick={() => commitValue(increased)}
          onPointerDown={(event) => {
            if (event.button === 0) event.preventDefault()
          }}
          size="icon"
          type="button"
          variant="outline"
        >
          <PlusIcon aria-hidden="true" />
        </Button>
      </div>
    </div>
  )
}
