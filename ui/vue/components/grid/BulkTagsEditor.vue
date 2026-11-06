<script setup lang="ts">
/**
 * BulkTagsEditor.vue - Tag editor operating on a multi-card selection.
 *
 * Shows the union of the selection's tags with per-tag coverage (k/N).
 * Add/remove actions are applied to every eligible asset through chunked
 * batch calls to POST /mjr/am/assets/tags; coverage is refreshed from the
 * response and mjr:asset-tags-changed is dispatched per updated asset.
 */
import { computed, nextTick, onMounted, ref } from "vue";
import { getAssetsBatch, updateAssetsTagsBulk } from "../../../api/client.js";
import { ASSET_TAGS_CHANGED_EVENT } from "../../../app/events.js";
import { t } from "../../../app/i18n.js";
import { comfyToast } from "../../../app/toast.js";
import { safeDispatchCustomEvent } from "../../../utils/events.js";

const MAX_TAGS = 50;
const MAX_TAG_LEN = 100;
const BULK_IDS_PER_REQUEST = 500;
const HYDRATE_BATCH_IDS = 200;

const props = defineProps<{
    assets: unknown[];
}>();

const inputRef = ref<{ $el?: HTMLElement } | HTMLElement | null>(null);
const inputValue = ref("");
const busy = ref(false);
const hydrating = ref(false);

const resolveDomElement = (value: { $el?: HTMLElement } | HTMLElement | null): HTMLElement | null =>
    (value as { $el?: HTMLElement } | null)?.$el || value || null;

const tagKey = (raw: unknown) =>
    String(raw ?? "")
        .trim()
        .toLowerCase();

function normalizeTagList(raw: unknown): string[] {
    const next: string[] = [];
    const seen = new Set<string>();
    for (const entry of Array.isArray(raw) ? raw : []) {
        const value = String(entry ?? "").trim();
        if (!value) continue;
        const key = tagKey(value);
        if (!key || seen.has(key)) continue;
        seen.add(key);
        next.push(value);
    }
    return next;
}

function isWorkflowAsset(asset: any) {
    return (
        String(asset?.kind || asset?.type || "")
            .trim()
            .toLowerCase() === "workflow"
    );
}

const selectionAssets = computed(() =>
    Array.isArray(props.assets)
        ? props.assets.filter((asset) => asset && typeof asset === "object")
        : [],
);
const isValidBulkAsset = (asset: any) => !isWorkflowAsset(asset) && Number(asset?.id) > 0;
const eligibleAssets = computed(() =>
    selectionAssets.value.filter((asset: any) => isValidBulkAsset(asset)),
);
const workflowSkipCount = computed(
    () => selectionAssets.value.filter((asset: any) => isWorkflowAsset(asset)).length,
);
const invalidSkipCount = computed(
    () =>
        selectionAssets.value.filter(
            (asset: any) => !isValidBulkAsset(asset) && !isWorkflowAsset(asset),
        ).length,
);
const skippedCount = computed(() => workflowSkipCount.value + invalidSkipCount.value);
const eligibleCount = computed(() => eligibleAssets.value.length);

const tagsByAsset = ref(new Map<string, string[]>());

const coverageEntries = computed(() => {
    const counts = new Map<string, { tag: string; count: number }>();
    for (const tags of tagsByAsset.value.values()) {
        for (const tag of tags) {
            const key = tagKey(tag);
            if (!key) continue;
            const entry = counts.get(key);
            if (entry) {
                entry.count += 1;
            } else {
                counts.set(key, { tag, count: 1 });
            }
        }
    }
    return Array.from(counts.values()).sort((left, right) => left.tag.localeCompare(right.tag));
});

defineExpose({ coverageEntries });

function recomputeTagsFromMap(next: Map<string, string[]>) {
    tagsByAsset.value = new Map(next);
}

function seedFromAssets() {
    const seeded = new Map<string, string[]>();
    for (const asset of eligibleAssets.value as any[]) {
        if (Array.isArray(asset?.tags)) {
            seeded.set(String(asset.id), normalizeTagList(asset.tags));
        }
    }
    return seeded;
}

async function hydrateCoverage() {
    hydrating.value = true;
    let unhydratedCount = 0;
    try {
        const hydrated = seedFromAssets();
        const ids = (eligibleAssets.value as any[]).map((asset) => Number(asset.id));
        for (let index = 0; index < ids.length; index += HYDRATE_BATCH_IDS) {
            const chunk = ids.slice(index, index + HYDRATE_BATCH_IDS);
            try {
                const result = await getAssetsBatch(chunk);
                if (!result?.ok) {
                    unhydratedCount += chunk.length;
                    continue;
                }
                for (const asset of result.data || []) {
                    if (asset?.id != null) {
                        hydrated.set(String(asset.id), normalizeTagList(asset?.tags));
                    }
                }
            } catch (e) {
                unhydratedCount += chunk.length;
                console.debug?.(e);
            }
        }
        recomputeTagsFromMap(hydrated);
    } finally {
        hydrating.value = false;
    }
    if (unhydratedCount > 0) {
        comfyToast(
            t(
                "toast.bulkTagsHydrationIncomplete",
                "Couldn't load tags for {n} cards; counts may be incomplete",
                {
                    n: unhydratedCount,
                },
            ),
            "warning",
            3500,
        );
    }
    try {
        await nextTick();
        resolveDomElement(inputRef.value)?.focus();
    } catch (e) {
        console.debug?.(e);
    }
}

onMounted(() => {
    void hydrateCoverage();
});

function chunkIds(ids: number[], size: number): number[][] {
    const chunks: number[][] = [];
    for (let index = 0; index < ids.length; index += size) {
        chunks.push(ids.slice(index, index + size));
    }
    return chunks;
}

function skippedSuffix() {
    if (workflowSkipCount.value > 0 && invalidSkipCount.value > 0) {
        return t(
            "toast.bulkTagsSkippedMixed",
            ", {n} skipped ({workflow} workflow, {invalid} no id)",
            {
                n: skippedCount.value,
                workflow: workflowSkipCount.value,
                invalid: invalidSkipCount.value,
            },
        );
    }
    if (workflowSkipCount.value > 0) {
        return t("toast.bulkTagsSkippedWorkflow", ", {n} skipped (workflow)", {
            n: workflowSkipCount.value,
        });
    }
    return t("toast.bulkTagsSkippedInvalidId", ", {n} skipped (no id)", {
        n: invalidSkipCount.value,
    });
}

function standaloneSkipMessage() {
    if (workflowSkipCount.value > 0 && invalidSkipCount.value > 0) {
        return t(
            "toast.bulkTagsSkippedOnlyMixed",
            "{n} asset(s) skipped ({workflow} workflow, {invalid} no id)",
            {
                n: skippedCount.value,
                workflow: workflowSkipCount.value,
                invalid: invalidSkipCount.value,
            },
        );
    }
    if (workflowSkipCount.value > 0) {
        return t("toast.bulkTagsSkippedOnlyWorkflow", "{n} workflow asset(s) skipped", {
            n: workflowSkipCount.value,
        });
    }
    return t("toast.bulkTagsSkippedOnlyInvalidId", "{n} asset(s) without id skipped", {
        n: invalidSkipCount.value,
    });
}

async function applyBulkChange(add: string[], remove: string[]) {
    if (busy.value || hydrating.value) return;
    const ids = (eligibleAssets.value as any[]).map((asset) => Number(asset.id));
    if (!ids.length) return;

    const chunks = chunkIds(ids, BULK_IDS_PER_REQUEST);
    if (chunks.length > 1) {
        comfyToast(
            t("toast.bulkTagsProgress", "Updating tags on {n} assets...", { n: ids.length }),
            "info",
            2500,
        );
    }

    busy.value = true;
    let updatedCount = 0;
    let failedCount = 0;
    let lastError = "";
    try {
        for (const chunk of chunks) {
            const result = await updateAssetsTagsBulk(chunk, { add, remove });
            if (!result?.ok) {
                failedCount += chunk.length;
                lastError = String(result?.error || "");
                continue;
            }
            const data = result.data || {};
            failedCount += Array.isArray(data.failed) ? data.failed.length : 0;
            const tagsById: Record<string, string[]> = data.tags || {};
            const nextTags = new Map(tagsByAsset.value);
            for (const [assetId, tags] of Object.entries(tagsById)) {
                nextTags.set(String(assetId), normalizeTagList(tags));
            }
            for (const rawId of Array.isArray(data.updated_ids) ? data.updated_ids : []) {
                updatedCount += 1;
                const assetId = String(rawId);
                const tags = nextTags.get(assetId) || [];
                safeDispatchCustomEvent(
                    ASSET_TAGS_CHANGED_EVENT,
                    { assetId, tags },
                    { warnPrefix: "[BulkTagsEditor]" },
                );
                const asset = (eligibleAssets.value as any[]).find(
                    (entry) => String(entry?.id || "") === assetId,
                );
                if (asset) {
                    asset.tags = [...tags];
                }
            }
            recomputeTagsFromMap(nextTags);
        }
    } finally {
        busy.value = false;
    }

    if (updatedCount > 0) {
        let message = t("toast.bulkTagsUpdated", "Tags updated on {n} asset(s)", {
            n: updatedCount,
        });
        if (failedCount > 0) {
            message += t("toast.bulkTagsUpdatedWithFailed", ", {n} failed", { n: failedCount });
        }
        if (skippedCount.value > 0) {
            message += skippedSuffix();
        }
        comfyToast(message, failedCount > 0 ? "warning" : "success", 2500);
        return;
    }
    if (failedCount > 0) {
        comfyToast(lastError || t("toast.bulkTagsFailed", "Bulk tag update failed"), "error");
        return;
    }
    if (skippedCount.value > 0) {
        comfyToast(standaloneSkipMessage(), "info", 2500);
    }
}

function normalizeInputTag(raw: unknown): string | null {
    const value = String(raw ?? "").trim();
    if (!value || value.length > MAX_TAG_LEN) return null;
    for (let index = 0; index < value.length; index += 1) {
        const code = value.charCodeAt(index);
        if (code <= 31 || code === 127) return null;
    }
    return value;
}

function addTag(tag: string): boolean {
    const existing = coverageEntries.value.find((entry) => tagKey(entry.tag) === tagKey(tag));
    if (existing && existing.count >= eligibleCount.value) return false;
    if (!existing && coverageEntries.value.length >= MAX_TAGS) {
        comfyToast(t("toast.maxTagsReached", "Maximum number of tags reached"), "warning");
        return false;
    }
    void applyBulkChange([tag], []);
    return true;
}

function removeTag(tag: string) {
    void applyBulkChange([], [String(tag)]);
}

function handleChipClick(entry: { tag: string; count: number }) {
    if (busy.value || hydrating.value) return;
    if (entry.count >= eligibleCount.value) return;
    void applyBulkChange([entry.tag], []);
}

function handleInputKeydown(event: KeyboardEvent) {
    if (event.key !== "Enter") return;
    event.preventDefault();
    const raw = inputValue.value.trim();
    if (!raw) return;
    const tag = normalizeInputTag(raw);
    if (!tag) {
        comfyToast(
            t("toast.bulkTagsInvalidTag", "Tag not added (empty, too long, or invalid characters)"),
            "warning",
        );
        return;
    }
    if (addTag(tag)) {
        inputValue.value = "";
    }
}
</script>

<template>
    <div
        class="mjr-tags-editor mjr-bulk-tags-editor"
        :class="{ 'is-disabled': busy || hydrating }"
        :aria-busy="busy || hydrating"
    >
        <div class="mjr-bulk-tags-header">
            {{
                t("tags.bulkTitle", "Tags across {n} assets", {
                    n: eligibleCount,
                })
            }}
        </div>
        <div class="mjr-tags-display" role="list" :aria-label="t('tags.label', 'Tags')">
            <template v-if="coverageEntries.length === 0">
                <span class="mjr-tags-empty">
                    {{ t("msg.noTagsYet", "No tags yet...") }}
                </span>
            </template>
            <template v-else>
                <div
                    v-for="entry in coverageEntries"
                    :key="entry.tag"
                    class="mjr-tag-chip"
                    :class="{ 'is-partial': entry.count < eligibleCount }"
                    role="listitem"
                    :title="
                        entry.count < eligibleCount
                            ? t('tags.bulkAddMissing', 'Add to all assets')
                            : ''
                    "
                    @click="handleChipClick(entry)"
                >
                    {{ entry.tag }} ({{ entry.count }}/{{ eligibleCount }})
                    <MButton
                        type="button"
                        class="mjr-tag-chip-remove"
                        severity="secondary"
                        text
                        rounded
                        :aria-label="t('tags.remove', 'Remove tag')"
                        :disabled="busy || hydrating"
                        @click.stop="removeTag(entry.tag)"
                    >
                        x
                    </MButton>
                </div>
            </template>
        </div>

        <div class="mjr-tags-input-wrap">
            <MInputText
                ref="inputRef"
                v-model="inputValue"
                type="text"
                class="mjr-tag-input"
                :placeholder="t('tags.bulkAddPlaceholder', 'Add tag to all...')"
                :disabled="busy || hydrating"
                :aria-label="t('tags.addLabel', 'Add tag')"
                @keydown="handleInputKeydown"
            />
        </div>
    </div>
</template>
