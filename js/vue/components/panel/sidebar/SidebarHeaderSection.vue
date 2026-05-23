<script setup>
/**
 * SidebarHeaderSection.vue — Sidebar header: asset filename + close button.
 *
 * Replaces createSidebarHeader() from HeaderSection.js.
 * Phase 5.
 */
const props = defineProps({
    asset: { type: Object, required: true },
});

const emit = defineEmits(["close"]);

const filename = () => String(props.asset?.filename || "");
</script>

<template>
    <div
        class="mjr-sidebar-header"
        style="display:flex;align-items:center;justify-content:space-between;padding:10px 12px;border-bottom:1px solid var(--mjr-border,rgba(255,255,255,0.12));flex-shrink:0;background:var(--mjr-surface-2,#2e2e2e)"
    >
        <div
            class="mjr-sidebar-filename"
            :title="asset.filename"
            style="font-size:0.9em;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1;min-width:0;padding-right:8px"
        >{{ asset.filename }}</div>

        <MButton
            type="button"
            class="mjr-sidebar-close"
            severity="secondary"
            text
            rounded
            title="Close sidebar (Esc)"
            aria-label="Close sidebar (Esc)"
            style="background:none;border:1px solid transparent;border-radius:4px;color:var(--mjr-text,#ccc);cursor:pointer;font-size:18px;line-height:1;padding:2px 6px;flex-shrink:0;transition:background 0.15s,border-color 0.15s"
            @click="emit('close')"
            @mouseenter="($event.currentTarget.style.background='rgba(255,255,255,0.1)') && ($event.currentTarget.style.borderColor='rgba(255,255,255,0.2)')"
            @mouseleave="($event.currentTarget.style.background='none') && ($event.currentTarget.style.borderColor='transparent')"
        >×</MButton>
    </div>
</template>
