// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createStatusIndicator, setupStatusPolling } from "../features/status/StatusDot.js";
import { post } from "../api/client.js";
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
});
