# Changelog

## 1.2.0 - 2026-08-31

### Added

- `ui.number_input` and `el.number_input` with direct numeric entry and
  decrement/increment buttons, addressing [#55](https://github.com/ObservedObserver/streamlit-shadcn-ui/issues/55).
- Integer and float return values, optional inclusive bounds, configurable
  steps, disabled state, and callbacks using the existing V2 state protocol.
- Decimal step arithmetic, keyboard controls, and 44 px touch targets.
- A Number Input documentation page with quantity, fractional, negative,
  disabled, and nested Elements examples.

### Behavior

- Typing commits on Enter or blur. Invalid or empty drafts restore the last
  committed value; valid out-of-range input clamps to the configured bounds.
- The new component composes the existing generated shadcn Input and Button.
  Runtime dependencies and the pinned upstream registry snapshot are unchanged.
- Existing public APIs keep their signatures and behavior.

Full details: [Number Input 1.2.0 release notes](docs/releases/1.2.0.md).

## 1.1.0 - 2026-08-09

### Added

- `ui.elements`, a typed Python context API that builds one nested shadcn
  React tree in one Streamlit Components V2 mount.
- Stable keyed identity for inserted, removed, reordered, and reset child
  nodes.
- Aggregate value handles, ordered value callbacks, and batched transient
  action callbacks through `ElementHandle` and `ElementEvent`.
- Typed Card, layout, content, value, and action nodes for the initial
  Elements catalog.
- An independent `Use Cases > V2 Elements` documentation page reproducing
  the shadcn Notification Settings and Transfer Funds cards.

### Changed

- The public package catalog and compatibility matrix now include Elements.
- The documentation router keeps the product homepage as the default route
  and mounts the Elements acceptance case at `/Elements`.

### Known boundaries

- Elements trees contain library-owned React nodes only; native Streamlit
  elements remain outside the component boundary.
- Action nodes are rejected inside `st.form` because Streamlit does not
  currently deliver custom-component trigger values there.
- The first Elements catalog intentionally excludes overlays, arbitrary JSX,
  raw HTML, arbitrary CSS classes, and user-defined React components.

Full details: [Elements 1.1.0 release notes](docs/releases/1.1.0.md).
