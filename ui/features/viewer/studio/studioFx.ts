/**
 * Pure review-tool maths for the Studio viewer (no DOM): colour filters,
 * guides, aspect masks, scopes, zebra and pixel probing.
 *
 * Colour effects are expressed as SVG filter primitives so the GPU applies
 * them to images *and* playing video alike.
 */

export type StudioChannel = "rgb" | "r" | "g" | "b" | "a" | "l";
export type StudioGrid = "off" | "thirds" | "center" | "safe" | "golden";
export type StudioAspect = "off" | "16:9" | "1:1" | "4:3" | "2.39" | "9:16";
export type StudioScopes = "off" | "hist" | "wave" | "both";
export type StudioCompare =
    "off" | "wipe" | "wipeV" | "side" | "difference" | "add" | "subtract" | "multiply" | "screen";

export interface StudioTools {
    channel: StudioChannel;
    exposure: number; // EV, -5..+5
    gamma: number; // 0.1..3
    zebra: boolean;
    zebraThreshold: number; // 0..1 luma
    scopes: StudioScopes;
    grid: StudioGrid;
    aspect: StudioAspect;
    maskOpacity: number; // 0..1
    probe: boolean;
    loupe: boolean;
    loupeSize: number;
    loupeZoom: number;
    compare: StudioCompare;
    wipe: number; // 0..100
}

export function defaultStudioTools(): StudioTools {
    return {
        channel: "rgb",
        exposure: 0,
        gamma: 1,
        zebra: false,
        zebraThreshold: 0.95,
        scopes: "off",
        grid: "off",
        aspect: "off",
        maskOpacity: 0.65,
        probe: false,
        loupe: false,
        loupeSize: 140,
        loupeZoom: 8,
        compare: "off",
        wipe: 50,
    };
}

/** Rec.709 luma. */
const LR = 0.2126;
const LG = 0.7152;
const LB = 0.0722;

/** feColorMatrix `values` (4x5) isolating a channel as greyscale, or null for RGB. */
export function channelMatrix(channel: StudioChannel): string | null {
    const grey = (r: number, g: number, b: number, a = 0) =>
        [r, g, b, a, 0, r, g, b, a, 0, r, g, b, a, 0].join(" ");
    switch (channel) {
        case "r":
            return `${grey(1, 0, 0)} 0 0 0 1 0`;
        case "g":
            return `${grey(0, 1, 0)} 0 0 0 1 0`;
        case "b":
            return `${grey(0, 0, 1)} 0 0 0 1 0`;
        case "l":
            return `${grey(LR, LG, LB)} 0 0 0 1 0`;
        case "a":
            // Alpha shown as greyscale on an opaque canvas.
            return `${grey(0, 0, 0, 1)} 0 0 0 0 1`;
        default:
            return null;
    }
}

export function exposureSlope(ev: number): number {
    const safe = Number.isFinite(ev) ? Math.max(-10, Math.min(10, ev)) : 0;
    return Math.pow(2, safe);
}

/** Display gamma: out = in^(1/gamma). */
export function gammaExponent(gamma: number): number {
    const g = Number.isFinite(gamma) && gamma > 0 ? gamma : 1;
    return 1 / g;
}

export function hasColorFx(tools: Pick<StudioTools, "channel" | "exposure" | "gamma">): boolean {
    return (
        tools.channel !== "rgb" ||
        Math.abs(tools.exposure) > 1e-3 ||
        Math.abs(tools.gamma - 1) > 1e-3
    );
}

export function aspectRatioValue(aspect: StudioAspect): number | null {
    switch (aspect) {
        case "16:9":
            return 16 / 9;
        case "1:1":
            return 1;
        case "4:3":
            return 4 / 3;
        case "2.39":
            return 2.39;
        case "9:16":
            return 9 / 16;
        default:
            return null;
    }
}

/** Largest centred rect of `aspect` inside w×h (the visible area of the mask). */
export function aspectRect(
    w: number,
    h: number,
    aspect: StudioAspect,
): { x: number; y: number; w: number; h: number } | null {
    const ratio = aspectRatioValue(aspect);
    if (!ratio || w <= 0 || h <= 0) return null;
    let rw = w;
    let rh = w / ratio;
    if (rh > h) {
        rh = h;
        rw = h * ratio;
    }
    return { x: (w - rw) / 2, y: (h - rh) / 2, w: rw, h: rh };
}

export interface GuideLine {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
}
export interface GuideRect {
    x: number;
    y: number;
    w: number;
    h: number;
}

/** Guide lines / rectangles in image pixel coordinates. */
export function gridGuides(
    w: number,
    h: number,
    grid: StudioGrid,
): { lines: GuideLine[]; rects: GuideRect[] } {
    const lines: GuideLine[] = [];
    const rects: GuideRect[] = [];
    if (w <= 0 || h <= 0 || grid === "off") return { lines, rects };
    const v = (f: number) => lines.push({ x1: w * f, y1: 0, x2: w * f, y2: h });
    const hz = (f: number) => lines.push({ x1: 0, y1: h * f, x2: w, y2: h * f });
    if (grid === "thirds") {
        v(1 / 3);
        v(2 / 3);
        hz(1 / 3);
        hz(2 / 3);
    } else if (grid === "golden") {
        const g = 0.381966;
        v(g);
        v(1 - g);
        hz(g);
        hz(1 - g);
    } else if (grid === "center") {
        v(0.5);
        hz(0.5);
    } else if (grid === "safe") {
        // Action safe (90 %) and title safe (80 %).
        for (const f of [0.9, 0.8]) {
            rects.push({ x: (w * (1 - f)) / 2, y: (h * (1 - f)) / 2, w: w * f, h: h * f });
        }
        v(0.5);
        hz(0.5);
    }
    return { lines, rects };
}

export function luma(r: number, g: number, b: number): number {
    return LR * r + LG * g + LB * b;
}

export interface Histogram {
    r: Uint32Array;
    g: Uint32Array;
    b: Uint32Array;
    l: Uint32Array;
    max: number;
}

/** 256-bin RGB + luma histogram of RGBA pixel data (alpha-weighted pixels skipped when transparent). */
export function computeHistogram(data: Uint8ClampedArray | number[]): Histogram {
    const r = new Uint32Array(256);
    const g = new Uint32Array(256);
    const b = new Uint32Array(256);
    const l = new Uint32Array(256);
    for (let i = 0; i + 3 < data.length; i += 4) {
        if (data[i + 3] === 0) continue;
        r[data[i]] += 1;
        g[data[i + 1]] += 1;
        b[data[i + 2]] += 1;
        l[Math.round(luma(data[i], data[i + 1], data[i + 2]))] += 1;
    }
    let max = 1;
    for (let k = 1; k < 255; k++) max = Math.max(max, r[k], g[k], b[k], l[k]);
    return { r, g, b, l, max };
}

/**
 * Luma waveform: `columns` × 256 density grid (column-major by image x),
 * values are counts of pixels at that luma in that column.
 */
export function computeWaveform(
    data: Uint8ClampedArray | number[],
    width: number,
    height: number,
    columns = 256,
): { columns: number; bins: Uint32Array; max: number } {
    const cols = Math.max(1, Math.min(columns, width));
    const bins = new Uint32Array(cols * 256);
    let max = 1;
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const i = (y * width + x) * 4;
            if (data[i + 3] === 0) continue;
            const c = Math.min(cols - 1, Math.floor((x * cols) / width));
            const v = Math.round(luma(data[i], data[i + 1], data[i + 2]));
            const idx = c * 256 + v;
            bins[idx] += 1;
            if (bins[idx] > max) max = bins[idx];
        }
    }
    return { columns: cols, bins, max };
}

/** Zebra stripes over pixels whose luma >= threshold (RGBA overlay, transparent elsewhere). */
export function computeZebra(
    data: Uint8ClampedArray | number[],
    width: number,
    height: number,
    threshold: number,
    phase = 0,
): Uint8ClampedArray<ArrayBuffer> {
    const out = new Uint8ClampedArray(new ArrayBuffer(width * height * 4));
    const limit = Math.max(0, Math.min(1, threshold)) * 255;
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const i = (y * width + x) * 4;
            if (luma(data[i], data[i + 1], data[i + 2]) < limit) continue;
            const stripe = Math.floor((x + y + phase) / 4) % 2 === 0;
            out[i] = stripe ? 255 : 20;
            out[i + 1] = stripe ? 40 : 20;
            out[i + 2] = stripe ? 40 : 20;
            out[i + 3] = 200;
        }
    }
    return out;
}

/** Size that fits `w×h` within `max` on the long edge (for cheap sampling). */
export function sampleSize(w: number, h: number, max = 256): { w: number; h: number } {
    if (w <= 0 || h <= 0) return { w: 0, h: 0 };
    const scale = Math.min(1, max / Math.max(w, h));
    return { w: Math.max(1, Math.round(w * scale)), h: Math.max(1, Math.round(h * scale)) };
}

export function formatProbe(
    r: number,
    g: number,
    b: number,
    a: number,
): { hex: string; rgb: string; luma: string } {
    const hex =
        `#${[r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("")}`.toUpperCase();
    return {
        hex,
        rgb: `${r}, ${g}, ${b}${a < 255 ? ` · α ${a}` : ""}`,
        luma: `${Math.round((luma(r, g, b) / 255) * 100)}%`,
    };
}

/** CSS mix-blend-mode for blend compare modes, or null. */
export function compareBlendMode(mode: StudioCompare): string | null {
    switch (mode) {
        case "difference":
            return "difference";
        case "add":
            return "plus-lighter";
        case "multiply":
            return "multiply";
        case "screen":
            return "screen";
        default:
            return null;
    }
}

export const COMPARE_MODES: { value: StudioCompare; label: string; imageOnly?: boolean }[] = [
    { value: "wipe", label: "Wipe ↔" },
    { value: "wipeV", label: "Wipe ↕" },
    { value: "side", label: "Side by side" },
    { value: "difference", label: "Difference" },
    { value: "add", label: "Add" },
    { value: "subtract", label: "Subtract", imageOnly: true },
    { value: "multiply", label: "Multiply" },
    { value: "screen", label: "Screen" },
];

/**
 * Next index from `from` (stepping `delta`, wrapping) whose asset matches
 * `accept`; never returns `from` itself. Null when nothing matches.
 */
export function nextCompareIndex<T>(
    list: readonly T[],
    from: number,
    delta: number,
    accept: (item: T, index: number) => boolean = () => true,
): number | null {
    const n = list.length;
    if (n < 2) return null;
    const step = delta < 0 ? -1 : 1;
    for (let k = 1; k < n; k++) {
        const i = (((from + step * k) % n) + n) % n;
        if (i !== from && accept(list[i], i)) return i;
    }
    return null;
}
