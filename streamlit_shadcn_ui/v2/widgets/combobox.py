from __future__ import annotations

from collections.abc import Iterable, Sequence
from typing import Any, Callable, Optional, TypeVar, Union

from .._protocol import validate_text
from ._common import (
    boolean,
    enum_value,
    mount_stateful,
    normalize_choices,
    token_for_value,
)


T = TypeVar("T")


def _combobox_config(
    options: Iterable[T],
    value: Any,
    format_func: Callable[[T], str],
    selection_mode: str,
) -> tuple[list[dict[str, Any]], dict[str, T], Any, Callable[[Any], bool]]:
    choices, values_by_token = normalize_choices(options, format_func)
    mode = enum_value(
        selection_mode,
        {"single", "multiple"},
        "selection_mode",
    )
    allowed_tokens = set(values_by_token)

    if mode == "single":
        initial = (
            None
            if value is None
            else token_for_value(value, choices, values_by_token, "value")
        )
        validator = lambda candidate: (
            candidate is None or candidate in allowed_tokens
        )
        return choices, values_by_token, initial, validator

    if value is None:
        values: list[T] = []
    else:
        if isinstance(value, (str, bytes)) or not isinstance(value, Sequence):
            raise TypeError(
                "value must be a sequence in multiple selection mode."
            )
        values = list(value)
    initial = [
        token_for_value(item, choices, values_by_token, "value")
        for item in values
    ]
    if len(set(initial)) != len(initial):
        raise ValueError("value entries must be unique.")
    def validator(candidate: Any) -> bool:
        return (
            isinstance(candidate, list)
            and all(isinstance(token, str) for token in candidate)
            and len(candidate) == len(set(candidate))
            and all(token in allowed_tokens for token in candidate)
        )

    return choices, values_by_token, initial, validator


def combobox(
    label: str,
    options: Iterable[T],
    *,
    value: Any = None,
    format_func: Callable[[T], str] = str,
    key: Optional[str] = None,
    placeholder: str = "Select an option",
    empty_message: str = "No options found.",
    selection_mode: str = "single",
    clearable: bool = True,
    disabled: bool = False,
    on_change: Optional[Callable[[], None]] = None,
    width: Union[str, int] = "stretch",
) -> Any:
    """Render a locally filtered shadcn Combobox.

    Typing filters the serialized options in the browser. Python reruns only
    after the selection changes.
    """

    label = validate_text(label, "label")
    placeholder = validate_text(placeholder, "placeholder")
    empty_message = validate_text(empty_message, "empty_message")
    mode = enum_value(
        selection_mode,
        {"single", "multiple"},
        "selection_mode",
    )
    choices, values_by_token, initial, validator = _combobox_config(
        options,
        value,
        format_func,
        mode,
    )
    selected = mount_stateful(
        key=key,
        kind="combobox",
        default_value=initial,
        is_valid_value=validator,
        props={
            "clearable": boolean(clearable, "clearable"),
            "disabled": boolean(disabled, "disabled"),
            "emptyMessage": empty_message,
            "label": label,
            "options": choices,
            "placeholder": placeholder,
            "selectionMode": mode,
        },
        width=width,
        on_change=on_change,
    )
    if mode == "single":
        return None if selected is None else values_by_token[selected]
    return [values_by_token[token] for token in selected]


__all__ = ["combobox"]
