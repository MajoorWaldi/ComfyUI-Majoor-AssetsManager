import { beforeEach, describe, expect, it, vi } from "vitest";

function createDocument() {
    const headChildren = [];
    const tabChildren = [];
    const classes = new Set();
    const badgeContainer = {
        children: tabChildren,
        classList: {
            add: (name) => classes.add(name),
            remove: (name) => classes.delete(name),
            contains: (name) => classes.has(name),
        },
        appendChild(el) {
            tabChildren.push(el);
            return el;
        },
        querySelector(selector) {
            if (selector.includes("mjr-sidebar-asset-badge")) {
                return tabChildren.find((child) => child.className === "mjr-sidebar-asset-badge") || null;
            }
            return null;
        },
        getAttribute: vi.fn(() => ""),
        textContent: "Assets Manager",
        title: "Assets Manager",
    };
    return {
        _tab: badgeContainer,
        createElement(tag) {
            return {
                tagName: String(tag).toUpperCase(),
                className: "",
                textContent: "",
                setAttribute: vi.fn(),
                remove() {
                    const index = tabChildren.indexOf(this);
                    if (index >= 0) tabChildren.splice(index, 1);
                },
            };
        },
        getElementById: vi.fn(() => null),
        querySelector(selector) {
            if (String(selector).includes("majoor-assets")) return badgeContainer;
            return null;
        },
        querySelectorAll: vi.fn(() => []),
        head: {
            appendChild(el) {
                headChildren.push(el);
                return el;
            },
        },
    };
}

describe("sidebarAssetBadge", () => {
    beforeEach(() => {
        vi.resetModules();
        vi.useFakeTimers();
        globalThis.document = createDocument();
        globalThis.requestAnimationFrame = (fn) => {
            fn();
            return 1;
        };
        globalThis.CSS = { escape: (value) => String(value) };
    });

    it("increments, deduplicates by asset id, and resets the sidebar badge", async () => {
        const { APP_CONFIG } = await import("../app/config.js");
        const mod = await import("../features/runtime/sidebarAssetBadge.js");
        APP_CONFIG.SIDEBAR_ASSET_BADGE_ENABLED = true;

        mod.configureSidebarAssetBadge({ sidebarTabId: "majoor-assets" });
        mod.incrementSidebarAssetBadge({ id: 1 });
        mod.incrementSidebarAssetBadge({ id: 1 });
        mod.incrementSidebarAssetBadge({ id: 2 });

        expect(mod.getSidebarAssetBadgeCount()).toBe(2);
        expect(globalThis.document._tab.querySelector(":scope > .mjr-sidebar-asset-badge").textContent).toBe("2");

        mod.resetSidebarAssetBadge();

        expect(mod.getSidebarAssetBadgeCount()).toBe(0);
        expect(globalThis.document._tab.querySelector(":scope > .mjr-sidebar-asset-badge")).toBeNull();
    });

    it("does not show the badge when the sidebar asset badge setting is disabled", async () => {
        const { APP_CONFIG } = await import("../app/config.js");
        const mod = await import("../features/runtime/sidebarAssetBadge.js");
        APP_CONFIG.SIDEBAR_ASSET_BADGE_ENABLED = false;

        mod.configureSidebarAssetBadge({ sidebarTabId: "majoor-assets" });
        mod.incrementSidebarAssetBadge({ id: 1 });

        expect(mod.getSidebarAssetBadgeCount()).toBe(0);
        expect(globalThis.document._tab.querySelector(":scope > .mjr-sidebar-asset-badge")).toBeNull();
    });

    it("deduplicates indexed asset events by file identity when no asset id is available", async () => {
        const { APP_CONFIG } = await import("../app/config.js");
        const mod = await import("../features/runtime/sidebarAssetBadge.js");
        APP_CONFIG.SIDEBAR_ASSET_BADGE_ENABLED = true;

        mod.configureSidebarAssetBadge({ sidebarTabId: "majoor-assets" });
        mod.incrementSidebarAssetBadge({
            filename: "same.png",
            subfolder: "renders",
            type: "output",
        });
        mod.incrementSidebarAssetBadge({
            filename: "same.png",
            subfolder: "renders",
            type: "output",
        });

        expect(mod.getSidebarAssetBadgeCount()).toBe(1);
    });
});
