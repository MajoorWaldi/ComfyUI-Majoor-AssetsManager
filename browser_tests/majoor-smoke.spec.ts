import { expect, test } from "@playwright/test";

declare global {
    interface Window {
        app?: {
            extensionManager?: Record<string, any>;
            ui?: { extensionManager?: Record<string, any> };
        };
    }
}

const SIDEBAR_TAB_ID = "majoor-assets";

test("ComfyUI shell loads with a host app or graph canvas", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("body")).toBeVisible();

    await page.waitForFunction(
        () => Boolean(window.app || document.querySelector("canvas")),
        null,
        { timeout: 30_000 },
    );

    const hostState = await page.evaluate(() => ({
        hasApp: Boolean(window.app),
        hasCanvas: Boolean(document.querySelector("canvas")),
        hasExtensionManager: Boolean(
            window.app?.extensionManager || window.app?.ui?.extensionManager,
        ),
    }));

    expect(hostState.hasApp || hostState.hasCanvas).toBeTruthy();
});

test("Majoor sidebar can be activated through the ComfyUI sidebar controller", async ({ page }) => {
    await page.goto("/");

    await page.waitForFunction(() => Boolean(window.app), null, { timeout: 30_000 });

    const result = await page.evaluate((tabId) => {
        const manager = window.app?.extensionManager || window.app?.ui?.extensionManager;
        const sidebar =
            manager?.sidebarTabStore ||
            manager?.sidebarTab ||
            manager?.workspaceStore?.sidebarTab ||
            null;
        const hosts = [manager, sidebar].filter(Boolean);
        const methods = [
            "activateSidebarTab",
            "openSidebarTab",
            "selectSidebarTab",
            "setActiveSidebarTab",
            "showSidebarTab",
            "toggleSidebarTab",
        ];

        for (const host of hosts) {
            for (const method of methods) {
                if (typeof host?.[method] === "function") {
                    host[method](tabId);
                    return { ok: true, method };
                }
            }
        }
        return { ok: false, method: "" };
    }, SIDEBAR_TAB_ID);

    expect(result.ok, `No sidebar activation method found for ${SIDEBAR_TAB_ID}`).toBe(true);

    await page.waitForTimeout(250);
    await expect(page.locator("body")).toBeVisible();
});

test("Majoor floating viewer event path can be triggered without page errors", async ({ page }) => {
    const pageErrors = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));

    await page.goto("/");
    await page.waitForFunction(() => Boolean(window.app), null, { timeout: 30_000 });

    await page.evaluate(() => {
        window.dispatchEvent(new Event("mjr:mfv-open"));
    });
    await page.waitForTimeout(250);

    expect(pageErrors).toEqual([]);
});
