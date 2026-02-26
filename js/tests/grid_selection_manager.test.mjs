import test from "node:test";
import assert from "node:assert/strict";

import {
  getSelectedIdSet,
  safeEscapeId,
  setSelectionIds,
  syncSelectionClasses,
} from "../features/grid/GridSelectionManager.js";

function makeCard(id) {
  const classSet = new Set();
  const attrs = new Map();
  return {
    dataset: { mjrAssetId: String(id) },
    classList: {
      add(v) {
        classSet.add(v);
      },
      remove(v) {
        classSet.delete(v);
      },
      has(v) {
        return classSet.has(v);
      },
    },
    setAttribute(k, v) {
      attrs.set(k, v);
    },
    getAttribute(k) {
      return attrs.get(k);
    },
  };
}

test("getSelectedIdSet supports single and multi dataset keys", () => {
  const g1 = { dataset: { mjrSelectedAssetIds: JSON.stringify([1, "2"]) } };
  assert.deepEqual(Array.from(getSelectedIdSet(g1)).sort(), ["1", "2"]);

  const g2 = { dataset: { mjrSelectedAssetId: "9" } };
  assert.deepEqual(Array.from(getSelectedIdSet(g2)), ["9"]);
});

test("syncSelectionClasses and setSelectionIds update cards and emit event", () => {
  const cards = [makeCard(1), makeCard(2), makeCard(3)];
  const events = [];
  globalThis.CustomEvent = class {
    constructor(type, init) {
      this.type = type;
      this.detail = init?.detail;
    }
  };
  const grid = {
    dataset: {},
    dispatchEvent(evt) {
      events.push(evt);
    },
  };

  syncSelectionClasses(grid, new Set(["2"]), () => cards);
  assert.equal(cards[1].classList.has("is-selected"), true);
  assert.equal(cards[0].getAttribute("aria-selected"), "false");

  const selected = setSelectionIds(grid, ["1", 3, "3"], { activeId: "3" }, () => cards);
  assert.deepEqual(selected.sort(), ["1", "3"]);
  assert.equal(grid.dataset.mjrSelectedAssetId, "3");
  assert.ok(events.length >= 1);
});

test("safeEscapeId falls back when CSS.escape is unavailable", () => {
  globalThis.CSS = undefined;
  assert.equal(safeEscapeId('a"b\\c'), 'a\\"b\\\\c');
});

