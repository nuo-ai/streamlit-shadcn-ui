import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

import { ElementsView } from "@/components/streamlit/elements"
import { NumberInputView } from "@/components/streamlit/number-input"
import { parseEnvelope, type NumberInputEnvelope } from "@/protocol/schema"

afterEach(cleanup)

function envelope(
  props: Partial<NumberInputEnvelope["props"]> = {},
  value = 2
): NumberInputEnvelope {
  return {
    protocolVersion: 1,
    kind: "number_input",
    state: { kind: "number_input", value, clientRevision: 0, serverRevision: 0 },
    props: { label: "Quantity", min: 0, max: 10, step: 1, integer: true, disabled: false, ...props },
  }
}

function input() {
  return screen.getByRole("spinbutton", { name: "Quantity" }) as HTMLInputElement
}

describe("NumberInputView", () => {
  it("keeps typing local, commits on Enter once, and preserves values on a stale rerun", () => {
    const setStateValue = vi.fn()
    const view = render(<NumberInputView envelope={envelope()} setStateValue={setStateValue} />)
    fireEvent.change(input(), { target: { value: "8" } })
    expect(setStateValue).not.toHaveBeenCalled()
    fireEvent.keyDown(input(), { key: "Enter" })
    expect(setStateValue).toHaveBeenCalledTimes(1)
    expect(setStateValue.mock.calls[0]?.[1].value).toBe(8)
    fireEvent.blur(input())
    expect(setStateValue).toHaveBeenCalledTimes(1)
    view.rerender(<NumberInputView envelope={envelope()} setStateValue={setStateValue} />)
    expect(input().value).toBe("8")
  })

  it("steps from a typed draft without a separate blur commit on pointer click", async () => {
    const user = userEvent.setup()
    const setStateValue = vi.fn()
    render(<NumberInputView envelope={envelope()} setStateValue={setStateValue} />)
    await user.click(input())
    await user.clear(input())
    await user.type(input(), "5")
    expect(setStateValue).not.toHaveBeenCalled()
    await user.click(screen.getByRole("button", { name: "Increase Quantity" }))
    expect(input().value).toBe("6")
    expect(setStateValue).toHaveBeenCalledTimes(1)
    expect(setStateValue.mock.calls[0]?.[1].value).toBe(6)
  })

  it("restores empty, invalid, and fractional integer drafts and clamps valid input", () => {
    const setStateValue = vi.fn()
    render(<NumberInputView envelope={envelope()} setStateValue={setStateValue} />)
    for (const draft of ["", "-", "1e", "0x10", "2.5", "Infinity"]) {
      fireEvent.change(input(), { target: { value: draft } })
      fireEvent.blur(input())
      expect(input().value).toBe("2")
    }
    expect(setStateValue).not.toHaveBeenCalled()
    fireEvent.change(input(), { target: { value: "100" } })
    fireEvent.blur(input())
    expect(input().value).toBe("10")
    expect(setStateValue.mock.calls[0]?.[1].value).toBe(10)
    expect((screen.getByRole("button", { name: "Increase Quantity" }) as HTMLButtonElement).disabled).toBe(true)
  })

  it("supports decimal buttons, keyboard stepping, and finite bounds", () => {
    const setStateValue = vi.fn()
    render(<NumberInputView envelope={envelope({ integer: false, step: 0.1, max: 0.3 }, 0)} setStateValue={setStateValue} />)
    expect(input().inputMode).toBe("decimal")
    const increase = screen.getByRole("button", { name: "Increase Quantity" })
    for (let i = 0; i < 3; i += 1) fireEvent.click(increase)
    expect(input().value).toBe("0.3")
    expect(setStateValue.mock.calls[2]?.[1].value).toBe(0.3)
    fireEvent.keyDown(input(), { key: "ArrowDown" })
    expect(input().value).toBe("0.2")
    fireEvent.keyDown(input(), { key: "Home" })
    expect(input().value).toBe("0")
    fireEvent.keyDown(input(), { key: "End" })
    expect(input().value).toBe("0.3")
  })

  it("does not commit an IME confirmation and lets Escape discard a draft", () => {
    const setStateValue = vi.fn()
    render(<NumberInputView envelope={envelope()} setStateValue={setStateValue} />)
    fireEvent.change(input(), { target: { value: "5" } })
    fireEvent.keyDown(input(), { key: "Enter", isComposing: true })
    expect(setStateValue).not.toHaveBeenCalled()
    fireEvent.keyDown(input(), { key: "Escape" })
    expect(input().value).toBe("2")
    expect(setStateValue).not.toHaveBeenCalled()
  })

  it("honors server resets even when the authoritative value has not changed", () => {
    const setStateValue = vi.fn()
    const view = render(<NumberInputView envelope={envelope()} setStateValue={setStateValue} />)
    fireEvent.change(input(), { target: { value: "7" } })
    const reset = envelope()
    reset.state.serverRevision = 1
    view.rerender(<NumberInputView envelope={reset} setStateValue={setStateValue} />)
    expect(input().value).toBe("2")
  })

  it("disables both buttons and the field", () => {
    const setStateValue = vi.fn()
    render(<NumberInputView envelope={envelope({ disabled: true })} setStateValue={setStateValue} />)
    expect(input().disabled).toBe(true)
    for (const button of screen.getAllByRole("button")) {
      expect((button as HTMLButtonElement).disabled).toBe(true)
      fireEvent.click(button)
    }
    expect(setStateValue).not.toHaveBeenCalled()
  })
})

describe("number input protocol and Elements integration", () => {
  it("rejects malformed numeric envelopes", () => {
    expect(parseEnvelope(envelope()).ok).toBe(true)
    for (const props of [
      { min: 11 }, { max: -1 }, { step: 0 }, { step: -1 },
      { step: 0.1 }, { min: 0.5 }, { max: Infinity },
      { integer: "yes" }, { disabled: 0 },
    ]) {
      expect(parseEnvelope({ ...envelope(), props: { ...envelope().props, ...props } }).ok).toBe(false)
    }
    for (const value of [true, null, "2", 2.5, NaN, Infinity, 2 ** 53, -1, 11]) {
      expect(parseEnvelope({ ...envelope(), state: { ...envelope().state, value } }).ok).toBe(false)
    }
  })

  it("commits one typed numeric node inside an Elements tree", () => {
    const leaf = envelope()
    const parsed = parseEnvelope({
      protocolVersion: 1,
      kind: "elements",
      state: {
        kind: "elements", clientRevision: 0, serverRevision: 0,
        value: {
          sequence: 0,
          nodes: { quantity: { ...leaf.state, changeSequence: 0 } },
        },
      },
      props: {
        nodes: [{ id: "quantity", type: "number_input", props: leaf.props, children: [] }],
      },
    })
    if (!parsed.ok || parsed.envelope.kind !== "elements") throw new Error("Invalid fixture")
    const setStateValue = vi.fn()
    render(<ElementsView envelope={parsed.envelope} setStateValue={setStateValue} setTriggerValue={vi.fn()} />)
    fireEvent.click(screen.getByRole("button", { name: "Increase Quantity" }))
    expect(setStateValue).toHaveBeenCalledTimes(1)
    expect(setStateValue.mock.calls[0]?.[1].value.nodes.quantity.value).toBe(3)
    expect(setStateValue.mock.calls[0]?.[1].value.nodes.quantity.changeSequence).toBe(1)
  })
})
