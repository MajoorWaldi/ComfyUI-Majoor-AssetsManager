const MINIMAP_PADDING = 6;
const MINIMAP_ZOOM_MIN = 1;
const MINIMAP_ZOOM_MAX = 8;
import { getWorkflowNodeDisplayName } from "../../../features/viewer/workflowGraphMap/workflowNodeLabeling.js";

const TYPE_PALETTE = [
    ["sampler", "#8e5cff"],
    ["ksampler", "#8e5cff"],
    ["loader", "#4f8cff"],
    ["load", "#4f8cff"],
    ["clip", "#d4a634"],
    ["vae", "#36a7c9"],
    ["latent", "#47a56d"],
    ["image", "#8fb04a"],
    ["video", "#c47b3d"],
    ["mask", "#999999"],
    ["conditioning", "#b56bd8"],
    ["controlnet", "#c44f76"],
    ["lora", "#d27a45"],
    ["save", "#4aa37c"],
    ["preview", "#4aa37c"],
    ["api", "#3aa6a6"],
];

const clampNumber = (value, min, max) => {
    const n = Number(value);
    if (!Number.isFinite(n)) return min;
    return Math.max(min, Math.min(max, n));
};

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
        showNodeLabels: false,
        ...(options && typeof options === "object" ? options : {}),
    };

    const renderWorkflow = expandSubgraphsForMinimap(workflow);
    const nodes = Array.isArray(renderWorkflow?.nodes) ? renderWorkflow.nodes : [];
    const groups =
        (Array.isArray(renderWorkflow?.groups) && renderWorkflow.groups) ||
        (Array.isArray(renderWorkflow?.extra?.groups) && renderWorkflow.extra.groups) ||
        (Array.isArray(renderWorkflow?.extra?.groupNodes) && renderWorkflow.extra.groupNodes) ||
        (Array.isArray(renderWorkflow?.extra?.group_nodes) && renderWorkflow.extra.group_nodes) ||
        [];
    const links =
        (Array.isArray(renderWorkflow?.links) && renderWorkflow.links) ||
        (Array.isArray(renderWorkflow?.extra?.links) && renderWorkflow.extra.links) ||
        [];

    const cw = Math.max(1, canvas.clientWidth || canvas.width || 1);
    const ch = Math.max(1, canvas.clientHeight || canvas.height || 1);

    if ((!nodes || nodes.length === 0) && (!groups || groups.length === 0)) {
        ctx.clearRect(0, 0, cw, ch);
        return null;
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

    const colorForNode = (node) => {
        const explicit = node?.bgcolor || node?.color || null;
        if (explicit) return explicit;
        const text = String(
            node?.category || node?.type || node?.comfyClass || node?.class_type || node?.title || "",
        ).toLowerCase();
        for (const [needle, color] of TYPE_PALETTE) {
            if (text.includes(needle)) return color;
        }
        let hash = 0;
        for (let i = 0; i < text.length; i += 1) hash = (hash * 31 + text.charCodeAt(i)) | 0;
        const hue = Math.abs(hash) % 360;
        return `hsl(${hue} 42% 42%)`;
    };

    const getWidgetPreviewRows = (node) => {
        const rows = [];
        const inputs = node?.inputs && typeof node.inputs === "object" && !Array.isArray(node.inputs)
            ? node.inputs
            : null;
        if (inputs) {
            for (const [key, value] of Object.entries(inputs)) {
                if (Array.isArray(value) || (value && typeof value === "object")) continue;
                rows.push([key, value]);
                if (rows.length >= 3) return rows;
            }
        }
        const values = Array.isArray(node?.widgets_values) ? node.widgets_values : [];
        const widgets = Array.isArray(node?.widgets) ? node.widgets : [];
        const inputSlots = Array.isArray(node?.inputs) ? node.inputs : [];
        const widgetInputSlots = inputSlots.filter((input) =>
            input?.widget === true ||
            (input?.widget && typeof input.widget === "object") ||
            (typeof input?.widget === "string" && input.widget.trim()),
        );
        const unlinkedWidgetLikeInputs = inputSlots.filter(
            (input) => input?.link == null && _minimapInputTypeLooksWidgetCapable(input?.type),
        );
        const labelInputSlots = widgetInputSlots.length
            ? widgetInputSlots
            : unlinkedWidgetLikeInputs.length
              ? unlinkedWidgetLikeInputs
              : inputSlots;
        const inputSlotNames = labelInputSlots.map((input) =>
            String(
                input?.label ||
                    input?.localized_name ||
                    input?.name ||
                    input?.widget?.name ||
                    input?.widget?.label ||
                    "",
            ).trim(),
        );
        values.forEach((value, index) => {
            const key =
                widgets[index]?.name ||
                widgets[index]?.label ||
                inputSlotNames[index] ||
                `p${index + 1}`;
            rows.push([key, value]);
        });
        return rows.slice(0, 3);
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
        if (
            !Number.isFinite(x) ||
            !Number.isFinite(y) ||
            !Number.isFinite(w) ||
            !Number.isFinite(h)
        )
            continue;

        const mode = Number(n?.mode);
        const bypassed = mode === 2 || mode === 4;

        const errExtra = renderWorkflow?.extra?.errors || renderWorkflow?.extra?.node_errors || null;
        const errByNodeId =
            errExtra && typeof errExtra === "object" && nodeId ? errExtra[nodeId] : null;
        const errored = Boolean(
            errByNodeId || n?.error || n?.errors || n?.flags?.error || n?.properties?.error,
        );

        const nodeColor = colorForNode(n);
        rects.push({
            kind: "node",
            id: nodeId,
            x,
            y,
            w,
            h,
            fill: settings.nodeColors ? nodeColor : null,
            stroke: settings.nodeColors ? n?.color || nodeColor : null,
            bypassed,
            errored,
            type: String(n?.type || n?.comfyClass || n?.class_type || "").trim(),
            rows: getWidgetPreviewRows(n),
            inputCount: Array.isArray(n?.inputs)
                ? n.inputs.length
                : n?.inputs && typeof n.inputs === "object"
                  ? Object.keys(n.inputs).length
                  : 0,
            outputCount: Array.isArray(n?.outputs) ? n.outputs.length : 0,
            label: getWorkflowNodeDisplayName(n).replace(/\s+/g, " ").trim(),
        });
        if (nodeId) nodesById.set(nodeId, rects[rects.length - 1]);
    }
    if (settings.showGroups) {
        for (const g of groups || []) {
            // Some exports use `bounding: [x,y,w,h]` instead of pos/size.
            const bounding =
                Array.isArray(g?.bounding) && g.bounding.length >= 4 ? g.bounding : null;
            const pos = bounding
                ? [Number(bounding[0]), Number(bounding[1])]
                : normalizeVec2(g?.pos);
            const size = bounding
                ? [Number(bounding[2]), Number(bounding[3])]
                : normalizeSize2(g?.size);
            if (!pos || !size) continue;
            const x = Number(pos[0]);
            const y = Number(pos[1]);
            const w = Math.max(1, Number(size[0]));
            const h = Math.max(1, Number(size[1]));
            if (
                !Number.isFinite(x) ||
                !Number.isFinite(y) ||
                !Number.isFinite(w) ||
                !Number.isFinite(h)
            )
                continue;
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
        return null;
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

    const boundsW = Math.max(1, maxX - minX);
    const boundsH = Math.max(1, maxY - minY);
    const baseCenterX = minX + boundsW / 2;
    const baseCenterY = minY + boundsH / 2;
    const requestedView =
        settings.view && typeof settings.view === "object" ? settings.view : Object.create(null);
    const zoom = clampNumber(requestedView.zoom ?? 1, MINIMAP_ZOOM_MIN, MINIMAP_ZOOM_MAX);
    const visibleW = Math.max(1, boundsW / zoom);
    const visibleH = Math.max(1, boundsH / zoom);
    const halfVisibleW = visibleW / 2;
    const halfVisibleH = visibleH / 2;
    const centerX =
        visibleW >= boundsW
            ? baseCenterX
            : clampNumber(
                  requestedView.centerX ?? baseCenterX,
                  minX + halfVisibleW,
                  maxX - halfVisibleW,
              );
    const centerY =
        visibleH >= boundsH
            ? baseCenterY
            : clampNumber(
                  requestedView.centerY ?? baseCenterY,
                  minY + halfVisibleH,
                  maxY - halfVisibleH,
              );
    const viewMinX = centerX - halfVisibleW;
    const viewMinY = centerY - halfVisibleH;
    const pad = MINIMAP_PADDING;
    const renderScale = Math.min((cw - pad * 2) / visibleW, (ch - pad * 2) / visibleH);
    const hoveredNodeId =
        requestedView.hoveredNodeId !== null && requestedView.hoveredNodeId !== undefined
            ? String(requestedView.hoveredNodeId)
            : null;

    ctx.clearRect(0, 0, cw, ch);

    // Background
    ctx.fillStyle = "rgba(0,0,0,0.22)";
    ctx.fillRect(0, 0, cw, ch);

    const toCanvas = (x, y) => ({
        x: pad + (x - viewMinX) * renderScale,
        y: pad + (y - viewMinY) * renderScale,
    });

    const toWorld = (x, y) => ({
        x: clampNumber(viewMinX + (Number(x) - pad) / renderScale, minX, maxX),
        y: clampNumber(viewMinY + (Number(y) - pad) / renderScale, minY, maxY),
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
        const x = pad + (r.x - viewMinX) * renderScale;
        const y = pad + (r.y - viewMinY) * renderScale;
        const w = Math.max(1, r.w * renderScale);
        const h = Math.max(1, r.h * renderScale);

        const isNode = r.kind === "node";
        const isGroup = r.kind === "group";

        const bypassed = Boolean(r.bypassed);
        const errored = Boolean(r.errored);

        const fillAlpha = isGroup ? 0.18 : bypassed && settings.renderBypassState ? 0.14 : 0.62;
        const strokeAlpha = isGroup ? 0.55 : bypassed && settings.renderBypassState ? 0.32 : 0.8;

        const fill = toRgba(r.fill, fillAlpha);
        const stroke = toRgba(r.stroke, strokeAlpha);

        const radius = Math.max(2, Math.min(8, Math.floor(Math.min(w, h) * 0.08)));
        const titleH = isNode ? Math.max(10, Math.min(22, Math.floor(h * 0.2))) : 0;

        // Fill
        ctx.save();
        ctx.globalAlpha = 1;
        if (
            typeof fill === "string" &&
            (fill.startsWith("#") || fill.startsWith("rgb") || fill.startsWith("hsl"))
        ) {
            ctx.fillStyle = fill;
            ctx.globalAlpha = fillAlpha;
        } else {
            ctx.fillStyle = typeof fill === "string" ? fill : "rgba(82,88,96,0.72)";
            ctx.globalAlpha = fillAlpha;
        }
        if (typeof ctx.roundRect === "function") {
            ctx.beginPath();
            ctx.roundRect(x, y, w, h, radius);
            ctx.fill();
        } else {
            ctx.fillRect(x, y, w, h);
        }
        ctx.restore();

        if (isNode) {
            ctx.save();
            ctx.fillStyle = toRgba(r.stroke || r.fill, bypassed ? 0.34 : 0.9);
            if (typeof ctx.roundRect === "function") {
                ctx.beginPath();
                ctx.roundRect(x, y, w, titleH, [radius, radius, 0, 0]);
                ctx.fill();
            } else {
                ctx.fillRect(x, y, w, titleH);
            }
            ctx.restore();
        }

        ctx.globalAlpha = 1;
        ctx.strokeStyle = "rgba(255,255,255,0.22)";
        if (
            typeof stroke === "string" &&
            (stroke.startsWith("#") || stroke.startsWith("rgb") || stroke.startsWith("hsl"))
        ) {
            ctx.save();
            ctx.globalAlpha = strokeAlpha;
            ctx.strokeStyle = stroke;
            ctx.restore();
        }
        if (isNode && bypassed && settings.renderBypassState) {
            try {
                ctx.setLineDash([3, 2]);
            } catch (e) {
                console.debug?.(e);
            }
        } else {
            try {
                ctx.setLineDash([]);
            } catch (e) {
                console.debug?.(e);
            }
        }

        ctx.lineWidth = 1;
        if (typeof ctx.roundRect === "function") {
            ctx.beginPath();
            ctx.roundRect(x, y, w, h, radius);
            ctx.stroke();
        } else {
            ctx.strokeRect(x, y, w, h);
        }

        if (isNode && w >= 24 && h >= 20) {
            const portCountIn = Math.min(6, Number(r.inputCount) || 0);
            const portCountOut = Math.min(6, Number(r.outputCount) || 0);
            ctx.save();
            ctx.fillStyle = "rgba(255,255,255,0.72)";
            for (let i = 0; i < portCountIn; i += 1) {
                const py = y + titleH + ((h - titleH) * (i + 1)) / (portCountIn + 1);
                ctx.beginPath();
                ctx.arc(x, py, 2.2, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.fillStyle = "rgba(170,220,255,0.82)";
            for (let i = 0; i < portCountOut; i += 1) {
                const py = y + titleH + ((h - titleH) * (i + 1)) / (portCountOut + 1);
                ctx.beginPath();
                ctx.arc(x + w, py, 2.2, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        }

        if (isNode && errored && settings.renderErrorState) {
            try {
                ctx.setLineDash([]);
            } catch (e) {
                console.debug?.(e);
            }
            ctx.strokeStyle = "rgba(244,67,54,0.95)";
            ctx.lineWidth = 1.5;
            ctx.strokeRect(x - 0.5, y - 0.5, w + 1, h + 1);
        }

        if (isNode && hoveredNodeId && String(r.id || "") === hoveredNodeId) {
            try {
                ctx.setLineDash([]);
            } catch (e) {
                console.debug?.(e);
            }
            ctx.strokeStyle = "rgba(255,224,130,0.96)";
            ctx.lineWidth = 2;
            ctx.strokeRect(x - 1, y - 1, w + 2, h + 2);
        }

        if (isNode && settings.showNodeLabels && r.label && w >= 42 && h >= 12) {
            const fontSize = Math.max(8, Math.min(12, Math.floor(titleH * 0.58)));
            const textY = y + Math.max(8, Math.floor((titleH + fontSize) / 2) - 1);
            const maxTextWidth = Math.max(20, w - 6);
            let label = r.label;
            ctx.save();
            ctx.beginPath();
            ctx.rect(x + 2, y + 1, w - 4, titleH - 1);
            ctx.clip();
            ctx.font = `600 ${fontSize}px sans-serif`;
            while (label.length > 3 && ctx.measureText(`${label}...`).width > maxTextWidth) {
                label = label.slice(0, -1);
            }
            const finalText = label === r.label ? label : `${label}...`;
            ctx.fillStyle = "rgba(255,255,255,0.92)";
            ctx.shadowColor = "rgba(0,0,0,0.5)";
            ctx.shadowBlur = 2;
            ctx.fillText(finalText, x + 3, textY, maxTextWidth);
            ctx.restore();
        }

        if (isNode && settings.showNodeLabels && Array.isArray(r.rows) && w >= 76 && h >= 46) {
            const rowFont = Math.max(7, Math.min(10, Math.floor(h * 0.12)));
            const rowH = Math.max(9, rowFont + 4);
            const startY = y + titleH + 4;
            ctx.save();
            ctx.font = `500 ${rowFont}px sans-serif`;
            ctx.fillStyle = "rgba(255,255,255,0.62)";
            for (let i = 0; i < r.rows.length; i += 1) {
                const ry = startY + i * rowH;
                if (ry + rowH > y + h - 2) break;
                const [key, value] = r.rows[i];
                const text = `${String(key)}: ${String(value).replace(/\s+/g, " ").slice(0, 42)}`;
                ctx.fillText(text, x + 5, ry + rowFont, Math.max(20, w - 10));
            }
            ctx.restore();
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
                const vx0 = -offX / scaleDs;
                const vy0 = -offY / scaleDs;
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
        } catch (e) {
            console.debug?.(e);
        }
    }

    ctx.globalAlpha = 1;

    const hitTestNode = (canvasX, canvasY) => {
        const world = toWorld(canvasX, canvasY);
        for (let i = rects.length - 1; i >= 0; i -= 1) {
            const rect = rects[i];
            if (rect.kind !== "node") continue;
            if (
                world.x >= rect.x &&
                world.x <= rect.x + rect.w &&
                world.y >= rect.y &&
                world.y <= rect.y + rect.h
            ) {
                return rect;
            }
        }
        return null;
    };

    return {
        bounds: {
            minX,
            minY,
            maxX,
            maxY,
            width: boundsW,
            height: boundsH,
        },
        resolvedView: {
            zoom,
            centerX,
            centerY,
            visibleW,
            visibleH,
            viewMinX,
            viewMinY,
            pad,
            renderScale,
        },
        canvasToWorld: toWorld,
        worldToCanvas: toCanvas,
        hitTestNode,
    };
}

function expandSubgraphsForMinimap(workflow) {
    if (!workflow || typeof workflow !== "object") return workflow;
    const baseNodes = Array.isArray(workflow.nodes) ? workflow.nodes.filter(Boolean) : [];
    const defs = getSubgraphDefinitionMap(workflow);
    if (!baseNodes.length || !defs.size) return workflow;

    const nodes = [];
    const links = Array.isArray(workflow.links) ? [...workflow.links] : [];
    const groups = [
        ...(Array.isArray(workflow.groups) ? workflow.groups : []),
        ...(Array.isArray(workflow.extra?.groups) ? workflow.extra.groups : []),
    ];

    for (const node of baseNodes) {
        nodes.push(node);
        const subgraph = getNodeSubgraphDefinition(node, defs);
        if (!subgraph || !Array.isArray(subgraph.nodes) || !subgraph.nodes.length) continue;
        const fitted = fitSubgraphNodesIntoParent(node, subgraph);
        nodes.push(...fitted.nodes);
        links.push(...fitted.links);
        if (fitted.group) groups.push(fitted.group);
    }

    return {
        ...workflow,
        nodes,
        links,
        groups,
        extra: { ...(workflow.extra || {}), groups },
    };
}

function getSubgraphDefinitionMap(workflow) {
    const defs =
        (Array.isArray(workflow?.definitions?.subgraphs) && workflow.definitions.subgraphs) ||
        (Array.isArray(workflow?.subgraphs) && workflow.subgraphs) ||
        [];
    const map = new Map();
    for (const def of defs) {
        const id = def?.id ?? def?.name ?? null;
        if (id != null) map.set(String(id), def);
    }
    return map;
}

function getNodeSubgraphDefinition(node, defs) {
    const byType = defs.get(String(node?.type ?? ""));
    if (byType) return byType;
    const candidates = [
        node?.subgraph,
        node?._subgraph,
        node?.subgraph?.graph,
        node?.subgraph?.lgraph,
        node?.properties?.subgraph,
        node?.subgraph_instance,
        node?.subgraph_instance?.graph,
        node?.inner_graph,
        node?.subgraph_graph,
    ];
    return candidates.find((candidate) => candidate && typeof candidate === "object" && Array.isArray(candidate.nodes)) || null;
}

function fitSubgraphNodesIntoParent(parent, subgraph) {
    const parentId = String(parent?.id ?? parent?.ID ?? "");
    const parentPos = normalizeVec2Any(parent?.pos) || [0, 0];
    const parentSize = normalizeSize2Any(parent?.size) || [260, 180];
    const inner = subgraph.nodes.filter(Boolean);
    const bounds = getNodesBounds(inner);
    const padX = Math.min(22, Math.max(8, parentSize[0] * 0.08));
    const padTop = Math.min(34, Math.max(18, parentSize[1] * 0.18));
    const padBottom = Math.min(18, Math.max(8, parentSize[1] * 0.08));
    const availableW = Math.max(40, parentSize[0] - padX * 2);
    const availableH = Math.max(34, parentSize[1] - padTop - padBottom);
    const scale = Math.min(1, availableW / bounds.width, availableH / bounds.height);
    const offsetX = parentPos[0] + padX + (availableW - bounds.width * scale) / 2;
    const offsetY = parentPos[1] + padTop + (availableH - bounds.height * scale) / 2;

    const nodes = inner.map((node) => {
        const pos = normalizeVec2Any(node?.pos) || [bounds.minX, bounds.minY];
        const size = normalizeSize2Any(node?.size) || [140, 60];
        return {
            ...node,
            id: `${parentId}::${node?.id ?? node?.ID ?? ""}`,
            pos: [offsetX + (pos[0] - bounds.minX) * scale, offsetY + (pos[1] - bounds.minY) * scale],
            size: [Math.max(18, size[0] * scale), Math.max(14, size[1] * scale)],
            _mjrSubgraphParentId: parentId,
            _mjrSubgraphName: subgraph?.name || parent?.title || parent?.type || "Subgraph",
        };
    });

    const linkMapId = (id) => `${parentId}::${id}`;
    const links = (Array.isArray(subgraph.links) ? subgraph.links : []).map((link) => {
        if (Array.isArray(link) && link.length >= 4) {
            const next = [...link];
            next[1] = linkMapId(next[1]);
            next[3] = linkMapId(next[3]);
            return next;
        }
        if (link && typeof link === "object") {
            return {
                ...link,
                origin_id: link.origin_id != null ? linkMapId(link.origin_id) : link.origin_id,
                originId: link.originId != null ? linkMapId(link.originId) : link.originId,
                from: link.from != null ? linkMapId(link.from) : link.from,
                target_id: link.target_id != null ? linkMapId(link.target_id) : link.target_id,
                targetId: link.targetId != null ? linkMapId(link.targetId) : link.targetId,
                to: link.to != null ? linkMapId(link.to) : link.to,
            };
        }
        return link;
    });

    return {
        nodes,
        links,
        group: {
            title: subgraph?.name || parent?.title || "Subgraph",
            bounding: [parentPos[0] + 4, parentPos[1] + 18, Math.max(1, parentSize[0] - 8), Math.max(1, parentSize[1] - 22)],
            color: parent?.color || parent?.bgcolor || "#7f8ca3",
            borderColor: "#9fb5d8",
        },
    };
}

function getNodesBounds(nodes) {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const node of nodes) {
        const pos = normalizeVec2Any(node?.pos);
        if (!pos) continue;
        const size = normalizeSize2Any(node?.size) || [140, 60];
        minX = Math.min(minX, pos[0]);
        minY = Math.min(minY, pos[1]);
        maxX = Math.max(maxX, pos[0] + size[0]);
        maxY = Math.max(maxY, pos[1] + size[1]);
    }
    if (!Number.isFinite(minX)) return { minX: 0, minY: 0, width: 1, height: 1 };
    return { minX, minY, width: Math.max(1, maxX - minX), height: Math.max(1, maxY - minY) };
}

function normalizeVec2Any(value) {
    if (Array.isArray(value) && value.length >= 2) return [Number(value[0]), Number(value[1])];
    if (value && typeof value === "object") {
        const a = value[0] ?? value["0"] ?? value.x ?? value.left ?? null;
        const b = value[1] ?? value["1"] ?? value.y ?? value.top ?? null;
        if (a !== null && b !== null) return [Number(a), Number(b)];
    }
    return null;
}

function normalizeSize2Any(value) {
    if (Array.isArray(value) && value.length >= 2) return [Number(value[0]), Number(value[1])];
    if (value && typeof value === "object") {
        const w = value[0] ?? value["0"] ?? value.w ?? value.width ?? null;
        const h = value[1] ?? value["1"] ?? value.h ?? value.height ?? null;
        if (w !== null && h !== null) return [Number(w), Number(h)];
    }
    return null;
}

function _minimapInputTypeLooksWidgetCapable(type) {
    if (Array.isArray(type)) return true;
    const text = String(type || "").trim().toUpperCase();
    return (
        text === "INT" ||
        text === "FLOAT" ||
        text === "STRING" ||
        text === "BOOLEAN" ||
        text === "BOOL" ||
        text === "COMBO" ||
        text === "ENUM"
    );
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

    const isLink = (v) =>
        Array.isArray(v) &&
        v.length === 2 &&
        toStrId(v[0]) != null &&
        Number.isFinite(Number(v[1]));

    for (const [idRaw, node] of entries.slice(0, settings.maxNodes)) {
        if (!node || typeof node !== "object") continue;
        const id = toStrId(idRaw);
        if (!id) continue;
        const classType = String(node.class_type || node.type || node.classType || "").trim();
        const inputs = node.inputs && typeof node.inputs === "object" ? node.inputs : {};
        const syntheticInputs = {};

        const deps = [];
        for (const v of Object.values(inputs)) {
            if (!isLink(v)) continue;
            const src = toStrId(v[0]);
            if (!src) continue;
            deps.push(src);
            edges.push([src, id]);
        }
        for (const [inputName, v] of Object.entries(inputs)) {
            if (isLink(v)) continue;
            syntheticInputs[inputName] = v;
        }
        depsById.set(id, deps);

        // Basic color heuristic (only for minimap readability).
        const ctLower = classType.toLowerCase();
        let bgcolor = "#3a3a3a";
        let color = "#6b6b6b";
        if (ctLower.includes("ksampler") || ctLower.includes("sampler")) {
            bgcolor = "#6a4b1f";
            color = "#b07a2c";
        } else if (
            ctLower.includes("cliptext") ||
            ctLower.includes("textencode") ||
            ctLower.includes("conditioning")
        ) {
            bgcolor = "#1f5f3a";
            color = "#2cb06c";
        } else if (
            ctLower.includes("checkpoint") ||
            ctLower.includes("loader") ||
            ctLower.includes("model")
        ) {
            bgcolor = "#243a6a";
            color = "#3f6fd6";
        } else if (
            ctLower.includes("save") ||
            ctLower.includes("preview") ||
            ctLower.includes("video")
        ) {
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
            title: String(node?._meta?.title || node?.title || "").trim() || undefined,
            inputs: syntheticInputs,
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
        .map(([a, b]) => [
            linkId++,
            Number.isFinite(Number(a)) ? Number(a) : a,
            0,
            Number.isFinite(Number(b)) ? Number(b) : b,
            0,
            "LINK",
        ]);

    return { id: "synthetic", nodes, links, extra: { synthetic: true } };
}
