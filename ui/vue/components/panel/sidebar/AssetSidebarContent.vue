<script setup>
/**
 * AssetSidebarContent.vue — Vue-rendered sidebar content.
 *
 * Header, rating/tags, preview, file info, folder details, generation, and
 * workflow minimap now render directly in Vue.
 */
import { computed } from "vue";
import { closeSidebar } from "../../../../components/sidebar/SidebarView.js";
import { loadMajoorSettings } from "../../../../app/settings.js";
import SidebarHeaderSection from "./SidebarHeaderSection.vue";
import SidebarPreviewSection from "./SidebarPreviewSection.vue";
import SidebarFileInfoSection from "./SidebarFileInfoSection.vue";
import SidebarGenerationSection from "./SidebarGenerationSection.vue";
import SidebarWorkflowSection from "./SidebarWorkflowSection.vue";
import SidebarFolderSection from "./SidebarFolderSection.vue";
import RatingEditor from "../../common/RatingEditor.vue";
import TagsEditor from "../../common/TagsEditor.vue";

const props = defineProps({
    asset: { type: Object, required: true },
    onUpdate: { type: Function, default: null },
    sidebar: { type: Object, default: null },
});

const emit = defineEmits(["close"]);

const isFolder = computed(() => String(props.asset?.kind || "").toLowerCase() === "folder");
const rating = computed(() => Number(props.asset?.rating) || 0);
const tags = computed(() => props.asset?.tags || []);
const showPreviewThumb = computed(() => {
    try {
        const settings = loadMajoorSettings();
        return !!(settings?.sidebar?.showPreviewThumb ?? true);
    } catch {
        return true;
    }
});

function handleClose() {
    if (props.sidebar) {
        try {
            closeSidebar(props.sidebar);
        } catch (e) {
            console.debug?.(e);
        }
    } else {
        emit("close");
    }
}
</script>

<template>
    <SidebarHeaderSection :asset="asset" @close="handleClose" />

    <div
        class="mjr-sidebar-content"
        style="flex:1;overflow-y:auto;padding:10px 12px;display:flex;flex-direction:column;gap:16px"
    >
        <template v-if="isFolder">
            <SidebarFolderSection :asset="asset" />
        </template>

        <template v-else>
            <SidebarPreviewSection
                :asset="asset"
                :show-preview-thumb="showPreviewThumb"
            />

            <div
                class="mjr-sidebar-rating-tags"
                style="display:flex;flex-direction:column;gap:10px"
            >
                <div style="display:flex;align-items:center;gap:8px">
                    <span style="font-size:0.8em;opacity:0.6;min-width:44px">Rating</span>
                    <RatingEditor
                        :asset="asset"
                        :model-value="rating"
                    />
                </div>
                <div style="display:flex;flex-direction:column;gap:4px">
                    <span style="font-size:0.8em;opacity:0.6">Tags</span>
                    <TagsEditor
                        :asset="asset"
                        :model-value="tags"
                    />
                </div>
            </div>

            <SidebarFileInfoSection :asset="asset" />
            <SidebarGenerationSection :asset="asset" />
            <SidebarWorkflowSection :asset="asset" />
        </template>
    </div>
</template>
