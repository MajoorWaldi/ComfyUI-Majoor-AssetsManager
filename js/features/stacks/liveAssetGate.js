function _normalizeJobId(jobId) {
    return String(jobId || "").trim();
}

function _assetFileKey(detail) {
    const filename = String(detail?.filename || "").trim();
    const filepath = String(detail?.filepath || "").trim();
    const subfolder = String(detail?.subfolder || "").trim();
    const type = String(detail?.type || detail?.source || "output")
        .trim()
        .toLowerCase();
    const rootId = String(detail?.root_id || detail?.custom_root_id || "").trim();
    return `${type}|${rootId}|${subfolder}|${filename || filepath}`;
}

function _copyWithJobId(detail, jobId) {
    if (!jobId) return detail;
    if (String(detail?.job_id || "").trim() === jobId) return detail;
    return { ...(detail || {}), job_id: jobId };
}

export function createLiveAssetGate() {
    const pendingJobs = new Map();

    function markPendingJob(jobId, { files = [], expectedCount = null } = {}) {
        const normalizedJobId = _normalizeJobId(jobId);
        if (!normalizedJobId) return;
        const fileKeys = new Set();
        for (const file of Array.isArray(files) ? files : []) {
            const key = _assetFileKey(file);
            if (key) fileKeys.add(key);
        }
        pendingJobs.set(normalizedJobId, {
            expectedCount: Math.max(0, Number(expectedCount ?? fileKeys.size) || 0),
            fileKeys,
        });
    }

    function clearPendingJob(jobId) {
        const normalizedJobId = _normalizeJobId(jobId);
        if (!normalizedJobId) return;
        pendingJobs.delete(normalizedJobId);
    }

    function resolveJobId(detail) {
        const explicit = _normalizeJobId(detail?.job_id);
        if (explicit) return explicit;
        const key = _assetFileKey(detail);
        if (!key) return "";
        for (const [jobId, meta] of pendingJobs.entries()) {
            if (meta?.fileKeys?.has?.(key)) return jobId;
        }
        return "";
    }

    function prepare(detail) {
        const jobId = resolveJobId(detail);
        if (!jobId) return { detail, jobId: "", defer: false };
        const normalizedDetail = _copyWithJobId(detail, jobId);
        const pending = pendingJobs.get(jobId);
        if (!pending) return { detail: normalizedDetail, jobId, defer: false };
        const stackId = String(normalizedDetail?.stack_id || "").trim();
        const expectedCount = Math.max(0, Number(pending?.expectedCount || 0) || 0);
        const isMultiOutput = expectedCount > 1;
        return {
            detail: normalizedDetail,
            jobId,
            defer: isMultiOutput && !stackId,
        };
    }

    return {
        markPendingJob,
        clearPendingJob,
        resolveJobId,
        prepare,
        _pendingJobs: pendingJobs,
    };
}
