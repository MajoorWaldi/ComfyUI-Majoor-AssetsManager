<script setup>
/**
 * TagsBadge.vue — Display-only tags badge.
 *
 * Phase 4.1: Replaces createTagsBadge() from Badges.js.
 * This is a display-only component. For interactive tags, use TagsEditor.vue.
 */
import { computed } from "vue";
import { t } from "../../../app/i18n.js";

const props = defineProps({
    tags: {
        type: [Array, String],
        default: () => [],
    },
});

const normalizedTags = computed(() => {
    if (Array.isArray(props.tags)) {
        return props.tags
            .map((tag) => String(tag ?? "").trim())
            .filter(Boolean)
            .slice(0, 10); // Limit display to first 10 tags
    }
    if (typeof props.tags === "string") {
        const raw = props.tags.trim();
        if (!raw) return [];
        try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
                return parsed
                    .map((tag) => String(tag ?? "").trim())
                    .filter(Boolean)
                    .slice(0, 10);
            }
        } catch {
            // Not JSON, treat as comma-separated
            return raw
                .split(",")
                .map((t) => t.trim())
                .filter(Boolean)
                .slice(0, 10);
        }
    }
    return [];
});

const hasTags = computed(() => normalizedTags.value.length > 0);
const tagsTitle = computed(() => t("tags.title", "Tags: {tags}", { tags: normalizedTags.value.join(", ") }));
const displayTags = computed(() => {
    const tags = normalizedTags.value;
    if (tags.length <= 5) return tags.join(", ");
    return tags.slice(0, 5).join(", ") + ` +${tags.length - 5}`;
});
</script>

<template>
    <div
        v-if="hasTags"
        class="mjr-tags-badge"
        :title="tagsTitle"
        :style="{ color: 'var(--mjr-tag-color, #90CAF9)' }"
    >
        {{ displayTags }}
    </div>
</template>

<style scoped>
.mjr-tags-badge {
    position: absolute;
    bottom: 6px;
    left: 6px;
    padding: 3px 6px;
    border-radius: 4px;
    background: rgba(0, 0, 0, 0.8);
    font-size: 9px;
    /* Reserve room for the gentime badge (≈ 50px) at the bottom-right */
    max-width: calc(100% - 56px);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    pointer-events: none;
    z-index: 10;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    animation: mjr-fade-in 0.2s ease-out;
}

@keyframes mjr-fade-in {
    from {
        opacity: 0;
        transform: scale(0.95);
    }
    to {
        opacity: 1;
        transform: scale(1);
    }
}
</style>
