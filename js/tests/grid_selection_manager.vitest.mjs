import { describe, expect, it } from "vitest";

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

describe("GridSelectionManager", () => {
  it("supports single and multi selection dataset keys", () => {
    const g1 = { dataset: { mjrSelectedAssetIds: JSON.stringify([1, "2"]) } };
    expect(Array.from(getSelectedIdSet(g1)).sort()).toEqual(["1", "2"]);

    const g2 = { dataset: { mjrSelectedAssetId: "9" } };
    expect(Array.from(getSelectedIdSet(g2))).toEqual(["9"]);
  });

  it("updates cards and emits event when selection changes", () => {
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
    expect(cards[1].classList.has("is-selected")).toBe(true);
    expect(cards[0].getAttribute("aria-selected")).toBe("false");

    const selected = setSelectionIds(grid, ["1", 3, "3"], { activeId: "3" }, () => cards);
    expect(selected.sort()).toEqual(["1", "3"]);
    expect(grid.dataset.mjrSelectedAssetId).toBe("3");
    expect(events.length).toBeGreaterThanOrEqual(1);
  });

  it("falls back when CSS.escape is unavailable", () => {
    globalThis.CSS = undefined;
    expect(safeEscapeId('a"b\\c')).toBe('a\\"b\\\\c');
  });
});
