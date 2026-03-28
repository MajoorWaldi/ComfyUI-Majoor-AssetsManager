import { buildViewerResourceURL } from "../../api/endpoints.js";
import { drawMediaError } from "./imageProcessor.js";

export const MODEL3D_EXT_TO_LOADER = Object.freeze({
    ".gltf": "gltf",
    ".glb": "gltf",
    ".obj": "obj",
    ".fbx": "fbx",
    ".stl": "stl",
    ".ply": "ply",
    ".splat": "splat",
    ".ksplat": "splat",
    ".spz": "splat",
});

export const MODEL3D_EXTS = new Set(Object.keys(MODEL3D_EXT_TO_LOADER));
export const PREVIEWABLE_MODEL3D_LOADERS = new Set(["gltf", "obj", "fbx", "stl", "ply"]);

const MODEL3D_VIEWER_DEFAULT_BG = "#282828";
const MODEL3D_DEFAULT_CONTROL_HINT = "Rotate: left drag  Pan: right drag  Zoom: wheel";
const MODEL3D_VIEW_MODES = Object.freeze({
    PERSPECTIVE: "perspective",
    ORTHOGRAPHIC: "orthographic",
});
const MODEL3D_MATERIAL_MODES = Object.freeze({
    ORIGINAL: "original",
    NORMAL: "normal",
    DEPTH: "depth",
    WIREFRAME: "wireframe",
    POINTCLOUD: "pointcloud",
});
// Euler rotations [x, y, z] to apply to modelGroup so the specified axis points up
const MODEL3D_UP_DIR_EULER = Object.freeze({
    original: [0, 0, 0],
    "+y": [0, 0, 0],
    "-y": [Math.PI, 0, 0],
    "+z": [-Math.PI / 2, 0, 0],
    "-z": [Math.PI / 2, 0, 0],
    "+x": [0, 0, Math.PI / 2],
    "-x": [0, 0, -Math.PI / 2],
});
const MODEL3D_ANIMATION_SPEEDS = [0.25, 0.5, 1.0, 1.5, 2.0];
const MODEL3D_ANIM_BAR_HEIGHT_PX = 44;
const MODEL3D_DEFAULT_FOV = 75;
const MODEL3D_DEFAULT_LIGHT_INTENSITY = 1.0;
const MODEL3D_LIGHT_SCALE = Object.freeze({
    ambient: 0.5,
    main: 0.8,
    fill: 0.3,
    back: 0.3,
    rim: 0.3,
    bottom: 0.2,
});

let _threeDepsPromise = null;

// ─── Utility helpers ───────────────────────────────────────────────────────

function _extOf(asset) {
    try {
        const ext = String(asset?.ext || "")
            .trim()
            .toLowerCase();
        if (ext) return ext.startsWith(".") ? ext : `.${ext}`;
    } catch (e) {
        console.debug?.(e);
    }
    try {
        const name = String(asset?.filename || asset?.filepath || asset?.path || "").trim();
        const idx = name.lastIndexOf(".");
        return idx >= 0 ? name.slice(idx).toLowerCase() : "";
    } catch (e) {
        console.debug?.(e);
    }
    return "";
}

function _isAbsoluteOrSpecialUrl(url) {
    const value = String(url || "").trim();
    if (!value) return false;
    // Root-relative (/path), protocol-relative (//host), or scheme (http:, data:, blob:)
    // Root-relative URLs must NOT be rewritten through the viewer resource endpoint.
    return value.startsWith("/") || /^[a-z][\w+\-.]*:/i.test(value);
}

function _stopEvent(event, { preventDefault = false, immediate = false } = {}) {
    if (!event) return;
    try {
        if (preventDefault) event.preventDefault?.();
    } catch (e) {
        console.debug?.(e);
    }
    try {
        event.stopPropagation?.();
        if (immediate) event.stopImmediatePropagation?.();
    } catch (e) {
        console.debug?.(e);
    }
}

function _formatAnimTime(totalSeconds) {
    const s = Math.max(0, Number(totalSeconds) || 0);
    const m = Math.floor(s / 60);
    const ss = Math.floor(s % 60);
    return m > 0 ? `${m}:${String(ss).padStart(2, "0")}` : `${Math.floor(s)}s`;
}

// ─── DOM helpers ───────────────────────────────────────────────────────────

function _createViewportButton(label, title) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = String(label || "");
    button.title = String(title || label || "");
    button.setAttribute("aria-label", String(title || label || "3D viewport action"));
    button.style.cssText = [
        "height:28px",
        "padding:0 10px",
        "border-radius:999px",
        "border:1px solid rgba(255,255,255,0.16)",
        "background:rgba(13,15,20,0.78)",
        "color:rgba(255,255,255,0.92)",
        "font:600 11px system-ui,sans-serif",
        "letter-spacing:0.02em",
        "cursor:pointer",
        "backdrop-filter:blur(8px)",
        "display:inline-flex",
        "align-items:center",
        "justify-content:center",
        "box-shadow:0 4px 18px rgba(0,0,0,0.24)",
    ].join(";");
    return button;
}

function _setViewportButtonActive(button, active) {
    if (!button) return;
    const on = Boolean(active);
    button.dataset.active = on ? "1" : "0";
    button.style.background = on ? "rgba(76,175,80,0.18)" : "rgba(13,15,20,0.78)";
    button.style.borderColor = on ? "rgba(76,175,80,0.42)" : "rgba(255,255,255,0.16)";
    button.style.color = on ? "rgba(230,255,235,0.96)" : "rgba(255,255,255,0.92)";
}

// ─── Scene helpers ─────────────────────────────────────────────────────────

function _visitMeshes(object, visit) {
    if (!object || typeof visit !== "function") return;
    try {
        object.traverse?.((child) => {
            if (child?.isMesh || child?.isPoints || child?.isLine) visit(child);
        });
    } catch (e) {
        console.debug?.(e);
    }
}

function _hasMeshMaterials(object) {
    let found = false;
    _visitMeshes(object, (child) => {
        if (!found && child?.isMesh) found = true;
    });
    return found;
}

function _findHasSkeleton(object) {
    let found = false;
    try {
        object.traverse?.((child) => {
            if (!found && child?.isSkinnedMesh) {
                // Only consider as having a skeleton if there are actual bones to display
                const boneCount = child.skeleton?.bones?.length ?? 0;
                if (boneCount > 0) found = true;
            }
        });
    } catch (e) {
        console.debug?.(e);
    }
    return found;
}

function _storeOriginalMaterials(object) {
    const store = new Map();
    _visitMeshes(object, (child) => {
        store.set(child.uuid, child.material);
    });
    return store;
}

function _applyMaterialMode(THREE, object, mode, originalMaterials, tempMaterials) {
    _visitMeshes(object, (child) => {
        try {
            if (mode === MODEL3D_MATERIAL_MODES.ORIGINAL) {
                const orig = originalMaterials?.get(child.uuid);
                if (orig !== undefined) child.material = orig;
            } else if (mode === MODEL3D_MATERIAL_MODES.NORMAL && child.isMesh) {
                const m = new THREE.MeshNormalMaterial({ side: THREE.DoubleSide });
                tempMaterials?.add(m);
                child.material = m;
            } else if (mode === MODEL3D_MATERIAL_MODES.DEPTH && child.isMesh) {
                const m = new THREE.MeshDepthMaterial();
                tempMaterials?.add(m);
                child.material = m;
            } else if (mode === MODEL3D_MATERIAL_MODES.WIREFRAME && child.isMesh) {
                const m = new THREE.MeshBasicMaterial({ color: 0x90caf9, wireframe: true });
                tempMaterials?.add(m);
                child.material = m;
            } else if (mode === MODEL3D_MATERIAL_MODES.POINTCLOUD) {
                const hasColors = !!child.geometry?.getAttribute?.("color");
                const m = new THREE.PointsMaterial({
                    size: 0.012,
                    sizeAttenuation: true,
                    vertexColors: hasColors,
                    color: hasColors ? 0xffffff : 0x90caf9,
                });
                tempMaterials?.add(m);
                child.material = m;
            }
        } catch (e) {
            console.debug?.(e);
        }
    });
}

function _disposeTempMaterials(tempMaterials) {
    if (!tempMaterials) return;
    for (const mat of tempMaterials) {
        try {
            mat?.dispose?.();
        } catch (e) {
            console.debug?.(e);
        }
    }
    tempMaterials.clear();
}

function _getModelAnimations(loaded, loaderType) {
    try {
        if (loaderType === "gltf" || loaderType === "fbx") {
            return Array.isArray(loaded?.animations) ? loaded.animations : [];
        }
    } catch (e) {
        console.debug?.(e);
    }
    return [];
}

function _computeObjectFrame(THREE, object) {
    const box = new THREE.Box3().setFromObject(object);
    if (box.isEmpty()) return null;
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z, 0.01);
    return { box, size, center, maxDim, radius: Math.max(maxDim * 0.72, 0.5) };
}

function _fitPerspectiveCamera(THREE, camera, controls, frame) {
    if (!frame || !camera || !controls) return;
    const fov = camera.fov * (Math.PI / 180);
    const distance = (frame.maxDim / (2 * Math.tan(fov / 2))) * 1.55;
    const dir = new THREE.Vector3(1, 0.8, 1).normalize();
    camera.position.copy(frame.center).addScaledVector(dir, distance);
    camera.near = Math.max(0.01, distance / 250);
    camera.far = Math.max(1000, distance * 60);
    camera.updateProjectionMatrix();
    controls.target.copy(frame.center);
    controls.minDistance = Math.max(0.01, distance / 25);
    controls.maxDistance = Math.max(10, distance * 12);
    controls.minZoom = 0.25;
    controls.maxZoom = 12;
    controls.update();
}

function _fitOrthographicCamera(camera, controls, frame, aspect) {
    if (!frame || !camera || !controls) return null;
    const safeAspect = Math.max(0.0001, Number(aspect) || 1);
    const frustumHeight = Math.max(frame.maxDim * 1.9, 2);
    const frustumWidth = frustumHeight * safeAspect;
    camera.left = -frustumWidth / 2;
    camera.right = frustumWidth / 2;
    camera.top = frustumHeight / 2;
    camera.bottom = -frustumHeight / 2;
    camera.near = -Math.max(1000, frame.maxDim * 40);
    camera.far = Math.max(1000, frame.maxDim * 40);
    camera.zoom = 1;
    camera.position
        .copy(frame.center)
        .add({ x: frame.radius * 2.1, y: frame.radius * 1.6, z: frame.radius * 2.1 });
    camera.updateProjectionMatrix();
    controls.target.copy(frame.center);
    controls.minZoom = 0.25;
    controls.maxZoom = 12;
    controls.minDistance = 0;
    controls.maxDistance = Math.max(10, frame.maxDim * 12);
    controls.update();
    return frustumHeight;
}

function _createLoaderInstance(deps, loaderType, manager) {
    switch (loaderType) {
        case "gltf":
            return new deps.GLTFLoader(manager);
        case "obj":
            return new deps.OBJLoader(manager);
        case "fbx":
            return new deps.FBXLoader(manager);
        case "stl":
            return new deps.STLLoader(manager);
        case "ply":
            return new deps.PLYLoader(manager);
        default:
            return null;
    }
}

function _buildRenderableObject(THREE, loaderType, loaded) {
    if (!loaded) return null;
    if (loaderType === "gltf") return loaded.scene || null;
    if (loaderType === "obj" || loaderType === "fbx") return loaded;
    if (loaderType === "stl" || loaderType === "ply") {
        const geometry = loaded;
        if (geometry?.computeVertexNormals) {
            try {
                geometry.computeVertexNormals();
            } catch (e) {
                console.debug?.(e);
            }
        }
        const hasNormals = !!geometry?.getAttribute?.("normal");
        const hasColors = !!geometry?.getAttribute?.("color");
        if (loaderType === "ply" && !hasNormals) {
            return new THREE.Points(
                geometry,
                new THREE.PointsMaterial({
                    size: 0.02,
                    sizeAttenuation: true,
                    vertexColors: hasColors,
                    color: hasColors ? 0xffffff : 0x90caf9,
                }),
            );
        }
        return new THREE.Mesh(
            geometry,
            new THREE.MeshStandardMaterial({
                color: hasColors ? 0xffffff : 0xd8dee9,
                metalness: 0.08,
                roughness: 0.72,
                vertexColors: hasColors,
            }),
        );
    }
    return null;
}

function _loadModelContent(loader, loaderType, url) {
    return new Promise((resolve, reject) => {
        if (!loader || !url) {
            reject(new Error("Missing loader or URL"));
            return;
        }
        if (typeof loader.loadAsync === "function") {
            loader.loadAsync(url).then(resolve).catch(reject);
            return;
        }
        loader.load(url, resolve, undefined, reject);
    });
}

function _drawModelMessage(canvas, title, hint = "", accent = "#4CAF50") {
    if (!canvas) return;
    try {
        const w = Math.max(480, Number(canvas.width) || 0 || 960);
        const h = Math.max(270, Number(canvas.height) || 0 || 540);
        canvas.width = w;
        canvas.height = h;
    } catch (e) {
        console.debug?.(e);
    }
    const ctx = (() => {
        try {
            return canvas.getContext("2d");
        } catch {
            return null;
        }
    })();
    if (!ctx) return;
    const width = Number(canvas.width) || 960,
        height = Number(canvas.height) || 540;
    const cx = width / 2,
        cy = height / 2;
    try {
        const bg = ctx.createLinearGradient(0, 0, width, height);
        bg.addColorStop(0, "#0f1419");
        bg.addColorStop(1, "#11181f");
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, width, height);
        ctx.save();
        ctx.translate(cx, cy - 32);
        ctx.strokeStyle = accent;
        ctx.lineWidth = 3;
        ctx.globalAlpha = 0.95;
        ctx.beginPath();
        ctx.moveTo(0, -44);
        ctx.lineTo(42, -22);
        ctx.lineTo(42, 22);
        ctx.lineTo(0, 44);
        ctx.lineTo(-42, 22);
        ctx.lineTo(-42, -22);
        ctx.closePath();
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, -44);
        ctx.lineTo(0, 0);
        ctx.lineTo(42, 22);
        ctx.moveTo(0, 0);
        ctx.lineTo(-42, 22);
        ctx.moveTo(-42, -22);
        ctx.lineTo(0, 0);
        ctx.moveTo(42, -22);
        ctx.lineTo(0, 0);
        ctx.stroke();
        ctx.restore();
        ctx.fillStyle = "rgba(255,255,255,0.94)";
        ctx.font = "600 18px system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(String(title || "3D preview"), cx, cy + 44);
        if (hint) {
            ctx.fillStyle = "rgba(255,255,255,0.62)";
            ctx.font = "13px system-ui, sans-serif";
            ctx.fillText(String(hint), cx, cy + 72);
        }
    } catch (e) {
        console.debug?.(e);
        try {
            drawMediaError(canvas, title, hint || "3D viewer unavailable");
        } catch (err) {
            console.debug?.(err);
        }
    }
}

const _VENDOR_BASE = "/mjr/am/vendor/three";

function _loadThreeDeps() {
    if (_threeDepsPromise) return _threeDepsPromise;
    _threeDepsPromise = Promise.all([
        import(/* @vite-ignore */ `${_VENDOR_BASE}/three.module.js`),
        import(/* @vite-ignore */ `${_VENDOR_BASE}/addons/controls/OrbitControls.js`),
        import(/* @vite-ignore */ `${_VENDOR_BASE}/addons/loaders/GLTFLoader.js`),
        import(/* @vite-ignore */ `${_VENDOR_BASE}/addons/loaders/FBXLoader.js`),
        import(/* @vite-ignore */ `${_VENDOR_BASE}/addons/loaders/OBJLoader.js`),
        import(/* @vite-ignore */ `${_VENDOR_BASE}/addons/loaders/MTLLoader.js`),
        import(/* @vite-ignore */ `${_VENDOR_BASE}/addons/loaders/STLLoader.js`),
        import(/* @vite-ignore */ `${_VENDOR_BASE}/addons/loaders/PLYLoader.js`),
    ]).then(([THREE, controls, gltf, fbx, obj, mtl, stl, ply]) => ({
        THREE,
        OrbitControls: controls.OrbitControls,
        GLTFLoader: gltf.GLTFLoader,
        FBXLoader: fbx.FBXLoader,
        OBJLoader: obj.OBJLoader,
        MTLLoader: mtl.MTLLoader,
        STLLoader: stl.STLLoader,
        PLYLoader: ply.PLYLoader,
    }));
    return _threeDepsPromise;
}

function _resolveLoaderFromAsset(asset) {
    const explicit = String(asset?.loader || asset?.viewer_info?.loader || "")
        .trim()
        .toLowerCase();
    if (explicit) return explicit;
    return MODEL3D_EXT_TO_LOADER[_extOf(asset)] || "";
}

// ─── Settings panel ────────────────────────────────────────────────────────

function _createSettingsPanel({
    defaultBgColor,
    defaultFov,
    defaultLightIntensity,
    hasSkeleton,
} = {}) {
    const panel = document.createElement("div");
    panel.className = "mjr-model3d-settings";
    panel.style.cssText = [
        "position:absolute",
        "right:0",
        "top:44px",
        "width:210px",
        "max-height:calc(100% - 100px)",
        "overflow-y:auto",
        "background:rgba(14,18,26,0.96)",
        "border:1px solid rgba(255,255,255,0.10)",
        "border-right:none",
        "border-radius:10px 0 0 10px",
        "padding:10px 10px 12px 10px",
        "z-index:4",
        "display:none",
        "box-shadow:-6px 4px 24px rgba(0,0,0,0.5)",
        "backdrop-filter:blur(12px)",
        "font:13px system-ui,sans-serif",
        "color:rgba(255,255,255,0.88)",
        "scrollbar-width:thin",
    ].join(";");

    // Stop propagation so events don't reach OrbitControls or panzoom,
    // but do NOT preventDefault — form controls (select, checkbox, color, slider) need default behavior.
    [
        "pointerdown",
        "pointermove",
        "pointerup",
        "mousedown",
        "mousemove",
        "mouseup",
        "wheel",
        "click",
        "contextmenu",
        "dragstart",
        "dragover",
        "drop",
    ].forEach((evt) => {
        panel.addEventListener(evt, (e) => _stopEvent(e, { preventDefault: false }));
    });

    const addSectionHeader = (title) => {
        const h = document.createElement("div");
        h.style.cssText = [
            "font:700 10px system-ui,sans-serif",
            "letter-spacing:0.08em",
            "color:rgba(255,255,255,0.40)",
            "text-transform:uppercase",
            "margin:10px 0 6px 0",
        ].join(";");
        h.textContent = title;
        panel.appendChild(h);
        const sep = document.createElement("div");
        sep.style.cssText = "height:1px;background:rgba(255,255,255,0.07);margin-bottom:8px;";
        panel.appendChild(sep);
    };

    const addRow = (label, control) => {
        const row = document.createElement("div");
        row.style.cssText =
            "display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;gap:6px;";
        const lbl = document.createElement("span");
        lbl.style.cssText =
            "font:500 11px system-ui,sans-serif;color:rgba(255,255,255,0.65);white-space:nowrap;flex-shrink:0;";
        lbl.textContent = label;
        row.appendChild(lbl);
        row.appendChild(control);
        panel.appendChild(row);
        return row;
    };

    const makeSelect = (opts, defaultVal) => {
        const sel = document.createElement("select");
        sel.style.cssText = [
            "background:rgba(25,30,42,0.95)",
            "color:rgba(255,255,255,0.88)",
            "border:1px solid rgba(255,255,255,0.14)",
            "border-radius:6px",
            "padding:3px 5px",
            "font:11px system-ui,sans-serif",
            "cursor:pointer",
            "flex:1",
            "min-width:0",
        ].join(";");
        for (const [val, lbl] of opts) {
            const opt = document.createElement("option");
            opt.value = val;
            opt.textContent = lbl;
            if (val === defaultVal) opt.selected = true;
            sel.appendChild(opt);
        }
        return sel;
    };

    const makeSlider = (min, max, step, defaultVal) => {
        const wrap = document.createElement("div");
        wrap.style.cssText = "display:flex;align-items:center;gap:5px;flex:1;";
        const slider = document.createElement("input");
        slider.type = "range";
        slider.min = String(min);
        slider.max = String(max);
        slider.step = String(step);
        slider.value = String(defaultVal);
        slider.style.cssText = "flex:1;cursor:pointer;accent-color:#4CAF50;height:3px;";
        const valLbl = document.createElement("span");
        valLbl.style.cssText =
            "font:11px system-ui,sans-serif;color:rgba(255,255,255,0.45);min-width:26px;text-align:right;";
        valLbl.textContent = String(defaultVal);
        slider.addEventListener("input", () => {
            valLbl.textContent = slider.value;
        });
        wrap.appendChild(slider);
        wrap.appendChild(valLbl);
        return { wrap, slider, valLbl };
    };

    // ── Scene ──
    addSectionHeader("Scene");
    const bgInput = document.createElement("input");
    bgInput.type = "color";
    bgInput.value = defaultBgColor || MODEL3D_VIEWER_DEFAULT_BG;
    bgInput.style.cssText =
        "width:34px;height:24px;cursor:pointer;border:1px solid rgba(255,255,255,0.18);border-radius:4px;padding:1px;background:none;flex-shrink:0;";
    addRow("Background", bgInput);

    // ── Model ──
    addSectionHeader("Model");
    const materialSel = makeSelect(
        [
            ["original", "Original"],
            ["normal", "Normal map"],
            ["depth", "Depth"],
            ["wireframe", "Wireframe"],
            ["pointcloud", "Point cloud"],
        ],
        "original",
    );
    addRow("Material", materialSel);

    const upSel = makeSelect(
        [
            ["original", "Original"],
            ["+y", "+Y (default)"],
            ["-y", "-Y"],
            ["+z", "+Z (CAD)"],
            ["-z", "-Z"],
            ["+x", "+X"],
            ["-x", "-X"],
        ],
        "original",
    );
    addRow("Up", upSel);

    let skeletonRow = null;
    let skeletonToggle = null;
    if (hasSkeleton) {
        skeletonToggle = document.createElement("input");
        skeletonToggle.type = "checkbox";
        skeletonToggle.checked = false;
        skeletonToggle.style.cssText = "cursor:pointer;accent-color:#4CAF50;flex-shrink:0;";
        skeletonRow = addRow("Skeleton", skeletonToggle);
    }

    // ── Camera ──
    addSectionHeader("Camera");
    const fovData = makeSlider(15, 120, 1, defaultFov ?? MODEL3D_DEFAULT_FOV);
    addRow("FOV", fovData.wrap);

    // ── Lights ──
    addSectionHeader("Lights");
    const lightData = makeSlider(
        0,
        5,
        0.1,
        defaultLightIntensity ?? MODEL3D_DEFAULT_LIGHT_INTENSITY,
    );
    addRow("Intensity", lightData.wrap);

    return {
        panel,
        bgInput,
        materialSel,
        upSel,
        skeletonToggle,
        skeletonRow,
        fovSlider: fovData.slider,
        fovValLbl: fovData.valLbl,
        lightSlider: lightData.slider,
        lightValLbl: lightData.valLbl,
    };
}

// ─── Animation bar ─────────────────────────────────────────────────────────

function _createAnimationBar() {
    const bar = document.createElement("div");
    bar.className = "mjr-model3d-anim-bar";
    bar.style.cssText = [
        "position:absolute",
        "bottom:0",
        "left:0",
        "right:0",
        `height:${MODEL3D_ANIM_BAR_HEIGHT_PX}px`,
        "display:none",
        "align-items:center",
        "gap:7px",
        "padding:0 10px",
        "background:rgba(10,13,20,0.90)",
        "backdrop-filter:blur(10px)",
        "border-top:1px solid rgba(255,255,255,0.07)",
        "z-index:3",
    ].join(";");

    [
        "pointerdown",
        "pointermove",
        "pointerup",
        "mousedown",
        "mousemove",
        "mouseup",
        "wheel",
        "click",
    ].forEach((evt) => {
        bar.addEventListener(evt, (e) => _stopEvent(e, { preventDefault: false }));
    });

    const playBtn = document.createElement("button");
    playBtn.type = "button";
    playBtn.textContent = "▶";
    playBtn.title = "Play / Pause";
    playBtn.style.cssText = [
        "width:28px",
        "height:28px",
        "border-radius:50%",
        "border:1px solid rgba(255,255,255,0.18)",
        "background:rgba(76,175,80,0.14)",
        "color:rgba(255,255,255,0.92)",
        "font:600 12px system-ui,sans-serif",
        "cursor:pointer",
        "flex-shrink:0",
        "padding:0",
        "line-height:1",
        "display:flex",
        "align-items:center",
        "justify-content:center",
    ].join(";");

    const speedSel = document.createElement("select");
    speedSel.title = "Playback speed";
    speedSel.style.cssText = [
        "background:rgba(20,24,34,0.9)",
        "color:rgba(255,255,255,0.8)",
        "border:1px solid rgba(255,255,255,0.14)",
        "border-radius:6px",
        "padding:3px 4px",
        "font:11px system-ui,sans-serif",
        "cursor:pointer",
        "width:52px",
        "flex-shrink:0",
    ].join(";");
    for (const spd of MODEL3D_ANIMATION_SPEEDS) {
        const opt = document.createElement("option");
        opt.value = String(spd);
        opt.textContent = `${spd}×`;
        if (spd === 1.0) opt.selected = true;
        speedSel.appendChild(opt);
    }

    const animSel = document.createElement("select");
    animSel.title = "Animation clip";
    animSel.style.cssText = [
        "background:rgba(20,24,34,0.9)",
        "color:rgba(255,255,255,0.8)",
        "border:1px solid rgba(255,255,255,0.14)",
        "border-radius:6px",
        "padding:3px 5px",
        "font:11px system-ui,sans-serif",
        "cursor:pointer",
        "max-width:130px",
        "flex-shrink:1",
        "min-width:0",
    ].join(";");

    const progressSlider = document.createElement("input");
    progressSlider.type = "range";
    progressSlider.min = "0";
    progressSlider.max = "1000";
    progressSlider.value = "0";
    progressSlider.style.cssText =
        "flex:1;min-width:50px;cursor:pointer;accent-color:#4CAF50;height:3px;";

    const timeLbl = document.createElement("span");
    timeLbl.style.cssText = [
        "font:500 11px system-ui,sans-serif",
        "color:rgba(255,255,255,0.45)",
        "white-space:nowrap",
        "flex-shrink:0",
    ].join(";");
    timeLbl.textContent = "0s / 0s";

    bar.appendChild(playBtn);
    bar.appendChild(speedSel);
    bar.appendChild(animSel);
    bar.appendChild(progressSlider);
    bar.appendChild(timeLbl);

    return { bar, playBtn, speedSel, animSel, progressSlider, timeLbl };
}

// ─── Public exports ────────────────────────────────────────────────────────

/** Returns true if the given asset dict represents a 3D model file. */
export function isModel3DAsset(asset) {
    const kind = String(asset?.kind || "").toLowerCase();
    if (kind === "model3d") return true;
    return MODEL3D_EXTS.has(_extOf(asset));
}

/** Returns the loader type string (e.g. "gltf", "obj", "fbx") for the given asset. */
export function resolveModel3DLoader(asset) {
    return _resolveLoaderFromAsset(asset) || "gltf";
}

/** Returns the default mouse-control hint string shown in the 3D viewport. */
export function getModel3DDefaultControlHint() {
    return MODEL3D_DEFAULT_CONTROL_HINT;
}

/** Returns the WebGL canvas element inside a 3D host element, or null if not found. */
export function findModel3DCanvas(rootEl) {
    try {
        if (rootEl?.classList?.contains?.("mjr-model3d-render-canvas")) return rootEl;
    } catch (e) {
        console.debug?.(e);
    }
    try {
        return rootEl?.querySelector?.(".mjr-model3d-render-canvas") || null;
    } catch {
        return null;
    }
}

/** Returns true if the given DOM element is inside a 3D model host (used to suppress panzoom). */
export function isModel3DInteractionTarget(target) {
    try {
        return !!target?.closest?.(
            ".mjr-model3d-host, .mjr-viewer-model3d-host, .mjr-mfv-model3d-host",
        );
    } catch {
        return false;
    }
}

/**
 * Returns an OrbitControls mouseButtons config mapping Left→ROTATE, Middle→DOLLY, Right→PAN.
 * @param {MouseEvent|null} eventLike - unused, reserved for future gesture detection
 * @param {{ROTATE:number,DOLLY:number,PAN:number}} MOUSE_ENUM - THREE.MOUSE enum
 */
export function buildModel3DMouseButtons(eventLike, MOUSE_ENUM) {
    const M = MOUSE_ENUM || { ROTATE: 0, DOLLY: 1, PAN: 2 };
    void eventLike;
    return { LEFT: M.ROTATE, MIDDLE: M.DOLLY, RIGHT: M.PAN };
}

// ─── Main element factory ──────────────────────────────────────────────────

/**
 * Creates and returns a fully self-contained 3D viewer host element.
 *
 * The returned div contains a WebGL canvas, status overlay, toolbar, settings
 * panel, and animation bar. Three.js is loaded lazily on first call.
 *
 * @param {object} asset - Asset dict with at least `filename` and optionally `id`, `ext`
 * @param {string} url - Absolute or root-relative URL to the 3D model file
 * @param {object} [options]
 * @param {string}   [options.hostClassName]        - CSS class for the host div
 * @param {string}   [options.hostStyle]            - Inline CSS for the host div
 * @param {string}   [options.canvasClassName]      - CSS class for the WebGL canvas
 * @param {string}   [options.canvasStyle]          - Inline CSS for the WebGL canvas
 * @param {boolean}  [options.disableViewerTransform=false] - Disable panzoom on canvas
 * @param {string}   [options.hintText]             - Override the control hint text
 * @param {Function} [options.scheduleOverlayRedraw] - Callback to trigger overlay repaints
 * @param {Function} [options.onReady]              - Called once the model is loaded and rendered
 * @returns {HTMLDivElement} The 3D viewer host element (append to DOM to activate)
 */
export function createModel3DMediaElement(asset, url, options = {}) {
    const host = document.createElement("div");
    host.className = options.hostClassName || "mjr-model3d-host mjr-viewer-model3d-host";
    host.style.cssText =
        options.hostStyle ||
        [
            "width:100%",
            "height:100%",
            "display:flex",
            "align-items:stretch",
            "justify-content:stretch",
            "position:relative",
            "overflow:hidden",
            "border-radius:12px",
            "background:radial-gradient(circle at top, rgba(76,175,80,0.10), rgba(0,0,0,0) 42%), linear-gradient(180deg, rgba(40,40,40,0.98), rgba(19,22,28,0.99))",
            "box-shadow:inset 0 0 0 1px rgba(255,255,255,0.06)",
        ].join(";");
    host.setAttribute("data-capture-wheel", "true");
    host.tabIndex = -1;

    // Canvas (WebGL target)
    const canvas = document.createElement("canvas");
    canvas.className = options.canvasClassName || "mjr-viewer-media mjr-model3d-render-canvas";
    canvas.style.cssText =
        options.canvasStyle ||
        [
            "display:block",
            "width:100%",
            "height:100%",
            "max-width:100%",
            "max-height:100%",
            "outline:none",
            "touch-action:none",
        ].join(";");
    canvas.tabIndex = 0;
    canvas._mjrDisableViewerTransform = options.disableViewerTransform !== false;
    try {
        if (asset?.id != null) canvas.dataset.mjrAssetId = String(asset.id);
    } catch (e) {
        console.debug?.(e);
    }
    host.appendChild(canvas);

    // Status overlay canvas
    const statusCanvas = document.createElement("canvas");
    statusCanvas.className = "mjr-model3d-status";
    statusCanvas.style.cssText = [
        "position:absolute",
        "inset:0",
        "display:block",
        "width:100%",
        "height:100%",
        "pointer-events:none",
        "z-index:1",
    ].join(";");
    host.appendChild(statusCanvas);

    // Format badge
    const ext = _extOf(asset).replace(".", "").toUpperCase();
    if (ext) {
        const badge = document.createElement("div");
        badge.className = "mjr-model3d-badge";
        badge.textContent = ext;
        badge.style.cssText = [
            "position:absolute",
            "top:10px",
            "left:10px",
            "padding:4px 8px",
            "border-radius:999px",
            "font:700 10px system-ui,sans-serif",
            "letter-spacing:0.08em",
            "color:#fff",
            "background:rgba(76,175,80,0.9)",
            "pointer-events:none",
            "z-index:2",
        ].join(";");
        host.appendChild(badge);
    }

    // Viewport toolbar (top-right)
    const viewportToolbar = document.createElement("div");
    viewportToolbar.className = "mjr-model3d-toolbar";
    viewportToolbar.style.cssText = [
        "position:absolute",
        "top:10px",
        "right:10px",
        "display:flex",
        "align-items:center",
        "gap:6px",
        "flex-wrap:wrap",
        "pointer-events:none",
        "z-index:5",
    ].join(";");
    const viewportTools = document.createElement("div");
    viewportTools.style.cssText =
        "display:flex;align-items:center;gap:6px;flex-wrap:wrap;pointer-events:auto;";
    const resetViewBtn = _createViewportButton("Reset", "Reset 3D view");
    const gridBtn = _createViewportButton("Grid", "Toggle grid");
    const cameraModeBtn = _createViewportButton("Persp", "Switch perspective / orthographic");
    const settingsBtn = _createViewportButton("⚙", "Settings");
    viewportTools.append(resetViewBtn, gridBtn, cameraModeBtn, settingsBtn);
    viewportToolbar.appendChild(viewportTools);
    host.appendChild(viewportToolbar);

    // Control hint (bottom-right)
    const hint = document.createElement("div");
    hint.className = "mjr-model3d-hint";
    hint.textContent = options.hintText || MODEL3D_DEFAULT_CONTROL_HINT;
    hint.style.cssText = [
        "position:absolute",
        "right:10px",
        "bottom:10px",
        "padding:5px 10px",
        "border-radius:999px",
        "font:500 11px system-ui,sans-serif",
        "color:rgba(255,255,255,0.75)",
        "background:rgba(0,0,0,0.35)",
        "backdrop-filter:blur(6px)",
        "pointer-events:none",
        "z-index:2",
        "transition:bottom 0.2s",
    ].join(";");
    host.appendChild(hint);

    // Settings panel
    const settingsDom = _createSettingsPanel({
        defaultBgColor: MODEL3D_VIEWER_DEFAULT_BG,
        defaultFov: MODEL3D_DEFAULT_FOV,
        defaultLightIntensity: MODEL3D_DEFAULT_LIGHT_INTENSITY,
        hasSkeleton: false, // updated after load
    });
    host.appendChild(settingsDom.panel);

    // Animation bar
    const animDom = _createAnimationBar();
    host.appendChild(animDom.bar);

    // ── State ──────────────────────────────────────────────────────────────
    let destroyed = false;
    let resizeObserver = null;
    let threeLib = null;
    let renderer = null;
    let scene = null;
    let activeCamera = null;
    let perspectiveCamera = null;
    let orthographicCamera = null;
    let controls = null;
    let rafId = null;
    let statusState = null;
    let interactionCleanup = null;
    let gridHelper = null;
    let modelGroup = null; // Group wrapping loadedObject – used for up-direction rotation
    let loadedObject = null;
    let objectFrame = null;
    let orthographicFrustumHeight = 0;
    let viewportMode = MODEL3D_VIEW_MODES.PERSPECTIVE;

    // Material modes
    let originalMaterials = new Map(); // uuid → original material
    const tempMaterials = new Set(); // disposable materials created by modes

    // Skeleton
    let skeletonHelper = null;
    let hasSkeleton = false;

    // Lights
    let ambientLight = null;
    let lightObjects = []; // [mainDir, backDir, fillRight, fillLeft, bottomDir]
    let lightIntensity = MODEL3D_DEFAULT_LIGHT_INTENSITY;

    // Animation
    let animationMixer = null;
    let animationClock = null;
    let animationClips = [];
    let animationActions = [];
    let currentAnimIdx = 0;
    let animSpeed = 1.0;
    let isAnimPlaying = false;
    let isSeeking = false;

    // Settings panel visibility
    let settingsPanelVisible = false;

    const modelName = String(asset?.filename || "3D model");

    const scheduleOverlayRedraw = () => {
        try {
            options.scheduleOverlayRedraw?.();
        } catch (e) {
            console.debug?.(e);
        }
    };

    // ── Status helpers ──────────────────────────────────────────────────────
    const setStatus = (title, hintText = "", accent = "#4CAF50") => {
        statusState = { title, hintText, accent };
        statusCanvas.style.display = "block";
        _drawModelMessage(statusCanvas, title, hintText, accent);
    };

    const clearStatus = () => {
        statusState = null;
        statusCanvas.style.display = "none";
    };

    const syncNaturalSize = () => {
        try {
            const rect = host.getBoundingClientRect();
            canvas._mjrNaturalW = Math.max(1, Math.round(rect.width || canvas.width || 1));
            canvas._mjrNaturalH = Math.max(1, Math.round(rect.height || canvas.height || 1));
        } catch (e) {
            console.debug?.(e);
        }
        try {
            if (statusState)
                _drawModelMessage(
                    statusCanvas,
                    statusState.title,
                    statusState.hintText,
                    statusState.accent,
                );
        } catch (e) {
            console.debug?.(e);
        }
    };

    // ── Camera helpers ──────────────────────────────────────────────────────
    const updateOrthographicProjection = (width, height) => {
        if (!orthographicCamera || !(orthographicFrustumHeight > 0)) return;
        const aspect = Math.max(0.0001, (Number(width) || 1) / Math.max(1, Number(height) || 1));
        const fw = orthographicFrustumHeight * aspect;
        orthographicCamera.left = -fw / 2;
        orthographicCamera.right = fw / 2;
        orthographicCamera.top = orthographicFrustumHeight / 2;
        orthographicCamera.bottom = -orthographicFrustumHeight / 2;
        orthographicCamera.updateProjectionMatrix();
    };

    const fitLoadedObject = () => {
        if (!modelGroup || !controls || !objectFrame) return;
        if (viewportMode === MODEL3D_VIEW_MODES.ORTHOGRAPHIC) {
            const rect = host.getBoundingClientRect();
            orthographicFrustumHeight =
                _fitOrthographicCamera(
                    orthographicCamera,
                    controls,
                    objectFrame,
                    Math.max(0.0001, (rect.width || 1) / Math.max(1, rect.height || 1)),
                ) || orthographicFrustumHeight;
            activeCamera = orthographicCamera;
        } else {
            _fitPerspectiveCamera(threeLib, perspectiveCamera, controls, objectFrame);
            activeCamera = perspectiveCamera;
        }
        try {
            controls.object = activeCamera;
            controls.update();
        } catch (e) {
            console.debug?.(e);
        }
    };

    const setViewportMode = (nextMode, { refit = true } = {}) => {
        viewportMode =
            nextMode === MODEL3D_VIEW_MODES.ORTHOGRAPHIC
                ? MODEL3D_VIEW_MODES.ORTHOGRAPHIC
                : MODEL3D_VIEW_MODES.PERSPECTIVE;
        activeCamera =
            viewportMode === MODEL3D_VIEW_MODES.ORTHOGRAPHIC
                ? orthographicCamera
                : perspectiveCamera;
        try {
            if (controls) controls.object = activeCamera;
        } catch (e) {
            console.debug?.(e);
        }
        if (refit) {
            fitLoadedObject();
        } else {
            try {
                activeCamera?.updateProjectionMatrix?.();
            } catch (e) {
                console.debug?.(e);
            }
            try {
                controls?.update?.();
            } catch (e) {
                console.debug?.(e);
            }
        }
        syncViewportButtons();
        scheduleOverlayRedraw();
    };

    // ── Light helpers ────────────────────────────────────────────────────────
    const applyLightIntensity = (val) => {
        lightIntensity = Math.max(0, Math.min(10, Number(val) || 0));
        try {
            if (ambientLight) ambientLight.intensity = MODEL3D_LIGHT_SCALE.ambient * lightIntensity;
        } catch (e) {
            console.debug?.(e);
        }
        // lightObjects order: [main, back, fillRight, fillLeft, bottom]
        const scales = [
            MODEL3D_LIGHT_SCALE.main,
            MODEL3D_LIGHT_SCALE.back,
            MODEL3D_LIGHT_SCALE.fill,
            MODEL3D_LIGHT_SCALE.fill,
            MODEL3D_LIGHT_SCALE.bottom,
        ];
        lightObjects.forEach((light, i) => {
            try {
                if (light)
                    light.intensity = (scales[i] ?? MODEL3D_LIGHT_SCALE.fill) * lightIntensity;
            } catch (e) {
                console.debug?.(e);
            }
        });
    };

    // ── Material mode helpers ────────────────────────────────────────────────
    const applyMaterialMode = (mode) => {
        if (!loadedObject || !threeLib) return;
        _disposeTempMaterials(tempMaterials);
        _applyMaterialMode(threeLib, loadedObject, mode, originalMaterials, tempMaterials);
        scheduleOverlayRedraw();
    };

    // ── Up direction helpers ─────────────────────────────────────────────────
    const applyUpDirection = (dir) => {
        if (!modelGroup) return;
        const euler = MODEL3D_UP_DIR_EULER[dir] || [0, 0, 0];
        try {
            modelGroup.rotation.set(euler[0], euler[1], euler[2]);
            modelGroup.updateMatrixWorld(true);
        } catch (e) {
            console.debug?.(e);
        }
        if (threeLib) objectFrame = _computeObjectFrame(threeLib, modelGroup);
        fitLoadedObject();
    };

    // ── Skeleton helpers ─────────────────────────────────────────────────────
    const setSkeletonVisible = (visible) => {
        if (!skeletonHelper) return;
        try {
            skeletonHelper.visible = Boolean(visible);
        } catch (e) {
            console.debug?.(e);
        }
    };

    // ── Animation helpers ────────────────────────────────────────────────────
    const syncAnimBar = () => {
        if (!animationMixer || animationClips.length === 0) return;
        const action = animationActions[currentAnimIdx];
        if (!action) return;
        const clip = animationClips[currentAnimIdx];
        const duration = clip?.duration || 0;
        const current = action.time || 0;
        try {
            animDom.timeLbl.textContent = `${_formatAnimTime(current)} / ${_formatAnimTime(duration)}`;
        } catch (e) {
            console.debug?.(e);
        }
        if (!isSeeking && duration > 0) {
            try {
                const sliderMax = Number(animDom.progressSlider.max) || 1000;
                animDom.progressSlider.value = String(Math.round((current / duration) * sliderMax));
            } catch (e) {
                console.debug?.(e);
            }
        }
    };

    const playAnimation = (idx) => {
        if (!animationMixer || !animationClips.length) return;
        const clip = animationClips[idx];
        if (!clip) return;
        // Stop all current actions
        animationActions.forEach((a) => {
            try {
                a?.stop();
            } catch (e) {
                console.debug?.(e);
            }
        });
        const action = animationMixer.clipAction(clip);
        action.timeScale = animSpeed;
        action.clampWhenFinished = false;
        action.loop = threeLib?.LoopRepeat ?? 2201;
        action.play();
        animationActions[idx] = action;
        currentAnimIdx = idx;
        isAnimPlaying = true;
        animDom.playBtn.textContent = "⏸";
        // Scale progress slider steps to clip duration for consistent seek granularity
        // (~10ms steps, min 100 ticks, max 10000 ticks)
        try {
            const steps = Math.max(100, Math.min(10000, Math.round((clip.duration || 1) * 100)));
            animDom.progressSlider.max = String(steps);
        } catch (_) {}
    };

    const togglePlayPause = () => {
        if (!animationMixer || !animationClips.length) return;
        if (isAnimPlaying) {
            animationMixer.timeScale = 0;
            isAnimPlaying = false;
            animDom.playBtn.textContent = "▶";
        } else {
            animationMixer.timeScale = animSpeed;
            if (!animationActions[currentAnimIdx]?.isRunning?.()) {
                playAnimation(currentAnimIdx);
            } else {
                isAnimPlaying = true;
                animDom.playBtn.textContent = "⏸";
            }
        }
    };

    const setupAnimations = (clips, object) => {
        if (!clips || clips.length === 0 || !threeLib) return;
        animationClips = clips;
        animationMixer = new threeLib.AnimationMixer(object);
        animationClock = new threeLib.Clock();
        animationActions = new Array(clips.length).fill(null);

        // Populate animation selector
        animDom.animSel.innerHTML = "";
        clips.forEach((clip, i) => {
            const opt = document.createElement("option");
            opt.value = String(i);
            opt.textContent = clip.name || `Animation ${i + 1}`;
            animDom.animSel.appendChild(opt);
        });
        animDom.animSel.style.display = clips.length > 1 ? "" : "none";

        animDom.bar.style.display = "flex";
        hint.style.bottom = `${MODEL3D_ANIM_BAR_HEIGHT_PX + 10}px`; // clear the animation bar

        // Play first animation
        playAnimation(0);

        // Bind animation bar events
        animDom.playBtn.addEventListener("click", (e) => {
            _stopEvent(e);
            togglePlayPause();
        });
        animDom.speedSel.addEventListener("change", () => {
            animSpeed = Number(animDom.speedSel.value) || 1.0;
            animationMixer.timeScale = isAnimPlaying ? animSpeed : 0;
            const action = animationActions[currentAnimIdx];
            if (action) action.timeScale = animSpeed;
        });
        animDom.animSel.addEventListener("change", () => {
            const idx = Number(animDom.animSel.value) || 0;
            playAnimation(idx);
        });
        animDom.progressSlider.addEventListener("pointerdown", () => {
            isSeeking = true;
        });
        animDom.progressSlider.addEventListener("pointerup", () => {
            isSeeking = false;
            const action = animationActions[currentAnimIdx];
            const clip = animationClips[currentAnimIdx];
            if (action && clip) {
                const sliderMax = Number(animDom.progressSlider.max) || 1000;
                const t = (Number(animDom.progressSlider.value) / sliderMax) * clip.duration;
                action.time = Math.max(0, Math.min(t, clip.duration));
            }
        });
        animDom.progressSlider.addEventListener("input", () => {
            const action = animationActions[currentAnimIdx];
            const clip = animationClips[currentAnimIdx];
            if (action && clip && isSeeking) {
                const sliderMax = Number(animDom.progressSlider.max) || 1000;
                const t = (Number(animDom.progressSlider.value) / sliderMax) * clip.duration;
                action.time = Math.max(0, Math.min(t, clip.duration));
                animDom.timeLbl.textContent = `${_formatAnimTime(t)} / ${_formatAnimTime(clip.duration)}`;
            }
        });
    };

    // ── Viewport button sync ─────────────────────────────────────────────────
    const syncViewportButtons = () => {
        _setViewportButtonActive(gridBtn, Boolean(gridHelper?.visible));
        _setViewportButtonActive(cameraModeBtn, viewportMode === MODEL3D_VIEW_MODES.ORTHOGRAPHIC);
        cameraModeBtn.textContent =
            viewportMode === MODEL3D_VIEW_MODES.ORTHOGRAPHIC ? "Ortho" : "Persp";
        _setViewportButtonActive(settingsBtn, settingsPanelVisible);
    };

    // ── Settings panel wiring ────────────────────────────────────────────────
    settingsDom.bgInput.addEventListener("input", () => {
        const col = settingsDom.bgInput.value;
        try {
            if (scene) scene.background = new (threeLib?.Color || Object)(col);
        } catch (e) {
            console.debug?.(e);
        }
    });
    settingsDom.materialSel.addEventListener("change", () => {
        applyMaterialMode(settingsDom.materialSel.value);
    });
    settingsDom.upSel.addEventListener("change", () => {
        applyUpDirection(settingsDom.upSel.value);
    });
    if (settingsDom.skeletonToggle) {
        settingsDom.skeletonToggle.addEventListener("change", () => {
            setSkeletonVisible(settingsDom.skeletonToggle.checked);
        });
    }
    settingsDom.fovSlider.addEventListener("input", () => {
        const fov = Math.max(
            1,
            Math.min(179, Number(settingsDom.fovSlider.value) || MODEL3D_DEFAULT_FOV),
        );
        try {
            if (perspectiveCamera) {
                perspectiveCamera.fov = fov;
                perspectiveCamera.updateProjectionMatrix();
            }
        } catch (e) {
            console.debug?.(e);
        }
    });
    settingsDom.lightSlider.addEventListener("input", () => {
        applyLightIntensity(Number(settingsDom.lightSlider.value));
    });

    // ── Event blocking (prevent bubbling to outer viewer/panzoom) ─────────────
    // NOTE: panzoom.js already guards pointer/mouse events via isModel3DInteractionTarget()
    // in its capture-phase listeners (panzoom.js:460), so we only need to block wheel,
    // contextmenu, and drag events here. Pointer/mouse events must NOT be stopped on host
    // because OrbitControls registers pointermove/pointerup on document via the canvas.
    const installInteractionShell = () => {
        const registrations = [];
        const bind = (el, name, handler, opts) => {
            el.addEventListener(name, handler, opts);
            registrations.push(() => el.removeEventListener(name, handler, opts));
        };
        // Focus canvas on pointer down (bubble, no stop — OrbitControls needs these)
        bind(host, "pointerdown", () => {
            try {
                canvas.focus?.();
            } catch (e) {
                console.debug?.(e);
            }
        });
        // Block wheel from reaching panzoom zoom
        bind(host, "wheel", (event) => _stopEvent(event));
        // Block context menu and drag
        bind(host, "contextmenu", (event) => _stopEvent(event, { preventDefault: true }));
        bind(host, "dragstart", (event) => _stopEvent(event, { preventDefault: true }));
        bind(host, "dragover", (event) => _stopEvent(event, { preventDefault: true }));
        bind(host, "dragleave", (event) => _stopEvent(event));
        bind(host, "drop", (event) => _stopEvent(event, { preventDefault: true }));
        return () => {
            for (const c of registrations) {
                try {
                    c();
                } catch (e) {
                    console.debug?.(e);
                }
            }
        };
    };

    // ── Destroy ──────────────────────────────────────────────────────────────
    const destroy = () => {
        destroyed = true;
        try {
            host._mjr3D = null;
        } catch (_) {}
        try {
            if (rafId != null) cancelAnimationFrame(rafId);
        } catch (e) {
            console.debug?.(e);
        }
        rafId = null;
        try {
            interactionCleanup?.();
        } catch (e) {
            console.debug?.(e);
        }
        interactionCleanup = null;
        try {
            resizeObserver?.disconnect?.();
        } catch (e) {
            console.debug?.(e);
        }
        resizeObserver = null;
        try {
            controls?.dispose?.();
        } catch (e) {
            console.debug?.(e);
        }
        controls = null;
        // Dispose animation mixer, actions, and clips
        try {
            animationMixer?.stopAllAction?.();
            animationMixer?.uncacheRoot?.(animationMixer.getRoot?.());
        } catch (e) {
            console.debug?.(e);
        }
        try {
            for (const action of animationActions) {
                try {
                    animationMixer?.uncacheAction?.(action);
                } catch (_) {}
            }
        } catch (e) {
            console.debug?.(e);
        }
        try {
            for (const clip of animationClips) {
                try {
                    clip?.dispose?.();
                } catch (_) {}
            }
        } catch (e) {
            console.debug?.(e);
        }
        animationMixer = null;
        animationActions = [];
        animationClips = [];
        // Dispose temp materials
        _disposeTempMaterials(tempMaterials);
        // Dispose skeleton helper
        try {
            if (skeletonHelper) {
                scene?.remove?.(skeletonHelper);
                skeletonHelper.dispose?.();
            }
        } catch (e) {
            console.debug?.(e);
        }
        skeletonHelper = null;
        // Dispose axis gizmo scene
        try {
            if (host._mjrAxisScene) {
                host._mjrAxisScene.traverse?.((obj) => {
                    try {
                        obj.geometry?.dispose?.();
                    } catch (_) {}
                    try {
                        obj.material?.dispose?.();
                    } catch (_) {}
                });
                host._mjrAxisScene = null;
            }
        } catch (e) {
            console.debug?.(e);
        }
        try {
            renderer?.dispose?.();
        } catch (e) {
            console.debug?.(e);
        }
        renderer = null;
        scene = null;
        activeCamera = null;
        perspectiveCamera = null;
        orthographicCamera = null;
        loadedObject = null;
        modelGroup = null;
        objectFrame = null;
        try {
            const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
            if (gl) gl.getExtension("WEBGL_lose_context")?.loseContext?.();
        } catch (e) {
            console.debug?.(e);
        }
    };

    const proc = { setParams: () => {}, destroy, captureCanvas: () => canvas };
    canvas._mjrProc = proc;
    setStatus("Preparing 3D preview", modelName);

    // ── Async init ────────────────────────────────────────────────────────────
    Promise.resolve()
        .then(async () => {
            const loaderType = resolveModel3DLoader(asset);
            if (!PREVIEWABLE_MODEL3D_LOADERS.has(loaderType)) {
                setStatus(
                    "3D preview unavailable",
                    `${loaderType.toUpperCase()} is not supported in the embedded viewer.`,
                );
                hint.style.display = "none";
                // Show a download fallback so the user can still access the file
                if (url) {
                    try {
                        const dl = document.createElement("a");
                        dl.href = url;
                        dl.download = String(asset?.filename || "model");
                        dl.textContent = `Download ${String(asset?.filename || "file")}`;
                        dl.style.cssText = [
                            "position:absolute",
                            "bottom:18px",
                            "left:50%",
                            "transform:translateX(-50%)",
                            "padding:7px 16px",
                            "border-radius:8px",
                            "font:600 12px system-ui,sans-serif",
                            "color:#fff",
                            "background:rgba(76,175,80,0.85)",
                            "text-decoration:none",
                            "pointer-events:auto",
                            "z-index:3",
                        ].join(";");
                        host.appendChild(dl);
                    } catch (_) {}
                }
                return;
            }

            try {
                const deps = await _loadThreeDeps();
                if (destroyed) return;
                const THREE = deps.THREE;
                threeLib = THREE;

                // URL modifier for relative resources (e.g. GLTF textures)
                const manager = new THREE.LoadingManager();
                manager.setURLModifier((requestedUrl) => {
                    if (!requestedUrl || _isAbsoluteOrSpecialUrl(requestedUrl)) return requestedUrl;
                    const rewritten = buildViewerResourceURL(asset, requestedUrl);
                    if (rewritten) return rewritten;
                    try {
                        return new URL(requestedUrl, url).href;
                    } catch {
                        return requestedUrl;
                    }
                });

                // Renderer
                renderer = new THREE.WebGLRenderer({
                    canvas,
                    antialias: true,
                    alpha: true,
                    preserveDrawingBuffer: true,
                });
                renderer.outputColorSpace = THREE.SRGBColorSpace;
                renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));

                // Scene
                scene = new THREE.Scene();
                scene.background = new THREE.Color(MODEL3D_VIEWER_DEFAULT_BG);

                // Cameras
                perspectiveCamera = new THREE.PerspectiveCamera(
                    MODEL3D_DEFAULT_FOV,
                    16 / 9,
                    0.01,
                    10000,
                );
                orthographicCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, -10000, 10000);
                activeCamera = perspectiveCamera;

                // Controls – attach to canvas (like ComfyUI's ControlsManager uses renderer.domElement)
                // so OrbitControls' internal pointermove/pointerup on ownerDocument are not blocked.
                controls = new deps.OrbitControls(activeCamera, canvas);
                controls.enableDamping = true;
                controls.dampingFactor = 0.08;
                controls.rotateSpeed = 0.82;
                controls.zoomSpeed = 1.0;
                controls.panSpeed = 0.9;
                controls.screenSpacePanning = true;
                controls.mouseButtons = buildModel3DMouseButtons(null, THREE.MOUSE);
                interactionCleanup = installInteractionShell();

                // ── 6-light setup (ComfyUI-style) ───────────────────────────────
                ambientLight = new THREE.AmbientLight(
                    0xffffff,
                    MODEL3D_LIGHT_SCALE.ambient * lightIntensity,
                );
                scene.add(ambientLight);

                const mainLight = new THREE.DirectionalLight(
                    0xffffff,
                    MODEL3D_LIGHT_SCALE.main * lightIntensity,
                );
                mainLight.position.set(0, 10, 10);

                const backLight = new THREE.DirectionalLight(
                    0xffffff,
                    MODEL3D_LIGHT_SCALE.back * lightIntensity,
                );
                backLight.position.set(-10, 0, -10);

                const fillRight = new THREE.DirectionalLight(
                    0xe8f0ff,
                    MODEL3D_LIGHT_SCALE.fill * lightIntensity,
                );
                fillRight.position.set(10, 5, -5);

                const fillLeft = new THREE.DirectionalLight(
                    0xfff0e8,
                    MODEL3D_LIGHT_SCALE.fill * lightIntensity,
                );
                fillLeft.position.set(-10, 5, 5);

                const bottomLight = new THREE.DirectionalLight(
                    0xffffff,
                    MODEL3D_LIGHT_SCALE.bottom * lightIntensity,
                );
                bottomLight.position.set(0, -10, 0);

                lightObjects = [mainLight, backLight, fillRight, fillLeft, bottomLight];
                lightObjects.forEach((l) => scene.add(l));

                // Grid
                gridHelper = new THREE.GridHelper(20, 20, 0x4d5560, 0x2f3742);
                scene.add(gridHelper);

                // Resize handler
                const resize = () => {
                    if (destroyed || !renderer || !activeCamera) return;
                    const rect = host.getBoundingClientRect();
                    const w = Math.max(1, Math.round(rect.width || canvas.clientWidth || 1));
                    const h = Math.max(1, Math.round(rect.height || canvas.clientHeight || 1));
                    renderer.setSize(w, h, false);
                    if (perspectiveCamera) {
                        perspectiveCamera.aspect = w / h;
                        perspectiveCamera.updateProjectionMatrix();
                    }
                    updateOrthographicProjection(w, h);
                    syncNaturalSize();
                    scheduleOverlayRedraw();
                };

                if (typeof ResizeObserver !== "undefined") {
                    resizeObserver = new ResizeObserver(() => resize());
                    resizeObserver.observe(host);
                }

                // Load model
                const loader = _createLoaderInstance(deps, loaderType, manager);
                if (!loader) {
                    setStatus(
                        "3D loader unavailable",
                        `${loaderType.toUpperCase()} loader could not be created.`,
                    );
                    hint.style.display = "none";
                    return;
                }

                // OBJ: try to load companion MTL first (like ComfyUI does)
                if (loaderType === "obj" && deps.MTLLoader) {
                    try {
                        const mtlUrl = url.replace(/\.obj(\?.*)?$/i, (m, q) => `.mtl${q || ""}`);
                        const mtlLoader = new deps.MTLLoader(manager);
                        const materials = await new Promise((res) => {
                            mtlLoader.load(mtlUrl, res, undefined, () => res(null));
                        });
                        if (materials && !destroyed) {
                            materials.preload();
                            loader.setMaterials(materials);
                        }
                    } catch (e) {
                        console.debug?.("[MJR 3D] MTL load skipped:", e?.message);
                    }
                }

                const loaded = await _loadModelContent(loader, loaderType, url);
                if (destroyed) return;

                const object = _buildRenderableObject(THREE, loaderType, loaded);
                if (!object) {
                    setStatus("Empty 3D scene", "The loader returned no renderable object.");
                    hint.style.display = "none";
                    return;
                }

                // Normalize model: scale to ~5 units and floor it (matches ComfyUI SceneModelManager)
                try {
                    const normBox = new THREE.Box3().setFromObject(object);
                    if (!normBox.isEmpty()) {
                        const normSize = normBox.getSize(new THREE.Vector3());
                        const normCenter = normBox.getCenter(new THREE.Vector3());
                        const maxDim = Math.max(normSize.x, normSize.y, normSize.z, 0.001);
                        const scale = 5 / maxDim;
                        object.scale.multiplyScalar(scale);
                        // Re-compute after scaling
                        normBox.setFromObject(object);
                        normBox.getCenter(normCenter);
                        // Center X/Z, floor Y
                        object.position.set(-normCenter.x, -normBox.min.y, -normCenter.z);
                    }
                } catch (e) {
                    console.debug?.("[MJR 3D] normalize skipped:", e);
                }

                // Wrap in a group so up-direction can rotate without affecting camera framing directly
                loadedObject = object;
                modelGroup = new THREE.Group();
                modelGroup.add(object);
                scene.add(modelGroup);

                // Store original materials
                originalMaterials = _storeOriginalMaterials(object);

                // Skeleton
                hasSkeleton = _findHasSkeleton(object);
                if (hasSkeleton) {
                    skeletonHelper = new THREE.SkeletonHelper(object);
                    skeletonHelper.visible = false;
                    scene.add(skeletonHelper);
                    // Rebuild settings panel with skeleton toggle
                    const newSettings = _createSettingsPanel({
                        defaultBgColor: MODEL3D_VIEWER_DEFAULT_BG,
                        defaultFov: MODEL3D_DEFAULT_FOV,
                        defaultLightIntensity: MODEL3D_DEFAULT_LIGHT_INTENSITY,
                        hasSkeleton: true,
                    });
                    host.replaceChild(newSettings.panel, settingsDom.panel);
                    Object.assign(settingsDom, newSettings);
                    // Re-wire events for new panel
                    settingsDom.bgInput.addEventListener("input", () => {
                        try {
                            if (scene)
                                scene.background = new THREE.Color(settingsDom.bgInput.value);
                        } catch (e) {
                            console.debug?.(e);
                        }
                    });
                    settingsDom.materialSel.addEventListener("change", () => {
                        applyMaterialMode(settingsDom.materialSel.value);
                    });
                    settingsDom.upSel.addEventListener("change", () => {
                        applyUpDirection(settingsDom.upSel.value);
                    });
                    if (settingsDom.skeletonToggle) {
                        settingsDom.skeletonToggle.addEventListener("change", () => {
                            setSkeletonVisible(settingsDom.skeletonToggle.checked);
                        });
                    }
                    settingsDom.fovSlider.addEventListener("input", () => {
                        const fov = Math.max(
                            1,
                            Math.min(
                                179,
                                Number(settingsDom.fovSlider.value) || MODEL3D_DEFAULT_FOV,
                            ),
                        );
                        try {
                            if (perspectiveCamera) {
                                perspectiveCamera.fov = fov;
                                perspectiveCamera.updateProjectionMatrix();
                            }
                        } catch (e) {
                            console.debug?.(e);
                        }
                    });
                    settingsDom.lightSlider.addEventListener("input", () => {
                        applyLightIntensity(Number(settingsDom.lightSlider.value));
                    });
                }

                // Fit model + place grid at its base
                objectFrame = _computeObjectFrame(THREE, modelGroup);
                if (objectFrame) {
                    gridHelper.position.y = objectFrame.box.min.y;
                }
                viewportMode = MODEL3D_VIEW_MODES.PERSPECTIVE;
                fitLoadedObject();
                resize();
                clearStatus();
                syncViewportButtons();

                // Animations
                const clips = _getModelAnimations(loaded, loaderType);
                if (clips.length > 0) setupAnimations(clips, object);

                // ── Axis gizmo (bottom-left corner) ─────────────────────────────
                const axisScene = new THREE.Scene();
                host._mjrAxisScene = axisScene;
                const axisCamera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
                axisCamera.position.set(0, 0, 3.2);
                axisCamera.lookAt(0, 0, 0);
                const AXIS_SIZE = 96; // px

                // Build axis lines + sphere tips
                const axisDefs = [
                    { dir: [1, 0, 0], color: 0xff3333 }, // X = red
                    { dir: [0, 1, 0], color: 0x33ff33 }, // Y = green
                    { dir: [0, 0, 1], color: 0x5588ff }, // Z = blue
                ];
                const sphereGeo = new THREE.SphereGeometry(0.1, 12, 8);
                const centerGeo = new THREE.SphereGeometry(0.08, 10, 6);
                const centerMat = new THREE.MeshBasicMaterial({ color: 0xcccccc });
                axisScene.add(new THREE.Mesh(centerGeo, centerMat));
                for (const { dir, color } of axisDefs) {
                    const mat = new THREE.LineBasicMaterial({ color });
                    const pts = [
                        new THREE.Vector3(0, 0, 0),
                        new THREE.Vector3(dir[0], dir[1], dir[2]),
                    ];
                    const lineGeo = new THREE.BufferGeometry().setFromPoints(pts);
                    axisScene.add(new THREE.Line(lineGeo, mat));
                    const tipMat = new THREE.MeshBasicMaterial({ color });
                    const tip = new THREE.Mesh(sphereGeo, tipMat);
                    tip.position.set(dir[0], dir[1], dir[2]);
                    axisScene.add(tip);
                }

                // Expose controls/camera on host so compare-mode sync can find them
                host._mjr3D = {
                    controls,
                    get camera() {
                        return activeCamera;
                    },
                };

                try {
                    options.onReady?.({
                        canvas,
                        host,
                        object: modelGroup,
                        renderer,
                        camera: activeCamera,
                        controls,
                    });
                } catch (e) {
                    console.debug?.(e);
                }
                scheduleOverlayRedraw();

                // ── Render loop ──────────────────────────────────────────────────
                const renderFrame = () => {
                    if (destroyed || !renderer || !scene || !activeCamera) return;
                    try {
                        controls?.update?.();
                        if (animationMixer && animationClock) {
                            const delta = animationClock.getDelta();
                            if (isAnimPlaying) animationMixer.update(delta);
                            syncAnimBar();
                        }

                        // Main scene
                        renderer.setScissorTest(false);
                        renderer.setViewport(0, 0, canvas.width, canvas.height);
                        renderer.render(scene, activeCamera);

                        // Axis gizmo – bottom-left corner
                        const px = Math.min(2, window.devicePixelRatio || 1);
                        const gizmoSize = Math.round(AXIS_SIZE * px);
                        renderer.setScissorTest(true);
                        renderer.setScissor(0, 0, gizmoSize, gizmoSize);
                        renderer.setViewport(0, 0, gizmoSize, gizmoSize);
                        renderer.setClearColor(0x000000, 0);
                        renderer.clear(true, true, false);

                        // Sync axis camera orientation with main camera
                        const q = activeCamera.quaternion;
                        axisCamera.position.set(0, 0, 3.2).applyQuaternion(q);
                        axisCamera.quaternion.copy(q);

                        renderer.render(axisScene, axisCamera);

                        // Restore state
                        renderer.setScissorTest(false);
                        try {
                            renderer.setClearColor(scene.background || 0x000000, 1);
                        } catch (_) {}

                        syncNaturalSize();
                    } catch (e) {
                        console.debug?.(e);
                    }
                    rafId = requestAnimationFrame(renderFrame);
                };

                // ── Viewport button events ───────────────────────────────────────
                const stopClick = (e) => _stopEvent(e, { preventDefault: true });

                resetViewBtn.addEventListener("click", (e) => {
                    stopClick(e);
                    fitLoadedObject();
                    syncViewportButtons();
                });
                gridBtn.addEventListener("click", (e) => {
                    stopClick(e);
                    if (gridHelper) gridHelper.visible = !gridHelper.visible;
                    syncViewportButtons();
                    scheduleOverlayRedraw();
                });
                cameraModeBtn.addEventListener("click", (e) => {
                    stopClick(e);
                    setViewportMode(
                        viewportMode === MODEL3D_VIEW_MODES.PERSPECTIVE
                            ? MODEL3D_VIEW_MODES.ORTHOGRAPHIC
                            : MODEL3D_VIEW_MODES.PERSPECTIVE,
                    );
                });
                settingsBtn.addEventListener("click", (e) => {
                    stopClick(e);
                    settingsPanelVisible = !settingsPanelVisible;
                    settingsDom.panel.style.display = settingsPanelVisible ? "block" : "none";
                    syncViewportButtons();
                });

                renderFrame();
            } catch (error) {
                console.warn("[MJR 3D] preview init failed", error);
                setStatus(
                    "Failed to load 3D preview",
                    String(error?.message || "Three.js initialization failed."),
                );
                hint.style.display = "none";
            }
        })
        .catch((err) => {
            if (!destroyed) {
                console.warn("[MJR 3D] preview init unhandled error", err);
                try {
                    setStatus(
                        "Failed to load 3D preview",
                        String(err?.message || "Initialization failed."),
                    );
                } catch (_) {}
                try {
                    hint.style.display = "none";
                } catch (_) {}
            }
        });

    return host;
}
