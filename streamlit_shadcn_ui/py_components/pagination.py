from .utils import declare_component

_component_func = declare_component("pagination")

def pagination(key=None,totalPages=3,initialPage=1,siblingCount=1):
    """
    Pagination component for navigating through multiple pages.
    
    Args:
        key: Unique identifier for the component
        totalPages: Total number of pages (default: 3)
        initialPage: Initial page to display (default: 1)
        siblingCount: Number of page buttons to show on each side of the active page (default: 1)
                     This helps limit the number of visible page buttons for large page counts.
                     Example with siblingCount=1 on page 50: "1 ... 49 50 51 ... 100"
    
    Returns:
        The current active page number
    """
    totalPages = max(1, int(totalPages))
    siblingCount = max(0, int(siblingCount))
    initialPage = min(totalPages, max(1, int(initialPage)))

    props = {
        "totalPages": totalPages,
        "initialPage": initialPage,
        "siblingCount": siblingCount
    }
    component_value = _component_func(comp="pagination",props=props,key=key)
    return component_value
