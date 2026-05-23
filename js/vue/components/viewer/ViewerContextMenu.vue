<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import {
    closeAllViewerContextMenus,
    closeViewerSubmenu,
    openViewerSubmenu,
    viewerContextMenuState,
} from "../../../features/contextmenu/viewerContextMenuState.js";
import TagsEditor from "../common/TagsEditor.vue";

const mainMenuRef = ref(null);
const submenuRef = ref(null);
const tagsPopoverRef = ref(null);

let submenuCloseTimer = null;
let globalListenersController = null;

const mainMenuStyle = computed(() => layerStyle(viewerContextMenuState.main, 10041));
const submenuStyle = computed(() => layerStyle(viewerContextMenuState.submenu, 10042));
const tagsPopoverStyle = computed(() => layerStyle(viewerContextMenuState.tags, 10043));

function layerStyle(layer, zIndex) {
    return {
        position: "fixed",
        left: `${Math.round(Number(layer?.x) || 0)}px`,
        top: `${Math.round(Number(layer?.y) || 0)}px`,
        display: "block",
        zIndex: String(zIndex),
    };
}

function clearSubmenuTimer() {
    if (submenuCloseTimer) {
        clearTimeout(submenuCloseTimer);
        submenuCloseTimer = null;
    }
}

function scheduleSubmenuClose() {
    clearSubmenuTimer();
    submenuCloseTimer = setTimeout(() => {
        closeViewerSubmenu();
    }, 180);
}

function clampLayerToViewport(layer, element) {
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

async function afterOpenClamp(layer, elementRef) {
    await nextTick();
    clampLayerToViewport(layer, elementRef?.value || null);
}

function focusFirstItem(menuRef) {
    try {
        menuRef?.value
            ?.querySelector?.('.mjr-context-menu-item:not([aria-disabled="true"])')
            ?.focus?.();
    } catch (e) {
        console.debug?.(e);
    }
}

function openSubmenuForItem(item, event) {
    if (!Array.isArray(item?.submenu) || !item.submenu.length) {
        closeViewerSubmenu();
        return;
    }
    clearSubmenuTimer();
    const target = event?.currentTarget;
    const rect = target?.getBoundingClientRect?.();
    openViewerSubmenu({
        x: Math.round((rect?.right || viewerContextMenuState.main.x || 0) + 6),
        y: Math.round((rect?.top || viewerContextMenuState.main.y || 0) - 4),
        items: item.submenu,
        title: item.label || "",
    });
}

async function handleItemClick(item, event, source = "main") {
    if (!item || item.type !== "item" || item.disabled) return;
    if (Array.isArray(item.submenu) && item.submenu.length) {
        openSubmenuForItem(item, event);
        return;
    }
    try {
        await item.action?.();
    } catch (error) {
        console.error("[ViewerContextMenu.vue] Action failed:", error);
    } finally {
        if (item.closeOnSelect !== false) {
            closeAllViewerContextMenus();
        } else if (source === "submenu") {
            closeViewerSubmenu();
        }
    }
}

function handleMainItemEnter(item, event) {
    if (Array.isArray(item?.submenu) && item.submenu.length) {
        openSubmenuForItem(item, event);
        return;
    }
    closeViewerSubmenu();
}

function handleMainItemLeave(item) {
    if (Array.isArray(item?.submenu) && item.submenu.length) {
        scheduleSubmenuClose();
    }
}

function handleSubmenuEnter() {
    clearSubmenuTimer();
}

function handleSubmenuLeave() {
    scheduleSubmenuClose();
}

function handleGlobalPointerDown(event) {
    const target = event?.target;
    const insideMenu =
        mainMenuRef.value?.contains?.(target) ||
        submenuRef.value?.contains?.(target) ||
        tagsPopoverRef.value?.contains?.(target);
    if (!insideMenu) closeAllViewerContextMenus();
}

function handleGlobalKeydown(event) {
    if (event?.key === "Escape") closeAllViewerContextMenus();
}

function handleGlobalScroll() {
    closeAllViewerContextMenus();
}

function handleCloseAllMenus(event) {
    if (String(event?.detail?.source || "") === "viewer") return;
    closeAllViewerContextMenus();
}

function handleTagsModelValue(tags) {
    const asset = viewerContextMenuState.tags.asset;
    if (!asset) return;
    asset.tags = Array.isArray(tags) ? [...tags] : [];
}

function handleTagsChange(payload) {
    const tags = Array.isArray(payload?.tags) ? payload.tags : [];
    try {
        viewerContextMenuState.tags.onChanged?.(tags);
    } catch (e) {
        console.debug?.(e);
    }
}

watch(
    () => viewerContextMenuState.main.open,
    async (open) => {
        if (!open) return;
        await afterOpenClamp(viewerContextMenuState.main, mainMenuRef);
        focusFirstItem(mainMenuRef);
    },
);

watch(
    () => viewerContextMenuState.submenu.open,
    async (open) => {
        if (!open) return;
        await afterOpenClamp(viewerContextMenuState.submenu, submenuRef);
        focusFirstItem(submenuRef);
    },
);

watch(
    () => viewerContextMenuState.tags.open,
    async (open) => {
        if (!open) return;
        await afterOpenClamp(viewerContextMenuState.tags, tagsPopoverRef);
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
    clearSubmenuTimer();
    try {
        globalListenersController?.abort();
    } catch (e) {
        console.debug?.(e);
    }
    globalListenersController = null;
    closeAllViewerContextMenus();
});
</script>

<template>
    <Teleport to="body">
        <div
            v-if="viewerContextMenuState.main.open"
            ref="mainMenuRef"
            class="mjr-viewer-context-menu mjr-context-menu"
            :style="mainMenuStyle"
            role="menu"
            aria-label="Viewer context menu"
        >
            <template v-for="item in viewerContextMenuState.main.items" :key="item.id">
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
            v-if="viewerContextMenuState.submenu.open"
            ref="submenuRef"
            class="mjr-viewer-rating-submenu mjr-context-menu"
            :style="submenuStyle"
            role="menu"
            aria-label="Viewer context submenu"
            @mouseenter="handleSubmenuEnter"
            @mouseleave="handleSubmenuLeave"
        >
            <template v-for="item in viewerContextMenuState.submenu.items" :key="item.id">
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
                    :class="{ 'is-disabled': item.disabled }"
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
            v-if="viewerContextMenuState.tags.open && viewerContextMenuState.tags.asset"
            ref="tagsPopoverRef"
            class="mjr-viewer-popover"
            :style="tagsPopoverStyle"
        >
            <TagsEditor
                :asset="viewerContextMenuState.tags.asset"
                :model-value="viewerContextMenuState.tags.asset?.tags || []"
                @update:model-value="handleTagsModelValue"
                @tags-change="handleTagsChange"
            />
        </div>
    </Teleport>
</template>
