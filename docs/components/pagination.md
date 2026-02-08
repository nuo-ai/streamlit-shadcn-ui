### Basic Usage

```py
import streamlit as st
import streamlit_shadcn_ui as ui

page_value = ui.pagination(key="pagination1",totalPages=10,initialPage=1)

st.write(page_value)
```

### Parameters

- `key` (str, optional): Unique identifier for the component
- `totalPages` (int, default=3): Total number of pages
- `initialPage` (int, default=1): Initial page to display
- `siblingCount` (int, default=1): Number of page buttons to show on each side of the active page. This helps limit the number of visible page buttons for large page counts.

### Example with Large Page Count

For pagination with many pages (e.g., 100+), use `siblingCount` to limit the number of visible page buttons:

```py
import streamlit as st
import streamlit_shadcn_ui as ui

# With siblingCount=1 (default), on page 50 it shows: 1 ... 49 50 51 ... 100
page_value = ui.pagination(
    key="pagination2",
    totalPages=100,
    initialPage=1,
    siblingCount=1
)

st.write(f"Current page: {page_value}")

# With siblingCount=2, on page 50 it shows: 1 ... 48 49 50 51 52 ... 100
page_value2 = ui.pagination(
    key="pagination3",
    totalPages=100,
    initialPage=1,
    siblingCount=2
)

st.write(f"Current page: {page_value2}")
```
