export function drawWorkflowMinimap(canvas, workflow, options = null) {
    if (!canvas) return;
    const ctx = canvas.getContext?.("2d");
    if (!ctx) return;

    const settings = {
        nodeColors: true,
        showLinks: true,
        showGroups: true,
        renderBypassState: true,
        renderErrorState: true,
        showViewport: true,
        ...(options && typeof options === "object" ? options : {}),
    };

    const nodes = Array.isArray(workflow?.nodes) ? workflow.nodes : [];
    const groups =
        (Array.isArray(workflow?.groups) && workflow.groups) ||
        (Array.isArray(workflow?.extra?.groups) && workflow.extra.groups) ||
        (Array.isArray(workflow?.extra?.groupNodes) && workflow.extra.groupNodes) ||
        (Array.isArray(workflow?.extra?.group_nodes) && workflow.extra.group_nodes) ||
        [];
    const links =
        (Array.isArray(workflow?.links) && workflow.links) ||
        (Array.isArray(workflow?.extra?.links) && workflow.extra.links) ||
        [];

    const cw = Math.max(1, canvas.clientWidth || canvas.width || 1);
    const ch = Math.max(1, canvas.clientHeight || canvas.height || 1);

    if ((!nodes || nodes.length === 0) && (!groups || groups.length === 0)) {
        ctx.clearRect(0, 0, cw, ch);
        return;
    }

    const toRgba = (color, alpha) => {
        if (!color) return `rgba(255,255,255,${alpha})`;
        if (typeof color !== "string") return `rgba(255,255,255,${alpha})`;
        const s = color.trim();
        if (!s) return `rgba(255,255,255,${alpha})`;

        // rgba(...) -> override alpha
        const mRgba = s.match(/^rgba?\((\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([0-9.]+))?\)\s*$/i);
        if (mRgba) {
            const r = Number(mRgba[1]);
            const g = Number(mRgba[2]);
            const b = Number(mRgba[3]);
            if ([r, g, b].every((v) => Number.isFinite(v))) return `rgba(${r},${g},${b},${alpha})`;
        }

        // #rgb / #rrggbb
        const hex = s.startsWith("#") ? s.slice(1) : "";
        if (hex.length === 3) {
            const r = parseInt(hex[0] + hex[0], 16);
            const g = parseInt(hex[1] + hex[1], 16);
            const b = parseInt(hex[2] + hex[2], 16);
            if ([r, g, b].every((v) => Number.isFinite(v))) return `rgba(${r},${g},${b},${alpha})`;
        }
        if (hex.length === 6) {
            const r = parseInt(hex.slice(0, 2), 16);
            const g = parseInt(hex.slice(2, 4), 16);
            const b = parseInt(hex.slice(4, 6), 16);
            if ([r, g, b].every((v) => Number.isFinite(v))) return `rgba(${r},${g},${b},${alpha})`;
        }

        // Otherwise keep as-is (named colors) with globalAlpha.
        return s;
    };

    const rects = [];
    const nodesById = new Map();

    const normalizeVec2 = (value) => {
        if (Array.isArray(value) && value.length >= 2) return [Number(value[0]), Number(value[1])];
        if (value && typeof value === "object") {
            const a = value[0] ?? value["0"] ?? value.x ?? value.left ?? null;
            const b = value[1] ?? value["1"] ?? value.y ?? value.top ?? null;
            if (a !== null && b !== null) return [Number(a), Number(b)];
        }
        return null;
    };

    const normalizeSize2 = (value) => {
        if (Array.isArray(value) && value.length >= 2) return [Number(value[0]), Number(value[1])];
        if (value && typeof value === "object") {
            const w = value[0] ?? value["0"] ?? value.w ?? value.width ?? null;
            const h = value[1] ?? value["1"] ?? value.h ?? value.height ?? null;
            if (w !== null && h !== null) return [Number(w), Number(h)];
        }
        return null;
    };

    for (const n of nodes || []) {
        const nodeIdRaw = n?.id ?? n?.ID ?? n?.node_id ?? null;
        const nodeId = nodeIdRaw !== null && nodeIdRaw !== undefined ? String(nodeIdRaw) : null;
        const pos = normalizeVec2(n?.pos);
        const size = normalizeSize2(n?.size);
        if (!pos) continue;
        if (!size) continue;
        const x = Number(pos[0]);
        const y = Number(pos[1]);
        const w = Math.max(1, Number(size[0]));
        const h = Math.max(1, Number(size[1]));
        if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(w) || !Number.isFinite(h)) continue;

        const mode = Number(n?.mode);
        const bypassed = mode === 2 || mode === 4;

        const errExtra = workflow?.extra?.errors || workflow?.extra?.node_errors || null;
        const errByNodeId =
            errExtra && typeof errExtra === "object" && nodeId ? errExtra[nodeId] : null;
        const errored = Boolean(
            errByNodeId ||
                n?.error ||
                n?.errors ||
                n?.flags?.error ||
                n?.properties?.error
        );

        rects.push({
            kind: "node",
            id: nodeId,
            x,
            y,
            w,
            h,
            fill: settings.nodeColors ? n?.bgcolor || n?.color || null : null,
            stroke: settings.nodeColors ? n?.color || n?.bgcolor || null : null,
            bypassed,
            errored,
        });
        if (nodeId) nodesById.set(nodeId, rects[rects.length - 1]);
    }
    if (settings.showGroups) {
        for (const g of groups || []) {
        // Some exports use `bounding: [x,y,w,h]` instead of pos/size.
        const bounding = Array.isArray(g?.bounding) && g.bounding.length >= 4 ? g.bounding : null;
        const pos = bounding ? [Number(bounding[0]), Number(bounding[1])] : normalizeVec2(g?.pos);
        const size = bounding ? [Number(bounding[2]), Number(bounding[3])] : normalizeSize2(g?.size);
        if (!pos || !size) continue;
        const x = Number(pos[0]);
        const y = Number(pos[1]);
        const w = Math.max(1, Number(size[0]));
        const h = Math.max(1, Number(size[1]));
        if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(w) || !Number.isFinite(h)) continue;
        rects.push({
            kind: "group",
            x,
            y,
            w,
            h,
            fill: g?.color || g?.bgcolor || g?.borderColor || null,
            stroke: g?.borderColor || g?.color || g?.bgcolor || null,
        });
        }
    }

    if (!rects.length) {
        ctx.clearRect(0, 0, cw, ch);
        return;
    }

    let minX = rects[0].x;
    let minY = rects[0].y;
    let maxX = rects[0].x + rects[0].w;
    let maxY = rects[0].y + rects[0].h;
    for (const r of rects) {
        minX = Math.min(minX, r.x);
        minY = Math.min(minY, r.y);
        maxX = Math.max(maxX, r.x + r.w);
        maxY = Math.max(maxY, r.y + r.h);
    }

    const pad = 6;
    const viewW = Math.max(1, maxX - minX);
    const viewH = Math.max(1, maxY - minY);
    const scale = Math.min((cw - pad * 2) / viewW, (ch - pad * 2) / viewH);

    ctx.clearRect(0, 0, cw, ch);

    // Background
    ctx.fillStyle = "rgba(0,0,0,0.22)";
    ctx.fillRect(0, 0, cw, ch);

    const toCanvas = (x, y) => ({
        x: pad + (x - minX) * scale,
        y: pad + (y - minY) * scale,
    });

    const drawLinks = () => {
        if (!settings.showLinks) return;
        if (!links || links.length === 0) return;

        ctx.save();
        ctx.globalAlpha = 1;
        ctx.strokeStyle = "rgba(255,255,255,0.18)";
        ctx.lineWidth = 1;

        for (const l of links) {
            let originId = null;
            let targetId = null;

            if (Array.isArray(l) && l.length >= 4) {
                // LiteGraph format: [id, origin_id, origin_slot, target_id, target_slot, type]
                originId = l[1];
                targetId = l[3];
            } else if (l && typeof l === "object") {
                originId = l.origin_id ?? l.originId ?? l.from ?? null;
                targetId = l.target_id ?? l.targetId ?? l.to ?? null;
            }

            if (originId === null || targetId === null) continue;
            const a = nodesById.get(String(originId));
            const b = nodesById.get(String(targetId));
            if (!a || !b) continue;

            // Use right/left ports for a more ComfyUI-like look.
            const aP = toCanvas(a.x + a.w, a.y + a.h / 2);
            const bP = toCanvas(b.x, b.y + b.h / 2);
            const dx = Math.max(12, Math.min(80, Math.abs(bP.x - aP.x) * 0.35));

            ctx.beginPath();
            ctx.moveTo(aP.x, aP.y);
            ctx.bezierCurveTo(aP.x + dx, aP.y, bP.x - dx, bP.y, bP.x, bP.y);
            ctx.stroke();
        }
        ctx.restore();
    };

    const drawRect = (r) => {
        const x = pad + (r.x - minX) * scale;
        const y = pad + (r.y - minY) * scale;
        const w = Math.max(1, r.w * scale);
        const h = Math.max(1, r.h * scale);

        const isNode = r.kind === "node";
        const isGroup = r.kind === "group";

        const bypassed = Boolean(r.bypassed);
        const errored = Boolean(r.errored);

        const fillAlpha = isGroup ? 0.18 : bypassed && settings.renderBypassState ? 0.14 : 0.62;
        const strokeAlpha = isGroup ? 0.55 : bypassed && settings.renderBypassState ? 0.32 : 0.8;

        const fill = toRgba(r.fill, fillAlpha);
        const stroke = toRgba(r.stroke, strokeAlpha);

        // Fill
        ctx.save();
        ctx.globalAlpha = 1;
        if (typeof fill === "string" && (fill.startsWith("#") || fill.startsWith("rgb") || fill.startsWith("hsl"))) {
            ctx.fillStyle = fill;
            ctx.globalAlpha = fillAlpha;
        } else {
            ctx.fillStyle = typeof fill === "string" ? fill : "rgba(255,255,255,0.20)";
            ctx.globalAlpha = fillAlpha;
        }
        ctx.fillRect(x, y, w, h);
        ctx.restore();

        ctx.globalAlpha = 1;
        ctx.strokeStyle = "rgba(255,255,255,0.22)";
        if (typeof stroke === "string" && (stroke.startsWith("#") || stroke.startsWith("rgb") || stroke.startsWith("hsl"))) {
            ctx.save();
            ctx.globalAlpha = strokeAlpha;
            ctx.strokeStyle = stroke;
            ctx.restore();
        }
        if (isNode && bypassed && settings.renderBypassState) {
            try {
                ctx.setLineDash([3, 2]);
            } catch (e) { console.debug?.(e); }
        } else {
            try {
                ctx.setLineDash([]);
            } catch (e) { console.debug?.(e); }
        }

        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, w, h);

        if (isNode && errored && settings.renderErrorState) {
            try {
                ctx.setLineDash([]);
            } catch (e) { console.debug?.(e); }
            ctx.strokeStyle = "rgba(244,67,54,0.95)";
            ctx.lineWidth = 1.5;
            ctx.strokeRect(x - 0.5, y - 0.5, w + 1, h + 1);
        }
    };

    // Groups first (backdrops), then nodes on top.
    for (const r of rects.filter((r) => r.kind === "group")) drawRect(r);
    drawLinks();
    for (const r of rects.filter((r) => r.kind === "node")) drawRect(r);

    // Viewport rectangle (ComfyUI-like): only meaningful when we can read the current canvas DS.
    if (settings.showViewport) {
        try {
            const app = window?.app || null;
            const canvasEl = app?.canvas?.canvas || app?.canvas?.el || null;
            const ds = app?.canvas?.ds || null;
            const scaleDs = Number(ds?.scale);
            const off = ds?.offset;
            const offX = Array.isArray(off) ? Number(off[0]) : Number(off?.x);
            const offY = Array.isArray(off) ? Number(off[1]) : Number(off?.y);
            const viewWpx = Number(canvasEl?.clientWidth || canvasEl?.width);
            const viewHpx = Number(canvasEl?.clientHeight || canvasEl?.height);

            if (
                Number.isFinite(scaleDs) &&
                scaleDs > 0 &&
                Number.isFinite(offX) &&
                Number.isFinite(offY) &&
                Number.isFinite(viewWpx) &&
                Number.isFinite(viewHpx) &&
                viewWpx > 0 &&
                viewHpx > 0
            ) {
                const vx0 = (-offX) / scaleDs;
                const vy0 = (-offY) / scaleDs;
                const vx1 = (viewWpx - offX) / scaleDs;
                const vy1 = (viewHpx - offY) / scaleDs;

                const p0 = toCanvas(vx0, vy0);
                const p1 = toCanvas(vx1, vy1);
                const rx = Math.min(p0.x, p1.x);
                const ry = Math.min(p0.y, p1.y);
                const rw = Math.abs(p1.x - p0.x);
                const rh = Math.abs(p1.y - p0.y);

                ctx.save();
                ctx.globalAlpha = 1;
                ctx.strokeStyle = "rgba(255,255,255,0.9)";
                ctx.lineWidth = 1;
                ctx.strokeRect(rx, ry, rw, rh);
                ctx.restore();
            }
        } catch (e) { console.debug?.(e); }
    }

    ctx.globalAlpha = 1;
}

export function synthesizeWorkflowFromPromptGraph(promptGraph, options = null) {
    if (!promptGraph || typeof promptGraph !== "object") return null;
    const settings = {
        maxNodes: 220,
        ...(options && typeof options === "object" ? options : {}),
    };

    const entries = Object.entries(promptGraph);
    if (!entries.length) return null;

    const nodes = [];
    const edges = [];
    const depsById = new Map();

    const toStrId = (v) => {
        if (v === null || v === undefined) return null;
        const s = String(v);
        return s ? s : null;
    };

    const isLink = (v) => Array.isArray(v) && v.length === 2 && Number.isFinite(Number(v[0]));

    for (const [idRaw, node] of entries.slice(0, settings.maxNodes)) {
        if (!node || typeof node !== "object") continue;
        const id = toStrId(idRaw);
        if (!id) continue;
        const classType = String(node.class_type || node.type || node.classType || "").trim();
        const inputs = node.inputs && typeof node.inputs === "object" ? node.inputs : {};

        const deps = [];
        for (const v of Object.values(inputs)) {
            if (!isLink(v)) continue;
            const src = toStrId(v[0]);
            if (!src) continue;
            deps.push(src);
            edges.push([src, id]);
        }
        depsById.set(id, deps);

        // Basic color heuristic (only for minimap readability).
        const ctLower = classType.toLowerCase();
        let bgcolor = "#3a3a3a";
        let color = "#6b6b6b";
        if (ctLower.includes("ksampler") || ctLower.includes("sampler")) {
            bgcolor = "#6a4b1f";
            color = "#b07a2c";
        } else if (ctLower.includes("cliptext") || ctLower.includes("textencode") || ctLower.includes("conditioning")) {
            bgcolor = "#1f5f3a";
            color = "#2cb06c";
        } else if (ctLower.includes("checkpoint") || ctLower.includes("loader") || ctLower.includes("model")) {
            bgcolor = "#243a6a";
            color = "#3f6fd6";
        } else if (ctLower.includes("save") || ctLower.includes("preview") || ctLower.includes("video")) {
            bgcolor = "#4a2a5f";
            color = "#8c4cd1";
        }

        nodes.push({
            id: Number.isFinite(Number(id)) ? Number(id) : id,
            type: classType || "Node",
            pos: [0, 0],
            size: [180, 80],
            bgcolor,
            color,
            inputs: [],
            outputs: [],
        });
    }

    if (!nodes.length) return null;

    // Topological-ish layering (best-effort).
    const levelById = new Map();
    const visiting = new Set();

    const computeLevel = (id) => {
        if (levelById.has(id)) return levelById.get(id);
        if (visiting.has(id)) return 0;
        visiting.add(id);
        let best = 0;
        const deps = depsById.get(id) || [];
        for (const dep of deps) best = Math.max(best, computeLevel(dep) + 1);
        visiting.delete(id);
        levelById.set(id, best);
        return best;
    };

    for (const n of nodes) computeLevel(String(n.id));

    // Place nodes by level then index within level.
    const nodesByLevel = new Map();
    for (const n of nodes) {
        const lvl = levelById.get(String(n.id)) ?? 0;
        if (!nodesByLevel.has(lvl)) nodesByLevel.set(lvl, []);
        nodesByLevel.get(lvl).push(n);
    }
    const levels = Array.from(nodesByLevel.keys()).sort((a, b) => a - b);
    for (const lvl of levels) {
        const bucket = nodesByLevel.get(lvl) || [];
        bucket.sort((a, b) => Number(a.id) - Number(b.id));
        for (let i = 0; i < bucket.length; i++) {
            bucket[i].pos = [lvl * 220, i * 110];
        }
    }

    // Convert edges to litegraph-style links array.
    // [id, origin_id, origin_slot, target_id, target_slot, type]
    let linkId = 1;
    const links = edges
        .filter(([a, b]) => a !== b)
        .slice(0, 4000)
        .map(([a, b]) => [linkId++, Number.isFinite(Number(a)) ? Number(a) : a, 0, Number.isFinite(Number(b)) ? Number(b) : b, 0, "LINK"]);

    return { id: "synthetic", nodes, links, extra: { synthetic: true } };
}
