import { comfyPrompt, comfyConfirm } from "../../../app/dialogs.js";
import { comfyToast } from "../../../app/toast.js";
import { listCollections, createCollection, deleteCollection } from "../../../api/client.js";
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
            } catch {}
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
                    } catch {}
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
                } catch {}
                popovers.close(collectionsPopover);
                await reloadGrid();
            });

            const delBtn = document.createElement("button");
            delBtn.type = "button";
            delBtn.className = "mjr-menu-item";
            delBtn.title = "Delete collection";
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
                    } catch {}
                }
                await render();
                await reloadGrid();
            });

            row.appendChild(openBtn);
            row.appendChild(delBtn);
            collectionsMenu.appendChild(row);
        }
    };

    const bind = () => {
        if (!collectionsBtn) return;
        collectionsBtn.addEventListener("click", async (e) => {
            e.stopPropagation();
            try {
                window.dispatchEvent(new CustomEvent("mjr-close-all-menus"));
            } catch {}
            try {
                await render();
            } catch {}
            popovers.toggle(collectionsPopover, collectionsBtn);
        });
    };

    return { bind, render };
}

