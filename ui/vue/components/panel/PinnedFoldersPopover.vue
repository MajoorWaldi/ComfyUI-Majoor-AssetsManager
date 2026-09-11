<script setup lang="ts">
/**
 * PinnedFoldersPopover.vue - Vue-owned pinned folders menu.
 *
 * Visibility is still controlled by the legacy popoverManager
 * (popovers.toggle) while Vue owns menu item rendering.
 */
import { ref } from "vue";

interface PinnedRoot {
    id: string;
    label: string;
    path: string;
}

const menuRef = ref<HTMLElement | null>(null);
const roots = ref<PinnedRoot[]>([]);
const loading = ref(false);
const emptyLabel = ref("No pinned folders");
const loadingLabel = ref("Loading...");
const unpinLabel = ref("Unpin folder");
const openHandler = ref<((root: PinnedRoot) => void) | null>(null);
const unpinHandler = ref<((root: PinnedRoot, event?: Event) => void) | null>(null);

function normalizeRoot(root: { id?: unknown; label?: unknown; name?: unknown; path?: unknown } | null | undefined): PinnedRoot | null {
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
}: {
    roots?: unknown[];
    emptyLabel?: string;
    loadingLabel?: string;
    unpinLabel?: string;
    onOpen?: ((root: PinnedRoot) => void) | null;
    onUnpin?: ((root: PinnedRoot, event?: Event) => void) | null;
    loading?: boolean;
} = {}) {
    roots.value = Array.isArray(nextRoots)
        ? nextRoots.map(normalizeRoot).filter((r): r is PinnedRoot => r !== null)
        : [];
    if (nextEmptyLabel) emptyLabel.value = String(nextEmptyLabel);
    if (nextLoadingLabel) loadingLabel.value = String(nextLoadingLabel);
    if (nextUnpinLabel) unpinLabel.value = String(nextUnpinLabel);
    openHandler.value = typeof onOpen === "function" ? onOpen : null;
    unpinHandler.value = typeof onUnpin === "function" ? onUnpin : null;
    loading.value = !!nextLoading;
}

function setPinnedFoldersLoading(value: boolean, label = "") {
    loading.value = !!value;
    if (label) loadingLabel.value = String(label);
}

function handleOpen(root: PinnedRoot) {
    openHandler.value?.(root);
}

function handleUnpin(root: PinnedRoot, event?: Event) {
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
    <div class="mjr-popover mjr-pinned-folders-popover mjr-popover--hidden">
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
