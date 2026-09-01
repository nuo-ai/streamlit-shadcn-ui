import streamlit as st

import streamlit_shadcn_ui as ui


st.set_page_config(
    page_title="Streamlit Shadcn UI · P0 Foundations",
    page_icon="🧱",
    layout="wide",
)

st.title("Streamlit Shadcn UI · P0 Foundations")
st.caption(
    "Button Group, Combobox, Dialog, Empty, Field, Input Group, Spinner, "
    "and Tooltip using the pinned shadcn Base UI source."
)

st.session_state["p0_runs"] = st.session_state.get("p0_runs", 0) + 1
st.caption("Python run count: %d" % st.session_state["p0_runs"])
st.button("Unrelated Streamlit rerun", key="p0-unrelated-rerun")

with st.sidebar:
    st.header("Sidebar placement")
    sidebar_release = ui.combobox(
        "Sidebar release",
        ["Stable", "Beta", "Canary"],
        value="Stable",
        key="p0-sidebar-release",
    )
    st.write("Sidebar value:", sidebar_release)

st.subheader("Standalone controls in columns")
combobox_column, input_group_column = st.columns(2)
with combobox_column:
    release = ui.combobox(
        "Release channel",
        ["Stable", "Beta", "Canary"],
        value="Stable",
        key="p0-release",
        placeholder="Search release channels",
        empty_message="No release channels found.",
    )
    topics = ui.combobox(
        "Release topics",
        ["Components", "Elements", "Theming", "Deployment"],
        value=["Components"],
        key="p0-topics",
        selection_mode="multiple",
    )
    st.write("Release value:", release)
    st.write("Topic values:", topics)

with input_group_column:
    website = ui.input_group(
        "Project website",
        "docs.example.com",
        key="p0-project-website",
        type="url",
        prefix="https://",
        suffix="public",
        start_icon="link",
        clearable=True,
        copyable=True,
        max_length=64,
    )
    st.write("Website value:", website)
    ui.button(
        "Publishing",
        key="p0-publishing",
        loading=True,
        help="The publish action is still running.",
    )

catalog_tab, placement_tab = st.tabs(["P0 composition", "Tab placement"])

with catalog_tab:
    with ui.elements(key="p0-elements") as el:
        with el.button_group("Editor actions", key="editor-actions"):
            previous = el.button("Previous", key="previous", variant="outline")
            el.button_group_separator()
            el.button_group_text("Draft 2 of 5")
            el.button_group_separator()
            next_draft = el.button("Next", key="next", variant="outline")

        with el.tooltip("Runs the current release", side="top"):
            tooltip_run = el.button("Run release", key="tooltip-run")
        with el.tooltip(
            "Unavailable while publishing",
            key="disabled-tooltip",
            side="bottom",
        ):
            el.button("Disabled action", key="disabled-action", disabled=True)

        with el.dialog(
            "Edit release",
            key="release-dialog",
            description="Review the release details before closing.",
            trigger_label="Open release dialog",
        ):
            dialog_name = el.input(
                "Release name",
                "Aurora",
                key="release-name",
            )
            el.text(
                "Rerun inside dialog keeps the local open state.",
                variant="muted",
            )
            with el.dialog_footer():
                dialog_rerun = el.button(
                    "Rerun inside dialog",
                    key="dialog-rerun",
                )
                dialog_close = el.dialog_close_button(
                    "Close dialog",
                    key="dialog-close",
                )

        with el.empty(key="empty-results"):
            with el.empty_header():
                with el.empty_media(variant="icon"):
                    el.spinner(label="Checking search index")
                el.empty_title("No matching components")
                el.empty_description("Try a broader query.")
            with el.empty_content():
                empty_reset = el.button("Clear filters", key="clear-filters")

        with el.field_set(
            "Profile",
            key="profile-fields",
            description="Details shown on the public profile.",
        ):
            with el.field_group():
                with el.field(
                    "Website",
                    description="Use a public URL.",
                    error="Example validation message.",
                ):
                    field_website = el.input_group(
                        "Website",
                        "example.com",
                        key="field-website",
                        prefix="https://",
                        start_icon="link",
                        clearable=True,
                    )
                el.field_separator("Preferences")
                with el.field(
                    "Field release",
                    description="Search before selecting.",
                ):
                    field_release = el.combobox(
                        "Field release",
                        ["Stable", "Beta", "Canary"],
                        key="field-release",
                        value="Stable",
                    )
                with el.field(
                    "Security alerts",
                    description="Receive important account notices.",
                    orientation="horizontal",
                ):
                    field_alerts = el.checkbox(
                        "Security alerts",
                        key="field-alerts",
                        value=True,
                    )

        el.spinner(label="Loading release metadata")

    st.write(
        "Elements values:",
        {
            "dialog_name": dialog_name.value,
            "field_alerts": field_alerts.value,
            "field_release": field_release.value,
            "field_website": field_website.value,
        },
    )
    st.caption(
        "Elements actions: previous=%s, next=%s, tooltip=%s, rerun=%s, "
        "close=%s, reset=%s"
        % (
            previous.clicked,
            next_draft.clicked,
            tooltip_run.clicked,
            dialog_rerun.clicked,
            dialog_close.clicked,
            empty_reset.clicked,
        )
    )

with placement_tab:
    st.caption("Combobox and Input Group inside a Streamlit tab.")
    tab_columns = st.columns(2)
    with tab_columns[0]:
        with st.container(height=220):
            for row in range(4):
                st.caption("Bounded row %d" % (row + 1))
            bounded_release = ui.combobox(
                "Bounded release",
                ["Stable", "Beta", "Canary", "Nightly"],
                value="Stable",
                key="p0-bounded-release",
            )
            st.write("Bounded value:", bounded_release)
    with tab_columns[1]:
        tab_email = ui.input_group(
            "Tab email",
            "team@example.com",
            key="p0-tab-email",
            type="email",
            start_icon="mail",
            clearable=True,
            copyable=True,
        )
        st.write("Tab email value:", tab_email)

st.status(
    "P0 fixture: eight components, local and committed state, overlays, "
    "focus, reruns, sidebar, columns, tabs, and bounded placement.",
    state="complete",
)
