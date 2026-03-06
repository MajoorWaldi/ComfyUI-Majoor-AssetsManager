import { describe, expect, it } from "vitest";

import { listShortcutGuideSections } from "../features/panel/messages/shortcutGuide.js";

describe("shortcutGuide", () => {
  it("returns grouped shortcut sections with visible entries", () => {
    const sections = listShortcutGuideSections();

    expect(Array.isArray(sections)).toBe(true);
    expect(sections.length).toBeGreaterThanOrEqual(5);
    expect(sections.every((section) => Array.isArray(section.items) && section.items.length > 0)).toBe(true);
  });
});
