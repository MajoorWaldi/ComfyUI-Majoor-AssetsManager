<script setup>
/**
 * PinnedFoldersPopover.vue - Vue-owned pinned folders menu.
 *
 * Visibility is still controlled by the legacy popoverManager
 * (popovers.toggle) while Vue owns menu item rendering.
 */
import { ref } from "vue";

const menuRef = ref(null);
const roots = ref([]);
const loading = ref(false);
const emptyLabel = ref("No pinned folders");
const loadingLabel = ref("Loading...");
const unpinLabel = ref("Unpin folder");
const openHandler = ref(null);
const unpinHandler = ref(null);

function normalizeRoot(root) {
    const id = String(root?.id || "").trim();
    if (!id) return null;
    const label = String(root?.label || root?.name || root?.path || id).trim();
    return {
        id,
        label: label || id,
        path: String(root?.path || "").trim(),
    };
}

function setPinnedFolders({
    roots: nextRoots = [],
    emptyLabel: nextEmptyLabel = "",
    loadingLabel: nextLoadingLabel = "",
    unpinLabel: nextUnpinLabel = "",
    onOpen = null,
    onUnpin = null,
    loading: nextLoading = false,
} = {}) {
    roots.value = Array.isArray(nextRoots) ? nextRoots.map(normalizeRoot).filter(Boolean) : [];
    if (nextEmptyLabel) emptyLabel.value = String(nextEmptyLabel);
    if (nextLoadingLabel) loadingLabel.value = String(nextLoadingLabel);
    if (nextUnpinLabel) unpinLabel.value = String(nextUnpinLabel);
    openHandler.value = typeof onOpen === "function" ? onOpen : null;
    unpinHandler.value = typeof onUnpin === "function" ? onUnpin : null;
    loading.value = !!nextLoading;
}

function setPinnedFoldersLoading(value, label = "") {
    loading.value = !!value;
    if (label) loadingLabel.value = String(label);
}

function handleOpen(root) {
    openHandler.value?.(root);
}

function handleUnpin(root, event) {
    event?.preventDefault?.();
    event?.stopPropagation?.();
    unpinHandler.value?.(root, event);
}

defineExpose({
    get pinnedFoldersMenu() {
        return menuRef.value;
    },
    setPinnedFolders,
    setPinnedFoldersLoading,
});
</script>

<template>
    <div class="mjr-popover mjr-pinned-folders-popover" style="display: none;">
        <div ref="menuRef" class="mjr-menu mjr-pinned-folders-menu" role="menu">
            <div v-if="loading" class="mjr-muted mjr-pinned-folders-empty">
                {{ loadingLabel }}
            </div>
            <div v-else-if="!roots.length" class="mjr-muted mjr-pinned-folders-empty">
                {{ emptyLabel }}
            </div>
            <template v-else>
                <div v-for="root in roots" :key="root.id" class="mjr-pinned-folder-row">
                    <MButton
                        type="button"
                        class="mjr-menu-item mjr-pinned-folder-open"
                        role="menuitem"
                        severity="secondary"
                        @click="handleOpen(root)"
                    >
                        <span class="mjr-pinned-folder-label">{{ root.label }}</span>
                        <span v-if="root.path" class="mjr-menu-item-hint mjr-pinned-folder-path">
                            {{ root.path }}
                        </span>
                    </MButton>
                    <MButton
                        type="button"
                        class="mjr-menu-item mjr-pinned-folder-unpin"
                        role="menuitem"
                        severity="danger"
                        :title="unpinLabel"
                        :aria-label="`${unpinLabel}: ${root.label}`"
                        @click="handleUnpin(root, $event)"
                    >
                        <i class="pi pi-times" aria-hidden="true" />
                    </MButton>
                </div>
            </template>
        </div>
    </div>
</template>

<style scoped>
.mjr-pinned-folders-menu {
    display: grid;
    gap: 6px;
}

.mjr-pinned-folders-empty {
    padding: 10px 12px;
    opacity: 0.75;
}

.mjr-pinned-folder-row {
    display: flex;
    align-items: stretch;
    width: 100%;
}

.mjr-pinned-folder-open {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    gap: 10px;
    padding: 9px 10px;
    border-radius: 9px;
    border: 1px solid rgba(120, 190, 255, 0.18);
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.03), rgba(255, 255, 255, 0.01));
    transition: border-color 120ms ease, background 120ms ease;
}

.mjr-pinned-folder-open:hover,
.mjr-pinned-folder-open:focus-visible {
    border-color: rgba(145, 205, 255, 0.4);
    background: linear-gradient(135deg, rgba(80, 140, 255, 0.18), rgba(32, 100, 200, 0.14));
}

.mjr-pinned-folder-label {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-weight: 600;
    color: var(--fg-color, #e6edf7);
}

.mjr-pinned-folder-path {
    flex: 0 1 auto;
    min-width: 0;
    max-width: 220px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    opacity: 0.68;
    font-size: 11px;
}

.mjr-pinned-folder-unpin {
    width: 42px;
    justify-content: center;
    padding: 0;
    border: 1px solid rgba(255, 95, 95, 0.35);
    border-radius: 9px;
    margin-left: 6px;
    background: linear-gradient(135deg, rgba(255, 70, 70, 0.16), rgba(160, 20, 20, 0.12));
}

.mjr-pinned-folder-unpin .pi {
    opacity: 0.88;
    color: rgba(255, 130, 130, 0.96);
}
</style>
