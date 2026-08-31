import { describe, expect, it } from "vitest"

import {
  parseNumberDraft,
  stepNumberInput,
  type NumberInputConstraints,
} from "@/lib/number-input"

const constraints: NumberInputConstraints = {
  min: null, max: null, step: 0.1, integer: false,
}

describe("number input arithmetic", () => {
  it("keeps decimal steps stable across repeated increments and decrements", () => {
    let value = 0
    for (let i = 0; i < 100; i += 1) value = stepNumberInput(value, 1, constraints)
    expect(value).toBe(10)
    for (let i = 0; i < 100; i += 1) value = stepNumberInput(value, -1, constraints)
    expect(value).toBe(0)
    expect(stepNumberInput(0.2, 1, constraints)).toBe(0.3)
    expect(stepNumberInput(-0.2, -1, constraints)).toBe(-0.3)
  })

  it("supports scientific notation and preserves meaningful precision", () => {
    expect(stepNumberInput(2e-20, 1, { ...constraints, step: 1e-20 })).toBe(3e-20)
    expect(stepNumberInput(1.005, 1, { ...constraints, step: 0.001 })).toBe(1.006)
    expect(stepNumberInput(0, 1, { ...constraints, step: Number.MIN_VALUE })).toBe(Number.MIN_VALUE)
  })

  it("clamps large steps and stops at JavaScript's safe numeric boundary", () => {
    expect(stepNumberInput(0, 1, { ...constraints, step: 20, min: 0, max: 3 })).toBe(3)
    expect(stepNumberInput(3, -1, { ...constraints, step: 20, min: 0, max: 3 })).toBe(0)
    expect(stepNumberInput(Number.MAX_SAFE_INTEGER, 1, { ...constraints, step: 1 })).toBe(Number.MAX_SAFE_INTEGER)
    expect(stepNumberInput(-Number.MAX_SAFE_INTEGER, -1, { ...constraints, step: 1 })).toBe(-Number.MAX_SAFE_INTEGER)
  })

  it("distinguishes empty or invalid drafts from zero without truncating integers", () => {
    for (const draft of ["", " ", "-", ".", "1e", "Infinity", "NaN", "0x10", "1,000", "1e400"])
      expect(parseNumberDraft(draft, false)).toBeNull()
    expect(parseNumberDraft("0", true)).toBe(0)
    expect(parseNumberDraft(" 1e3 ", true)).toBe(1000)
    expect(parseNumberDraft(".25", false)).toBe(0.25)
    expect(parseNumberDraft("-2.5", true)).toBeNull()
    expect(parseNumberDraft("9007199254740992", true)).toBeNull()
    expect(parseNumberDraft("9007199254740991.1", true)).toBeNull()
    expect(parseNumberDraft("1e-999", false)).toBeNull()
    expect(parseNumberDraft("0e-999", true)).toBe(0)
  })
})
