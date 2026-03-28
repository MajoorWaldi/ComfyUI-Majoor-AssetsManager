import { comfyPrompt } from "../../../app/dialogs.js";
import { comfyToast } from "../../../app/toast.js";
import { listCollections, createCollection, addAssetsToCollection } from "../../../api/client.js";
import { t } from "../../../app/i18n.js";
import {
    getOrCreateMenu as getOrCreateMenuCore,
    createMenuItem,
    createMenuSeparator,
    showMenuAt,
    clearMenu,
    hideMenu,
    hideAllMenus,
    MENU_Z_INDEX,
} from "../../../components/contextmenu/MenuCore.js";
import { pickRootId } from "../../../utils/ids.js";

const MENU_SELECTOR = ".mjr-collections-context-menu";

function getOrCreateCollectionsMenu() {
    return getOrCreateMenuCore({
        selector: MENU_SELECTOR,
        className: "mjr-collections-context-menu",
        minWidth: 240,
        zIndex: MENU_Z_INDEX.COLLECTIONS,
        onHide: null,
    });
}

function separator() {
    return createMenuSeparator();
}

const createItem = (label, iconClass, onClick, opts) =>
    createMenuItem(label, iconClass, null, onClick, opts);
const showAt = showMenuAt;

function simplifyAsset(a) {
    if (!a || typeof a !== "object") return null;
    const filepath = a.filepath || a.path || a?.file_info?.filepath || "";
    if (!filepath) return null;
    return {
        filepath,
        filename: a.filename || "",
        subfolder: a.subfolder || "",
        type: (a.type || "output").toLowerCase(),
        root_id: pickRootId(a),
        kind: a.kind || "",
    };
}

function formatAddResultMessage({ collectionName, selectedCount, addRes }) {
    const added = Number(addRes?.data?.added ?? 0) || 0;
    const skippedExisting = Number(addRes?.data?.skipped_existing ?? 0) || 0;
    const skippedDuplicate = Number(addRes?.data?.skipped_duplicate ?? 0) || 0;

    const name = String(collectionName || "").trim() || t("label.collection", "collection");
    let msg = t("msg.collectionAdd.added", 'Added {added} item(s) to "{name}".', { added, name });

    if (skippedExisting > 0) {
        msg += `\n\n${t("msg.collectionAdd.skippedExisting", "Skipped {count} item(s): already present in the collection.", { count: skippedExisting })}`;
    }
    if (skippedDuplicate > 0) {
        msg += `\n\n${t("msg.collectionAdd.skippedDuplicate", "Ignored {count} duplicate(s) in selection.", { count: skippedDuplicate })}`;
    }
    if (added === 0 && skippedExisting > 0 && selectedCount > 0) {
        msg = t(
            "msg.collectionAdd.noneAddedExisting",
            'No new items added to "{name}" (all exist).',
            { name },
        );
    }
    return msg;
}

export async function showAddToCollectionMenu({ x, y, assets }) {
    try {
        window.dispatchEvent(new CustomEvent("mjr-close-all-menus"));
    } catch (e) {
        console.debug?.(e);
    }
    hideAllMenus();

    const selected = Array.isArray(assets) ? assets.map(simplifyAsset).filter(Boolean) : [];
    if (!selected.length) {
        comfyToast(t("toast.noValidAssetsSelected", "No valid assets selected."), "warning");
        return;
    }

    const listRes = await listCollections();
    const collections = Array.isArray(listRes?.data) ? listRes.data : [];

    // If none exist, directly prompt creation.
    if (!collections.length) {
        const name = await comfyPrompt(
            t("dialog.createCollection", "Create collection"),
            t("dialog.collectionPlaceholder", "My collection"),
        );
        if (!name) return;
        const created = await createCollection(name);
        if (!created?.ok) {
            comfyToast(
                created?.error ||
                    t("toast.failedCreateCollectionDot", "Failed to create collection."),
                "error",
            );
            return;
        }
        const cid = created.data?.id;
        const addRes = await addAssetsToCollection(cid, selected);
        if (!addRes?.ok) {
            comfyToast(
                addRes?.error ||
                    t("toast.failedAddAssetsToCollection", "Failed to add assets to collection."),
                "error",
            );
            return;
        }
        comfyToast(
            formatAddResultMessage({
                collectionName: created.data?.name || name,
                selectedCount: selected.length,
                addRes,
            }),
            "success",
            4000,
        );
        return;
    }

    const menu = getOrCreateCollectionsMenu();
    clearMenu(menu);

    const createIt = createItem(
        `${t("dialog.createCollection", "Create collection")}...`,
        "pi pi-plus",
        async () => {
            hideMenu(menu);
            const name = await comfyPrompt(
                t("dialog.createCollection", "Create collection"),
                t("dialog.collectionPlaceholder", "My collection"),
            );
            if (!name) return;
            const created = await createCollection(name);
            if (!created?.ok) {
                comfyToast(
                    created?.error ||
                        t("toast.failedCreateCollectionDot", "Failed to create collection."),
                    "error",
                );
                return;
            }
            const cid = created.data?.id;
            const addRes = await addAssetsToCollection(cid, selected);
            if (!addRes?.ok) {
                comfyToast(
                    addRes?.error ||
                        t(
                            "toast.failedAddAssetsToCollection",
                            "Failed to add assets to collection.",
                        ),
                    "error",
                );
                return;
            }
            comfyToast(
                formatAddResultMessage({
                    collectionName: created.data?.name || name,
                    selectedCount: selected.length,
                    addRes,
                }),
                "success",
                4000,
            );
        },
    );
    menu.appendChild(createIt);
    menu.appendChild(separator());

    for (const c of collections) {
        const cid = String(c?.id || "");
        const name = String(c?.name || cid);
        if (!cid) continue;
        menu.appendChild(
            createItem(name, "pi pi-bookmark", async () => {
                hideMenu(menu);
                const addRes = await addAssetsToCollection(cid, selected);
                if (!addRes?.ok) {
                    comfyToast(
                        addRes?.error ||
                            t(
                                "toast.failedAddAssetsToCollection",
                                "Failed to add assets to collection.",
                            ),
                        "error",
                    );
                    return;
                }
                comfyToast(
                    formatAddResultMessage({
                        collectionName: name,
                        selectedCount: selected.length,
                        addRes,
                    }),
                    "success",
                    4000,
                );
            }),
        );
    }

    showAt(menu, Number(x) || 0, Number(y) || 0);
}
