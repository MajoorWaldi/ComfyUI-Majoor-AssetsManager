/** Rating tags hydration helpers extracted from GridView_impl.js (P3-B-01). */

export function getRtHydrateState(gridContainer, mapRef) {
    try {
        if (!gridContainer) return null;
        let s = mapRef.get(gridContainer);
        if (!s) {
            s = { queue: [], inflight: 0, seen: new Set(), active: new Set(), lastPruneAt: 0 };
            mapRef.set(gridContainer, s);
        }
        return s;
    } catch {
        return null;
    }
}

export function pruneRatingTagsHydrateSeen(st, max, ttlMs, budgetRef) {
    if (!st || !st.seen) return;
    const now = Date.now();
    const needsSizePrune = st.seen.size > max;
    const needsTimePrune =
        st.lastPruneAt > 0 && (now - st.lastPruneAt) > ttlMs && st.seen.size > Math.max(1000, Math.floor(max / 4));
    if (!needsSizePrune && !needsTimePrune) return;
    if (budgetRef.value > 0) {
        budgetRef.value -= 1;
        return;
    }
    st.seen.clear();
    st.lastPruneAt = now;
}

export function updateCardRatingTagsBadges(card, rating, tags, deps) {
    if (!card) return;
    try {
        if (!card.isConnected) return;
    } catch {}
    const thumb = card.querySelector?.(".mjr-thumb");
    if (!thumb) return;

    const oldRatingBadge = thumb.querySelector?.(".mjr-rating-badge");
    const ratingValue = Math.max(0, Math.min(5, Number(rating) || 0));
    if (ratingValue <= 0) {
        try {
            oldRatingBadge?.remove?.();
        } catch {}
    } else if (!oldRatingBadge) {
        const nextRatingBadge = deps.createRatingBadge(ratingValue);
        if (nextRatingBadge) thumb.appendChild(nextRatingBadge);
    } else {
        try {
            const cur = oldRatingBadge.querySelectorAll?.("span")?.length || 0;
            if (cur !== ratingValue) {
                const stars = [];
                for (let i = 0; i < ratingValue; i++) {
                    const star = document.createElement("span");
                    star.textContent = "★";
                    star.style.color = "var(--mjr-rating-color, var(--mjr-star-active, #FFD45A))";
                    star.style.marginRight = i < ratingValue - 1 ? "2px" : "0";
                    stars.push(star);
                }
                oldRatingBadge.replaceChildren(...stars);
            }
        } catch {}
    }

    const oldTagsBadge = thumb.querySelector?.(".mjr-tags-badge");
    if (oldTagsBadge) {
        if (Array.isArray(tags) && tags.length) {
            oldTagsBadge.textContent = tags.join(", ");
            oldTagsBadge.style.display = "";
        } else {
            oldTagsBadge.textContent = "";
            oldTagsBadge.style.display = "none";
        }
    } else {
        const nextTagsBadge = deps.createTagsBadge(Array.isArray(tags) ? tags : []);
        thumb.appendChild(nextTagsBadge);
    }
}

export function pumpRatingTagsHydration(gridContainer, deps) {
    const st = getRtHydrateState(gridContainer, deps.stateMap);
    if (!st) return;
    while (st.inflight < deps.concurrency && st.queue.length) {
        const job = st.queue.shift();
        if (!job) break;
        st.inflight += 1;
        (async () => {
            const res = await deps.hydrateAssetRatingTags(job.id);
            if (!res || !res.ok || !res.data) return;
            const updated = res.data;
            const rating = Number(updated.rating || 0) || 0;
            const tags = Array.isArray(updated.tags) ? updated.tags : [];
            try {
                if (job.asset) {
                    job.asset.rating = rating;
                    job.asset.tags = tags;
                }
            } catch {}
            updateCardRatingTagsBadges(job.card, rating, tags, deps);
            deps.safeDispatchCustomEvent(deps.events.rating, { assetId: String(job.id), rating }, { warnPrefix: "[GridView]" });
            deps.safeDispatchCustomEvent(deps.events.tags, { assetId: String(job.id), tags }, { warnPrefix: "[GridView]" });
        })()
            .catch(() => null)
            .finally(() => {
                try {
                    st.active.delete(String(job.id));
                } catch {}
                st.inflight -= 1;
                pumpRatingTagsHydration(gridContainer, deps);
            });
    }
}

export function enqueueRatingTagsHydration(gridContainer, card, asset, deps) {
    const id = asset?.id != null ? String(asset.id) : "";
    if (!id) return;
    const st = getRtHydrateState(gridContainer, deps.stateMap);
    if (!st) return;
    if (st.seen.has(id)) return;

    const rating = Number(asset?.rating || 0) || 0;
    const tags = asset?.tags;
    const tagsEmpty = !(Array.isArray(tags) && tags.length);
    if (rating > 0 && !tagsEmpty) {
        st.seen.add(id);
        return;
    }
    if (rating > 0 || !tagsEmpty) {
        st.seen.add(id);
        return;
    }
    try {
        while (st.queue.length >= deps.queueMax) {
            const dropped = st.queue.shift();
            try {
                if (dropped?.id) st.active.delete(String(dropped.id));
            } catch {}
            try {
                if (dropped?.id) st.seen.delete(String(dropped.id));
            } catch {}
        }
    } catch {}
    st.seen.add(id);
    pruneRatingTagsHydrateSeen(st, deps.seenMax, deps.seenTtlMs, deps.pruneBudgetRef);
    try {
        st.active.add(id);
    } catch {}
    st.queue.push({ id, card, asset });
    pumpRatingTagsHydration(gridContainer, deps);
}
