from __future__ import annotations

from typing import Callable, Optional, Union

from .._protocol import validate_text
from ._common import (
    boolean,
    enum_value,
    mount_stateful,
    optional_text,
    utf16_length,
)


_INPUT_GROUP_ICONS = {
    "at-sign",
    "dollar-sign",
    "link",
    "mail",
    "search",
}


def _input_group_props(
    label: str,
    *,
    type: str,
    placeholder: Optional[str],
    prefix: Optional[str],
    suffix: Optional[str],
    start_icon: Optional[str],
    clearable: bool,
    copyable: bool,
    disabled: bool,
    max_length: Optional[int],
) -> dict:
    if max_length is not None and (
        isinstance(max_length, bool)
        or not isinstance(max_length, int)
        or not 1 <= max_length <= 16 * 1024
    ):
        raise ValueError("max_length must be between 1 and 16,384.")
    return {
        "clearable": boolean(clearable, "clearable"),
        "copyable": boolean(copyable, "copyable"),
        "disabled": boolean(disabled, "disabled"),
        "label": validate_text(label, "label"),
        "maxLength": max_length,
        "placeholder": validate_text(placeholder or "", "placeholder"),
        "prefix": optional_text(prefix, "prefix"),
        "startIcon": (
            None
            if start_icon is None
            else enum_value(start_icon, _INPUT_GROUP_ICONS, "start_icon")
        ),
        "suffix": optional_text(suffix, "suffix"),
        "type": enum_value(
            type,
            {"text", "email", "password", "search", "tel", "url"},
            "type",
        ),
    }


def input_group(
    label: str,
    value: str = "",
    *,
    key: Optional[str] = None,
    type: str = "text",
    placeholder: Optional[str] = None,
    prefix: Optional[str] = None,
    suffix: Optional[str] = None,
    start_icon: Optional[str] = None,
    clearable: bool = False,
    copyable: bool = False,
    disabled: bool = False,
    max_length: Optional[int] = None,
    on_change: Optional[Callable[[], None]] = None,
    width: Union[str, int] = "stretch",
) -> str:
    """Render a shadcn Input Group with serializable addons."""

    value = validate_text(value, "value")
    props = _input_group_props(
        label,
        type=type,
        placeholder=placeholder,
        prefix=prefix,
        suffix=suffix,
        start_icon=start_icon,
        clearable=clearable,
        copyable=copyable,
        disabled=disabled,
        max_length=max_length,
    )
    if max_length is not None and utf16_length(value) > max_length:
        raise ValueError("value exceeds max_length.")
    selected = mount_stateful(
        key=key,
        kind="input_group",
        default_value=value,
        is_valid_value=lambda candidate: (
            isinstance(candidate, str)
            and len(candidate.encode("utf-8")) <= 16 * 1024
            and (
                max_length is None
                or utf16_length(candidate) <= max_length
            )
        ),
        props=props,
        width=width,
        on_change=on_change,
    )
    return str(selected)


__all__ = ["input_group"]
