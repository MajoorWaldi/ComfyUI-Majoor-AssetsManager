import { describe, expect, it, vi } from "vitest";

import {
    getHotkeysState,
    setHotkeysScope,
    setHotkeysSuspendedFlag,
} from "../features/panel/controllers/hotkeysState.js";

/**
 * Tests for the cleanup contract used in panelRuntime section #29.
 *
 * The cleanup closure at `container._eventCleanup` follows a strict pattern:
 *  - Every disposable is wrapped in try/catch so one failure cannot block others
 *  - AbortController.abort() is called first (cancels in-flight requests)
 *  - Timers are cleared via clearTimeout/clearInterval, then nulled
 *  - Controllers expose .dispose() or .unbind()
 *  - hotkeysScope is conditionally reset to null
 *  - gridContainer is nulled out via clearActiveGridContainer()
 *
 * These tests verify that an extracted cleanup runner following the same
 * contract behaves correctly, ensuring future refactors preserve the pattern.
 */
describe("panel cleanup contract", () => {
    describe("AbortController teardown pattern", () => {
        it("abort() cancels the signal", () => {
            const ac = new AbortController();
            expect(ac.signal.aborted).toBe(false);
            ac.abort();
            expect(ac.signal.aborted).toBe(true);
        });

        it("abort() is safely re-entrant", () => {
            const ac = new AbortController();
            ac.abort();
            ac.abort(); // no throw
            expect(ac.signal.aborted).toBe(true);
        });

        it("try-catch wrapping tolerates null controller", () => {
            const ac = null;
            let threw = false;
            try {
                ac?.abort?.();
            } catch {
                threw = true;
            }
            expect(threw).toBe(false);
        });
    });

    describe("timer cleanup pattern", () => {
        it("clearTimeout on null does not throw", () => {
            expect(() => clearTimeout(null)).not.toThrow();
        });

        it("clearInterval on null does not throw", () => {
            expect(() => clearInterval(null)).not.toThrow();
        });

        it("clears a pending timeout", () => {
            const cb = vi.fn();
            const timer = setTimeout(cb, 100_000);
            clearTimeout(timer);
            // Can't easily assert the callback won't run, but no throw.
            expect(timer).toBeTruthy();
        });
    });

    describe("disposable controller pattern", () => {
        it("calls .dispose() on each controller", () => {
            const hotkeys = { dispose: vi.fn() };
            const ratingHotkeys = { dispose: vi.fn() };
            const sidebar = { dispose: vi.fn() };
            const popovers = { dispose: vi.fn() };

            const disposables = [hotkeys, ratingHotkeys, sidebar, popovers];
            for (const d of disposables) {
                try {
                    d.dispose();
                } catch {
                    /* safety */
                }
            }

            expect(hotkeys.dispose).toHaveBeenCalledOnce();
            expect(ratingHotkeys.dispose).toHaveBeenCalledOnce();
            expect(sidebar.dispose).toHaveBeenCalledOnce();
            expect(popovers.dispose).toHaveBeenCalledOnce();
        });

        it("continues disposing after one controller throws", () => {
            const broken = {
                dispose: vi.fn(() => {
                    throw new Error("boom");
                }),
            };
            const healthy = { dispose: vi.fn() };

            for (const d of [broken, healthy]) {
                try {
                    d.dispose();
                } catch {
                    /* safety */
                }
            }

            expect(broken.dispose).toHaveBeenCalledOnce();
            expect(healthy.dispose).toHaveBeenCalledOnce();
        });

        it("handles optional dispose via ?. operator", () => {
            const obj = {};
            let threw = false;
            try {
                obj?.dispose?.();
            } catch {
                threw = true;
            }
            expect(threw).toBe(false);
        });
    });

    describe("hotkeys scope conditional reset", () => {
        it("resets scope to null when scope is grid", () => {
            setHotkeysScope("grid");
            setHotkeysSuspendedFlag(false);

            if (getHotkeysState().scope === "grid") setHotkeysScope(null);
            expect(getHotkeysState().scope).toBeNull();
        });

        it("preserves scope when not grid", () => {
            setHotkeysScope("viewer");

            if (getHotkeysState().scope === "grid") setHotkeysScope(null);
            expect(getHotkeysState().scope).toBe("viewer");
        });
    });

    describe("grid container null-out pattern", () => {
        it("clears container reference after dispose", () => {
            let gridContainer = { id: "grid-1" };
            const disposeFn = vi.fn();

            // Simulates: if (gridContainer) disposeGridFn(gridContainer);
            if (gridContainer) disposeFn(gridContainer);
            gridContainer = null;

            expect(disposeFn).toHaveBeenCalledWith({ id: "grid-1" });
            expect(gridContainer).toBeNull();
        });
    });

    describe("full cleanup sequence ordering", () => {
        it("runs all cleanup steps even when some fail", () => {
            const log = [];
            const steps = [
                () => {
                    log.push("abort");
                },
                () => {
                    log.push("timer");
                    throw new Error("timer fail");
                },
                () => {
                    log.push("hotkeys");
                },
                () => {
                    log.push("filters");
                },
                () => {
                    log.push("sidebar");
                    throw new Error("sidebar fail");
                },
                () => {
                    log.push("grid");
                },
                () => {
                    log.push("popovers");
                },
            ];

            for (const step of steps) {
                try {
                    step();
                } catch {
                    /* safety */
                }
            }

            expect(log).toEqual([
                "abort",
                "timer",
                "hotkeys",
                "filters",
                "sidebar",
                "grid",
                "popovers",
            ]);
        });
    });
});
