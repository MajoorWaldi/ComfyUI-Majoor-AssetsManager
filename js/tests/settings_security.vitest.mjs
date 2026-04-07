import { beforeEach, describe, expect, it, vi } from "vitest";

const saveMajoorSettings = vi.fn();
const applySettingsToConfig = vi.fn();
const syncBackendSecuritySettings = vi.fn();
const setSecuritySettings = vi.fn();
const setRuntimeSecurityToken = vi.fn();
const comfyToast = vi.fn();
const t = vi.fn((key, fallback, vars) => {
    if (!fallback) return key;
    if (!vars || typeof vars !== "object") return fallback;
    return String(fallback).replace(/\{(\w+)\}/g, (_m, name) => String(vars[name] ?? `{${name}}`));
});

vi.mock("../app/i18n.js", () => ({
    t,
}));

vi.mock("../app/toast.js", () => ({
    comfyToast,
}));

vi.mock("../api/client.js", () => ({
    setSecuritySettings,
    setRuntimeSecurityToken,
}));

vi.mock("../app/settings/settingsCore.js", () => ({
    saveMajoorSettings,
    applySettingsToConfig,
    syncBackendSecuritySettings,
}));

describe("settingsSecurity recommended remote LAN preset", () => {
    beforeEach(() => {
        vi.resetModules();
        vi.unstubAllGlobals();
        vi.clearAllMocks();
        globalThis.location = {
            protocol: "http:",
            hostname: "192.168.1.10",
        };
        vi.stubGlobal("crypto", {
            getRandomValues: vi.fn((buffer) => {
                for (let index = 0; index < buffer.length; index += 1) {
                    buffer[index] = (index * 17 + 23) & 0xff;
                }
                return buffer;
            }),
        });
        setSecuritySettings.mockResolvedValue({ ok: true, data: { prefs: {} } });
    });

    it("builds the recommended preset with a generated token on HTTP LAN sessions", async () => {
        const mod = await import("../app/settings/settingsSecurity.js");
        const patch = mod.buildRecommendedRemoteLanSecuritySettings({});

        expect(patch.allowWrite).toBe(true);
        expect(patch.requireAuth).toBe(true);
        expect(patch.allowRemoteWrite).toBe(false);
        expect(patch.allowInsecureTokenTransport).toBe(true);
        expect(String(patch.apiToken)).toMatch(/^mjr_[0-9a-f]+$/);
        expect(String(patch.apiToken)).toHaveLength(40);
    });

    it("rejects token generation when secure randomness is unavailable", async () => {
        vi.stubGlobal("crypto", undefined);

        const mod = await import("../app/settings/settingsSecurity.js");

        expect(() => mod.generateRecommendedApiToken()).toThrow(
            "Secure token generation requires crypto.getRandomValues().",
        );
    });

    it("applies the preset through the settings toggle and syncs backend security", async () => {
        const mod = await import("../app/settings/settingsSecurity.js");
        const defs = [];
        const settings = {
            safety: {},
            security: {
                allowWrite: false,
                requireAuth: false,
                allowRemoteWrite: false,
                allowInsecureTokenTransport: false,
            },
        };
        const notifyApplied = vi.fn();

        mod.registerSecuritySettings((def) => defs.push(def), settings, notifyApplied);

        const presetDef = defs.find((def) => def.id === "Majoor.Security.RemoteLanPreset");
        expect(presetDef).toBeTruthy();

        presetDef.onChange(true);
        await Promise.resolve();
        await Promise.resolve();

        expect(saveMajoorSettings).toHaveBeenCalled();
        expect(setRuntimeSecurityToken).toHaveBeenCalledTimes(1);
        expect(setSecuritySettings).toHaveBeenCalledTimes(1);
        expect(setSecuritySettings).toHaveBeenCalledWith(
            expect.objectContaining({
                allow_write: true,
                require_auth: true,
                allow_remote_write: false,
                allow_insecure_token_transport: true,
            }),
        );
        expect(String(settings.security.apiToken)).toMatch(/^mjr_[0-9a-f]+$/);
        expect(notifyApplied).toHaveBeenCalledWith("security.remoteLanPreset");
        expect(notifyApplied).toHaveBeenCalledWith("security.apiToken");
        expect(syncBackendSecuritySettings).toHaveBeenCalledTimes(1);
        expect(comfyToast).toHaveBeenCalledWith(
            "Recommended remote LAN setup applied. This browser session is now authorized for Majoor write operations.",
            "success",
        );
    });

    it("persists a manually entered API token into the runtime auth session", async () => {
        const mod = await import("../app/settings/settingsSecurity.js");
        const defs = [];
        const settings = {
            safety: {},
            security: {},
        };

        mod.registerSecuritySettings((def) => defs.push(def), settings, vi.fn());

        const tokenDef = defs.find((def) => def.id === "Majoor.Security.ApiToken");
        expect(tokenDef).toBeTruthy();

        tokenDef.onChange("mjr_manual_token_1234567890");
        await Promise.resolve();

        expect(setRuntimeSecurityToken).toHaveBeenCalledWith("mjr_manual_token_1234567890");
        expect(setSecuritySettings).toHaveBeenCalledWith({ api_token: "mjr_manual_token_1234567890" });
    });

    it("does not push unchanged security toggle values during initial settings hydration", async () => {
        const mod = await import("../app/settings/settingsSecurity.js");
        const defs = [];
        const settings = {
            safety: {
                confirmDeletion: true,
            },
            security: {
                allowWrite: true,
                requireAuth: true,
                allowRemoteWrite: false,
                allowInsecureTokenTransport: false,
            },
        };

        mod.registerSecuritySettings((def) => defs.push(def), settings, vi.fn());

        const allowWriteDef = defs.find((def) => def.id === "Majoor.Security.allowWrite");
        expect(allowWriteDef).toBeTruthy();

        allowWriteDef.onChange(true);
        await Promise.resolve();

        expect(saveMajoorSettings).not.toHaveBeenCalled();
        expect(setSecuritySettings).not.toHaveBeenCalled();
        expect(syncBackendSecuritySettings).not.toHaveBeenCalled();
    });

    it("does not push an unchanged API token during initial settings hydration", async () => {
        const mod = await import("../app/settings/settingsSecurity.js");
        const defs = [];
        const settings = {
            safety: {},
            security: {
                apiToken: "mjr_same_token_1234567890",
            },
        };

        mod.registerSecuritySettings((def) => defs.push(def), settings, vi.fn());

        const tokenDef = defs.find((def) => def.id === "Majoor.Security.ApiToken");
        expect(tokenDef).toBeTruthy();

        tokenDef.onChange("mjr_same_token_1234567890");
        await Promise.resolve();

        expect(saveMajoorSettings).not.toHaveBeenCalled();
        expect(setRuntimeSecurityToken).not.toHaveBeenCalled();
        expect(setSecuritySettings).not.toHaveBeenCalled();
    });
});