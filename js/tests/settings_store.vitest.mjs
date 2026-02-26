import { describe, expect, it } from "vitest";

import { SettingsStore } from "../app/settings/SettingsStore.js";

function createStorage() {
  const data = new Map();
  return {
    get length() {
      return data.size;
    },
    key(i) {
      return Array.from(data.keys())[i] ?? null;
    },
    getItem(k) {
      return data.has(k) ? data.get(k) : null;
    },
    setItem(k, v) {
      data.set(String(k), String(v));
    },
    removeItem(k) {
      data.delete(String(k));
    },
  };
}

describe("SettingsStore (Vitest)", () => {
  it("reads and writes settings through localStorage wrapper", () => {
    globalThis.window = {
      localStorage: createStorage(),
      addEventListener() {},
    };

    expect(SettingsStore.get("missing")).toBe(null);
    expect(SettingsStore.set("k", "v")).toBe(true);
    expect(SettingsStore.get("k")).toBe("v");
    expect(SettingsStore.getAll()).toEqual({ k: "v" });
  });
});

