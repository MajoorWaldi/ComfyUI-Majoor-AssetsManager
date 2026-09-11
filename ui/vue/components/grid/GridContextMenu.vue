<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import {
    closeAllGridContextMenus,
    closeGridSubmenu,
    gridContextMenuState,
    openGridSubmenu,
} from "../../../features/contextmenu/gridContextMenuState.js";
import TagsEditor from "../common/TagsEditor.vue";
import type { MjrContextMenuItem, MjrContextMenuLayer } from "../../../types/contextMenu";

const mainMenuRef = ref<HTMLElement | null>(null);
const submenuRef = ref<HTMLElement | null>(null);
const tagsPopoverRef = ref<HTMLElement | null>(null);

let submenuCloseTimer: ReturnType<typeof setTimeout> | null = null;
let globalListenersController: AbortController | null = null;

const mainMenuStyle = computed(() => _layerStyle(gridContextMenuState.main, 10031));
const submenuStyle = computed(() => _layerStyle(gridContextMenuState.submenu, 10032));
const tagsPopoverStyle = computed(() => _layerStyle(gridContextMenuState.tags, 10033));

function _layerStyle(layer: MjrContextMenuLayer | undefined, zIndex: number) {
    return {
        position: "fixed",
        left: `${Math.round(Number(layer?.x) || 0)}px`,
        top: `${Math.round(Number(layer?.y) || 0)}px`,
        display: "block",
        zIndex: String(zIndex),
    };
}

function _clearSubmenuTimer() {
    if (submenuCloseTimer) {
        clearTimeout(submenuCloseTimer);
        submenuCloseTimer = null;
    }
}

function _scheduleSubmenuClose() {
    _clearSubmenuTimer();
    submenuCloseTimer = setTimeout(() => {
        closeGridSubmenu();
    }, 180);
}

function _clampLayerToViewport(layer: MjrContextMenuLayer | undefined, element: HTMLElement | null) {
    if (!layer?.open || !element) return;
    const rect = element.getBoundingClientRect();
    const vw = Number(window.innerWidth || 0);
    const vh = Number(window.innerHeight || 0);
    let x = Number(layer.x) || 0;
    let y = Number(layer.y) || 0;
    if (x + rect.width > vw) x = Math.max(8, vw - rect.width - 10);
    if (y + rect.height > vh) y = Math.max(8, vh - rect.height - 10);
    if (x < 8) x = 8;
    if (y < 8) y = 8;
    layer.x = x;
    layer.y = y;
}

async function _afterOpenClamp(layer: MjrContextMenuLayer, elementRef: { value: HTMLElement | null }) {
    await nextTick();
    _clampLayerToViewport(layer, elementRef?.value || null);
}

function _focusFirstItem(menuRef: { value: HTMLElement | null }) {
    try {
        menuRef?.value
            ?.querySelector?.('.mjr-context-menu-item:not([aria-disabled="true"])')
            ?.focus?.();
    } catch (e) {
        console.debug?.(e);
    }
}

function _openSubmenuForItem(item: MjrContextMenuItem | undefined, event: MouseEvent) {
    if (!Array.isArray(item?.submenu) || !item.submenu.length) {
        closeGridSubmenu();
        return;
    }
    _clearSubmenuTimer();
    const target = event?.currentTarget as HTMLElement | null;
    const rect = target?.getBoundingClientRect?.();
    openGridSubmenu({
        x: Math.round((rect?.right || gridContextMenuState.main.x || 0) + 6),
        y: Math.round((rect?.top || gridContextMenuState.main.y || 0) - 4),
        items: item.submenu,
        title: item.label || "",
    });
}

async function handleItemClick(item: MjrContextMenuItem | undefined, event: Event, source = "main") {
    if (!item || item.type !== "item" || item.disabled) return;
    if (Array.isArray(item.submenu) && item.submenu.length) {
        _openSubmenuForItem(item, event);
        return;
    }
    try {
        await item.action?.();
    } catch (error) {
        console.error("[GridContextMenu.vue] Action failed:", error);
    } finally {
        if (item.closeOnSelect !== false) {
            closeAllGridContextMenus();
        } else if (source === "submenu") {
            closeGridSubmenu();
        }
    }
}

function handleMainItemEnter(item: MjrContextMenuItem | undefined, event: MouseEvent) {
    if (Array.isArray(item?.submenu) && item.submenu.length) {
        _openSubmenuForItem(item, event);
        return;
    }
    closeGridSubmenu();
}

function handleMainItemLeave(item: MjrContextMenuItem | undefined) {
    if (Array.isArray(item?.submenu) && item.submenu.length) {
        _scheduleSubmenuClose();
    }
}

function handleSubmenuEnter() {
    _clearSubmenuTimer();
}

function handleSubmenuLeave() {
    _scheduleSubmenuClose();
}

function handleGlobalPointerDown(event: PointerEvent) {
    const target = event?.target as Node;
    const insideMenu =
        mainMenuRef.value?.contains?.(target) ||
        submenuRef.value?.contains?.(target) ||
        tagsPopoverRef.value?.contains?.(target);
    if (!insideMenu) {
        closeAllGridContextMenus();
    }
}

function handleGlobalKeydown(event: KeyboardEvent) {
    if (event?.key === "Escape") {
        closeAllGridContextMenus();
    }
}

function handleGlobalScroll() {
    closeAllGridContextMenus();
}

function handleCloseAllMenus(event: Event) {
    const detail = (event as CustomEvent)?.detail;
    if (String(detail?.source || "") === "grid") return;
    closeAllGridContextMenus();
}

function handleTagsModelValue(tags: unknown) {
    const asset = gridContextMenuState.tags.asset;
    if (!asset) return;
    asset.tags = Array.isArray(tags) ? [...tags] : [];
}

function handleTagsChange(payload: { tags?: unknown[] }) {
    const tags = Array.isArray(payload?.tags) ? payload.tags : [];
    try {
        gridContextMenuState.tags.onChanged?.(tags);
    } catch (e) {
        console.debug?.(e);
    }
}

watch(
    () => gridContextMenuState.main.open,
    async (open) => {
        if (!open) return;
        await _afterOpenClamp(gridContextMenuState.main, mainMenuRef);
        _focusFirstItem(mainMenuRef);
    },
);

watch(
    () => gridContextMenuState.submenu.open,
    async (open) => {
        if (!open) return;
        await _afterOpenClamp(gridContextMenuState.submenu, submenuRef);
        _focusFirstItem(submenuRef);
    },
);

watch(
    () => gridContextMenuState.tags.open,
    async (open) => {
        if (!open) return;
        await _afterOpenClamp(gridContextMenuState.tags, tagsPopoverRef);
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
    window.addEventListener("scroll", handleGlobalScroll, optsCapturePassive);
    window.addEventListener("wheel", handleGlobalScroll, optsCapturePassive);
    window.addEventListener("resize", handleGlobalScroll, {
        passive: true,
        signal: globalListenersController.signal,
    });
    window.addEventListener("mjr-close-all-menus", handleCloseAllMenus, {
        signal: globalListenersController.signal,
    });
});

onUnmounted(() => {
    _clearSubmenuTimer();
    try {
        globalListenersController?.abort();
    } catch (e) {
        console.debug?.(e);
    }
    globalListenersController = null;
    closeAllGridContextMenus();
});
</script>

<template>
    <Teleport to="body">
        <div
            v-if="gridContextMenuState.main.open"
            ref="mainMenuRef"
            class="mjr-grid-context-menu mjr-context-menu"
            :style="mainMenuStyle"
            role="menu"
            aria-label="Grid context menu"
        >
            <template v-for="item in gridContextMenuState.main.items" :key="item.id">
                <div
                    v-if="item.type === 'separator'"
                    class="mjr-context-menu-separator"
                />
                <MButton
                    v-else
                    type="button"
                    class="mjr-context-menu-item"
                    severity="secondary"
                    text
                    :class="{
                        'is-disabled': item.disabled,
                        'has-submenu': Array.isArray(item.submenu) && item.submenu.length,
                        'is-tone-graph-map': item.tone === 'graph-map',
                        'is-tone-rename': item.tone === 'rename',
                        'is-tone-delete': item.tone === 'delete',
                        'is-tone-floating-viewer': item.tone === 'floating-viewer',
                    }"
                    role="menuitem"
                    :aria-disabled="item.disabled ? 'true' : 'false'"
                    :tabindex="item.disabled ? -1 : 0"
                    @click="handleItemClick(item, $event)"
                    @mouseenter="handleMainItemEnter(item, $event)"
                    @mouseleave="handleMainItemLeave(item)"
                >
                    <span class="mjr-context-menu-item-left">
                        <i v-if="item.iconClass" :class="item.iconClass" />
                        <span>{{ item.label }}</span>
                    </span>
                    <span class="mjr-context-menu-item-right">
                        <span v-if="item.rightHint" class="mjr-context-menu-hint">
                            {{ item.rightHint }}
                        </span>
                        <span
                            v-if="Array.isArray(item.submenu) && item.submenu.length"
                            class="mjr-context-menu-submenu-arrow"
                        >
                            &gt;
                        </span>
                    </span>
                </MButton>
            </template>
        </div>

        <div
            v-if="gridContextMenuState.submenu.open"
            ref="submenuRef"
            class="mjr-grid-rating-submenu mjr-context-menu"
            :style="submenuStyle"
            role="menu"
            aria-label="Grid context submenu"
            @mouseenter="handleSubmenuEnter"
            @mouseleave="handleSubmenuLeave"
        >
            <template v-for="item in gridContextMenuState.submenu.items" :key="item.id">
                <div
                    v-if="item.type === 'separator'"
                    class="mjr-context-menu-separator"
                />
                <MButton
                    v-else
                    type="button"
                    class="mjr-context-menu-item"
                    severity="secondary"
                    text
                    :class="{
                        'is-disabled': item.disabled,
                        'is-tone-graph-map': item.tone === 'graph-map',
                        'is-tone-rename': item.tone === 'rename',
                        'is-tone-delete': item.tone === 'delete',
                        'is-tone-floating-viewer': item.tone === 'floating-viewer',
                    }"
                    role="menuitem"
                    :aria-disabled="item.disabled ? 'true' : 'false'"
                    :tabindex="item.disabled ? -1 : 0"
                    @click="handleItemClick(item, $event, 'submenu')"
                >
                    <span class="mjr-context-menu-item-left">
                        <i v-if="item.iconClass" :class="item.iconClass" />
                        <span>{{ item.label }}</span>
                    </span>
                    <span v-if="item.rightHint" class="mjr-context-menu-hint">
                        {{ item.rightHint }}
                    </span>
                </MButton>
            </template>
        </div>

        <div
            v-if="gridContextMenuState.tags.open && gridContextMenuState.tags.asset"
            ref="tagsPopoverRef"
            class="mjr-grid-popover"
            :style="tagsPopoverStyle"
        >
            <TagsEditor
                :asset="gridContextMenuState.tags.asset"
                :model-value="gridContextMenuState.tags.asset?.tags || []"
                @update:model-value="handleTagsModelValue"
                @tags-change="handleTagsChange"
            />
        </div>
    </Teleport>
</template>
