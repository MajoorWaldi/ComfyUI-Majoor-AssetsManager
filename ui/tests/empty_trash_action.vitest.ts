import { beforeEach, describe, expect, it, vi } from "vitest";

import { runEmptyTrashAction } from "../features/status/emptyTrashAction.js";

function makeDeps(overrides: Record<string, any> = {}) {
    return {
        getStatus: vi.fn(async () => ({
            ok: true,
            data: { supported: true, count: 3, bytes: 4096 },
        })),
        empty: vi.fn(async () => ({
            ok: true,
            data: { removed: 3, bytes: 4096, failed: [] },
        })),
        confirm: vi.fn(async () => true),
        toast: vi.fn(),
        formatBytes: vi.fn((n: number) => `${n} B`),
        translate: vi.fn((_key: string, fallback: string, params?: Record<string, any>) => {
            if (!params) return fallback;
            let out = fallback;
            for (const [k, v] of Object.entries(params)) {
                out = out.split(`{${k}}`).join(String(v));
            }
            return out;
        }),
        ...overrides,
    };
}

beforeEach(() => {
    vi.clearAllMocks();
});

describe("runEmptyTrashAction", () => {
    it("shows an info toast and never posts when the trash is empty", async () => {
        const deps = makeDeps({
            getStatus: vi.fn(async () => ({
                ok: true,
                data: { supported: true, count: 0, bytes: 0 },
            })),
        });
        await expect(runEmptyTrashAction(deps)).resolves.toBe("empty");
        expect(deps.toast).toHaveBeenCalledTimes(1);
        expect(deps.toast.mock.calls[0][0]).toBe("Trash is empty");
        expect(deps.toast.mock.calls[0][1]).toBe("info");
        expect(deps.confirm).not.toHaveBeenCalled();
        expect(deps.empty).not.toHaveBeenCalled();
    });

    it("asks for confirmation with count and size, then posts and toasts the result", async () => {
        const deps = makeDeps();
        await expect(runEmptyTrashAction(deps)).resolves.toBe("removed");
        expect(deps.confirm).toHaveBeenCalledTimes(1);
        const [message, title] = deps.confirm.mock.calls[0];
        expect(message).toContain("3");
        expect(message).toContain("4096 B");
        expect(message).toContain("cannot be undone");
        expect(title).toBe("Empty trash?");
        expect(deps.empty).toHaveBeenCalledTimes(1);
        expect(deps.toast.mock.calls[0]).toEqual(["3 files removed (4096 B)", "success", 3200]);
    });

    it("does not post when the user cancels the confirmation", async () => {
        const deps = makeDeps({ confirm: vi.fn(async () => false) });
        await expect(runEmptyTrashAction(deps)).resolves.toBe("cancelled");
        expect(deps.empty).not.toHaveBeenCalled();
        expect(deps.toast).not.toHaveBeenCalled();
    });

    it("adds a warning toast when some entries fail to remove", async () => {
        const deps = makeDeps({
            empty: vi.fn(async () => ({
                ok: true,
                data: {
                    removed: 2,
                    bytes: 2048,
                    failed: [{ name: "a.png", error: "permission denied" }],
                },
            })),
        });
        await expect(runEmptyTrashAction(deps)).resolves.toBe("removed");
        expect(deps.toast).toHaveBeenCalledTimes(2);
        expect(deps.toast.mock.calls[1][0]).toContain("1");
        expect(deps.toast.mock.calls[1][1]).toBe("warning");
    });

    it("warns when directories in the trash are skipped", async () => {
        const deps = makeDeps({
            empty: vi.fn(async () => ({
                ok: true,
                data: { removed: 2, bytes: 2048, failed: [], skipped_dirs: 3 },
            })),
        });
        await expect(runEmptyTrashAction(deps)).resolves.toBe("removed");
        expect(deps.toast).toHaveBeenCalledTimes(2);
        expect(deps.toast.mock.calls[1][0]).toContain("3");
        expect(deps.toast.mock.calls[1][1]).toBe("warning");
    });

    it("reports unsupported platforms without posting", async () => {
        const deps = makeDeps({
            getStatus: vi.fn(async () => ({
                ok: true,
                data: { supported: false, count: 9, bytes: 9 },
            })),
        });
        await expect(runEmptyTrashAction(deps)).resolves.toBe("unsupported");
        expect(deps.confirm).not.toHaveBeenCalled();
        expect(deps.empty).not.toHaveBeenCalled();
        expect(deps.toast.mock.calls[0][1]).toBe("info");
    });

    it("surfaces GET failures as an error toast", async () => {
        const deps = makeDeps({
            getStatus: vi.fn(async () => ({ ok: false, error: "nope" })),
        });
        await expect(runEmptyTrashAction(deps)).resolves.toBe("error");
        expect(deps.toast.mock.calls[0]).toEqual(["nope", "error", 4500]);
        expect(deps.empty).not.toHaveBeenCalled();
    });

    it("surfaces thrown GET errors as an error toast", async () => {
        const deps = makeDeps({
            getStatus: vi.fn(async () => {
                throw new Error("network down");
            }),
        });
        await expect(runEmptyTrashAction(deps)).resolves.toBe("error");
        expect(deps.toast.mock.calls[0][0]).toBe("network down");
    });

    it("surfaces POST failures as an error toast", async () => {
        const deps = makeDeps({
            empty: vi.fn(async () => ({ ok: false, error: "FORBIDDEN by policy" })),
        });
        await expect(runEmptyTrashAction(deps)).resolves.toBe("error");
        expect(deps.toast.mock.calls[0]).toEqual(["FORBIDDEN by policy", "error", 4500]);
    });

    it("surfaces thrown POST errors as an error toast", async () => {
        const deps = makeDeps({
            empty: vi.fn(async () => {
                throw new Error("boom");
            }),
        });
        await expect(runEmptyTrashAction(deps)).resolves.toBe("error");
        expect(deps.toast.mock.calls[0][0]).toBe("boom");
    });

    it("treats a throwing confirm dialog as a cancellation", async () => {
        const deps = makeDeps({
            confirm: vi.fn(async () => {
                throw new Error("dialog closed");
            }),
        });
        await expect(runEmptyTrashAction(deps)).resolves.toBe("cancelled");
        expect(deps.empty).not.toHaveBeenCalled();
    });
});
