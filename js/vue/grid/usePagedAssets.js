import { computed, reactive } from "vue";

export function resolvePageAdvance({ assets = [], count = null, limit = 0, offset = 0, total = null } = {}) {
    const returnedCount = Array.isArray(assets) ? assets.length : 0;
    const responseCount = count == null ? returnedCount : Math.max(0, Number(count) || 0);
    if (responseCount <= 0) return 0;

    const requestedLimit = Math.max(0, Number(limit) || 0);
    const currentOffset = Math.max(0, Number(offset) || 0);
    const knownTotal = total == null ? null : Math.max(0, Number(total) || 0);
    const remaining = knownTotal == null ? null : Math.max(0, knownTotal - currentOffset);

    if (requestedLimit <= 0 || knownTotal == null) return responseCount;
    if (responseCount >= requestedLimit) return requestedLimit;

    const pageWindow = Math.min(requestedLimit, remaining);
    if (pageWindow <= 0) return responseCount;
    return Math.max(responseCount, pageWindow);
}

export async function loadPagesUntilVisible({
    fetchPage,
    applyPage,
    getLimit,
    canContinue = null,
    beforeApplyPage = null,
    onEmptyPage = null,
    maxEmptyPages = 6,
} = {}) {
    if (typeof fetchPage !== "function" || typeof applyPage !== "function") {
        return { ok: false, error: new Error("fetchPage and applyPage are required") };
    }

    const maxAttempts = Math.max(1, Number(maxEmptyPages) || 1);
    let firstResult = null;
    let lastResult = null;

    for (let emptyPageIndex = 0; emptyPageIndex < maxAttempts; emptyPageIndex += 1) {
        if (typeof canContinue === "function" && !canContinue({ emptyPageIndex })) {
            return { ok: true, skipped: true, hidden: true };
        }

        const limit = Math.max(
            1,
            Number(typeof getLimit === "function" ? getLimit(emptyPageIndex) : getLimit) || 1,
        );
        const page = await fetchPage({ limit, emptyPageIndex });
        if (page?.skipped) return page;
        if (!page?.ok) return page || { ok: false, error: "Failed to load assets" };

        if (typeof beforeApplyPage === "function") {
            const earlyResult = await beforeApplyPage(page, { limit, emptyPageIndex });
            if (earlyResult) return earlyResult;
        }

        const applied = applyPage(page, { limit, emptyPageIndex }) || {};
        const result = {
            ok: true,
            page,
            limit,
            emptyPageIndex,
            count: Number(applied.count ?? page?.count ?? 0) || 0,
            total: applied.total,
            added: Number(applied.added || 0) || 0,
            advanced: Number(applied.advanced || 0) || 0,
            done: !!applied.done,
        };
        if (!firstResult) firstResult = result;
        lastResult = result;

        if (result.done || result.added > 0) {
            return result;
        }

        if (typeof onEmptyPage === "function") {
            onEmptyPage(result);
        }
        if (result.advanced <= 0) break;
    }

    return {
        ok: true,
        skippedEmpty: true,
        count: firstResult?.count ?? 0,
        total: lastResult?.total ?? firstResult?.total ?? null,
        added: lastResult?.added ?? 0,
        advanced: lastResult?.advanced ?? 0,
        firstResult,
        lastResult,
    };
}

export function usePagedAssets({
    query,
    collection,
    fetchPage,
    pageSize = 80,
    getPageSize = null,
} = {}) {
    const state = reactive({
        offset: 0,
        cursor: null,
        total: null,
        loading: false,
        error: null,
        done: false,
        requestId: 0,
    });

    const items = computed(() => collection?.items?.value || []);
    const canLoadMore = computed(() => !state.loading && !state.done);

    function currentQuery() {
        if (query && typeof query === "object" && "value" in query) return query.value;
        return query;
    }

    function currentPageSize() {
        if (typeof getPageSize === "function") {
            return Math.max(1, Number(getPageSize()) || 1);
        }
        if (pageSize && typeof pageSize === "object" && "value" in pageSize) {
            return Math.max(1, Number(pageSize.value) || 1);
        }
        return Math.max(1, Number(pageSize) || 1);
    }

    function setPageState(nextState = {}) {
        if (!nextState || typeof nextState !== "object") return getPageState();
        if (Object.prototype.hasOwnProperty.call(nextState, "offset")) {
            state.offset = Math.max(0, Number(nextState.offset || 0) || 0);
        }
        if (Object.prototype.hasOwnProperty.call(nextState, "cursor")) {
            state.cursor = nextState.cursor || null;
        }
        if (Object.prototype.hasOwnProperty.call(nextState, "total")) {
            state.total = nextState.total == null ? null : Math.max(0, Number(nextState.total) || 0);
        }
        if (Object.prototype.hasOwnProperty.call(nextState, "loading")) {
            state.loading = !!nextState.loading;
        }
        if (Object.prototype.hasOwnProperty.call(nextState, "error")) {
            state.error = nextState.error || null;
        }
        if (Object.prototype.hasOwnProperty.call(nextState, "done")) {
            state.done = !!nextState.done;
        }
        if (Object.prototype.hasOwnProperty.call(nextState, "requestId")) {
            state.requestId = Math.max(0, Number(nextState.requestId || 0) || 0);
        }
        return getPageState();
    }

    function getPageState() {
        return {
            offset: state.offset,
            cursor: state.cursor,
            total: state.total,
            loading: state.loading,
            error: state.error,
            done: state.done,
            requestId: state.requestId,
        };
    }

    function applyPage(page, { limit = currentPageSize() } = {}) {
        const assets = Array.isArray(page?.assets) ? page.assets : [];
        const total = page?.total == null ? null : Number(page.total) || 0;
        const advance = resolvePageAdvance({
            assets,
            count: page?.count,
            limit: Number(page?.limit || limit) || limit,
            offset: state.offset,
            total,
        });

        const appended = Number(collection?.append?.(assets) || 0) || 0;
        state.offset += advance;
        if (page?.next_cursor != null || page?.nextCursor != null) {
            state.cursor = page.next_cursor || page.nextCursor || null;
        }
        if (page?.total != null) state.total = total;
        if (
            advance <= 0 ||
            page?.has_more === false ||
            page?.hasMore === false ||
            (state.total != null && state.total > 0 && state.offset >= state.total)
        ) {
            state.done = true;
        }

        return { added: appended, advanced: advance };
    }

    async function loadMore() {
        if (state.loading || state.done) return { ok: true, skipped: true };
        if (typeof fetchPage !== "function") {
            state.error = new Error("fetchPage is required");
            return { ok: false, error: state.error };
        }

        const requestId = state.requestId;
        const limit = currentPageSize();
        state.loading = true;
        state.error = null;

        try {
            const page = await fetchPage({
                query: currentQuery(),
                offset: state.offset,
                cursor: state.cursor,
                limit,
                requestId,
            });
            if (requestId !== state.requestId) return { ok: false, stale: true };
            if (!page?.ok) {
                state.error = page?.error || new Error("Failed to load assets");
                return { ok: false, error: state.error };
            }
            const result = applyPage(page, { limit });
            return { ok: true, ...result };
        } catch (error) {
            if (requestId !== state.requestId) return { ok: false, stale: true };
            state.error = error;
            return { ok: false, error };
        } finally {
            if (requestId === state.requestId) state.loading = false;
        }
    }

    async function loadUntilVisible({
        getLimit = currentPageSize,
        canContinue = null,
        beforeApplyPage = null,
        onEmptyPage = null,
        maxEmptyPages = 6,
        fetchPage: pageFetcher = fetchPage,
    } = {}) {
        if (state.loading || state.done) return { ok: true, skipped: true };
        if (typeof pageFetcher !== "function") {
            state.error = new Error("fetchPage is required");
            return { ok: false, error: state.error };
        }

        const requestId = state.requestId;
        state.loading = true;
        state.error = null;

        try {
            const result = await loadPagesUntilVisible({
                maxEmptyPages,
                canContinue,
                getLimit,
                beforeApplyPage,
                onEmptyPage,
                fetchPage: async ({ limit, emptyPageIndex }) => {
                    const page = await pageFetcher({
                        query: currentQuery(),
                        offset: state.offset,
                        cursor: state.cursor,
                        limit,
                        requestId,
                        emptyPageIndex,
                    });
                    if (requestId !== state.requestId) {
                        return { ok: false, stale: true, error: "Stale page" };
                    }
                    return page;
                },
                applyPage: (page, { limit, emptyPageIndex }) => {
                    const pageResult = applyPage(page, { limit, emptyPageIndex });
                    return {
                        ...pageResult,
                        count: Number(page?.count || 0) || 0,
                        total: state.total,
                        done: state.done,
                    };
                },
            });
            if (!result?.ok && !result?.stale && !result?.aborted) {
                state.error = result?.error || new Error("Failed to load assets");
            }
            return result;
        } catch (error) {
            if (requestId !== state.requestId) return { ok: false, stale: true };
            state.error = error;
            return { ok: false, error };
        } finally {
            if (requestId === state.requestId) state.loading = false;
        }
    }

    async function reset(nextQuery = undefined) {
        state.requestId += 1;
        state.offset = 0;
        state.cursor = null;
        state.total = null;
        state.loading = false;
        state.error = null;
        state.done = false;
        collection?.reset?.();
        if (nextQuery !== undefined && query && typeof query === "object" && "value" in query) {
            query.value = nextQuery;
        }
        return loadMore();
    }

    return {
        state,
        items,
        canLoadMore,
        getPageState,
        setPageState,
        applyPage,
        loadMore,
        loadUntilVisible,
        reset,
    };
}
