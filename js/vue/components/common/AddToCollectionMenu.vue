<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import { listCollections, createCollection, addAssetsToCollection } from "../../../api/client.js";
import { comfyPrompt } from "../../../app/dialogs.js";
import { comfyToast } from "../../../app/toast.js";
import { t } from "../../../app/i18n.js";
import {
    addToCollectionMenuState,
    closeAddToCollectionMenu,
} from "../../../features/collections/contextmenu/addToCollectionMenuState.js";

const menuRef = ref(null);
const loading = ref(false);
const collections = ref([]);
const loadError = ref("");

let loadToken = 0;
let globalListenersController = null;

const menuStyle = computed(() => ({
    position: "fixed",
    left: `${Math.round(Number(addToCollectionMenuState.x) || 0)}px`,
    top: `${Math.round(Number(addToCollectionMenuState.y) || 0)}px`,
    display: "block",
    zIndex: "10004",
}));

const selectionCount = computed(() => addToCollectionMenuState.assets.length || 0);
const selectionLabel = computed(() =>
    t("ctx.addToCollection", "Add to collection") +
    (selectionCount.value > 1 ? ` (${selectionCount.value})` : ""),
);

function formatAddResultMessage({ collectionName, selectedCount, addRes }) {
    const added = Number(addRes?.data?.added ?? 0) || 0;
    const skippedExisting = Number(addRes?.data?.skipped_existing ?? 0) || 0;
    const skippedDuplicate = Number(addRes?.data?.skipped_duplicate ?? 0) || 0;

    const name = String(collectionName || "").trim() || t("label.collection", "collection");
    let msg = t('msg.collectionAdd.added', 'Added {added} item(s) to "{name}".', {
        added,
        name,
    });

    if (skippedExisting > 0) {
        msg += `\n\n${t(
            "msg.collectionAdd.skippedExisting",
            "Skipped {count} item(s): already present in the collection.",
            { count: skippedExisting },
        )}`;
    }
    if (skippedDuplicate > 0) {
        msg += `\n\n${t(
            "msg.collectionAdd.skippedDuplicate",
            "Ignored {count} duplicate(s) in selection.",
            { count: skippedDuplicate },
        )}`;
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

function clampToViewport() {
    const element = menuRef.value;
    if (!addToCollectionMenuState.open || !element) return;
    const rect = element.getBoundingClientRect();
    const vw = Number(window.innerWidth || 0);
    const vh = Number(window.innerHeight || 0);
    let x = Number(addToCollectionMenuState.x) || 0;
    let y = Number(addToCollectionMenuState.y) || 0;
    if (x + rect.width > vw) x = Math.max(8, vw - rect.width - 10);
    if (y + rect.height > vh) y = Math.max(8, vh - rect.height - 10);
    if (x < 8) x = 8;
    if (y < 8) y = 8;
    addToCollectionMenuState.x = x;
    addToCollectionMenuState.y = y;
}

async function loadCollections() {
    const token = ++loadToken;
    loading.value = true;
    loadError.value = "";
    try {
        const listRes = await listCollections();
        if (token !== loadToken) return;
        collections.value = Array.isArray(listRes?.data) ? listRes.data : [];
    } catch (error) {
        console.error("[AddToCollectionMenu.vue] listCollections failed:", error);
        if (token !== loadToken) return;
        collections.value = [];
        loadError.value = t("toast.failedLoadCollections", "Failed to load collections.");
    } finally {
        if (token === loadToken) {
            loading.value = false;
            await nextTick();
            clampToViewport();
            try {
                menuRef.value
                    ?.querySelector?.('.mjr-context-menu-item:not([aria-disabled="true"])')
                    ?.focus?.();
            } catch (e) {
                console.debug?.(e);
            }
        }
    }
}

async function addToCollection(id, name) {
    const selected = Array.isArray(addToCollectionMenuState.assets)
        ? addToCollectionMenuState.assets
        : [];
    closeAddToCollectionMenu();
    const addRes = await addAssetsToCollection(id, selected);
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
            collectionName: name,
            selectedCount: selected.length,
            addRes,
        }),
        "success",
        4000,
    );
}

async function createAndAddCollection() {
    const selected = Array.isArray(addToCollectionMenuState.assets)
        ? addToCollectionMenuState.assets
        : [];
    closeAddToCollectionMenu();
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
}

function handleGlobalPointerDown(event) {
    if (!menuRef.value?.contains?.(event?.target)) {
        closeAddToCollectionMenu();
    }
}

function handleGlobalKeydown(event) {
    if (event?.key === "Escape") closeAddToCollectionMenu();
}

function handleGlobalClose() {
    closeAddToCollectionMenu();
}

watch(
    () => addToCollectionMenuState.open,
    async (open) => {
        if (!open) return;
        collections.value = [];
        await loadCollections();
    },
);

onMounted(() => {
    globalListenersController = new AbortController();
    const optsCapturePassive = {
        capture: true,
        passive: true,
        signal: globalListenersController.signal,
    };
    window.addEventListener("pointerdown", handleGlobalPointerDown, optsCapturePassive);
    window.addEventListener("keydown", handleGlobalKeydown, {
        capture: true,
        signal: globalListenersController.signal,
    });
    window.addEventListener("scroll", handleGlobalClose, optsCapturePassive);
    window.addEventListener("wheel", handleGlobalClose, optsCapturePassive);
    window.addEventListener("resize", handleGlobalClose, {
        passive: true,
        signal: globalListenersController.signal,
    });
    window.addEventListener("mjr-close-all-menus", handleGlobalClose, {
        signal: globalListenersController.signal,
    });
});

onUnmounted(() => {
    try {
        globalListenersController?.abort();
    } catch (e) {
        console.debug?.(e);
    }
    globalListenersController = null;
    closeAddToCollectionMenu();
});
</script>

<template>
    <Teleport to="body">
        <div
            v-if="addToCollectionMenuState.open"
            ref="menuRef"
            class="mjr-add-to-collection-menu mjr-context-menu"
            :style="menuStyle"
            role="menu"
            :aria-label="selectionLabel"
        >
            <div class="mjr-context-menu-title">
                {{ selectionLabel }}
            </div>

            <button
                type="button"
                class="mjr-context-menu-item"
                role="menuitem"
                @click="createAndAddCollection"
            >
                <span class="mjr-context-menu-item-left">
                    <i class="pi pi-plus" />
                    <span>{{ t("dialog.createCollection", "Create collection") }}...</span>
                </span>
            </button>

            <div class="mjr-context-menu-separator" />

            <div v-if="loading" class="mjr-context-menu-note">
                {{ t("msg.loadingCollections", "Loading collections...") }}
            </div>
            <div v-else-if="loadError" class="mjr-context-menu-note is-error">
                {{ loadError }}
            </div>
            <div
                v-else-if="!collections.length"
                class="mjr-context-menu-note"
            >
                {{ t("msg.noCollections", "No collections yet.") }}
            </div>

            <button
                v-for="collection in collections"
                :key="String(collection?.id || '')"
                type="button"
                class="mjr-context-menu-item"
                role="menuitem"
                @click="addToCollection(String(collection?.id || ''), String(collection?.name || collection?.id || ''))"
            >
                <span class="mjr-context-menu-item-left">
                    <i class="pi pi-bookmark" />
                    <span>{{ String(collection?.name || collection?.id || "") }}</span>
                </span>
                <span
                    v-if="Number(collection?.count || 0) > 0"
                    class="mjr-context-menu-hint"
                >
                    {{ Number(collection?.count || 0) }}
                </span>
            </button>
        </div>
    </Teleport>
</template>
