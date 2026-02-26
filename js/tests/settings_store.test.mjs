import test from "node:test";
import assert from "node:assert/strict";

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

test("SettingsStore get/set/getAll works with localStorage", () => {
  globalThis.window = {
    localStorage: createStorage(),
    addEventListener() {},
  };

  assert.equal(SettingsStore.get("missing"), null);
  assert.equal(SettingsStore.set("k", "v"), true);
  assert.equal(SettingsStore.get("k"), "v");
  assert.deepEqual(SettingsStore.getAll(), { k: "v" });
});

test("SettingsStore subscribe emits on local set/remove", () => {
  globalThis.window = {
    localStorage: createStorage(),
    addEventListener() {},
  };

  const events = [];
  const unsub = SettingsStore.subscribe("pref", (next, prev, key) => {
    events.push({ next, prev, key });
  });

  SettingsStore.set("pref", "a");
  SettingsStore.set("pref", "b");
  SettingsStore.set("pref", null);
  unsub();

  assert.equal(events.length, 3);
  assert.deepEqual(events[0], { next: "a", prev: null, key: "pref" });
  assert.deepEqual(events[2], { next: null, prev: "b", key: "pref" });
});

