<script setup>
/**
 * FolderCard.vue — Complete Vue card for folder assets.
 * Replaces createFolderCard() from FolderCard.js.
 *
 * Unlike AssetCardInner.vue (fragment), FolderCard is a complete card with its
 * own `.mjr-asset-card` root so it can be returned directly from createItem().
 * GridView_impl.js mounts it into a host div and returns firstElementChild.
 *
 * Phase 4.2.
 */
import { ref } from "vue";

const props = defineProps({
    asset: { type: Object, required: true },
    selected: { type: Boolean, default: false },
});

const emit = defineEmits(["drop-asset"]);

const filename = () => String(props.asset.filename || "");

// ── Drop target for moving assets into this folder ──────────────────────
const dropActive = ref(false);

function onDragOver(event) {
    // Allow drops — Vue's .prevent modifier already called preventDefault.
    if (event.dataTransfer) {
        event.dataTransfer.dropEffect = "move";
    }
    dropActive.value = true;
}

function onDragLeave() {
    dropActive.value = false;
}

function onDrop(event) {
    dropActive.value = false;
    if (!event.dataTransfer) return;
    const types = Array.from(event.dataTransfer.types);
    if (!types.includes("application/x-mjr-asset")) return;

    let payload = null;
    try {
        const raw = event.dataTransfer.getData("application/x-mjr-asset");
        if (raw) payload = JSON.parse(raw);
    } catch {}
    if (!payload) return;

    const folderPath = String(props.asset.filepath || "").trim();
    if (!folderPath) return;

    emit("drop-asset", { asset: payload, folderPath });
}
</script>

<template>
    <div
        class="mjr-asset-card mjr-card mjr-folder-card"
        :class="{ 'is-selected': selected, 'drop-active': dropActive }"
        role="button"
        :tabindex="0"
        draggable="true"
        @dragover.prevent="onDragOver"
        @dragleave="onDragLeave"
        @drop.stop.prevent="onDrop"
        :data-mjr-asset-id="String(asset.id ?? '')"
        :data-mjr-filename-key="String(asset.filename || '').toLowerCase()"
        data-mjr-ext="FOLDER"
        :data-mjr-stem="String(asset.filename || '').toLowerCase()"
        data-mjr-kind="folder"
        :aria-label="`Folder ${asset.filename}`"
        :aria-selected="selected ? 'true' : 'false'"
    >
        <!-- Thumb: folder icon SVG -->
        <div
            class="mjr-thumb"
            style="display:flex;align-items:center;justify-content:center"
        >
            <svg width="64" height="64" viewBox="0 0 24 24" aria-hidden="true">
                <path
                    fill="#F4C74A"
                    d="M10 4H4c-1.1 0-2 .9-2 2v1h20V8c0-1.1-.9-2-2-2h-8l-2-2z"
                />
                <path
                    fill="#D9A730"
                    d="M20 6H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2z"
                />
            </svg>
        </div>

        <!-- Meta -->
        <div class="mjr-card-info mjr-card-meta" style="padding:6px 8px;min-width:0">
            <div
                class="mjr-card-filename"
                :title="asset.filename"
                style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-bottom:4px"
            >{{ asset.filename }}</div>
            <div class="mjr-card-meta-row" />
        </div>
    </div>
</template>

<style scoped>
.mjr-folder-card.drop-active {
    outline: 2px solid #4a90e2;
    outline-offset: -2px;
    background: rgba(74, 144, 226, 0.08);
}
</style>
