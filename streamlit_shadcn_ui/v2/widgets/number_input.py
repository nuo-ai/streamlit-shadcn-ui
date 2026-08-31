from __future__ import annotations

from dataclasses import dataclass
import math
from typing import Any, Callable, Dict, Optional, Union

from .._protocol import validate_text
from ._common import boolean, mount_stateful


Number = Union[int, float]
_MAX_SAFE_NUMBER = (1 << 53) - 1


def _safe_number(value: object) -> bool:
    return (
        isinstance(value, (int, float))
        and not isinstance(value, bool)
        and -_MAX_SAFE_NUMBER <= value <= _MAX_SAFE_NUMBER
        and math.isfinite(value)
    )


@dataclass(frozen=True)
class _NumberInputConfig:
    value: Number
    props: Dict[str, Any]

    def valid(self, candidate: object) -> bool:
        return (
            _safe_number(candidate)
            and (
                not self.props["integer"]
                or float(candidate).is_integer()
            )
            and (
                self.props["min"] is None
                or candidate >= self.props["min"]
            )
            and (
                self.props["max"] is None
                or candidate <= self.props["max"]
            )
        )

    def decode(self, value: Any) -> Number:
        return int(value) if self.props["integer"] else float(value)


def _number_input_config(
    label: str,
    value: Number,
    min_value: Optional[Number],
    max_value: Optional[Number],
    step: Optional[Number],
    disabled: bool,
) -> _NumberInputConfig:
    label = validate_text(label, "label")
    numbers = {"value": value}
    for name, candidate in (
        ("min_value", min_value),
        ("max_value", max_value),
        ("step", step),
    ):
        if candidate is not None:
            numbers[name] = candidate
    for name, candidate in numbers.items():
        if isinstance(candidate, bool) or not isinstance(candidate, (int, float)):
            raise TypeError("%s must be an int or float." % name)
        if not _safe_number(candidate):
            raise ValueError(
                "%s must be finite and between -%d and %d."
                % (name, _MAX_SAFE_NUMBER, _MAX_SAFE_NUMBER)
            )
    if min_value is not None and max_value is not None and min_value > max_value:
        raise ValueError("max_value must be greater than or equal to min_value.")
    integer = all(isinstance(candidate, int) for candidate in numbers.values())
    resolved_step = step if step is not None else (1 if integer else 0.01)
    if resolved_step <= 0:
        raise ValueError("step must be positive.")
    config = _NumberInputConfig(
        value=int(value) if integer else float(value),
        props={
            "label": label,
            "min": min_value,
            "max": max_value,
            "step": resolved_step,
            "integer": integer,
            "disabled": boolean(disabled, "disabled"),
        },
    )
    if not config.valid(value):
        raise ValueError("value must be within min_value and max_value.")
    return config


def number_input(
    label: str,
    value: Number = 0,
    *,
    min_value: Optional[Number] = None,
    max_value: Optional[Number] = None,
    step: Optional[Number] = None,
    key: Optional[str] = None,
    disabled: bool = False,
    on_change: Optional[Callable[[], None]] = None,
    width: Union[str, int] = "stretch",
) -> Number:
    """Render a numeric input with decrement and increment buttons.

    All-integer arguments select integer mode; any float selects float mode.
    The default step is 1 for integers and 0.01 for floats. Typing commits on
    Enter or blur. Empty, invalid, or fractional integer drafts restore the
    last committed value; valid out-of-range drafts clamp to the bounds.
    Values, bounds, and step must be finite and within JavaScript's safe
    numeric range, +/- (2**53 - 1). ``value=None`` is not supported.
    """
    config = _number_input_config(
        label, value, min_value, max_value, step, disabled
    )
    current = mount_stateful(
        key=key,
        kind="number_input",
        default_value=config.value,
        is_valid_value=config.valid,
        props=config.props,
        width=width,
        on_change=on_change,
    )
    return config.decode(current)
