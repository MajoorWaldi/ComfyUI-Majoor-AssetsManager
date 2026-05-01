import { describe, expect, it, vi } from "vitest";
import { ref } from "vue";

import { useInfiniteTrigger } from "../vue/grid/useInfiniteTrigger.js";

describe("useInfiniteTrigger", () => {
    it("loads only when enabled and allowed", async () => {
        const enabled = ref(true);
        const canLoad = ref(true);
        const loadMore = vi.fn(async () => {});
        const trigger = useInfiniteTrigger({
            enabled,
            canLoad,
            loadMore,
        });

        await trigger.maybeLoad();
        expect(loadMore).toHaveBeenCalledTimes(1);

        enabled.value = false;
        await trigger.maybeLoad();
        expect(loadMore).toHaveBeenCalledTimes(1);

        enabled.value = true;
        canLoad.value = false;
        await trigger.maybeLoad();
        expect(loadMore).toHaveBeenCalledTimes(1);
    });

    it("coalesces concurrent load attempts", async () => {
        let resolveLoad;
        const loadMore = vi.fn(
            () =>
                new Promise((resolve) => {
                    resolveLoad = resolve;
                }),
        );
        const trigger = useInfiniteTrigger({ loadMore });

        const first = trigger.maybeLoad();
        const second = trigger.maybeLoad();

        expect(loadMore).toHaveBeenCalledTimes(1);
        resolveLoad();
        await first;
        await second;
    });
});
