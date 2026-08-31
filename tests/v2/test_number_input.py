from __future__ import annotations

import importlib
import unittest
from unittest.mock import patch

import streamlit_shadcn_ui as ui
from streamlit_shadcn_ui.v2 import _protocol


common = importlib.import_module("streamlit_shadcn_ui.v2.widgets._common")
elements = importlib.import_module("streamlit_shadcn_ui.v2.elements")


class NumberInputTests(unittest.TestCase):
    def setUp(self) -> None:
        self.runtime = type("Runtime", (), {"session_state": {}})()
        self.runtime_patch = patch.object(
            _protocol, "require_v2_runtime", return_value=self.runtime
        )
        self.runtime_patch.start()
        self.addCleanup(self.runtime_patch.stop)
        self.mounted = {}
        self.mount_patch = patch.object(
            common, "mount", side_effect=lambda **kwargs: self.mounted.update(kwargs)
        )
        self.mount_patch.start()
        self.addCleanup(self.mount_patch.stop)

    def test_integer_and_float_modes_have_numeric_returns_and_default_steps(self):
        for kwargs, expected_type, expected_step in [
            ({}, int, 1),
            ({"value": -2}, int, 1),
            ({"value": 0.5}, float, 0.01),
            ({"value": 1, "step": 0.1}, float, 0.1),
            ({"min_value": -0.5}, float, 0.01),
            ({"max_value": 0.5}, float, 0.01),
        ]:
            with self.subTest(kwargs=kwargs):
                self.runtime.session_state.clear()
                result = ui.number_input("Amount", key="amount", **kwargs)
                self.assertIs(type(result), expected_type)
                self.assertEqual(result, kwargs.get("value", 0))
                data = self.mounted["data"]
                self.assertEqual(data["kind"], "number_input")
                self.assertEqual(data["props"]["step"], expected_step)
                self.assertIs(data["props"]["integer"], expected_type is int)

    def test_invalid_arguments_fail_before_mount(self):
        invalid = [
            {"value": True}, {"value": "1"}, {"value": None},
            {"value": float("nan")}, {"value": float("inf")},
            {"value": 2**53}, {"value": 10**1000},
            {"min_value": False}, {"max_value": float("inf")},
            {"min_value": 1}, {"max_value": -1},
            {"min_value": 2, "max_value": 1},
            {"step": 0}, {"step": -1}, {"step": True},
            {"step": float("nan")}, {"step": 2**53},
            {"disabled": "yes"},
        ]
        for kwargs in invalid:
            with self.subTest(kwargs=kwargs):
                with self.assertRaises((TypeError, ValueError)):
                    ui.number_input("Amount", **kwargs)
                self.assertEqual(self.mounted, {})

    def test_equal_bounds_large_steps_and_unbounded_values_are_supported(self):
        for kwargs in [
            {"min_value": 0, "max_value": 0},
            {"min_value": 0, "max_value": 1, "step": 100},
            {"value": -(2**53 - 1)},
            {"value": 2**53 - 1},
            {"value": 0.0, "step": 1e-20},
        ]:
            with self.subTest(kwargs=kwargs):
                self.runtime.session_state.clear()
                self.assertEqual(ui.number_input("Amount", **kwargs), kwargs.get("value", 0))

    def test_persisted_state_and_callback_use_the_existing_v2_contract(self):
        callback = lambda: None
        ui.number_input("Quantity", value=1, key="quantity", on_change=callback)
        key = self.mounted["key"]
        self.assertNotEqual(key, "quantity")
        self.assertIs(self.mounted["callbacks"]["on_state_change"], callback)
        self.runtime.session_state[key] = {
            "meta": self.mounted["default"]["meta"],
            "state": {
                **self.mounted["default"]["state"],
                "value": 4.0,
                "clientRevision": 1,
            },
        }
        result = ui.number_input("Quantity", value=1, key="quantity")
        self.assertEqual(result, 4)
        self.assertIs(type(result), int)
        self.assertEqual(self.mounted["data"]["state"]["clientRevision"], 1)

    def test_invalid_persisted_numbers_reset_instead_of_truncating(self):
        for candidate in [1.5, True, "2", None, float("nan"), float("inf"), 20, 2**53]:
            with self.subTest(candidate=candidate):
                self.runtime.session_state.clear()
                ui.number_input("Quantity", value=2, max_value=10, key="quantity")
                key = self.mounted["key"]
                self.runtime.session_state[key] = {
                    "meta": self.mounted["default"]["meta"],
                    "state": {
                        **self.mounted["default"]["state"],
                        "value": candidate,
                        "clientRevision": 1,
                    },
                }
                self.assertEqual(
                    ui.number_input("Quantity", value=2, max_value=10, key="quantity"),
                    2,
                )
                self.assertEqual(self.mounted["data"]["state"]["serverRevision"], 1)

    def test_elements_reuses_numeric_validation_and_decodes_typed_handles(self):
        captured = {}

        def prepare(**kwargs):
            self.assertFalse(kwargs["validators"]["quantity"](1.5))
            self.assertFalse(kwargs["validators"]["ratio"](float("nan")))
            return {
                "kind": "elements",
                "value": {
                    "nodes": {
                        node_id: {
                            "kind": "number_input",
                            "value": 4.0 if node_id == "quantity" else 0.3,
                            "clientRevision": 1,
                            "serverRevision": 0,
                            "changeSequence": 0,
                        }
                        for node_id in kwargs["node_defaults"]
                    },
                    "sequence": 0,
                },
                "clientRevision": 0,
                "serverRevision": 0,
            }

        with patch.object(elements, "prepare_elements_state", side_effect=prepare), patch.object(
            elements, "mount", side_effect=lambda **kwargs: captured.update(kwargs) or {}
        ):
            with ui.elements(key="settings") as el:
                quantity = el.number_input("Quantity", key="quantity")
                ratio = el.number_input("Ratio", value=0.0, step=0.1, key="ratio")
        self.assertIs(type(quantity.value), int)
        self.assertEqual(quantity.value, 4)
        self.assertIs(type(ratio.value), float)
        self.assertEqual(ratio.value, 0.3)
        self.assertEqual(
            [node["type"] for node in captured["data"]["props"]["nodes"]],
            ["number_input", "number_input"],
        )


if __name__ == "__main__":
    unittest.main()
