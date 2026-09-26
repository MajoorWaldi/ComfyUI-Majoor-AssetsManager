// @vitest-environment happy-dom
import { beforeEach, expect, it, vi } from "vitest";

const { get, values } = vi.hoisted(() => ({ get: vi.fn(), values: new Map<string, string>() }));
vi.mock("../api/client.js", () => ({ get }));
vi.mock("../app/toast.js", () => ({ comfyToast: vi.fn() }));
vi.mock("../app/dialogs.js", () => ({ comfyAlert: vi.fn() }));
vi.mock("../app/i18n.js", () => ({ t: (_key: string, fallback: string) => fallback }));
vi.mock("../app/settings/SettingsStore.js", () => ({
    SettingsStore: {
        get: (key: string) => values.get(key),
        set: (key: string, value: string) => values.set(key, value),
    },
}));

import { checkMajoorVersion, getStoredVersionUpdateState } from "../app/versionCheck.js";

beforeEach(() => {
    get.mockReset();
    values.clear();
});

it("checks stable releases through the backend", async () => {
    get.mockResolvedValueOnce({ ok: true, data: { version: "2.5.1", branch: "main" } });
    get.mockResolvedValueOnce({ ok: true, data: { tag_name: "v2.5.2" } });
    await checkMajoorVersion({ force: true });
    expect(get).toHaveBeenLastCalledWith("/mjr/am/releases?channel=stable");
    expect(getStoredVersionUpdateState()).toMatchObject({ available: true, latest: "2.5.2" });
});

it("preserves nightly marker comparison through the backend", async () => {
    values.set("majoor_nightly_release_marker", "yesterday");
    get.mockResolvedValueOnce({ ok: true, data: { version: "nightly", branch: "nightly" } });
    get.mockResolvedValueOnce({ ok: true, data: { tag_name: "nightly", published_at: "today" } });
    await checkMajoorVersion({ force: true });
    expect(get).toHaveBeenLastCalledWith("/mjr/am/releases?channel=nightly");
    expect(getStoredVersionUpdateState()).toMatchObject({ available: true, channel: "nightly" });
    expect(values.get("majoor_nightly_release_marker")).toBe("today");
});

it("degrades without announcing an update when GitHub is unavailable", async () => {
    get.mockResolvedValueOnce({ ok: true, data: { version: "2.5.1", branch: "main" } });
    get.mockResolvedValueOnce({ ok: false, error: "Unavailable" });
    await checkMajoorVersion({ force: true });
    expect(getStoredVersionUpdateState()).toMatchObject({ available: false });
});
