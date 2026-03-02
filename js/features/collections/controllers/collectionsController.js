import { comfyPrompt, comfyConfirm } from "../../../app/dialogs.js";
import { comfyToast } from "../../../app/toast.js";
import { listCollections, createCollection, deleteCollection, vectorStats, vectorSearch, vectorSuggestCollections, addAssetsToCollection } from "../../../api/client.js";
import { buildAssetViewURL } from "../../../api/endpoints.js";
import { t } from "../../../app/i18n.js";

const MAX_COLLECTION_NAME_LEN = 128;

function normalizeCollectionName(value) {
    try {
        const name = String(value ?? "").trim();
        if (!name) return "";
        if (name.length > MAX_COLLECTION_NAME_LEN) return "";
        if (name.includes("\x00")) return "";
        for (let i = 0; i < name.length; i += 1) {
            const code = name.charCodeAt(i);
            if (code <= 31 || code === 127) return "";
        }
        return name;
    } catch {
        return "";
    }
}

function createMenuItem(label, { right = null, checked = false, danger = false } = {}) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "mjr-menu-item";
    if (danger) btn.style.color = "var(--error-text, #f44336)";
    btn.style.cssText = `
        display:flex;
        align-items:center;
        justify-content:space-between;
        width:100%;
        gap:10px;
        padding:9px 10px;
        border-radius:9px;
        border:1px solid ${checked ? "rgba(120,190,255,0.68)" : "rgba(120,190,255,0.18)"};
        background:${checked
            ? "linear-gradient(135deg, rgba(70,130,255,0.28), rgba(20,95,185,0.22))"
            : "linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))"};
        box-shadow:${checked ? "0 0 0 1px rgba(160,210,255,0.22) inset, 0 8px 18px rgba(35,95,185,0.26)" : "none"};
        transition: border-color 120ms ease, background 120ms ease, box-shadow 120ms ease;
    `;

    const left = document.createElement("span");
    left.className = "mjr-menu-item-label";
    left.textContent = label;
    left.style.cssText = `font-weight:${checked ? "700" : "600"}; color:${checked ? "rgba(208,234,255,0.98)" : "var(--fg-color, #e6edf7)"};`;

    const rightWrap = document.createElement("span");
    rightWrap.style.cssText = "display:flex; align-items:center; gap:10px;";

    if (right) {
        const hint = document.createElement("span");
        hint.className = "mjr-menu-item-hint";
        hint.textContent = String(right);
        hint.style.opacity = checked ? "0.9" : "0.65";
        hint.style.fontSize = "11px";
        rightWrap.appendChild(hint);
    }

    const check = document.createElement("i");
    check.className = "pi pi-check mjr-menu-item-check";
    check.style.cssText = `opacity:${checked ? "1" : "0"}; color: rgba(133,203,255,0.98);`;
    rightWrap.appendChild(check);

    btn.appendChild(left);
    btn.appendChild(rightWrap);
    btn.addEventListener("mouseenter", () => {
        if (checked) return;
        btn.style.borderColor = "rgba(145,205,255,0.4)";
        btn.style.background = "linear-gradient(135deg, rgba(80,140,255,0.18), rgba(32,100,200,0.14))";
    });
    btn.addEventListener("mouseleave", () => {
        if (checked) return;
        btn.style.borderColor = "rgba(120,190,255,0.18)";
        btn.style.background = "linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))";
    });
    return btn;
}

function createDivider() {
    const d = document.createElement("div");
    d.style.cssText = "height:1px; background: rgba(120,190,255,0.3); margin: 4px 0;";
    return d;
}

const SMART_COLLECTION_IDEAS = [
    { label: "Portraits", query: "portrait photo face person closeup", icon: "👤" },
    { label: "Landscapes", query: "landscape nature scenery mountains outdoor", icon: "🏞️" },
    { label: "Anime / Illustration", query: "anime illustration manga cartoon drawing", icon: "🎨" },
    { label: "Cyberpunk / Sci-Fi", query: "cyberpunk sci-fi futuristic neon city", icon: "🌃" },
    { label: "Fantasy", query: "fantasy magic medieval dragon castle", icon: "🐉" },
    { label: "Abstract", query: "abstract art pattern geometric colors", icon: "🔮" },
];

async function _appendSmartSuggestions(menu, state, popovers, collectionsPopover, reloadGrid, onChanged) {
    // Check if vector search is available
    let vectorAvailable = false;
    let vectorDisabled = false;
    try {
        const stats = await vectorStats();
        vectorDisabled = !stats?.ok && (
            String(stats?.code || "").toUpperCase() === "SERVICE_UNAVAILABLE"
            || /vector search is not enabled/i.test(String(stats?.error || ""))
        );
        vectorAvailable = stats?.ok && stats?.data?.total > 0;
    } catch { /* ignore */ }

    if (!vectorAvailable) {
        if (!vectorDisabled) return;
        menu.appendChild(createDivider());
        const disabled = document.createElement("div");
        disabled.style.cssText = `
            font-size: 10px;
            color: rgba(255,255,255,0.7);
            border: 1px dashed rgba(255,255,255,0.25);
            border-radius: 8px;
            padding: 8px 10px;
            margin: 4px 0;
            background: rgba(255,255,255,0.04);
            line-height: 1.35;
        `;
        disabled.textContent = "AI Smart Collections are disabled (enable vector search env var).";
        menu.appendChild(disabled);
        return;
    }

    menu.appendChild(createDivider());

    const header = document.createElement("div");
    header.style.cssText = `
        font-size: 10px;
        font-weight: 700;
        color: rgba(0, 188, 212, 0.8);
        text-transform: uppercase;
        letter-spacing: 0.8px;
        padding: 8px 10px 4px;
        display: flex;
        align-items: center;
        gap: 6px;
    `;
    header.textContent = "✨ Smart Suggestions";
    header.title = "AI-powered collection suggestions based on visual similarity";
    menu.appendChild(header);

    const hint = document.createElement("div");
    hint.style.cssText = "font-size: 10px; color: rgba(255,255,255,0.45); padding: 0 10px 6px; line-height: 1.4;";
    hint.textContent = "Create collections from AI-detected themes";
    menu.appendChild(hint);

    for (const idea of SMART_COLLECTION_IDEAS) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "mjr-menu-item";
        btn.style.cssText = `
            display: flex;
            align-items: center;
            justify-content: space-between;
            width: 100%;
            gap: 8px;
            padding: 7px 10px;
            border-radius: 9px;
            border: 1px solid rgba(0, 188, 212, 0.18);
            background: linear-gradient(135deg, rgba(0, 188, 212, 0.06), rgba(0, 150, 180, 0.04));
            transition: border-color 120ms ease, background 120ms ease;
            cursor: pointer;
        `;

        const left = document.createElement("span");
        left.style.cssText = "display: flex; align-items: center; gap: 6px; font-weight: 600; color: var(--fg-color, #e6edf7); font-size: 12px;";
        left.textContent = `${idea.icon} ${idea.label}`;
        btn.appendChild(left);

        const arrow = document.createElement("span");
        arrow.textContent = "+";
        arrow.style.cssText = "color: rgba(0, 188, 212, 0.6); font-size: 14px; font-weight: 700;";
        btn.appendChild(arrow);

        btn.addEventListener("mouseenter", () => {
            btn.style.borderColor = "rgba(0, 188, 212, 0.45)";
            btn.style.background = "linear-gradient(135deg, rgba(0, 188, 212, 0.14), rgba(0, 150, 180, 0.10))";
        });
        btn.addEventListener("mouseleave", () => {
            btn.style.borderColor = "rgba(0, 188, 212, 0.18)";
            btn.style.background = "linear-gradient(135deg, rgba(0, 188, 212, 0.06), rgba(0, 150, 180, 0.04))";
        });

        btn.addEventListener("click", async () => {
            try {
                // 1. Create the collection
                const res = await createCollection(idea.label);
                if (!res?.ok) {
                    comfyToast(res?.error || "Failed to create smart collection", "error");
                    return;
                }
                const colId = String(res.data?.id || "");
                if (!colId) return;

                // 2. Find matching assets via vector search
                const vecRes = await vectorSearch(idea.query, 50);
                if (vecRes?.ok && Array.isArray(vecRes.data) && vecRes.data.length > 0) {
                    // 3. Add found assets to collection
                    const assets = vecRes.data.map(r => ({ asset_id: r.asset_id }));
                    await addAssetsToCollection(colId, assets);
                    comfyToast(
                        t("toast.smartCollectionCreated", `Smart collection "${idea.label}" created with ${assets.length} assets!`, { name: idea.label, count: assets.length }),
                        "success",
                        3000
                    );
                } else {
                    comfyToast(
                        t("toast.smartCollectionEmpty", `Collection "${idea.label}" created but no matching assets found. Index more assets first.`, { name: idea.label }),
                        "info",
                        3000
                    );
                }

                // 4. Switch to the new collection
                state.collectionId = colId;
                state.collectionName = idea.label;
                try { onChanged?.(); } catch (e) { console.debug?.(e); }
                popovers.close(collectionsPopover);
                await reloadGrid();
            } catch (err) {
                console.error("[Majoor] Smart collection creation failed:", err);
                comfyToast("Failed to create smart collection", "error");
            }
        });

        menu.appendChild(btn);
    }
}

async function _appendDiscoverGroups(menu, state, popovers, collectionsPopover, reloadGrid, onChanged) {
    // Only show when vector search has indexed assets
    let vectorAvailable = false;
    try {
        const stats = await vectorStats();
        vectorAvailable = stats?.ok && stats?.data?.total > 0;
    } catch { /* ignore */ }
    if (!vectorAvailable) return;

    menu.appendChild(createDivider());

    const header = document.createElement("div");
    header.style.cssText = `
        font-size: 10px;
        font-weight: 700;
        color: rgba(180, 120, 255, 0.85);
        text-transform: uppercase;
        letter-spacing: 0.8px;
        padding: 8px 10px 4px;
        display: flex;
        align-items: center;
        gap: 6px;
    `;
    header.textContent = "🔬 Discover Groups";
    header.title = "Cluster your library into groups based on visual similarity";
    menu.appendChild(header);

    const hint = document.createElement("div");
    hint.style.cssText = "font-size: 10px; color: rgba(255,255,255,0.45); padding: 0 10px 6px; line-height: 1.4;";
    hint.textContent = "AI clusters assets by visual similarity";
    menu.appendChild(hint);

    // Container for cluster results (lazy loaded)
    const clustersContainer = document.createElement("div");
    clustersContainer.style.cssText = "padding: 0 4px;";

    const discoverBtn = document.createElement("button");
    discoverBtn.type = "button";
    discoverBtn.className = "mjr-menu-item";
    discoverBtn.style.cssText = `
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        gap: 6px;
        padding: 7px 10px;
        border-radius: 9px;
        border: 1px solid rgba(180, 120, 255, 0.25);
        background: linear-gradient(135deg, rgba(180, 120, 255, 0.07), rgba(130, 70, 220, 0.05));
        color: rgba(200, 150, 255, 0.85);
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.15s ease;
    `;
    discoverBtn.textContent = "🔍 Analyze Library";
    discoverBtn.title = "Run k-means clustering to discover visual groups";

    discoverBtn.addEventListener("mouseenter", () => {
        discoverBtn.style.borderColor = "rgba(180, 120, 255, 0.55)";
        discoverBtn.style.background = "linear-gradient(135deg, rgba(180, 120, 255, 0.15), rgba(130, 70, 220, 0.12))";
    });
    discoverBtn.addEventListener("mouseleave", () => {
        discoverBtn.style.borderColor = "rgba(180, 120, 255, 0.25)";
        discoverBtn.style.background = "linear-gradient(135deg, rgba(180, 120, 255, 0.07), rgba(130, 70, 220, 0.05))";
    });

    discoverBtn.addEventListener("click", async () => {
        discoverBtn.textContent = "⏳ Analyzing…";
        discoverBtn.disabled = true;
        clustersContainer.replaceChildren();
        try {
            const res = await vectorSuggestCollections(8);
            if (!res?.ok || !Array.isArray(res.data) || !res.data.length) {
                comfyToast("No groups found. Index more assets first.", "info", 3000);
                discoverBtn.textContent = "🔍 Analyze Library";
                discoverBtn.disabled = false;
                return;
            }

            discoverBtn.style.display = "none";

            for (const cluster of res.data) {
                const label = String(cluster.label || `Group ${cluster.cluster_id}`);
                const size = Number(cluster.size || 0);
                const allIds = Array.isArray(cluster.all_asset_ids) ? cluster.all_asset_ids : [];

                const row = document.createElement("div");
                row.style.cssText = `
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 6px 8px;
                    border-radius: 8px;
                    border: 1px solid rgba(180, 120, 255, 0.18);
                    background: rgba(180, 120, 255, 0.05);
                    margin-bottom: 4px;
                    gap: 8px;
                `;

                // Thumbnail previews
                const thumbRow = document.createElement("div");
                thumbRow.style.cssText = "display: flex; gap: 3px; flex-shrink: 0;";
                const sampleAssets = Array.isArray(cluster.sample_assets) ? cluster.sample_assets.slice(0, 3) : [];
                for (const sa of sampleAssets) {
                    const img = document.createElement("img");
                    img.style.cssText = "width: 28px; height: 28px; object-fit: cover; border-radius: 4px; opacity: 0.85;";
                    try {
                        img.src = buildAssetViewURL(sa);
                    } catch (e) { console.debug?.(e); }
                    img.loading = "lazy";
                    thumbRow.appendChild(img);
                }

                const info = document.createElement("div");
                info.style.cssText = "flex: 1; min-width: 0;";

                const nameSpan = document.createElement("div");
                nameSpan.style.cssText = "font-size: 12px; font-weight: 600; color: rgba(210, 170, 255, 0.95); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;";
                nameSpan.textContent = label;
                nameSpan.title = label;

                const countSpan = document.createElement("div");
                countSpan.style.cssText = "font-size: 10px; color: rgba(255,255,255,0.45);";
                countSpan.textContent = `${size} assets`;

                info.appendChild(nameSpan);
                info.appendChild(countSpan);

                const createBtn = document.createElement("button");
                createBtn.type = "button";
                createBtn.title = `Create collection "${label}"`;
                createBtn.style.cssText = `
                    padding: 3px 8px;
                    border-radius: 6px;
                    border: 1px solid rgba(180, 120, 255, 0.4);
                    background: rgba(180, 120, 255, 0.12);
                    color: rgba(210, 170, 255, 0.9);
                    font-size: 11px;
                    font-weight: 700;
                    cursor: pointer;
                    flex-shrink: 0;
                    transition: all 0.12s ease;
                `;
                createBtn.textContent = "+ Create";

                createBtn.addEventListener("click", async () => {
                    try {
                        createBtn.disabled = true;
                        createBtn.textContent = "…";
                        const colRes = await createCollection(label);
                        if (!colRes?.ok) {
                            comfyToast(colRes?.error || "Failed to create collection", "error");
                            createBtn.disabled = false;
                            createBtn.textContent = "+ Create";
                            return;
                        }
                        const colId = String(colRes.data?.id || "");
                        if (colId && allIds.length) {
                            await addAssetsToCollection(colId, allIds.map(id => ({ asset_id: id })));
                        }
                        comfyToast(`Collection "${label}" created with ${allIds.length} assets!`, "success", 3000);
                        state.collectionId = colId;
                        state.collectionName = label;
                        try { onChanged?.(); } catch (e) { console.debug?.(e); }
                        popovers.close(collectionsPopover);
                        await reloadGrid();
                    } catch (err) {
                        console.error("[Majoor] Cluster collection creation failed:", err);
                        comfyToast("Failed to create collection", "error");
                        createBtn.disabled = false;
                        createBtn.textContent = "+ Create";
                    }
                });

                row.appendChild(thumbRow);
                row.appendChild(info);
                row.appendChild(createBtn);
                clustersContainer.appendChild(row);
            }
        } catch (err) {
            console.error("[Majoor] Discover groups failed:", err);
            comfyToast("Cluster analysis failed", "error");
            discoverBtn.textContent = "🔍 Analyze Library";
            discoverBtn.disabled = false;
        }
    });

    menu.appendChild(discoverBtn);
    menu.appendChild(clustersContainer);
}

export function createCollectionsController({ state, collectionsBtn, collectionsMenu, collectionsPopover, popovers, reloadGrid, onChanged = null }) {
    const render = async () => {
        collectionsMenu.replaceChildren();

        const createBtn = createMenuItem(t("ctx.createCollection"));
        createBtn.addEventListener("click", async () => {
            const name = await comfyPrompt(t("dialog.createCollection"), t("dialog.collectionPlaceholder"));
            if (!name) return;
            const normalizedName = normalizeCollectionName(name);
            if (!normalizedName) {
                comfyToast(t("toast.invalidCollectionName", "Invalid collection name"), "error");
                return;
            }
            const res = await createCollection(normalizedName);
            if (!res?.ok) {
                comfyToast(res?.error || t("toast.failedCreateCollection"), "error");
                return;
            }
            state.collectionId = String(res.data?.id || "");
            state.collectionName = String(res.data?.name || normalizedName);
            try {
                onChanged?.();
            } catch (e) { console.debug?.(e); }
            popovers.close(collectionsPopover);
            await reloadGrid();
        });
        collectionsMenu.appendChild(createBtn);

            if (state.collectionId) {
                const exitBtn = createMenuItem(t("ctx.exitCollection"), { right: state.collectionName || null });
                exitBtn.addEventListener("click", async () => {
                    state.collectionId = "";
                    state.collectionName = "";
                    try {
                        onChanged?.();
                    } catch (e) { console.debug?.(e); }
                    popovers.close(collectionsPopover);
                    await reloadGrid();
                });
                collectionsMenu.appendChild(exitBtn);
            }

        collectionsMenu.appendChild(createDivider());

        const listRes = await listCollections();
        const list = Array.isArray(listRes?.data) ? listRes.data : [];

        if (!list.length) {
            const empty = document.createElement("div");
            empty.className = "mjr-muted";
            empty.style.cssText = "padding: 10px 12px; opacity: 0.75;";
            empty.textContent = t("msg.noCollections");
            collectionsMenu.appendChild(empty);
            return;
        }

        for (const item of list) {
            const id = String(item?.id || "");
            const name = String(item?.name || id);
            const count = Number(item?.count || 0) || 0;
            if (!id) continue;

            const row = document.createElement("div");
            row.style.cssText = "display:flex; align-items:stretch; width:100%;";

            const openBtn = createMenuItem(name, { right: count ? `${count}` : null, checked: state.collectionId === id });
            openBtn.style.flex = "1";
            openBtn.addEventListener("click", async () => {
                state.collectionId = id;
                state.collectionName = name;
                try {
                    onChanged?.();
                } catch (e) { console.debug?.(e); }
                popovers.close(collectionsPopover);
                await reloadGrid();
            });

            const delBtn = document.createElement("button");
            delBtn.type = "button";
            delBtn.className = "mjr-menu-item";
            delBtn.title = t("tooltip.deleteCollection", "Delete collection");
            delBtn.style.cssText =
                "width:42px; justify-content:center; padding:0; border:1px solid rgba(255,95,95,0.35); border-radius:9px; margin-left:6px; background: linear-gradient(135deg, rgba(255,70,70,0.16), rgba(160,20,20,0.12));";

            const trash = document.createElement("i");
            trash.className = "pi pi-trash";
            trash.style.cssText = "opacity:0.88; color: rgba(255,130,130,0.96);";
            delBtn.appendChild(trash);
            delBtn.addEventListener("mouseenter", () => {
                delBtn.style.borderColor = "rgba(255,120,120,0.62)";
                delBtn.style.background = "linear-gradient(135deg, rgba(255,70,70,0.24), rgba(170,30,30,0.2))";
            });
            delBtn.addEventListener("mouseleave", () => {
                delBtn.style.borderColor = "rgba(255,95,95,0.35)";
                delBtn.style.background = "linear-gradient(135deg, rgba(255,70,70,0.16), rgba(160,20,20,0.12))";
            });

            delBtn.addEventListener("click", async (e) => {
                e.preventDefault();
                e.stopPropagation();
                const ok = await comfyConfirm(t("dialog.deleteCollection", `Delete collection "${name}"?`, { name }));
                if (!ok) return;
                const res = await deleteCollection(id);
                if (!res?.ok) {
                    comfyToast(res?.error || t("toast.failedDeleteCollection"), "error");
                    return;
                }
                if (state.collectionId === id) {
                    state.collectionId = "";
                    state.collectionName = "";
                    try {
                        onChanged?.();
                    } catch (e) { console.debug?.(e); }
                }
                await render();
                await reloadGrid();
            });

            row.appendChild(openBtn);
            row.appendChild(delBtn);
            collectionsMenu.appendChild(row);
        }

        // ── Smart Collection Suggestions (vector-based) ──────────────
        _appendSmartSuggestions(collectionsMenu, state, popovers, collectionsPopover, reloadGrid, onChanged);

        // ── Discover Groups (cluster analysis) ───────────────────────
        _appendDiscoverGroups(collectionsMenu, state, popovers, collectionsPopover, reloadGrid, onChanged);
    };

    const bind = ({ onBeforeToggle } = {}) => {
        if (!collectionsBtn) return;
        collectionsBtn.addEventListener("click", async (e) => {
            e.stopPropagation();
            try {
                onBeforeToggle?.();
            } catch (e) { console.debug?.(e); }
            try {
                await render();
            } catch (e) { console.debug?.(e); }
            popovers.toggle(collectionsPopover, collectionsBtn);
        });
    };

    return { bind, render };
}

