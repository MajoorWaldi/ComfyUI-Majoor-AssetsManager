export function createJobFinalizeQueue({ defaultDelayMs = 900, postJob } = {}) {
    const timers = new Map();
    const pending = new Set();
    let inFlight = false;

    async function drain() {
        if (inFlight) return;
        inFlight = true;
        try {
            while (pending.size > 0) {
                const next = pending.values().next().value;
                pending.delete(next);
                if (!next) continue;
                // Wrap in Promise.resolve so a synchronous throw from postJob is caught
                // here rather than propagating before the finally block runs, which would
                // permanently lock inFlight=true and halt future drains.
                await Promise.resolve().then(() => postJob?.(next));
            }
        } finally {
            inFlight = false;
            if (pending.size > 0) {
                void drain();
            }
        }
    }

    function schedule(jobId, delayMs = defaultDelayMs) {
        const id = String(jobId || "").trim();
        if (!id) return;
        const existing = timers.get(id);
        if (existing) clearTimeout(existing);
        const timer = setTimeout(
            () => {
                timers.delete(id);
                pending.add(id);
                void drain();
            },
            Math.max(0, Number(delayMs) || 0),
        );
        timers.set(id, timer);
    }

    function dispose() {
        for (const timer of timers.values()) {
            clearTimeout(timer);
        }
        timers.clear();
        pending.clear();
        inFlight = false;
    }

    return {
        schedule,
        dispose,
        _pendingJobIds: pending,
        _timers: timers,
    };
}
