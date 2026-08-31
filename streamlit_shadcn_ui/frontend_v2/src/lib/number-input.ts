export type NumberInputConstraints = {
  min: number | null
  max: number | null
  step: number
  integer: boolean
}

export function isSafeNumber(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    Math.abs(value) <= Number.MAX_SAFE_INTEGER
  )
}

export function isNumberInputValue(
  value: unknown,
  constraints: NumberInputConstraints
): value is number {
  return (
    isSafeNumber(value) &&
    (!constraints.integer || Number.isSafeInteger(value)) &&
    (constraints.min === null || value >= constraints.min) &&
    (constraints.max === null || value <= constraints.max)
  )
}

export function parseNumberDraft(draft: string, integer: boolean): number | null {
  const text = draft.trim()
  if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(text)) {
    return null
  }
  const value = Number(text)
  if (!isSafeNumber(value) || (integer && !Number.isSafeInteger(value))) return null
  const [mantissa = "0", exponent = "0"] = text.toLowerCase().split("e")
  const digits = mantissa.replace(/[+.\-]/g, "")
  if (value === 0 && /[1-9]/.test(digits)) return null
  if (integer) {
    // Check the original decimal text too: Number() can round a fractional
    // value near MAX_SAFE_INTEGER into an integer before validation.
    const decimalPlaces = (mantissa.split(".")[1]?.length ?? 0) - Number(exponent)
    if (decimalPlaces > 0 && /[1-9]/.test(digits.slice(-decimalPlaces))) return null
  }
  return value
}

export function clampNumberInput(
  value: number,
  constraints: NumberInputConstraints
): number {
  return Math.max(
    constraints.min ?? -Number.MAX_SAFE_INTEGER,
    Math.min(constraints.max ?? Number.MAX_SAFE_INTEGER, value)
  )
}

function decimalParts(value: number): { coefficient: bigint; scale: number } {
  const [mantissa = "0", exponent = "0"] = String(value).toLowerCase().split("e")
  const fractionLength = mantissa.split(".")[1]?.length ?? 0
  const scale = fractionLength - Number(exponent)
  const coefficient = BigInt(mantissa.replace(".", ""))
  return scale < 0
    ? { coefficient: coefficient * 10n ** BigInt(-scale), scale: 0 }
    : { coefficient, scale }
}

export function stepNumberInput(
  value: number,
  direction: 1 | -1,
  constraints: NumberInputConstraints
): number {
  // Add the decimal representations exactly before converting back to a
  // JavaScript number, so repeated 0.1 steps do not expose binary drift.
  const current = decimalParts(value)
  const step = decimalParts(constraints.step)
  const scale = Math.max(current.scale, step.scale)
  const coefficient =
    current.coefficient * 10n ** BigInt(scale - current.scale) +
    BigInt(direction) * step.coefficient * 10n ** BigInt(scale - step.scale)
  return clampNumberInput(Number(`${coefficient}e-${scale}`), constraints)
}
