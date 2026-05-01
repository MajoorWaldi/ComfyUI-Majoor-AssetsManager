import { getCurrentInstance, onBeforeUnmount, onMounted, ref, unref, watch } from "vue";

function readBool(value, fallback = true) {
    const resolved = unref(value);
    if (resolved == null) return fallback;
    return !!resolved;
}

export function useInfiniteTrigger({
    rootRef,
    enabled = true,
    canLoad = true,
    loadMore,
    rootMargin = "900px",
    threshold = 0.01,
} = {}) {
    const sentinelRef = ref(null);
    let observer = null;
    let loading = false;

    function disconnect() {
        try {
            observer?.disconnect?.();
        } catch (e) {
            console.debug?.(e);
        }
        observer = null;
    }

    async function maybeLoad() {
        if (loading) return;
        if (!readBool(enabled, true) || !readBool(canLoad, true)) return;
        if (typeof loadMore !== "function") return;
        loading = true;
        try {
            await loadMore();
        } finally {
            loading = false;
        }
    }

    function connect() {
        disconnect();
        const sentinel = sentinelRef.value;
        if (!sentinel || typeof IntersectionObserver !== "function") return;

        observer = new IntersectionObserver(
            (entries = []) => {
                const hit = entries.some((entry) => entry?.isIntersecting);
                if (!hit) return;
                void maybeLoad();
            },
            {
                root: unref(rootRef) || null,
                rootMargin,
                threshold,
            },
        );
        observer.observe(sentinel);
    }

    if (getCurrentInstance()) {
        onMounted(connect);
        onBeforeUnmount(disconnect);

        watch(
            () => [unref(rootRef), sentinelRef.value],
            () => connect(),
            { flush: "post" },
        );
    }

    return {
        sentinelRef,
        connect,
        disconnect,
        maybeLoad,
    };
}
