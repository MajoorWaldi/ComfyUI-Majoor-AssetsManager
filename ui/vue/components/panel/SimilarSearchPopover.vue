<script setup>
/**
 * SimilarSearchPopover.vue - action menu for similarity/group filters.
 *
 * Visibility is controlled by the legacy popoverManager through style.display.
 * The exposed DOM refs keep action handling in the panel controller layer.
 */
import { ref } from "vue";
import { t } from "../../../app/i18n.js";

const findSimilarBtnRef = ref(null);
const findDuplicatesBtnRef = ref(null);
const sameNodeBtnRef = ref(null);
const sameWorkflowBtnRef = ref(null);

const resolveDomElement = (value) => value?.$el || value || null;

defineExpose({
    get findSimilarBtn() {
        return resolveDomElement(findSimilarBtnRef.value);
    },
    get findDuplicatesBtn() {
        return resolveDomElement(findDuplicatesBtnRef.value);
    },
    get sameNodeBtn() {
        return resolveDomElement(sameNodeBtnRef.value);
    },
    get sameWorkflowBtn() {
        return resolveDomElement(sameWorkflowBtnRef.value);
    },
});
</script>

<template>
    <div class="mjr-popover mjr-similar-popover" style="display: none;">
        <div class="mjr-menu mjr-similar-menu">
            <MButton
                ref="findSimilarBtnRef"
                type="button"
                class="mjr-menu-item"
                severity="secondary"
                text
                :title="t('search.findSimilarWarning', 'Find similar assets. This may be heavy on very large libraries.')"
            >
                <span class="mjr-menu-item-label mjr-menu-item-label--icon">
                    <i class="pi pi-sparkles" aria-hidden="true" />
                    <span>{{ t("search.findSimilar", "Find Similar") }}</span>
                </span>
            </MButton>

            <MButton
                ref="findDuplicatesBtnRef"
                type="button"
                class="mjr-menu-item"
                severity="secondary"
                text
            >
                <span class="mjr-menu-item-label mjr-menu-item-label--icon">
                    <i class="pi pi-clone" aria-hidden="true" />
                    <span>{{ t("search.findDuplicates", "Find Duplicate") }}</span>
                </span>
            </MButton>

            <div class="mjr-menu-divider" />

            <MButton
                ref="sameNodeBtnRef"
                type="button"
                class="mjr-menu-item"
                severity="secondary"
                text
            >
                <span class="mjr-menu-item-label mjr-menu-item-label--icon">
                    <i class="pi pi-share-alt" aria-hidden="true" />
                    <span>{{ t("search.generatedWithSameSaveNode", "Generated with same save node") }}</span>
                </span>
            </MButton>

            <MButton
                ref="sameWorkflowBtnRef"
                type="button"
                class="mjr-menu-item"
                severity="secondary"
                text
            >
                <span class="mjr-menu-item-label mjr-menu-item-label--icon">
                    <i class="pi pi-sitemap" aria-hidden="true" />
                    <span>{{ t("search.generatedFromSameWorkflow", "Generated from same workflow") }}</span>
                </span>
            </MButton>
        </div>
    </div>
</template>
