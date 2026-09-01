import {
  expect,
  test,
  type Locator,
  type Page,
} from "@playwright/test"
import axe from "axe-core"

type BrowserDiagnostics = {
  consoleMessages: string[]
  pageErrors: string[]
}

function collectDiagnostics(page: Page): BrowserDiagnostics {
  const diagnostics: BrowserDiagnostics = {
    consoleMessages: [],
    pageErrors: [],
  }
  page.on("console", (message) => {
    if (
      message.type() === "warning" &&
      message.text().includes(
        "This site appears to use a scroll-linked positioning effect"
      )
    ) {
      return
    }
    if (message.type() === "error" || message.type() === "warning") {
      diagnostics.consoleMessages.push(
        `${message.type()}: ${message.text()}`
      )
    }
  })
  page.on("pageerror", (error) => {
    diagnostics.pageErrors.push(error.message)
  })
  return diagnostics
}

async function openAcceptanceApp(page: Page) {
  await page.goto("/")
  await expect(
    page.getByRole("heading", {
      name: "Streamlit Shadcn UI · P0 Foundations",
    })
  ).toBeVisible({ timeout: 60_000 })
  await expect(page.getByTestId("ssui-v2-elements")).toHaveCount(1)
  await expect(page.locator("iframe")).toHaveCount(0)
}

async function componentIsolationState(page: Page) {
  return page.evaluate(() => {
    const hosts = [...document.querySelectorAll<HTMLElement>("*")].filter(
      (element) =>
        element.shadowRoot?.querySelector(
          "[data-ssui-v2-app-root]"
        ) != null
    )
    const kinds = hosts.flatMap((host) =>
      [
        ...(host.shadowRoot?.querySelectorAll<HTMLElement>(
          "[data-ssui-component]"
        ) ?? []),
      ].map((component) =>
        component.getAttribute("data-ssui-component")
      )
    )
    return {
      bodyComponents: document.body.querySelectorAll(
        "[data-ssui-component]"
      ).length,
      hostCount: hosts.length,
      invalidRoots: hosts.filter((host) => {
        const root = host.shadowRoot
        return (
          root === null ||
          root.querySelectorAll("[data-ssui-v2-app-root]").length !== 1 ||
          root.querySelectorAll("[data-ssui-v2-overlay-root]").length !== 1 ||
          root.querySelectorAll("style").length !== 1 ||
          root.querySelectorAll("link[rel='stylesheet']").length !== 0
        )
      }).length,
      kinds: [...new Set(kinds)].sort(),
    }
  })
}

async function overlayContract(trigger: Locator, popupSlot: string) {
  return trigger.evaluate((element, slot) => {
    const root = element.getRootNode()
    if (!(root instanceof ShadowRoot)) {
      return { error: "trigger is not in a ShadowRoot" }
    }
    const overlay = root.querySelector<HTMLElement>(
      "[data-ssui-v2-overlay-root]"
    )
    const popup = root.querySelector<HTMLElement>(
      `[data-slot='${slot}'][data-open]`
    )
    if (!overlay || !popup) {
      return { error: "overlay or popup missing" }
    }
    const rect = popup.getBoundingClientRect()
    return {
      bottom: rect.bottom,
      documentHitIsHost:
        document.elementFromPoint(
          rect.left + Math.min(12, rect.width / 2),
          rect.top + Math.min(20, rect.height / 2)
        ) === root.host,
      error: null,
      left: rect.left,
      overlayOpen: overlay.matches(":popover-open"),
      overlayOwnsPopup: overlay.contains(popup),
      popupRootIsExpected: popup.getRootNode() === root,
      right: rect.right,
      top: rect.top,
      viewportHeight: window.innerHeight,
      viewportWidth: window.innerWidth,
    }
  }, popupSlot)
}

async function expectOpenOverlayContract(
  trigger: Locator,
  popupSlot: string
) {
  await expect
    .poll(() => overlayContract(trigger, popupSlot))
    .toMatchObject({
      documentHitIsHost: true,
      error: null,
      overlayOpen: true,
      overlayOwnsPopup: true,
      popupRootIsExpected: true,
    })
}

async function dialogContract(content: Locator) {
  return content.evaluate((element) => {
    const root = element.getRootNode()
    if (!(root instanceof ShadowRoot)) {
      return { error: "content is not in a ShadowRoot" }
    }
    const overlay = root.querySelector<HTMLElement>(
      "[data-ssui-v2-overlay-root]"
    )
    const backdrop = root.querySelector<HTMLElement>(
      "[data-slot='dialog-overlay'][data-open]"
    )
    return {
      backdropRootIsExpected: backdrop?.getRootNode() === root,
      error: overlay && backdrop ? null : "overlay or backdrop missing",
      overlayOpen: overlay?.matches(":popover-open") ?? false,
      overlayOwnsContent: overlay?.contains(element) ?? false,
      portalRootIsExpected:
        element.closest("[data-slot='dialog-portal']")?.getRootNode() === root,
    }
  })
}

async function seriousAccessibilityViolations(page: Page) {
  await page.addScriptTag({ content: axe.source })
  return page.evaluate(async () => {
    const axeRuntime = (
      globalThis as typeof globalThis & {
        axe: {
          run: (
            context: Node,
            options: unknown
          ) => Promise<{
            violations: Array<{
              help: string
              id: string
              impact: string | null
              nodes: Array<{ html: string; target: unknown[] }>
            }>
          }>
        }
      }
    ).axe
    const violations = []
    const roots = [...document.querySelectorAll("*")]
      .map((element) => element.shadowRoot)
      .filter(
        (root): root is ShadowRoot =>
          root !== null &&
          root.querySelector("[data-ssui-v2-app-root]") !== null
      )

    for (const [index, root] of roots.entries()) {
      const result = await axeRuntime.run(root, {
        resultTypes: ["violations"],
      })
      for (const violation of result.violations) {
        if (
          violation.impact === "critical" ||
          violation.impact === "serious"
        ) {
          violations.push({
            help: violation.help,
            id: violation.id,
            impact: violation.impact,
            nodes: violation.nodes,
            scope: `shadow-${index}`,
          })
        }
      }
    }
    return violations
  })
}

test("P0 catalog renders from isolated generated-source roots", async ({
  page,
}) => {
  const diagnostics = collectDiagnostics(page)
  await openAcceptanceApp(page)

  await expect(page.getByTestId("ssui-v2-combobox")).toHaveCount(4)
  await expect(page.getByTestId("ssui-v2-input-group")).toHaveCount(2)
  await expect(page.getByTestId("ssui-v2-dialog")).toHaveCount(1)
  await expect(page.getByTestId("ssui-v2-field")).toHaveCount(3)
  await expect(
    page.getByRole("group", { name: "Editor actions" })
  ).toBeVisible()
  await expect(page.getByText("No matching components")).toBeVisible()
  await expect(
    page.getByRole("status", { name: "Loading release metadata" })
  ).toBeVisible()

  const isolation = await componentIsolationState(page)
  expect(isolation.bodyComponents).toBe(0)
  expect(isolation.hostCount).toBe(8)
  expect(isolation.invalidRoots).toBe(0)
  expect(isolation.kinds).toEqual([
    "combobox",
    "dialog",
    "elements",
    "field",
    "input-group",
    "button",
  ].sort())

  const metrics = await page
    .getByRole("button", { name: "Previous" })
    .evaluate((element) => {
      const group = element.closest("[data-slot='button-group']")
      const inputGroup = element
        .getRootNode()
        .querySelector<HTMLElement>("[data-slot='input-group']")
      return {
        buttonHeight: element.getBoundingClientRect().height,
        groupSlot: group?.getAttribute("data-slot"),
        inputGroupHeight: inputGroup?.getBoundingClientRect().height,
      }
    })
  expect(metrics).toEqual({
    buttonHeight: 32,
    groupSlot: "button-group",
    inputGroupHeight: 32,
  })
  expect(await seriousAccessibilityViolations(page)).toEqual([])
  expect(diagnostics).toEqual({ consoleMessages: [], pageErrors: [] })
})

test("Combobox filters locally and Input Group commits deliberately", async ({
  browserName,
  context,
  page,
}) => {
  const diagnostics = collectDiagnostics(page)
  if (browserName === "chromium") {
    await context.grantPermissions(["clipboard-read", "clipboard-write"])
  }
  await openAcceptanceApp(page)
  const runCount = page.getByText(/Python run count:/)
  await expect(runCount).toHaveText("Python run count: 1")

  const release = page.getByRole("combobox", {
    name: "Release channel",
  })
  await release.click()
  await release.fill("Bet")
  await expect(runCount).toHaveText("Python run count: 1")
  await expect(page.getByRole("option", { name: "Beta" })).toBeVisible()
  await expectOpenOverlayContract(release, "combobox-content")
  await page.getByRole("option", { name: "Beta" }).click()
  await expect(page.getByText("Release value: Beta")).toBeVisible()
  await expect(runCount).toHaveText("Python run count: 2")
  await expect(release).toHaveValue("Beta")

  const topics = page.getByRole("combobox", { name: "Release topics" })
  await topics.fill("Deploy")
  await expect(runCount).toHaveText("Python run count: 2")
  await page.getByRole("option", { name: "Deployment" }).click()
  await expect(
    page.getByRole("button", { name: "Remove Deployment" })
  ).toBeVisible()
  await expect(runCount).toHaveText("Python run count: 3")

  const website = page.getByRole("textbox", { name: "Project website" })
  await website.fill("new.example.com")
  await expect(page.getByText("Website value: docs.example.com")).toBeVisible()
  await expect(runCount).toHaveText("Python run count: 3")
  await page.getByRole("button", { name: "Copy value" }).first().click()
  await expect(runCount).toHaveText("Python run count: 3")
  if (browserName === "chromium") {
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
      "new.example.com"
    )
  }
  await website.press("Enter")
  await expect(page.getByText("Website value: new.example.com")).toBeVisible()
  await expect(runCount).toHaveText("Python run count: 4")

  await page.getByRole("button", { name: "Clear value" }).first().click()
  await expect(page.getByText("Website value:", { exact: true })).toBeVisible()
  await expect(runCount).toHaveText("Python run count: 5")
  expect(diagnostics).toEqual({ consoleMessages: [], pageErrors: [] })
})

test("Elements overlays, focus, actions, and reruns stay coherent", async ({
  page,
}) => {
  const diagnostics = collectDiagnostics(page)
  await openAcceptanceApp(page)

  const website = page
    .getByTestId("ssui-v2-elements")
    .getByRole("textbox", { name: "Website" })
  await expect(website).toHaveAttribute("aria-invalid", "true")
  await expect(website).toHaveAttribute("aria-describedby", /description/)
  await expect(website).toHaveAttribute("aria-describedby", /error/)
  await expect(
    page.getByRole("checkbox", { name: "Security alerts" })
  ).toBeChecked()

  const tooltipTrigger = page.getByRole("button", { name: "Run release" })
  await tooltipTrigger.hover()
  await expect(page.getByText("Runs the current release")).toBeVisible()
  await expectOpenOverlayContract(tooltipTrigger, "tooltip-content")
  await page.keyboard.press("Escape")
  await page.mouse.move(0, 0)
  await expect(page.getByText("Runs the current release")).toBeHidden()
  await page.getByRole("button", { name: "Previous" }).focus()
  await page.keyboard.press("Tab")
  await expect(page.getByRole("button", { name: "Next" })).toBeFocused()
  await page.keyboard.press("Tab")
  await expect(tooltipTrigger).toBeFocused()
  await expect(page.getByText("Runs the current release")).toBeVisible()

  const disabledTooltipTrigger = page
    .locator("[data-slot='tooltip-trigger']")
    .filter({ hasText: "Disabled action" })
  await page.keyboard.press("Escape")
  await page.keyboard.press("Tab")
  await expect(disabledTooltipTrigger).toBeFocused()
  await expect(page.getByText("Unavailable while publishing")).toBeVisible()
  await page.keyboard.press("Escape")

  const dialogTrigger = page.getByRole("button", {
    name: "Open release dialog",
  })
  await dialogTrigger.click()
  const dialog = page.getByRole("dialog")
  await expect(dialog).toBeVisible()
  await expect(
    page.getByRole("heading", { name: "Edit release" })
  ).toBeVisible()
  await expect.poll(() => dialogContract(dialog)).toEqual({
    backdropRootIsExpected: true,
    error: null,
    overlayOpen: true,
    overlayOwnsContent: true,
    portalRootIsExpected: true,
  })
  await expect
    .poll(() =>
      dialog.evaluate((element) => {
        let active: Element | null = document.activeElement
        while (
          active instanceof HTMLElement &&
          active.shadowRoot?.activeElement
        ) {
          active = active.shadowRoot.activeElement
        }
        return active !== null && element.contains(active)
      })
    )
    .toBe(true)

  const beforeRerun = await page.getByText(/Python run count:/).textContent()
  await page.getByRole("button", { name: "Rerun inside dialog" }).click()
  await expect(dialog).toBeVisible()
  await expect(page.getByText(/Python run count:/)).not.toHaveText(
    beforeRerun ?? ""
  )
  await expect(page.getByText(/Elements actions:/)).toContainText(
    "rerun=True"
  )

  await page.getByRole("button", { name: "Close dialog" }).click()
  await expect(dialog).toBeHidden()
  await expect(dialogTrigger).toBeFocused()

  await page.getByRole("button", { name: "Previous" }).click()
  await expect(page.getByText(/Elements actions:/)).toContainText(
    "previous=True"
  )
  await page.getByRole("button", { name: "Clear filters" }).click()
  await expect(page.getByText(/Elements actions:/)).toContainText("reset=True")
  expect(diagnostics).toEqual({ consoleMessages: [], pageErrors: [] })
})

test("mobile RTL, tabs, sidebar, bounded placement, and 200% metrics work", async ({
  browser,
}) => {
  const context = await browser.newContext({
    deviceScaleFactor: 2,
    viewport: { width: 390, height: 844 },
  })
  const page = await context.newPage()
  const diagnostics = collectDiagnostics(page)
  await openAcceptanceApp(page)
  await page.evaluate(() => {
    document.documentElement.dir = "rtl"
    document.documentElement.style.fontSize = "32px"
    for (const element of document.querySelectorAll<HTMLElement>("*")) {
      if (
        element.shadowRoot?.querySelector("[data-ssui-v2-app-root]")
      ) {
        element.dir = "rtl"
      }
    }
  })
  await page.getByRole("button", {
    name: "Unrelated Streamlit rerun",
  }).click()
  await page.evaluate(() => {
    document.documentElement.dir = "rtl"
    for (const element of document.querySelectorAll<HTMLElement>("*")) {
      if (
        element.shadowRoot?.querySelector("[data-ssui-v2-app-root]")
      ) {
        element.dir = "rtl"
      }
    }
  })

  const release = page.getByRole("combobox", {
    name: "Release channel",
  })
  await release.scrollIntoViewIfNeeded()
  await release.dispatchEvent("pointerdown", {
    button: 0,
    isPrimary: true,
    pointerId: 1,
    pointerType: "touch",
  })
  await release.dispatchEvent("pointerup", {
    button: 0,
    isPrimary: true,
    pointerId: 1,
    pointerType: "touch",
  })
  await release.click()
  await expect(page.getByRole("option", { name: "Canary" })).toBeVisible()
  const geometry = await overlayContract(release, "combobox-content")
  expect(geometry).toMatchObject({
    error: null,
    overlayOpen: true,
    popupRootIsExpected: true,
  })
  if ("left" in geometry) {
    expect(geometry.left).toBeGreaterThanOrEqual(0)
    expect(geometry.right).toBeLessThanOrEqual(geometry.viewportWidth + 1)
    expect(geometry.top).toBeGreaterThanOrEqual(0)
    expect(geometry.bottom).toBeLessThanOrEqual(geometry.viewportHeight + 1)
  }
  expect(
    await release.evaluate((element) =>
      (element.getRootNode() as ShadowRoot).host.getAttribute("dir")
    )
  ).toBe("rtl")
  await page.getByRole("option", { name: "Canary" }).click()
  await expect(release).toHaveValue("Canary")

  await page.getByRole("tab", { name: "Tab placement" }).click()
  const bounded = page.getByRole("combobox", { name: "Bounded release" })
  await bounded.scrollIntoViewIfNeeded()
  await bounded.click()
  await expect(page.getByRole("option", { name: "Nightly" })).toBeVisible()
  await expectOpenOverlayContract(bounded, "combobox-content")
  await page.getByRole("option", { name: "Nightly" }).click()
  const tabEmail = page.getByRole("textbox", { name: "Tab email" })
  await tabEmail.fill("mobile@example.com")
  await tabEmail.blur()
  await expect(page.getByText("Tab email value: mobile@example.com")).toBeVisible()

  const expandSidebar = page.getByTestId("stExpandSidebarButton")
  if (await expandSidebar.isVisible()) {
    await expandSidebar.click()
  }
  const sidebar = page.getByRole("combobox", { name: "Sidebar release" })
  await sidebar.click()
  await expectOpenOverlayContract(sidebar, "combobox-content")
  await page.getByRole("option", { name: "Beta" }).click()
  await expect(page.getByText("Sidebar value: Beta")).toBeVisible()

  expect(diagnostics).toEqual({ consoleMessages: [], pageErrors: [] })
  await context.close()
})
