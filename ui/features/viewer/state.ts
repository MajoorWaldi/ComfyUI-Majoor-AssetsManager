export function clamp01(v: number): number {
    const n = Number(v);
    if (!Number.isFinite(n)) return 0;
    return Math.max(0, Math.min(1, n));
}

export function clamp(v: number, min: number, max: number): number {
    const n = Number(v);
    if (!Number.isFinite(n)) return Number(min);
    return Math.max(Number(min), Math.min(Number(max), n));
}
