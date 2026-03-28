function _normalizeJobId(jobId) {
    return String(jobId || "").trim();
}

function _assetBufferKey(file) {
    const filename = String(file?.filename || "").trim();
    const subfolder = String(file?.subfolder || "").trim();
    const type = String(file?.type || "output")
        .trim()
        .toLowerCase();
    const rootId = String(file?.root_id || file?.custom_root_id || "").trim();
    return `${type}|${rootId}|${subfolder}|${filename}`;
}

export function createExecutionAssetBuffer() {
    const jobs = new Map();

    function add(jobId, files) {
        const normalizedJobId = _normalizeJobId(jobId);
        if (!normalizedJobId) return [];
        const list = Array.isArray(files) ? files : [];
        if (!list.length) return [];
        let bucket = jobs.get(normalizedJobId);
        if (!bucket) {
            bucket = new Map();
            jobs.set(normalizedJobId, bucket);
        }
        for (const file of list) {
            const key = _assetBufferKey(file);
            if (!key) continue;
            bucket.set(key, { ...(bucket.get(key) || {}), ...(file || {}) });
        }
        return Array.from(bucket.values());
    }

    function take(jobId) {
        const normalizedJobId = _normalizeJobId(jobId);
        if (!normalizedJobId) return [];
        const bucket = jobs.get(normalizedJobId);
        jobs.delete(normalizedJobId);
        return Array.from(bucket?.values?.() || []);
    }

    function clear(jobId) {
        const normalizedJobId = _normalizeJobId(jobId);
        if (!normalizedJobId) return;
        jobs.delete(normalizedJobId);
    }

    return {
        add,
        take,
        clear,
        _jobs: jobs,
    };
}
