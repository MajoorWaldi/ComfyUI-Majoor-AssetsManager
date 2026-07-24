<script setup>
/**
 * AssetSidebarContent.vue — Vue-rendered sidebar content.
 *
 * Header, rating/tags, preview, file info, folder details, generation, and
 * workflow minimap now render directly in Vue.
 */
import { computed, ref } from "vue";
import { closeSidebar } from "../../../../components/sidebar/SidebarView.js";
import { collectFiles } from "../../../../api/client.js";
import { loadMajoorSettings } from "../../../../app/settings.js";
import { t } from "../../../../app/i18n.js";
import { comfyToast } from "../../../../app/toast.js";
import SidebarHeaderSection from "./SidebarHeaderSection.vue";
import SidebarPreviewSection from "./SidebarPreviewSection.vue";
import SidebarFileInfoSection from "./SidebarFileInfoSection.vue";
import SidebarGenerationSection from "./SidebarGenerationSection.vue";
import SidebarWorkflowSection from "./SidebarWorkflowSection.vue";
import SidebarFolderSection from "./SidebarFolderSection.vue";
import RatingEditor from "../../common/RatingEditor.vue";
import TagsEditor from "../../common/TagsEditor.vue";
import ContextMenuPortal from "../../common/ContextMenuPortal.vue";

const props = defineProps({
    asset: { type: Object, required: true },
    onUpdate: { type: Function, default: null },
    sidebar: { type: Object, default: null },
});

const emit = defineEmits(["close"]);

const isFolder = computed(() => String(props.asset?.kind || "").toLowerCase() === "folder");
const isWorkflow = computed(() => {
    const kind = String(props.asset?.kind || "").toLowerCase();
    const source = String(props.asset?.source || props.asset?.scope || "").toLowerCase();
    const filepath = String(props.asset?.filepath || props.asset?.path || "").toLowerCase();
    return kind === "workflow" || source === "workflow" || filepath.endsWith(".json");
});
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

const collecting = ref(false);
const assetFilepath = computed(() =>
    String(props.asset?.filepath || props.asset?.path || props.asset?.file_info?.filepath || "").trim(),
);

async function handleCollectFiles() {
    if (collecting.value || !assetFilepath.value) return;
    collecting.value = true;
    try {
        comfyToast(t("toast.collectingFiles", "Collecting files..."), "info", 2500);
        const res = await collectFiles(assetFilepath.value);
        if (!res?.ok) {
            comfyToast(res?.error || t("toast.collectFilesFailed", "Collect files failed"), "error");
            return;
        }
        const data = res?.data || {};
        const missingCount = Array.isArray(data.missing) ? data.missing.length : 0;
        const where = data.fallback_used
            ? t("toast.collectFallbackDir", "output folder (source folder not writable)")
            : t("toast.collectSameDir", "asset folder");
        let message = t("toast.collectedFiles", "Collected {name} in {where}", {
            name: String(data.zip_name || "zip"),
            where,
        });
        if (missingCount > 0) {
            message += ` \u2014 ${missingCount} ${t("toast.collectMissingInputs", "input(s) missing")}`;
        }
        comfyToast(message, missingCount > 0 ? "warning" : "success", 6000);
    } catch (e) {
        console.debug?.(e);
        comfyToast(t("toast.collectFilesFailed", "Collect files failed"), "error");
    } finally {
        collecting.value = false;
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
            <template v-if="!isWorkflow">
                <SidebarPreviewSection
                    :asset="asset"
                    :show-preview-thumb="showPreviewThumb"
                />

                <div
                    class="mjr-sidebar-rating-tags"
                    style="display:flex;flex-direction:column;gap:10px"
                >
                    <div style="display:flex;align-items:center;gap:8px">
                        <span style="font-size:0.8em;opacity:0.6;min-width:44px">{{ t("sidebar.rating", "Rating") }}</span>
                        <RatingEditor
                            :asset="asset"
                            :model-value="rating"
                            :size="60"
                        />
                    </div>
                    <div style="display:flex;flex-direction:column;gap:4px">
                        <span style="font-size:0.8em;opacity:0.6">{{ t("sidebar.tags", "Tags") }}</span>
                        <TagsEditor
                            :asset="asset"
                            :model-value="tags"
                        />
                    </div>
                </div>

                <SidebarFileInfoSection :asset="asset" />

                <MButton
                    v-if="assetFilepath"
                    type="button"
                    class="mjr-btn mjr-sidebar-collect-btn"
                    severity="secondary"
                    :disabled="collecting"
                    :title="t('sidebar.collectFilesTooltip', 'Create a ZIP next to this asset with the workflow JSON, its media inputs and a manifest')"
                    style="display:flex;align-items:center;justify-content:center;gap:6px;width:100%"
                    @click="handleCollectFiles"
                >
                    <i :class="collecting ? 'pi pi-spin pi-spinner' : 'pi pi-box'" />
                    <span>{{ collecting ? t("sidebar.collectingFiles", "Collecting...") : t("sidebar.collectFiles", "Collect files") }}</span>
                </MButton>

                <SidebarGenerationSection :asset="asset" />
            </template>
            <SidebarWorkflowSection :asset="asset" />
        </template>
    </div>
    <ContextMenuPortal />
</template>
