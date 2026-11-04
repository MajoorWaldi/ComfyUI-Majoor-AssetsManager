import { describe, expect, it } from "vitest";
import { computed, effect, reactive } from "vue";

import { buildDisplayAssets, toDuplicateGroupMembers } from "../vue/grid/useGridDisplayAssets.js";

function asset(
    id: number,
    subfolder: string,
    filename = "at-7.958s.png",
    extra: Record<string, any> = {},
) {
    return { id, filename, subfolder, source: "output", type: "output", kind: "image", ...extra };
}

describe("duplicate stacks (display)", () => {
    it("never stacks files that only share a name in different folders", () => {
        const out = buildDisplayAssets([
            asset(1, "video_a"),
            asset(2, "video_b"),
            asset(3, "video_c"),
        ]);

        expect(out).toHaveLength(3);
        expect(out.every((a) => !a._mjrDupStack)).toBe(true);
    });

    it("stacks real duplicates of the same location and lists every copy", () => {
        const out = buildDisplayAssets([
            asset(1, "shots"),
            asset(2, "Shots"),
            asset(3, "shots", "AT-7.958S.png"),
        ]);

        expect(out).toHaveLength(1);
        expect(out[0]._mjrDupStack).toBe(true);
        expect(out[0]._mjrDupCount).toBe(3);
        expect(out[0]._mjrDupMembers.map((a: any) => a.id)).toEqual([1, 2, 3]);
    });

    it("is write-idempotent on reactive assets, so a render cannot loop", () => {
        // The grid template reads these fields; any write on a stable pass
        // re-triggers the render that ran this computed (the ComfyUI freeze).
        const state = reactive({
            assets: [asset(1, "s"), asset(2, "s"), asset(3, "s"), asset(4, "t")],
        });
        const display = computed(() => buildDisplayAssets(state.assets));
        let renders = 0;
        effect(() => {
            renders += 1;
            for (const a of display.value) {
                void a._mjrDupStack;
                void a._mjrDupCount;
                void a._mjrDupMembers;
                void a._mjrNameCollision;
            }
        });
        const settled = renders;

        for (let i = 0; i < 5; i++) {
            buildDisplayAssets(state.assets);
        }

        expect(renders).toBe(settled);
        expect(renders).toBeLessThan(5);
        const rep = display.value[0];
        const membersRef = rep._mjrDupMembers;
        buildDisplayAssets(state.assets);
        expect(rep._mjrDupMembers).toBe(membersRef);
    });

    it("shows every copy individually in the duplicates view", () => {
        const assets = [asset(1, "s"), asset(2, "s"), asset(3, "s")];
        buildDisplayAssets(assets);

        const out = buildDisplayAssets(assets, { collapseDuplicates: false });

        expect(out).toHaveLength(3);
        expect(out.every((a) => !a._mjrDupStack && a._mjrDupMembers == null)).toBe(true);
    });

    it("hands the duplicates view cycle-free copies", () => {
        const [rep] = buildDisplayAssets([asset(1, "s"), asset(2, "s")]);
        expect(rep._mjrDupMembers).toContain(rep); // the live graph is cyclic

        const members = toDuplicateGroupMembers(rep._mjrDupMembers);

        expect(members.map((m) => m.id)).toEqual([1, 2]);
        expect(() => JSON.stringify(members)).not.toThrow();
        expect(members[0]).not.toBe(rep);
        expect(members.some((m) => "_mjrDupMembers" in m || "_mjrDupStack" in m)).toBe(false);
    });
});
