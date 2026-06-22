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
