// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createStatusIndicator, setupStatusPolling, updateStatus } from "../features/status/StatusDot.js";
import { get, post } from "../api/client.js";
import { ENDPOINTS } from "../api/endpoints.js";

vi.mock("../api/client.js", () => ({
    get: vi.fn().mockResolvedValue({ ok: true, data: { input_directory: "/custom/inputs" } }),
    post: vi.fn().mockResolvedValue({ ok: false, error: "Scan stopped for test" }),
    listDbBackups: vi.fn().mockResolvedValue({ ok: true, data: { items: [] } }),
    getToolsStatus: vi.fn().mockResolvedValue({ ok: false }),
    getWatcherStatus: vi.fn().mockResolvedValue({ ok: false }),
}));
vi.mock("../app/i18n.js", () => ({
    t: (key: string, fallback?: string) => fallback || key,
}));
vi.mock("../app/toast.js", () => ({ comfyToast: vi.fn(), recordToastHistory: vi.fn() }));
vi.mock("../app/settings.js", () => ({ loadMajoorSettings: () => ({ scan: { fastMode: true } }) }));

describe("Index Status Scan button", () => {
    let section: any;

    beforeEach(() => {
        vi.useFakeTimers();
        vi.clearAllMocks();
    });

    afterEach(() => {
        section?._mjrStatusPollDispose?.();
        section?.remove();
        vi.useRealTimers();
    });

    it("exposes a labeled button even when status details are collapsed and scans the current scope", async () => {
        section = createStatusIndicator();
        document.body.appendChild(section);
        const dot = section.querySelector("#mjr-status-dot");
        const text = section.querySelector("#mjr-status-text");
        let scope = "input";
        setupStatusPolling(dot, text, section, null, null, () => ({ scope }));
        const button = section.querySelector("#mjr-status-scan") as HTMLButtonElement;
        expect(button.textContent).toBe("Scan");
        expect(button.type).toBe("button");
        expect(button.classList.contains("mjr-btn")).toBe(true);
        expect(button.classList.contains("mjr-status-scan")).toBe(true);
        expect(section.style.getPropertyValue("--mjr-status-color")).toBe("var(--mjr-status-info, #64B5F6)");
        expect(section.querySelector("#mjr-status-body").style.display).toBe("none");
        expect(button.closest("#mjr-status-body")).toBeNull();
        button.click();
        await vi.advanceTimersByTimeAsync(0);
        expect(post).toHaveBeenLastCalledWith(
            ENDPOINTS.SCAN, expect.objectContaining({ scope: "input", recursive: true }),
        );
        scope = "output";
        button.click();
        await vi.advanceTimersByTimeAsync(0);
        expect(post).toHaveBeenLastCalledWith(
            ENDPOINTS.SCAN, expect.objectContaining({ scope: "output" }),
        );
        dot.click();
        await vi.advanceTimersByTimeAsync(0);
        expect(post).toHaveBeenCalledTimes(3);
    });

    it.each([
        ["success", "output", {}, "var(--mjr-status-success, #4CAF50)"],
        ["warning", "output", { locked: true }, "var(--mjr-status-warning, #FFA726)"],
        ["error", "output", { malformed: true }, "var(--mjr-status-error, #f44336)"],
        ["info", "output", { maintenance_active: true }, "var(--mjr-status-info, #64B5F6)"],
        ["browser", "custom", {}, "var(--mjr-status-browser, #26A69A)"],
        ["workflow", "workflow", {}, "var(--mjr-status-workflow, #d481c3)"],
    ])("updates the Scan button's inherited color for %s status", async (tone, scope, diagnostics, color) => {
        section = createStatusIndicator();
        document.body.appendChild(section);
        const dot = section.querySelector("#mjr-status-dot");
        const text = section.querySelector("#mjr-status-text");
        vi.mocked(get).mockImplementation(async (url) => ({
            ok: true,
            data: url === ENDPOINTS.HEALTH
                ? { database: { available: true } }
                : url === ENDPOINTS.HEALTH_DB
                  ? { diagnostics }
                  : { total_assets: 1, with_workflows: 1, with_generation_data: 1, last_scan_end: 1 },
        }));

        await updateStatus(dot, text, null, { scope });

        expect(section.dataset.mjrStatusTone).toBe(tone);
        expect(section.style.getPropertyValue("--mjr-status-color")).toBe(color);
        expect(section.querySelector("#mjr-status-scan").closest("[data-mjr-status-tone]")).toBe(section);
    });
});
